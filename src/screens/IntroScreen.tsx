
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const IntroScreen = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();
    const isSignedIn = Boolean(currentUser && !currentUser.isAnonymous);
    const isStandalone = import.meta.env.VITE_APP_MODE === 'standalone';

    const handleStart = () => {
        if (isStandalone) {
            navigate('/play', { state: { mode: 'survival', level: 1 } });
        } else {
            navigate('/modes');
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans flex flex-col items-center justify-center p-4 overflow-hidden relative selection:bg-blue-500/30">
            {/* Background elements */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-yellow-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '2s' }} />
            </div>

            <div className="z-10 flex flex-col items-center text-center max-w-md w-full">

                {/* Hero Title */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="mb-12"
                >
                    <h1 className="text-8xl font-black text-transparent bg-clip-text bg-gradient-to-br from-blue-400 via-yellow-400 to-orange-500 tracking-tighter drop-shadow-[0_0_30px_rgba(250,204,21,0.5)] mb-2 italic">
                        SIX-7
                    </h1>
                    <p className="text-gray-400 text-lg font-medium tracking-widest uppercase mt-4">
                        Speed Math Survival
                    </p>
                </motion.div>

                {isSignedIn ? (
                    <>
                        {/* Signed-in Player Badge */}
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.2 }}
                            className="text-sm text-gray-400 mb-6"
                        >
                            Playing as <span className="text-white font-bold">{currentUser?.displayName || currentUser?.email}</span>
                        </motion.p>

                        {/* Primary Action: Start Game */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, type: "spring" }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={handleStart}
                            className="w-full py-5 bg-white text-gray-900 rounded-2xl font-black text-2xl tracking-wider shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all mb-4 relative overflow-hidden group"
                        >
                            <span className="relative z-10">START</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>

                        {/* Secondary Action: Profile & Stats */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            onClick={() => navigate('/profile')}
                            className="w-full py-3.5 bg-white/5 border border-white/10 rounded-xl font-bold text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all tracking-wider uppercase text-sm"
                        >
                            Profile &amp; Stats
                        </motion.button>
                    </>
                ) : (
                    <>
                        {/* Primary Action: Sign Up */}
                        <motion.button
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: 0.3, type: "spring" }}
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            onClick={() => navigate('/register')}
                            className="w-full py-5 bg-white text-gray-900 rounded-2xl font-black text-2xl tracking-wider shadow-[0_0_40px_rgba(255,255,255,0.3)] hover:shadow-[0_0_60px_rgba(255,255,255,0.5)] transition-all mb-4 relative overflow-hidden group"
                        >
                            <span className="relative z-10">SIGN UP</span>
                            <div className="absolute inset-0 bg-gradient-to-r from-yellow-200 to-white opacity-0 group-hover:opacity-100 transition-opacity" />
                        </motion.button>

                        {/* Secondary Action: Sign In */}
                        <motion.button
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.45 }}
                            onClick={() => navigate('/login')}
                            className="w-full py-3.5 bg-white/5 border border-white/10 rounded-xl font-bold text-gray-300 hover:bg-white/10 hover:border-white/20 transition-all tracking-wider uppercase text-sm"
                        >
                            Sign In
                        </motion.button>
                    </>
                )}

                {/* Footer Version & Privacy Link */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.8 }}
                    className="mt-16 flex flex-col items-center gap-2 text-gray-600 text-xs font-mono"
                >
                    <p>v1.0.0 • TWA PWA</p>
                    <a
                        href="/privacy.html"
                        className="text-gray-500 hover:text-gray-300 underline underline-offset-4 transition-colors"
                    >
                        Privacy Policy
                    </a>
                </motion.div>
            </div>
        </div>
    );
};
