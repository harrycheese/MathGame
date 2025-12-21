
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { signOut, EmailAuthProvider, linkWithCredential, GoogleAuthProvider, linkWithPopup } from 'firebase/auth';
import { auth } from '../firebase';
import { useState } from 'react';

export const ProfileScreen = () => {
    const navigate = useNavigate();
    const { currentUser } = useAuth();

    // Link email form state
    const [showLinkForm, setShowLinkForm] = useState(false);
    const [linkEmail, setLinkEmail] = useState('');
    const [linkPassword, setLinkPassword] = useState('');
    const [linkError, setLinkError] = useState('');
    const [linkLoading, setLinkLoading] = useState(false);
    const [linkSuccess, setLinkSuccess] = useState(false);

    // Determine user type and display info
    const isAnon = currentUser?.isAnonymous;
    const name = currentUser?.displayName || (isAnon ? 'Guest Player' : 'User');
    const email = currentUser?.email || 'No email linked';

    const handleSignOut = async () => {
        try {
            // Clear local progress to prevent guest from seeing previous user's data
            localStorage.removeItem('mathGame_progress');
            await signOut(auth);
            navigate('/');
        } catch {
            // Sign out error - silent
        }
    };

    const handleLinkEmail = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        setLinkError('');
        setLinkLoading(true);

        try {
            // Create email credential
            const credential = EmailAuthProvider.credential(linkEmail, linkPassword);

            // Link to current anonymous account
            await linkWithCredential(currentUser, credential);

            setLinkSuccess(true);
            setShowLinkForm(false);

            // Force refresh to update UI
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            if (err.code === 'auth/email-already-in-use') {
                setLinkError('This email is already registered. Try signing in instead.');
            } else if (err.code === 'auth/weak-password') {
                setLinkError('Password should be at least 6 characters.');
            } else if (err.code === 'auth/invalid-email') {
                setLinkError('Please enter a valid email address.');
            } else {
                setLinkError('Failed to link account. Please try again.');
            }
        }
        setLinkLoading(false);
    };

    const handleLinkGoogle = async () => {
        if (!currentUser) return;

        setLinkError('');
        setLinkLoading(true);

        try {
            const provider = new GoogleAuthProvider();
            await linkWithPopup(currentUser, provider);

            setLinkSuccess(true);
            setShowLinkForm(false);

            // Force refresh to update UI
            setTimeout(() => window.location.reload(), 1500);
        } catch (err: any) {
            if (err.code === 'auth/credential-already-in-use') {
                setLinkError('This Google account is already linked to another user.');
            } else {
                setLinkError('Failed to link Google account. Please try again.');
            }
        }
        setLinkLoading(false);
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

                    {/* Success Message */}
                    {linkSuccess && (
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 text-sm text-green-400 mb-4"
                        >
                            ✓ Account linked successfully! Your progress is now saved.
                        </motion.div>
                    )}

                    {/* Link Email Prompt (for anonymous users) */}
                    {isAnon && !showLinkForm && !linkSuccess && (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-4 mb-2"
                        >
                            <p className="text-xs text-yellow-200/80 mb-3">
                                Link an email to save your progress across devices!
                            </p>
                            <button
                                onClick={() => setShowLinkForm(true)}
                                className="w-full py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 rounded-lg font-bold text-sm transition-all"
                            >
                                Link Email Now
                            </button>
                        </motion.div>
                    )}

                    {/* Link Email Form */}
                    <AnimatePresence>
                        {showLinkForm && (
                            <motion.form
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                onSubmit={handleLinkEmail}
                                className="bg-purple-500/10 border border-purple-500/20 rounded-xl p-4 mb-2 text-left overflow-hidden"
                            >
                                <h3 className="text-sm font-bold text-purple-300 mb-3 text-center">Link Your Account</h3>

                                {linkError && (
                                    <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-3 py-2 rounded-lg mb-3 text-xs text-center">
                                        {linkError}
                                    </div>
                                )}

                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Email *</label>
                                        <input
                                            type="email"
                                            required
                                            autoComplete="email"
                                            value={linkEmail}
                                            onChange={(e) => setLinkEmail(e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="you@example.com"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">Password *</label>
                                        <input
                                            type="password"
                                            required
                                            autoComplete="new-password"
                                            value={linkPassword}
                                            onChange={(e) => setLinkPassword(e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                            placeholder="Min 6 characters"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2 mt-4">
                                    <button
                                        type="button"
                                        onClick={() => setShowLinkForm(false)}
                                        className="flex-1 py-2 bg-white/10 hover:bg-white/20 text-gray-300 rounded-lg font-bold text-sm transition-all"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={linkLoading}
                                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white rounded-lg font-bold text-sm transition-all"
                                    >
                                        {linkLoading ? 'Linking...' : 'Link Email'}
                                    </button>
                                </div>

                                {/* OR Divider */}
                                <div className="flex items-center gap-3 mt-4">
                                    <div className="h-px bg-white/10 flex-1" />
                                    <span className="text-gray-500 text-xs">OR</span>
                                    <div className="h-px bg-white/10 flex-1" />
                                </div>

                                {/* Google Link Button */}
                                <button
                                    type="button"
                                    onClick={handleLinkGoogle}
                                    disabled={linkLoading}
                                    className="w-full mt-3 py-2.5 bg-white hover:bg-gray-100 disabled:opacity-50 text-gray-900 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-all"
                                >
                                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                                        <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                        <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                        <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                        <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                    </svg>
                                    Link with Google
                                </button>
                            </motion.form>
                        )}
                    </AnimatePresence>
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
