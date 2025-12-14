
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export const ProfileScreen = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Determine user type and display info
    const isAnon = currentUser?.isAnonymous;
    const name = currentUser?.displayName || (isAnon ? 'Guest Player' : 'User');
    const email = currentUser?.email || 'No email linked';

    const handleSignOut = async () => {
        try {
            await signOut(auth);
            navigate('/');
        } catch (error) {
            console.error("Error signing out:", error);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans p-6">
            <div className="max-w-md mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <button
                        onClick={() => navigate('/modes')}
                        className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors"
                    >
                        <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <h1 className="text-xl font-black italic">PROFILE</h1>
                </div>

                <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 text-center">
                    <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold shadow-lg">
                        {name[0].toUpperCase()}
                    </div>
                    <h2 className="text-xl font-bold mb-1">{name}</h2>
                    <p className="text-sm text-gray-400 mb-4">{isAnon ? 'Guest Account (Stats not cloud saved)' : email}</p>

                    {isAnon && (
                        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 text-xs text-yellow-200/80 mb-2">
                            Tip: Link an email safely to save your progress across devices. (Coming Soon)
                        </div>
                    )}
                </div>

                <div className="space-y-3">
                    <button className="w-full p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors">
                        <span className="font-bold text-gray-300">Stats</span>
                        <span className="text-gray-500">Coming Soon</span>
                    </button>
                    <button className="w-full p-4 bg-white/5 border border-white/10 rounded-xl flex items-center justify-between hover:bg-white/10 transition-colors">
                        <span className="font-bold text-gray-300">Settings</span>
                        <span className="text-gray-500">→</span>
                    </button>
                </div>

                <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleSignOut}
                    className="w-full mt-12 py-4 bg-red-500/10 border border-red-500/20 text-red-500 font-bold rounded-xl hover:bg-red-500/20 transition-all"
                >
                    Sign Out
                </motion.button>
            </div>
        </div>
    );
};
