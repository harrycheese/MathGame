
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
            <div className="max-w-md mx-auto space-y-4 relative z-10 w-full">

                {/* CAMPAIGN MODE (Journey) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => navigate('/campaign')}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 p-6 rounded-3xl relative overflow-hidden shadow-2xl group cursor-pointer border border-white/10"
                >
                    <div className="absolute -right-6 -bottom-6 opacity-20 group-hover:opacity-30 transition-opacity">
                        <svg className="w-40 h-40 transform rotate-12" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" /></svg>
                    </div>

                    <div className="flex justify-between items-start mb-2 relative z-10">
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter">CAMPAIGN</h2>
                            <span className="text-red-200 font-bold text-xs tracking-wider">THE 100 LEVEL JOURNEY</span>
                        </div>
                        <span className="bg-white/20 px-3 py-1 rounded-full text-xs font-bold backdrop-blur-sm">NEW</span>
                    </div>
                    <p className="text-purple-100/90 text-sm font-medium mt-2 max-w-[80%]">Unlock operators, earn medals, and master the grid.</p>
                </motion.div>

                {/* SURVIVAL MODE (Classic) */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="p-6 bg-gradient-to-br from-blue-600 to-cyan-700 rounded-3xl shadow-lg border border-white/10 cursor-pointer group"
                    onClick={() => navigate('/play')}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h2 className="text-3xl font-black italic tracking-tighter">SURVIVAL</h2>
                            <span className="text-blue-200 font-bold text-xs tracking-wider">CLASSIC ARCADE</span>
                        </div>
                        <svg className="w-8 h-8 text-blue-200 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                    </div>
                    <p className="text-blue-100/90 text-sm font-medium mt-2">Infinite play. Bank time with combos. Don't hit zero.</p>
                </motion.div>

            </div>
        </div>
    );
};
