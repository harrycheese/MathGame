import { motion } from 'framer-motion';
import { OperatorTray } from './OperatorTray';

interface GameHUDProps {
    target: number;
    score: number;
    level: number;
    operatorCounts: Record<string, number>;
    lastOperator?: string | null;
}

export const GameHUD = ({ target, score, level, operatorCounts, lastOperator }: GameHUDProps) => {
    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto z-20 mb-2">

            {/* 1. UNIFIED HEADER (Tray + Status) */}
            <div className="w-full flex items-center justify-between px-2 mb-4">
                {/* Left: Collections */}
                <OperatorTray operatorCounts={operatorCounts} lastOperator={lastOperator} />

                {/* Right: Status Pill */}
                <div className="flex items-center gap-4 px-6 py-2 bg-gray-900/80 backdrop-blur-md rounded-full border border-white/10 shadow-xl">
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-500 tracking-wider">LVL</span>
                        <span className="text-xl font-black text-white leading-none">{level}</span>
                    </div>
                    <div className="w-px h-8 bg-white/10" />
                    <div className="flex flex-col items-center">
                        <span className="text-[10px] font-bold text-gray-500 tracking-wider">SCORE</span>
                        <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 leading-none">
                            {score}
                        </span>
                    </div>
                </div>
            </div>

            {/* 2. THE HERO (Target) */}
            <div className="relative group">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-30 animate-pulse group-hover:opacity-50 transition-opacity" />
                <div className="relative flex flex-col items-center justify-center w-32 h-32 bg-gray-900/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl ring-1 ring-white/10 overflow-hidden">
                    <span className="text-[10px] font-bold text-gray-400 mb-0 tracking-[0.2em] uppercase z-10">TARGET</span>
                    <motion.span
                        key={target}
                        initial={{ scale: 0.5, opacity: 0, y: 10 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                        className="text-6xl font-black text-white tracking-tighter drop-shadow-[0_2px_10px_rgba(255,255,255,0.2)] z-10"
                    >
                        {target}
                    </motion.span>
                </div>
            </div>
        </div>
    );
};
