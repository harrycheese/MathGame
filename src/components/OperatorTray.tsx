import { motion } from 'framer-motion';

interface OperatorTrayProps {
    operatorCounts: Record<string, number>;
    lastOperator?: string | null;
}

export const OperatorTray = ({ operatorCounts, lastOperator }: OperatorTrayProps) => {
    const operators = ['+', '-', '×', '÷'];

    return (
        <div className="flex items-center gap-2 bg-gray-900/50 backdrop-blur-sm px-3 py-2 rounded-xl border border-white/5 shadow-inner">
            {operators.map((op) => {
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

                            {/* Count Badge */}
                            {count > 0 && (
                                <div className="absolute -top-2 -right-2 bg-blue-500 text-white text-[10px] font-bold w-5 h-5 flex items-center justify-center rounded-full border border-gray-900 shadow-sm">
                                    {count}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}
        </div>
    );
};
