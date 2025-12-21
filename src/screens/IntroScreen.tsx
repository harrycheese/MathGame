
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { signInAnonymously } from 'firebase/auth';
import { auth } from '../firebase';
import { useState } from 'react';

export const IntroScreen = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);

    const handleGuestLogin = async () => {
        setLoading(true);
        try {
            await signInAnonymously(auth);
            navigate('/modes');
        } catch {
            // Guest login failed - silent
        }
        setLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-blue-500/30">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="z-10 flex flex-col items-center text-center max-w-md w-full">

                {/* Hero Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-12"
                >
                    <h1 className="text-7xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-purple-400 to-pink-400 tracking-tighter drop-shadow-2xl mb-2">
                        SUMS
                    </h1>
                    <p className="text-gray-400 text-lg font-medium tracking-widest uppercase">
                        The Speed Math Game
                    </p>
                </motion.div>

                {/* Primary Action */}
                <motion.button
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.4, type: "spring" }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleGuestLogin}
                    disabled={loading}
                    className="w-full py-4 bg-white text-gray-900 rounded-2xl font-black text-xl shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all mb-4 relative overflow-hidden group disabled:opacity-70 disabled:cursor-not-allowed"
                >
                    <span className="relative z-10">{loading ? 'STARTING...' : 'PLAY AS GUEST'}</span>
                    <div className="absolute inset-0 bg-gradient-to-r from-blue-100 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                </motion.button>

                {/* Secondary Actions */}
                <div className="grid grid-cols-2 gap-4 w-full">
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.6 }}
                        onClick={() => navigate('/login')}
                        className="py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                        LOGIN
                    </motion.button>
                    <motion.button
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.7 }}
                        onClick={() => navigate('/register')}
                        className="py-3 bg-white/5 border border-white/10 rounded-xl font-bold text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all"
                    >
                        REGISTER
                    </motion.button>
                </div>

                {/* Footer Version */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1 }}
                    className="mt-16 text-gray-600 text-xs font-mono"
                >
                    v1.0.0 • PROTOTYPE
                </motion.p>
            </div>
        </div>
    );
};
