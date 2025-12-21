import { motion } from 'framer-motion';

interface OperatorTrayProps {
    operatorCounts: Record<string, number>;
    lastOperator?: string | null;
    allowedOps: string[];
    requiredOps?: Record<string, number>;
}

export const OperatorTray = ({ operatorCounts, lastOperator, allowedOps, requiredOps }: OperatorTrayProps) => {
    // The design choice: only SHOW unlocked ones.

    // Safety fallback
    const displayOps = allowedOps.length > 0 ? allowedOps : ['+'];

    return (
        <div className="flex items-center gap-4 bg-gray-900/50 backdrop-blur-sm px-4 py-2 rounded-xl border border-white/5 shadow-inner">
            {displayOps.map((op) => {
                const count = operatorCounts[op] || 0;
                const isJustActive = lastOperator === op;

                return (
                    <div key={op} className="relative group">
                        {/* Active Pulse Effect */}
                        {isJustActive && (
                            <motion.div
                                layoutId="active-glow"
                                className="absolute -inset-1 bg-white/20 rounded-xl blur-md"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                            />
                        )}

                        <div className={`relative w-10 h-10 flex items-center justify-center rounded-lg border border-white/10 transition-all duration-300
                            ${count > 0 ? 'bg-white/10 text-white' : 'bg-white/5 text-gray-500'}
                            ${isJustActive ? 'bg-white/20 scale-110 shadow-lg ring-1 ring-white/30' : ''}
                        `}>
                            <span className="text-lg font-black">{op}</span>

                            {/* Quest / Count Badge */}
                            {(() => {
                                const req = requiredOps?.[op];
                                if (req) {
                                    const isDone = count >= req;
                                    return (
                                        <div className={`absolute -top-2 -right-2 px-1.5 h-5 flex items-center justify-center rounded-full border shadow-sm text-[9px] font-bold z-10 ${isDone ? 'bg-green-500 border-green-600 text-white shadow-green-500/20' : 'bg-orange-500 border-orange-600 text-white shadow-orange-500/20'}`}>
                                            {count}/{req}
                                        </div>
                                    )
                                }
                                // Fallback: just show count if > 0 (Standard behavior)
                                if (count > 0) {
                                    return (
                                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-gray-900 shadow-sm z-10">
                                            {count}
                                        </div>
                                    )
                                }
                                return null;
                            })()}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
