import { motion, AnimatePresence } from 'framer-motion';

interface TargetCircleProps {
    target: number;
    memeState?: boolean;
    squareState?: string | null; // Square easter egg message
    primeState?: string | null; // Prime easter egg message
    isResettingTarget?: boolean; // Power-up: roulette animation
}

export const TargetCircle = ({ target, memeState, squareState, primeState, isResettingTarget }: TargetCircleProps) => {
    // Determine which easter egg state is active
    const isSquareActive = !!squareState;
    const isPrimeActive = !!primeState;
    const hasEasterEgg = memeState || isSquareActive || isPrimeActive;

    return (
        <div className="relative group flex justify-center">
            {/* Glow effect - intensifies during spin OR changes color for easter eggs */}
            <motion.div
                className="absolute -inset-4 rounded-full blur-xl"
                animate={{
                    opacity: isResettingTarget ? [0.3, 0.6, 0.3] : 0.2,
                    scale: isResettingTarget ? [1, 1.1, 1] : 1,
                    background: isSquareActive
                        ? 'linear-gradient(to right, #60A5FA, #818CF8, #A78BFA)' // Blue/purple for squares
                        : isPrimeActive
                            ? 'linear-gradient(to right, #EF4444, #3B82F6, #9CA3AF)' // Red/blue/silver for Transformers
                            : 'linear-gradient(to right, #3B82F6, #8B5CF6, #EC4899)' // Default
                }}
                transition={{
                    duration: 0.3,
                    repeat: isResettingTarget ? Infinity : 0,
                }}
            />

            {/* Container for the wheel structure */}
            <div className="relative w-32 h-32 rounded-full overflow-hidden">

                {/* ROTATING BACKGROUND LAYER (for roulette animation) */}
                <motion.div
                    className="absolute inset-0 bg-gray-900/95 rounded-full border-2 shadow-2xl ring-1 ring-white/10"
                    style={{
                        borderColor: isResettingTarget ? '#f59e0b' : 'rgba(255,255,255,0.1)',
                        boxShadow: isResettingTarget
                            ? '0 0 30px rgba(245, 158, 11, 0.5), inset 0 0 20px rgba(245, 158, 11, 0.2)'
                            : '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                    }}
                    animate={{
                        rotate: isResettingTarget ? [0, 360, 720, 1080, 1440] : 0,
                        borderRadius: isSquareActive ? '20%' : '50%',
                    }}
                    transition={{
                        duration: 1.5,
                        ease: [0.25, 0.1, 0.1, 1], // Fast start, slow finish
                        times: [0, 0.3, 0.5, 0.7, 1],
                    }}
                >
                    {/* Spinning lines decoration - only visible during spin */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: isResettingTarget ? 1 : 0 }}
                    >
                        <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center rotate-45">
                            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center rotate-90">
                            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
                        </div>
                        <div className="absolute inset-0 flex items-center justify-center rotate-[135deg]">
                            <div className="w-full h-0.5 bg-gradient-to-r from-transparent via-amber-400 to-transparent opacity-50" />
                        </div>
                    </motion.div>
                </motion.div>

                {/* STATIONARY FOREGROUND LAYER */}
                <div className="absolute inset-0 z-10 flex flex-col items-center justify-center">

                    {/* TARGET label - Fades out during reset or easter eggs */}
                    {!hasEasterEgg && !isResettingTarget && (
                        <motion.span
                            className="absolute top-6 left-0 right-0 text-center text-[10px] font-bold text-gray-400 tracking-[0.2em] uppercase"
                            animate={{ opacity: 1 }}
                        >
                            TARGET
                        </motion.span>
                    )}

                    {/* Number / Content Area */}
                    <div className="flex items-center justify-center pt-2 w-full h-full">
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
                        ) : isResettingTarget ? (
                            // Roulette animation - pulsing "?"
                            <motion.div
                                key="question-mark"
                                initial={{ scale: 0, opacity: 0 }}
                                animate={{
                                    opacity: 1,
                                    scale: [1, 1.2, 1],
                                }}
                                exit={{ scale: 0, opacity: 0 }}
                                transition={{
                                    scale: { duration: 0.4, repeat: Infinity }
                                }}
                                className="text-6xl font-black text-amber-400"
                                style={{
                                    textShadow: '0 0 30px rgba(245, 158, 11, 0.8)',
                                }}
                            >
                                ?
                            </motion.div>
                        ) : (
                            // Normal target display
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={target}
                                    initial={{ scale: 0.5, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    transition={{
                                        type: 'spring',
                                        stiffness: 400,
                                        damping: 15,
                                    }}
                                    className="text-6xl font-black italic text-white tracking-tight leading-none"
                                    style={{ textShadow: '0 0 30px rgba(59, 130, 246, 0.5)' }}
                                >
                                    {target}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
};
