import { describe, it, expect, beforeEach, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { GameScreen } from '../screens/GameScreen';

vi.mock('../hooks/useUserProgress', () => ({
    useUserProgress: () => ({ saveLevel: vi.fn() }),
}));

const renderGame = () =>
    render(
        <MemoryRouter initialEntries={[{ pathname: '/play', state: { mode: 'survival' } }]}>
            <GameScreen />
        </MemoryRouter>
    );

// Effect-driven timers (countdown, 1s interval) are re-armed only after React re-renders,
// so advance one second per act() to let each effect schedule the next tick.
const tick = (ms: number) => {
    for (let t = 0; t < ms; t += 1000) act(() => { vi.advanceTimersByTime(1000); });
};
const setVisibility = (state: 'hidden' | 'visible') => {
    Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => state });
    act(() => { document.dispatchEvent(new Event('visibilitychange')); });
};
const pauseModalTime = () => screen.getByText('Time Left').previousElementSibling!.textContent;
const resumeBadge = () => document.querySelector('.bg-yellow-400.animate-pulse')?.textContent;

describe('Game lifecycle (pause & hardware events)', () => {
    beforeEach(() => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2025-01-01T00:00:00Z'));
        Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'visible' });
    });

    const startPlaying = () => {
        renderGame();
        tick(3000); // pre-game 3-2-1 countdown
        tick(5000); // 5 seconds of play
        expect(screen.getByText('0:55')).toBeInTheDocument();
        expect(screen.queryByText('GAME PAUSED')).not.toBeInTheDocument();
    };

    it('hardware/gesture back pauses the game instead of leaving', () => {
        startPlaying();
        act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
        expect(screen.getByText('GAME PAUSED')).toBeInTheDocument();
        expect(screen.getByText('Quit Game')).toBeInTheDocument();
        expect(screen.getByText('RESUME')).toBeInTheDocument();
    });

    it('back button re-arms the history guard so a second back still pauses', () => {
        startPlaying();
        const push = vi.spyOn(window.history, 'pushState');
        act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
        expect(push).toHaveBeenCalledWith({ modal: 'game-active' }, '');
    });

    it('backgrounding the app (visibility hidden) pauses and freezes the countdown', () => {
        startPlaying();
        setVisibility('hidden');
        expect(screen.getByText('GAME PAUSED')).toBeInTheDocument();
        expect(pauseModalTime()).toBe('55s');
        tick(10000);
        expect(pauseModalTime()).toBe('55s'); // still frozen
        expect(screen.getByText('0:55')).toBeInTheDocument();
    });

    it('does not pause when the page becomes visible', () => {
        startPlaying();
        setVisibility('visible');
        expect(screen.queryByText('GAME PAUSED')).not.toBeInTheDocument();
    });

    it('Resume runs a 3-2-1 countdown before the timer restarts', () => {
        startPlaying();
        setVisibility('hidden');
        fireEvent.click(screen.getByText('RESUME'));

        expect(resumeBadge()).toBe('3');
        tick(1000);
        expect(resumeBadge()).toBe('2');
        tick(1000);
        expect(resumeBadge()).toBe('1');
        // Still frozen during the unpause countdown
        expect(pauseModalTime()).toBe('55s');

        tick(1000); // countdown reaches 0 -> game resumes
        tick(2000); // two seconds of live play
        expect(screen.getByText('0:53')).toBeInTheDocument();
    });

    it('powerups and controls are disabled during the initial 3-2-1 countdown', () => {
        renderGame();
        // Right after render, countdown is active (3)
        const hintBtn = screen.getByTitle('Hint (-3s)');
        const remixBtn = screen.getByTitle('Remix (-3s)');
        const fiftyBtn = screen.getByTitle('50/50 (-3s)');
        const rerollBtn = screen.getByTitle('Reroll (-3s)');

        expect(hintBtn).toBeDisabled();
        expect(remixBtn).toBeDisabled();
        expect(fiftyBtn).toBeDisabled();
        expect(rerollBtn).toBeDisabled();

        // Advance 3 seconds for countdown to finish
        tick(3000);

        // Power-ups should now be enabled
        expect(hintBtn).toBeEnabled();
        expect(remixBtn).toBeEnabled();
        expect(fiftyBtn).toBeEnabled();
        expect(rerollBtn).toBeEnabled();
    });
});
