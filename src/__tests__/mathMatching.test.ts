import { describe, it, expect, beforeEach, vi } from 'vitest';
import confetti from 'canvas-confetti';
import { advance, clickPair, flat, mountScripted } from '../test/engineHarness';

// Survival-mode scripted board: values 1..12 (level 6 range), all four operators.
// Tile indexes 0 and 1 feed the first target; indexes 2 and 3 are the tiles we click.
const survival = (tiles: Record<number, number>, genOp: string) =>
    mountScripted({ mode: 'survival', level: 6, maxVal: 12, tiles, genOp, pair: [0, 1] });

const status = (e: ReturnType<typeof survival>, idx: number) => flat(e)[idx].status;

describe('Math matching engine', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
    });

    it('scripted harness builds the expected board and target', () => {
        const e = survival({ 0: 3, 1: 4 }, '+');
        expect(e.result.current.grid).toHaveLength(6);
        expect(e.result.current.grid.every(r => r.length === 6)).toBe(true);
        expect(e.result.current.target).toBe(7);
        expect(flat(e)[0].value).toBe(3);
    });

    describe('operators', () => {
        it('addition: A + B = target', () => {
            const e = survival({ 0: 3, 1: 4 }, '+'); // target 7
            clickPair(e, 0, 1);
            expect(status(e, 0)).toBe('matched');
            expect(status(e, 1)).toBe('matched');
            expect(e.result.current.operatorCounts['+']).toBe(1);
        });

        it('subtraction is order independent: |A - B| = target', () => {
            const e = survival({ 0: 9, 1: 4, 2: 2, 3: 7 }, '-'); // target 5
            expect(e.result.current.target).toBe(5);
            clickPair(e, 3, 2); // 7 then 2 (larger first)
            expect(status(e, 2)).toBe('matched');
            expect(e.result.current.operatorCounts['-']).toBe(1);
        });

        it('subtraction works in the opposite click order too', () => {
            const e = survival({ 0: 9, 1: 4, 2: 2, 3: 7 }, '-');
            clickPair(e, 2, 3);
            expect(status(e, 3)).toBe('matched');
        });

        it('multiplication: A × B = target', () => {
            const e = survival({ 0: 3, 1: 4 }, '×'); // target 12
            expect(e.result.current.target).toBe(12);
            clickPair(e, 0, 1);
            expect(e.result.current.operatorCounts['×']).toBe(1);
        });

        it('division: integer quotient matches', () => {
            const e = survival({ 0: 12, 1: 4, 2: 12, 3: 4 }, '÷'); // target 3
            expect(e.result.current.target).toBe(3);
            clickPair(e, 3, 2); // 4 then 12
            expect(status(e, 2)).toBe('matched');
            expect(e.result.current.operatorCounts['÷']).toBe(1);
        });

        it('division: non-integer quotient (5 ÷ 2 = 2.5) is rejected', () => {
            const e = survival({ 0: 7, 1: 5, 2: 5, 3: 2 }, '-'); // target 2
            expect(e.result.current.target).toBe(2);
            clickPair(e, 2, 3); // 5 and 2: 5/2 = 2.5, 5+2=7, 5-2=3, 5*2=10
            expect(status(e, 2)).toBe('wrong');
            expect(status(e, 3)).toBe('wrong');
            expect(e.result.current.score).toBe(0);
            advance(500);
            expect(status(e, 2)).toBe('idle'); // wrong tiles reset
        });

        it('a wrong pair never scores or counts an operator', () => {
            const e = survival({ 0: 3, 1: 4, 2: 1, 3: 1 }, '+'); // target 7
            clickPair(e, 2, 3);
            expect(e.result.current.score).toBe(0);
            expect(Object.values(e.result.current.operatorCounts).every(n => n === 0)).toBe(true);
        });
    });

    describe('corner case: target = 0', () => {
        it('rejects different numbers (no +, ×, ÷ can produce 0)', () => {
            const e = survival({ 0: 5, 1: 5, 2: 3, 3: 4 }, '-'); // target 0
            expect(e.result.current.target).toBe(0);
            clickPair(e, 2, 3);
            expect(status(e, 2)).toBe('wrong');
            expect(e.result.current.score).toBe(0);
        });

        it('accepts identical numbers via subtraction', () => {
            const e = survival({ 0: 5, 1: 5, 2: 3, 3: 3 }, '-');
            expect(e.result.current.target).toBe(0);
            clickPair(e, 2, 3);
            expect(status(e, 2)).toBe('matched');
            expect(e.result.current.operatorCounts['-']).toBe(1);
            expect(e.result.current.operatorCounts['+']).toBe(0);
            expect(e.result.current.operatorCounts['×']).toBe(0);
        });
    });

    describe('easter eggs', () => {
        it('square: equal tiles with a perfect-square target prefer × and trigger the square egg', () => {
            const e = survival({ 0: 2, 1: 2 }, '×'); // target 4; 2+2 would also match
            expect(e.result.current.target).toBe(4);
            clickPair(e, 0, 1);
            expect(e.result.current.operatorCounts['×']).toBe(1);
            expect(e.result.current.operatorCounts['+']).toBe(0);
            expect(e.result.current.squareState).toMatch(/SQUARE|SQUARED|BOXY/);
            expect(confetti).toHaveBeenCalled();
            advance(2000);
            expect(e.result.current.squareState).toBeNull();
        });

        it('meme: 6 and 7 trigger the meme explosion, then it clears', () => {
            const e = survival({ 0: 6, 1: 7 }, '+'); // target 13
            expect(e.result.current.target).toBe(13);
            expect(e.result.current.memeState).toBe(false);
            clickPair(e, 0, 1);
            expect(e.result.current.memeState).toBe(true);
            expect(confetti).toHaveBeenCalledWith(expect.objectContaining({ particleCount: 300 }));
            advance(2000);
            expect(e.result.current.memeState).toBe(false);
        });

        it('meme works with 7 clicked before 6', () => {
            const e = survival({ 0: 6, 1: 7 }, '+');
            clickPair(e, 1, 0);
            expect(e.result.current.memeState).toBe(true);
        });

        it('non-meme pairs do not trigger the meme', () => {
            const e = survival({ 0: 3, 1: 4 }, '+');
            clickPair(e, 0, 1);
            expect(e.result.current.memeState).toBe(false);
        });
    });

    describe('operator gating (campaign)', () => {
        const campaign = (level: number, ops: string[], maxVal: number, tiles: Record<number, number>, genOp: string) =>
            mountScripted({ mode: 'campaign', level, ops, maxVal, tiles, genOp, pair: [0, 1] });

        it('locked × gives feedback instead of a match', () => {
            const e = campaign(3, ['+', '-'], 8, { 0: 2, 1: 4, 2: 2, 3: 3 }, '+'); // target 6
            expect(e.result.current.target).toBe(6);
            clickPair(e, 2, 3); // 2×3 = 6 but × is locked
            expect(e.result.current.feedbackMessage).toMatch(/Multiplication/);
            expect(status(e, 2)).toBe('wrong');
            expect(e.result.current.score).toBe(0);
            advance(2500);
            expect(e.result.current.feedbackMessage).toBeNull();
        });

        it('locked - gives feedback (level 1 is addition only)', () => {
            const e = campaign(1, ['+'], 5, { 0: 1, 1: 1, 2: 5, 3: 3 }, '+'); // target 2
            expect(e.result.current.target).toBe(2);
            clickPair(e, 2, 3); // 5-3 = 2
            expect(e.result.current.feedbackMessage).toMatch(/ADDITION/);
            expect(e.result.current.score).toBe(0);
        });

        it('locked ÷ gives feedback', () => {
            const e = campaign(3, ['+', '-'], 8, { 0: 5, 1: 3, 2: 8, 3: 4 }, '-'); // target 2
            expect(e.result.current.target).toBe(2);
            clickPair(e, 2, 3); // 8/4 = 2
            expect(e.result.current.feedbackMessage).toMatch(/Division/);
            expect(e.result.current.score).toBe(0);
        });
    });
});
