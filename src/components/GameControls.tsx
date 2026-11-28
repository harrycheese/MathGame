import { motion } from 'framer-motion';

interface GameControlsProps {
    onShuffle: () => void;
    onHint: () => void;
    onFiftyFifty: () => void;
    onResetTarget: () => void;
    isGridHalved?: boolean; // Disable 50/50 after use
    isShuffling?: boolean;
    isResettingTarget?: boolean;
    isSurvivalMode?: boolean; // Show penalty only in survival
    disabled?: boolean; // Disable all power-ups during countdown/pause/gameover
}

export const GameControls = ({
    onShuffle,
    onHint,
    onFiftyFifty,
    onResetTarget,
    isGridHalved,
    isShuffling,
    isResettingTarget,
    isSurvivalMode,
    disabled = false
}: GameControlsProps) => {
    // Penalty suffix only for survival mode
    const penalty = isSurvivalMode ? ' (-3s)' : '';

    return (
        <div className="flex flex-col items-center justify-end w-full max-w-md mx-auto mt-6 mb-4 px-4">
            {/* Tools Dock - Dark glass style matching the game UI */}
            <div className="flex items-center gap-3 bg-gray-900/80 backdrop-blur-md p-3 rounded-2xl border border-white/10 shadow-2xl">

                {/* REMIX Tool (Shuffle) */}
                <motion.button
                    whileHover={{ scale: disabled || isShuffling ? 1 : 1.08, y: disabled || isShuffling ? 0 : -2 }}
                    whileTap={{ scale: disabled || isShuffling ? 1 : 0.95 }}
                    onClick={onShuffle}
                    disabled={disabled || isShuffling}
                    className="group relative flex flex-col items-center justify-center w-14 h-14 bg-gray-800/80 rounded-xl border border-white/10 hover:border-blue-500/50 hover:bg-gray-700/80 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/10"
                    title={`Remix${penalty}`}
                >
                    {/* Subtle glow on hover */}
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-blue-500/0 to-purple-500/0 group-hover:from-blue-500/20 group-hover:to-purple-500/20 rounded-xl blur-sm transition-all" />

                    {/* Shuffle/Remix icon */}
                    <svg
                        className={`w-6 h-6 relative z-10 text-blue-400 group-hover:text-blue-300 transition-colors ${isShuffling ? 'animate-spin' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                </motion.button>

                {/* HINT Tool */}
                <motion.button
                    whileHover={{ scale: disabled ? 1 : 1.08, y: disabled ? 0 : -2 }}
                    whileTap={{ scale: disabled ? 1 : 0.95 }}
                    onClick={onHint}
                    disabled={disabled}
                    className="group relative flex flex-col items-center justify-center w-14 h-14 bg-gray-800/80 rounded-xl border border-white/10 hover:border-amber-500/50 hover:bg-gray-700/80 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/10"
                    title={`Hint${penalty}`}
                >
                    {/* Subtle glow on hover */}
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-amber-500/0 to-yellow-500/0 group-hover:from-amber-500/20 group-hover:to-yellow-500/20 rounded-xl blur-sm transition-all" />

                    {/* Lightbulb icon */}
                    <svg
                        className="w-6 h-6 relative z-10 text-amber-400 group-hover:text-amber-300 transition-colors"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                </motion.button>

                {/* 50/50 Tool */}
                <motion.button
                    whileHover={{ scale: (disabled || isGridHalved) ? 1 : 1.08, y: (disabled || isGridHalved) ? 0 : -2 }}
                    whileTap={{ scale: (disabled || isGridHalved) ? 1 : 0.95 }}
                    onClick={onFiftyFifty}
                    disabled={disabled || isGridHalved}
                    className={`group relative flex flex-col items-center justify-center w-14 h-14 bg-gray-800/80 rounded-xl border border-white/10 hover:border-violet-500/50 hover:bg-gray-700/80 transition-all shadow-lg ${(disabled || isGridHalved) ? 'opacity-30 grayscale cursor-not-allowed hover:border-white/10' : ''}`}
                    title={`50/50${penalty}`}
                >
                    {/* Subtle glow on hover */}
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-violet-500/0 to-purple-500/0 group-hover:from-violet-500/20 group-hover:to-purple-500/20 rounded-xl blur-sm transition-all" />

                    {/* Scissors icon - cutting in half */}
                    <svg
                        className="w-6 h-6 relative z-10 text-violet-400 group-hover:text-violet-300 transition-colors"
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" d="M14.121 14.121L19 19m-7-7l7-7m-7 7l-2.879 2.879M12 12L9.121 9.121m0 5.758a3 3 0 10-4.243 4.243 3 3 0 004.243-4.243zm0-5.758a3 3 0 10-4.243-4.243 3 3 0 004.243 4.243z" />
                    </svg>
                </motion.button>

                {/* REROLL Tool (Reset Target) */}
                <motion.button
                    whileHover={{ scale: disabled || isResettingTarget ? 1 : 1.08, y: disabled || isResettingTarget ? 0 : -2 }}
                    whileTap={{ scale: disabled || isResettingTarget ? 1 : 0.95 }}
                    onClick={onResetTarget}
                    disabled={disabled || isResettingTarget}
                    className="group relative flex flex-col items-center justify-center w-14 h-14 bg-gray-800/80 rounded-xl border border-white/10 hover:border-rose-500/50 hover:bg-gray-700/80 transition-all shadow-lg disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:border-white/10"
                    title={`Reroll${penalty}`}
                >
                    {/* Subtle glow on hover */}
                    <div className="absolute -inset-0.5 bg-gradient-to-br from-rose-500/0 to-pink-500/0 group-hover:from-rose-500/20 group-hover:to-pink-500/20 rounded-xl blur-sm transition-all" />

                    {/* Dice icon - represents rerolling */}
                    <svg
                        className={`w-6 h-6 relative z-10 text-rose-400 group-hover:text-rose-300 transition-colors ${isResettingTarget ? 'animate-spin' : ''}`}
                        fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                    >
                        <rect x="4" y="4" width="16" height="16" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1" fill="currentColor" />
                        <circle cx="15.5" cy="8.5" r="1" fill="currentColor" />
                        <circle cx="8.5" cy="15.5" r="1" fill="currentColor" />
                        <circle cx="15.5" cy="15.5" r="1" fill="currentColor" />
                        <circle cx="12" cy="12" r="1" fill="currentColor" />
                    </svg>
                </motion.button>

            </div>
        </div>
    );
};
