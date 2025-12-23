import { motion } from 'framer-motion';
import { Shuffle, Lightbulb, Scissors, Target } from 'lucide-react';

interface GameControlsProps {
    onShuffle: () => void;
    onHint: () => void;
    onFiftyFifty: () => void;
    onResetTarget: () => void;
    isGridHalved?: boolean; // Disable 50/50 after use
    isShuffling?: boolean;
    isResettingTarget?: boolean;
}

export const GameControls = ({
    onShuffle,
    onHint,
    onFiftyFifty,
    onResetTarget,
    isGridHalved,
    isShuffling,
    isResettingTarget
}: GameControlsProps) => {
    return (
        <div className="flex flex-col items-center justify-end w-full max-w-md mx-auto mt-6 mb-4 px-4">
            {/* Tools Dock */}
            <div className="flex items-center gap-3 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-xl">

                {/* Shuffle Tool */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onShuffle}
                    disabled={isShuffling}
                    className="group relative flex flex-col items-center justify-center w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg border border-white/20 disabled:opacity-50"
                    title="Shuffle Board"
                >
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Shuffle className={`w-5 h-5 text-white ${isShuffling ? 'animate-spin' : ''}`} />
                </motion.button>

                {/* Hint Tool */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onHint}
                    className="group relative flex flex-col items-center justify-center w-12 h-12 bg-gradient-to-br from-amber-400 to-yellow-500 rounded-xl shadow-lg border border-white/20"
                    title="Hint (-3s)"
                >
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Lightbulb className="w-5 h-5 text-white" />
                </motion.button>

                {/* 50/50 Tool */}
                <motion.button
                    whileHover={{ scale: isGridHalved ? 1 : 1.05 }}
                    whileTap={{ scale: isGridHalved ? 1 : 0.95 }}
                    onClick={onFiftyFifty}
                    disabled={isGridHalved}
                    className={`group relative flex flex-col items-center justify-center w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl shadow-lg border border-white/20 ${isGridHalved ? 'opacity-40 grayscale cursor-not-allowed' : ''}`}
                    title="50/50 (-3s)"
                >
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Scissors className="w-5 h-5 text-white" />
                </motion.button>

                {/* Reset Target Tool */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onResetTarget}
                    disabled={isResettingTarget}
                    className="group relative flex flex-col items-center justify-center w-12 h-12 bg-gradient-to-br from-rose-500 to-pink-600 rounded-xl shadow-lg border border-white/20 disabled:opacity-50"
                    title="Reset Target (-3s)"
                >
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Target className={`w-5 h-5 text-white ${isResettingTarget ? 'animate-spin' : ''}`} />
                </motion.button>

            </div>
        </div>
    );
};
