
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export const GameModesScreen = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans p-6 overflow-hidden relative">
            {/* Background */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-[-10%] right-[-10%] w-96 h-96 bg-purple-600/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-[-10%] left-[-10%] w-96 h-96 bg-blue-600/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
            </div>

            {/* Header */}
            <div className="flex justify-between items-center mb-8 relative z-10">
                <div>
                    <h1 className="text-2xl font-black italic tracking-tighter">MATH GRID</h1>
                    <p className="text-gray-400 text-sm">Welcome, <span className="text-white font-bold">{currentUser?.displayName || 'Guest'}</span></p>
                </div>
                <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => navigate('/profile')}
                    className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center border border-white/10 hover:bg-white/20 transition-colors"
                >
                    <svg className="w-5 h-5 text-gray-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                        <circle cx="12" cy="7" r="4" />
                    </svg>
                </motion.button>
            </div>

            {/* Content */}
            <div className="max-w-md mx-auto space-y-4 relative z-10">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-6 bg-gradient-to-br from-blue-600 to-blue-800 rounded-2xl shadow-lg border border-white/10 cursor-pointer group"
                    onClick={() => navigate('/play')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="flex justify-between items-start mb-2">
                        <h2 className="text-2xl font-black italic">QUICK PLAY</h2>
                        <span className="bg-white/20 px-2 py-1 rounded text-xs font-bold">CLASSIC</span>
                    </div>
                    <p className="text-blue-100 text-sm">Find pairs that equal the changing Target. Score points to Level Up!</p>
                </motion.div>

                {/* Coming Soon Modes */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 opacity-50 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                            <span className="text-xs font-bold uppercase tracking-widest text-white/50 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Soon</span>
                        </div>
                        <h3 className="font-bold text-gray-400 mb-1">Ranked</h3>
                        <p className="text-xs text-gray-600">Compete globally</p>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 opacity-50 relative overflow-hidden">
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center z-10">
                            <span className="text-xs font-bold uppercase tracking-widest text-white/50 bg-black/50 px-3 py-1 rounded-full backdrop-blur-sm">Soon</span>
                        </div>
                        <h3 className="font-bold text-gray-400 mb-1">Zen Mode</h3>
                        <p className="text-xs text-gray-600">No timers, just chill</p>
                    </div>
                </div>
            </div>
        </div>
    );
};
