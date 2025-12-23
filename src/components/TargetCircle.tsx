import { motion } from 'framer-motion';

interface TargetCircleProps {
    target: number;
    memeState?: boolean;
    squareState?: string | null; // Square easter egg message
    primeState?: string | null; // Prime easter egg message
}

export const TargetCircle = ({ target, memeState, squareState, primeState }: TargetCircleProps) => {
    // Determine which easter egg state is active
    const isSquareActive = !!squareState;
    const isPrimeActive = !!primeState;
    const hasEasterEgg = memeState || isSquareActive || isPrimeActive;

    return (
        <div className="relative group flex justify-center">
            {/* Background glow - changes color based on easter egg */}
            <motion.div
                className="absolute -inset-4 rounded-full blur-xl opacity-20 animate-pulse group-hover:opacity-40 transition-opacity"
                animate={{
                    background: isSquareActive
                        ? 'linear-gradient(to right, #60A5FA, #818CF8, #A78BFA)' // Blue/purple for squares
                        : isPrimeActive
                            ? 'linear-gradient(to right, #EF4444, #3B82F6, #9CA3AF)' // Red/blue/silver for Transformers
                            : 'linear-gradient(to right, #3B82F6, #8B5CF6, #EC4899)' // Default
                }}
            />

            {/* Main circle container - morphs to square for square easter egg */}
            <motion.div
                className="relative w-32 h-32 bg-gray-900/95 border border-white/10 shadow-2xl ring-1 ring-white/10 overflow-hidden"
                animate={{
                    borderRadius: isSquareActive ? '20%' : '50%',
                    rotate: isSquareActive ? [0, 5, -5, 0] : 0,
                }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
            >
                {/* TARGET label - hidden during easter eggs */}
                {!hasEasterEgg && (
                    <span className="absolute top-6 left-0 right-0 text-center text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase z-10">
                        TARGET
                    </span>
                )}

                <div className="absolute inset-0 flex items-center justify-center pt-2">
                    {memeState ? (
                        // Six-Seven Easter Egg
                        <motion.div
                            initial={{ scale: 0.8, rotate: -5 }}
                            animate={{
                                scale: [1, 1.1, 1],
                                rotate: [-5, 5, -5],
                                y: [0, -5, 5, 0]
                            }}
                            transition={{ duration: 0.5, repeat: Infinity }}
                            className="text-2xl font-black text-yellow-400 tracking-tighter text-center leading-tight"
                            style={{ textShadow: '0 0 20px rgba(250, 204, 21, 0.5)' }}
                        >
                            Siiiix...
                            <br />
                            Seveennn!
                        </motion.div>
                    ) : isSquareActive ? (
                        // Square Easter Egg
                        <motion.div
                            initial={{ scale: 0.5, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-xl font-black text-blue-400 tracking-tighter text-center leading-tight px-2"
                            style={{ textShadow: '0 0 20px rgba(96, 165, 250, 0.5)' }}
                        >
                            {squareState}
                        </motion.div>
                    ) : isPrimeActive ? (
                        // Prime Easter Egg (Optimus Prime / Transformers style)
                        <motion.div
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{
                                scale: [1, 1.05, 1],
                                opacity: 1,
                            }}
                            transition={{ duration: 0.3, repeat: 3 }}
                            className="text-lg font-black tracking-tighter text-center leading-tight px-2"
                            style={{
                                background: 'linear-gradient(135deg, #EF4444, #3B82F6)',
                                WebkitBackgroundClip: 'text',
                                WebkitTextFillColor: 'transparent',
                                textShadow: '0 0 20px rgba(239, 68, 68, 0.3)',
                            }}
                        >
                            {primeState}
                        </motion.div>
                    ) : (
                        // Normal target display
                        <motion.div
                            key={target}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            className="text-6xl font-black italic text-white tracking-tight leading-none"
                            style={{ textShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
                        >
                            {target}
                        </motion.div>
                    )}
                </div>
            </motion.div>
        </div>
    );
};
