import { motion } from 'framer-motion';
import { Shuffle } from 'lucide-react';

interface GameControlsProps {
    onShuffle: () => void;
}

export const GameControls = ({ onShuffle }: GameControlsProps) => {
    return (
        <div className="flex flex-col items-center justify-end w-full max-w-md mx-auto mt-6 mb-4 px-4">

            {/* Instructions */}
            <div className="mb-4 text-center">
                <p className="text-sm font-semibold text-blue-200/80 tracking-wide drop-shadow-sm">
                    SELECT 2 NUMBERS THAT <span className="text-white font-bold">EQUAL</span> THE TARGET
                </p>
            </div>

            {/* Tools Dock */}
            <div className="flex items-center gap-4 bg-white/10 backdrop-blur-md p-2 rounded-2xl border border-white/10 shadow-xl">

                {/* Shuffle Tool */}
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={onShuffle}
                    className="group relative flex flex-col items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-lg border border-white/20"
                    title="Shuffle Board"
                >
                    <div className="absolute inset-0 bg-white/20 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Shuffle className="w-6 h-6 text-white" />
                </motion.button>

                {/* Placeholder: Magic Wand (Locked) */}
                <div className="w-14 h-14 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center opacity-50 grayscale cursor-not-allowed">
                    {/* Placeholder Icon */}
                    <span className="text-xs text-white/30">Wand</span>
                </div>

                {/* Placeholder: X-Ray (Locked) */}
                <div className="w-14 h-14 bg-white/5 rounded-xl border border-white/5 flex items-center justify-center opacity-50 grayscale cursor-not-allowed">
                    {/* Placeholder Icon */}
                    <span className="text-xs text-white/30">Hint</span>
                </div>

            </div>
        </div>
    );
};
