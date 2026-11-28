/* eslint-disable react-hooks/rules-of-hooks -- engine exposes power-ups named use*, they are plain callbacks */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useGameEngine } from '../hooks/useGameEngine';
import { advance, advanceRefill, click, findPairs, flat, installRandom, mountScripted, solveOne, type Engine } from '../test/engineHarness';

const SEEDS = Array.from({ length: 15 }, (_, i) => i + 1);

const mountSeeded = (seed: number, mode: 'survival' | 'zen' = 'survival'): Engine => {
    installRandom(seed);
    const e = renderHook(() => useGameEngine(mode));
    act(() => e.result.current.pauseGame()); // freeze the survival clock
    return e;
};

const hasPairWith = (e: Engine, tileId: string, op?: string) => {
    const { grid, target, config } = e.result.current;
    return findPairs(grid, target, config.ops).some(
        p => (p.a.id === tileId || p.b.id === tileId) && (!op || p.op === op)
    );
};

describe('Solvability & power-ups', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    });

    describe('board generation', () => {
        it.each(SEEDS)('seed %i: initial 6x6 board always has a solution for the target', seed => {
            const e = mountSeeded(seed);
            const { grid, target, config } = e.result.current;
            expect(grid.flat()).toHaveLength(36);
            expect(findPairs(grid, target, config.ops).length).toBeGreaterThan(0);
        });
    });

    describe('Hint (useHint)', () => {
        it.each(SEEDS)('seed %i: hints a tile from a real pair with the matching operator', seed => {
            const e = mountSeeded(seed);
            expect(e.result.current.hintState).toBeNull();
            act(() => e.result.current.useHint());
            const hint = e.result.current.hintState!;
            expect(hint).not.toBeNull();
            expect(hasPairWith(e, hint.tileId, hint.operator)).toBe(true);
        });

        it('costs 3 seconds in survival', () => {
            const e = mountSeeded(1);
            act(() => e.result.current.useHint());
            expect(e.result.current.timeRemaining).toBe(57);
            expect(e.result.current.timeBonus).toBe(-3);
        });

        it('is free in zen mode', () => {
            const e = mountSeeded(1, 'zen');
            act(() => e.result.current.useHint());
            expect(e.result.current.hintState).not.toBeNull();
            expect(e.result.current.timeRemaining).toBe(60);
        });

        it('clears any existing tile selection when hint is used', () => {
            const e = mountSeeded(1);
            click(e, 0);
            expect(flat(e)[0].status).toBe('selected');

            act(() => e.result.current.useHint());
            expect(flat(e)[0].status).toBe('idle');
        });

        it('is cleared after a successful match', () => {
            const e = mountSeeded(2);
            act(() => e.result.current.useHint());
            solveOne(e);
            expect(e.result.current.hintState).toBeNull();
        });
    });

    describe('50/50 (useFiftyFifty)', () => {
        it.each(SEEDS)('seed %i: leaves 18 tiles in 3 rows and keeps a solution', seed => {
            const e = mountSeeded(seed);
            act(() => e.result.current.useFiftyFifty());
            const { grid, target, config } = e.result.current;
            expect(grid).toHaveLength(3);
            expect(grid.flat()).toHaveLength(18);
            expect(e.result.current.isGridHalved).toBe(true);
            expect(findPairs(grid, target, config.ops).length).toBeGreaterThan(0);
        });

        it.each(SEEDS)('seed %i: preserves the hinted pair', seed => {
            const e = mountSeeded(seed);
            act(() => e.result.current.useHint());
            const hint = e.result.current.hintState!;
            act(() => e.result.current.useFiftyFifty());
            expect(e.result.current.grid.flat().some(t => t.id === hint.tileId)).toBe(true);
            expect(hasPairWith(e, hint.tileId)).toBe(true);
        });

        it('costs 3 seconds in survival and can only be used once', () => {
            const e = mountSeeded(3);
            act(() => e.result.current.useFiftyFifty());
            expect(e.result.current.timeRemaining).toBe(57);
            act(() => e.result.current.useFiftyFifty());
            expect(e.result.current.timeRemaining).toBe(57);
        });

        it('after a match the board regenerates to a full 6x6 grid', () => {
            const e = mountSeeded(4);
            act(() => e.result.current.useFiftyFifty());
            solveOne(e);
            advance(1000);
            expect(e.result.current.isGridHalved).toBe(false);
            expect(e.result.current.grid).toHaveLength(6);
            expect(e.result.current.grid.flat()).toHaveLength(36);
        });
    });

    describe('Shuffle & board regeneration', () => {
        it('refill replaces matched tiles and generates a solvable new target', () => {
            const e = mountScripted({
                mode: 'survival', level: 6, maxVal: 12, tiles: { 0: 3, 1: 4 }, genOp: '+', pair: [0, 1],
            });
            const matchedIds = [e.result.current.grid[0][0].id, e.result.current.grid[0][1].id];
            act(() => e.result.current.handleTileClick(0, 0));
            act(() => e.result.current.handleTileClick(0, 1));
            advanceRefill(600);

            const { grid, target, config } = e.result.current;
            const flatGrid = grid.flat();
            expect(grid).toHaveLength(6);
            expect(flatGrid).toHaveLength(36);
            expect(flatGrid.every(t => t.status === 'idle')).toBe(true);
            expect(flatGrid.some(t => matchedIds.includes(t.id))).toBe(false);
            expect(new Set(flatGrid.map(t => t.id)).size).toBe(36);
            expect(findPairs(grid, target, config.ops).length).toBeGreaterThan(0);
        });

        it('shuffle keeps the same tiles, finishes, and costs 3s in survival', () => {
            const e = mountSeeded(5);
            const before = e.result.current.grid.flat().map(t => t.value).sort((a, b) => a - b);
            act(() => e.result.current.shuffleBoard());
            expect(e.result.current.isShuffling).toBe(true);
            advance(3000);
            expect(e.result.current.isShuffling).toBe(false);
            const after = e.result.current.grid.flat().map(t => t.value).sort((a, b) => a - b);
            expect(after).toEqual(before);
            expect(e.result.current.timeRemaining).toBe(57);
        });

        it.each(SEEDS)('seed %i: shuffle keeps the hinted tile solvable', seed => {
            const e = mountSeeded(seed);
            act(() => e.result.current.useHint());
            const hint = e.result.current.hintState!;
            act(() => e.result.current.shuffleBoard());
            advance(3000);
            expect(hasPairWith(e, hint.tileId)).toBe(true);
        });

        it.each(SEEDS)('seed %i: reset target yields a solvable target', seed => {
            const e = mountSeeded(seed);
            act(() => e.result.current.resetTargetNumber());
            expect(e.result.current.isResettingTarget).toBe(true);
            advance(2000);
            expect(e.result.current.isResettingTarget).toBe(false);
            const { grid, target, config } = e.result.current;
            expect(findPairs(grid, target, config.ops).length).toBeGreaterThan(0);
            expect(e.result.current.timeRemaining).toBe(57);
        });
    });
});
