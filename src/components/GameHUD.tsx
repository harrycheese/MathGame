
import { motion } from 'framer-motion';
import { OperatorTray } from './OperatorTray';

interface GameHUDProps {
    target: number;
    score: number;
    level?: number; // Optional for zen mode
    operatorCounts: Record<string, number>;
    lastOperator?: string | null;
    memeState?: boolean;
    squareState?: string | null; // Square easter egg message
    primeState?: string | null; // Prime easter egg message
    allowedOps: string[];
    requiredOps?: Record<string, number>;
    showTarget?: boolean; // false = hide target (for survival mode side-by-side)
    onExit?: () => void;
}

export const GameHUD = ({ target, score, level, operatorCounts, lastOperator, memeState, squareState, primeState, allowedOps, requiredOps, showTarget = true, onExit }: GameHUDProps) => {
    // Determine which easter egg state is active
    const isSquareActive = !!squareState;
    const isPrimeActive = !!primeState;
    const hasEasterEgg = memeState || isSquareActive || isPrimeActive;
    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto z-20 mb-2">

            {/* HEADER ROW: Utilities */}
            <div className="w-full flex items-center justify-between px-4 mb-4">

                {/* Left Group: Exit & Operators */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onExit || (() => window.location.href = '/modes')}
                        className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <OperatorTray
                        operatorCounts={operatorCounts}
                        lastOperator={lastOperator}
                        allowedOps={allowedOps}
                        requiredOps={requiredOps}
                    />
                </div>

                {/* Right Group: Status Pill - removed backdrop-blur for Safari */}
                <div className="flex items-center gap-4 px-5 py-2 bg-gray-900/95 rounded-full border border-white/10 shadow-xl">
                    {level !== undefined && (
                        <>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-gray-500 tracking-wider">LVL</span>
                                <span className="text-xl font-black text-white leading-none">{level}</span>
                            </div>
                            <div className="w-px h-6 bg-white/10" />
                        </>
                    )}

                    {/* Score & Quests Container */}
                    <div className="flex flex-col items-end">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-gray-500 tracking-wider">SCORE</span>
                            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 leading-none">
                                {score}
                            </span>
                        </div>

                    </div>
                </div>
            </div>

            {/* HERO ROW: The Target (Centered & Large) */}
            {showTarget && (
                <div className="relative group flex justify-center py-2 mb-2">
                    <motion.div
                        className="absolute -inset-4 rounded-full blur-xl opacity-20 animate-pulse group-hover:opacity-40 transition-opacity"
                        animate={{
                            background: isSquareActive
                                ? 'linear-gradient(to right, #60A5FA, #818CF8, #A78BFA)'
                                : isPrimeActive
                                    ? 'linear-gradient(to right, #EF4444, #3B82F6, #9CA3AF)'
                                    : 'linear-gradient(to right, #3B82F6, #8B5CF6, #EC4899)'
                        }}
                    />

                    <motion.div
                        className="relative flex flex-col items-center justify-center w-32 h-32 bg-gray-900/95 border border-white/10 shadow-2xl ring-1 ring-white/10 overflow-hidden"
                        animate={{
                            borderRadius: isSquareActive ? '20%' : '50%',
                            rotate: isSquareActive ? [0, 5, -5, 0] : 0,
                        }}
                        transition={{ duration: 0.3, ease: 'easeInOut' }}
                    >
                        {!hasEasterEgg && (
                            <span className="text-[10px] font-bold text-gray-400 mb-1 tracking-[0.2em] uppercase z-10">TARGET</span>
                        )}

                        {memeState ? (
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
                            <motion.div
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                className="text-xl font-black text-blue-400 tracking-tighter text-center leading-tight px-2"
                                style={{ textShadow: '0 0 20px rgba(96, 165, 250, 0.5)' }}
                            >
                                {squareState}
                            </motion.div>
                        ) : isPrimeActive ? (
                            <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: [1, 1.05, 1], opacity: 1 }}
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
                    </motion.div>
                </div>
            )}

        </div>
    );
};
