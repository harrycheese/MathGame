import { act, renderHook } from '@testing-library/react';
import { vi } from 'vitest';
import { useGameEngine } from '../hooks/useGameEngine';
import type { TileData } from '../types/game';

/** Seeded PRNG (mulberry32) so "random" behaviour is reproducible. */
export const makePrng = (seed: number) => {
    let a = seed >>> 0;
    return () => {
        a = (a + 0x6d2b79f5) >>> 0;
        let t = a;
        t = Math.imul(t ^ (t >>> 15), t | 1);
        t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
};

/** Replace Math.random: values from `queue` first, then the seeded PRNG. */
export const installRandom = (seed: number, queue: number[] = []) => {
    const prng = makePrng(seed);
    vi.spyOn(Math, 'random').mockImplementation(() => (queue.length ? queue.shift()! : prng()));
};

type Mode = 'campaign' | 'survival' | 'zen';
const MODE_OPS: Record<Mode, string[]> = {
    survival: ['+', '-', '×', '÷'],
    zen: ['+', '-', '×', '÷'],
    campaign: ['+'], // overridden by caller via `ops` when needed
};

export interface ScriptedOpts {
    mode?: Mode;
    level?: number;
    /** Level config ops, in order, used to turn `genOp` into a random index. */
    ops?: string[];
    minVal?: number;
    maxVal: number;
    /** overrides: tile index (row*6+col) -> value */
    tiles: Record<number, number>;
    /** operator + tile indexes used by generateTarget for the first target */
    genOp: string;
    pair: [number, number];
}

/**
 * Mount useGameEngine with a fully scripted 6x6 grid and first target.
 * Math.random call order on mount: 36 x (id, value) then target (op, tileA, tileB).
 */
export const mountScripted = (o: ScriptedOpts) => {
    const mode = o.mode ?? 'survival';
    const ops = o.ops ?? MODE_OPS[mode];
    const min = o.minVal ?? 1;
    const range = o.maxVal - min + 1;
    const queue: number[] = [];
    for (let i = 0; i < 36; i++) {
        const v = o.tiles[i] ?? min;
        queue.push((i + 1) / 997); // unique tile id
        queue.push((v - min + 0.5) / range);
    }
    queue.push((ops.indexOf(o.genOp) + 0.5) / ops.length);
    queue.push((o.pair[0] + 0.5) / 36);
    queue.push((o.pair[1] + 0.5) / 36);
    installRandom(12345, queue);
    return renderHook(() => useGameEngine(mode, o.level ?? 1));
};

export type Engine = ReturnType<typeof mountScripted>;

export const click = (e: Engine, idx: number) =>
    act(() => e.result.current.handleTileClick(Math.floor(idx / 6), idx % 6));

export const clickPair = (e: Engine, a: number, b: number) => {
    click(e, a);
    click(e, b);
};

export const advance = (ms: number) => act(() => { vi.advanceTimersByTime(ms); });

/**
 * Advance past the 500ms grid refill. The engine schedules `setTarget` (0ms) from inside a
 * state updater, which only runs on re-render, so the clock must be advanced in two acts.
 */
export const advanceRefill = (totalMs: number) => {
    advance(500);
    advance(totalMs - 500);
};

export const flat = (e: Engine): TileData[] => e.result.current.grid.flat();

/** Independent oracle: all pairs on grid that hit `target` with one of `ops`. */
export const findPairs = (grid: TileData[][], target: number, ops: string[]) => {
    const tiles = grid.flat().filter(t => t.status !== 'matched');
    const out: { a: TileData; b: TileData; op: string }[] = [];
    for (let i = 0; i < tiles.length; i++) {
        for (let j = i + 1; j < tiles.length; j++) {
            const a = tiles[i], b = tiles[j];
            if (ops.includes('+') && a.value + b.value === target) out.push({ a, b, op: '+' });
            if (ops.includes('-') && Math.abs(a.value - b.value) === target) out.push({ a, b, op: '-' });
            if (ops.includes('×') && a.value * b.value === target) out.push({ a, b, op: '×' });
            if (ops.includes('÷') && (a.value / b.value === target || b.value / a.value === target)) out.push({ a, b, op: '÷' });
        }
    }
    return out;
};

/** Click any currently valid pair on the board (found via the oracle). */
export const solveOne = (e: Engine) => {
    const { grid, target, config } = e.result.current;
    const p = findPairs(grid, target, config.ops)[0];
    if (!p) throw new Error('no valid pair on board');
    const idx = (t: TileData) => t.row * 6 + t.col;
    clickPair(e, idx(p.a), idx(p.b));
    return p;
};

export const SCORE_BASE = (op: string, a: number, b: number, ms: number) => {
    const mult = op === '-' ? 1.2 : op === '×' ? 2 : op === '÷' ? 3 : 1;
    const speed = 1 + Math.max(0, (5000 - Math.min(ms, 10000)) / 5000);
    return Math.floor(10 * mult * (1 + (a + b) / 100) * speed);
};
