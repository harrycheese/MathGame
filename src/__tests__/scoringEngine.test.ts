import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act } from '@testing-library/react';
import { advanceRefill, clickPair, mountScripted, solveOne, SCORE_BASE, type Engine } from '../test/engineHarness';

const survival = (tiles: Record<number, number>, genOp: string): Engine =>
    mountScripted({ mode: 'survival', level: 6, maxVal: 12, tiles, genOp, pair: [0, 1] });

/** Freeze the survival countdown so timeRemaining only moves via bonuses/penalties. */
const freezeClock = (e: Engine) => act(() => e.result.current.pauseGame());

/** Wait `gapMs` since the previous match click, then solve any pair on the board. */
const nextMatch = (e: Engine, gapMs: number) => {
    advanceRefill(gapMs);
    const before = { ...e.result.current.operatorCounts };
    const scoreBefore = e.result.current.score;
    const p = solveOne(e);
    const after = e.result.current.operatorCounts;
    const op = Object.keys(after).find(k => after[k] !== before[k])!;
    return { op, a: p.a.value, b: p.b.value, delta: e.result.current.score - scoreBefore };
};

describe('Scoring engine', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    });

    describe('base score = floor(10 × opMult × magnitude × speedBonus)', () => {
        // First match of a session has no previous match => no speed bonus.
        it.each([
            ['+', { 0: 3, 1: 4 }, 3, 4, 1.0],
            ['-', { 0: 9, 1: 4 }, 9, 4, 1.2],
            ['×', { 0: 3, 1: 4 }, 3, 4, 2.0],
            ['÷', { 0: 12, 1: 4 }, 12, 4, 3.0],
        ])('operator %s', (op, tiles, a, b, mult) => {
            const e = survival(tiles, op);
            clickPair(e, 0, 1);
            const expected = Math.floor(10 * mult * (1 + (a + b) / 100));
            expect(e.result.current.score).toBe(expected);
            expect(e.result.current.score).toBe(SCORE_BASE(op, a, b, Infinity));
        });

        it('literal values: 3+4 → 10, 9+10 → 11 (magnitude grows with tile values)', () => {
            const small = survival({ 0: 3, 1: 4 }, '+');
            clickPair(small, 0, 1);
            expect(small.result.current.score).toBe(10);

            const big = survival({ 0: 9, 1: 10 }, '+');
            clickPair(big, 0, 1);
            expect(big.result.current.score).toBe(11);
        });
    });

    describe('combo scaling', () => {
        it('matches under 3.5s keep the streak (+10% per level); over 3.5s resets it', () => {
            const e = survival({ 0: 3, 1: 4 }, '+');
            freezeClock(e);

            // Match 1: first ever => no combo
            clickPair(e, 0, 1);
            expect(e.result.current.score).toBe(10);
            expect(e.result.current.sessionAnalytics.totalCombos).toBe(0);

            // Match 2: 1.5s later => combo, streak is 0 when applied (x1.0)
            const m2 = nextMatch(e, 1500);
            expect(m2.delta).toBe(SCORE_BASE(m2.op, m2.a, m2.b, 1500));
            expect(e.result.current.sessionAnalytics.totalCombos).toBe(1);

            // Match 3: 1.5s later => combo, streak is 1 (x1.1)
            const m3 = nextMatch(e, 1500);
            const base3 = SCORE_BASE(m3.op, m3.a, m3.b, 1500);
            expect(m3.delta).toBe(Math.floor(base3 * (1 + 1 * 0.1)));
            expect(e.result.current.sessionAnalytics.totalCombos).toBe(2);
            expect(e.result.current.sessionAnalytics.maxComboStreak).toBe(2);

            // Match 4: 4s later => too slow, streak resets, no multiplier
            const m4 = nextMatch(e, 4000);
            expect(m4.delta).toBe(SCORE_BASE(m4.op, m4.a, m4.b, 4000));
            expect(e.result.current.sessionAnalytics.totalCombos).toBe(2);

            // Match 5: fast again, but streak restarted at 0 => x1.0
            const m5 = nextMatch(e, 1500);
            expect(m5.delta).toBe(SCORE_BASE(m5.op, m5.a, m5.b, 1500));
            expect(e.result.current.sessionAnalytics.totalCombos).toBe(3);
            expect(e.result.current.sessionAnalytics.maxComboStreak).toBe(2); // max preserved
        });

        it('faster matches score more (speed bonus up to 2x within 5s)', () => {
            const e = survival({ 0: 3, 1: 4 }, '+');
            freezeClock(e);
            clickPair(e, 0, 1);
            const quick = nextMatch(e, 1000);
            // same op/tile magnitude normalised: speed factor at 1s is 1.8x vs 1.0x at >=5s
            expect(SCORE_BASE(quick.op, quick.a, quick.b, 1000)).toBeGreaterThanOrEqual(
                SCORE_BASE(quick.op, quick.a, quick.b, 5000)
            );
            expect(quick.delta).toBe(SCORE_BASE(quick.op, quick.a, quick.b, 1000));
        });
    });

    describe('survival time rewards', () => {
        it('normal match +3s, combo match +5s', () => {
            const e = survival({ 0: 3, 1: 4 }, '+');
            freezeClock(e);
            expect(e.result.current.timeRemaining).toBe(60);

            clickPair(e, 0, 1); // normal
            expect(e.result.current.timeRemaining).toBe(63);
            expect(e.result.current.timeBonus).toBe(3);

            nextMatch(e, 1500); // combo
            expect(e.result.current.timeRemaining).toBe(68);
            expect(e.result.current.timeBonus).toBe(5);

            nextMatch(e, 4000); // slow => normal again
            expect(e.result.current.timeRemaining).toBe(71);
        });

        it('zen mode never changes the clock', () => {
            const e = mountScripted({ mode: 'zen', level: 6, maxVal: 12, tiles: { 0: 3, 1: 4 }, genOp: '+', pair: [0, 1] });
            clickPair(e, 0, 1);
            expect(e.result.current.timeRemaining).toBe(60);
            expect(e.result.current.timeBonus).toBeNull();
        });
    });
});
