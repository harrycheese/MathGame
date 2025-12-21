import { motion } from 'framer-motion';

interface TargetCircleProps {
    target: number;
    memeState?: boolean;
}

export const TargetCircle = ({ target, memeState }: TargetCircleProps) => {
    return (
        <div className="relative group flex justify-center">
            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-full blur-xl opacity-20 animate-pulse group-hover:opacity-40 transition-opacity" />

            <div className="relative flex flex-col items-center justify-center w-32 h-32 bg-gray-900/80 backdrop-blur-xl rounded-full border border-white/10 shadow-2xl ring-1 ring-white/10 overflow-hidden">
                {!memeState && (
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
            </div>
        </div>
    );
};
