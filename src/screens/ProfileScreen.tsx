import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
    signOut,
    deleteUser,
    EmailAuthProvider,
    GoogleAuthProvider,
    reauthenticateWithCredential,
    reauthenticateWithPopup,
} from 'firebase/auth';
import { auth } from '../firebase';
import { useState, useEffect } from 'react';
import { useUserProgress } from '../hooks/useUserProgress';

export const ProfileScreen = () => {
    const navigate = useNavigate();
    const isStandalone = import.meta.env.VITE_APP_MODE === 'standalone';
    const { currentUser } = useAuth();
    const { progress, refetch } = useUserProgress();

    // Refetch stats on mount to ensure fresh data
    useEffect(() => {
        refetch();
    }, [refetch]);

    // Delete account modal state
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteConfirmText, setDeleteConfirmText] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [deleteLoading, setDeleteLoading] = useState(false);

    // Determine user info & auth provider
    const name = currentUser?.displayName || 'Player';
    const email = currentUser?.email || 'No email';
    const hasPasswordProvider = Boolean(
        currentUser?.providerData.some((p) => p.providerId === 'password')
    );
    const hasGoogleProvider = Boolean(
        currentUser?.providerData.some((p) => p.providerId === 'google.com')
    );

    const handleSignOut = async () => {
        try {
            localStorage.removeItem('mathGame_progress');
            await signOut(auth);
            navigate('/');
        } catch {
            // Sign out error - silent
        }
    };

    const handleDeleteAccount = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentUser) return;

        if (deleteConfirmText.trim().toUpperCase() !== 'DELETE') {
            setDeleteError('Please type DELETE to confirm.');
            return;
        }

        setDeleteError('');
        setDeleteLoading(true);

        try {
            // 1. Re-authenticate BEFORE deleting Firestore data so deleteUser cannot fail with auth/requires-recent-login
            if (hasPasswordProvider && currentUser.email) {
                if (!deletePassword) {
                    setDeleteError('Please enter your password to confirm deletion.');
                    setDeleteLoading(false);
                    return;
                }
                const credential = EmailAuthProvider.credential(currentUser.email, deletePassword);
                await reauthenticateWithCredential(currentUser, credential);
            } else if (hasGoogleProvider) {
                const provider = new GoogleAuthProvider();
                await reauthenticateWithPopup(currentUser, provider);
            }

            // 2. Delete Firestore sessions subcollection & user document
            const { doc, deleteDoc, collection, getDocs, writeBatch } = await import('firebase/firestore');
            const { db } = await import('../firebase');

            const userRef = doc(db, 'users', currentUser.uid);
            const sessionsRef = collection(userRef, 'sessions');
            const sessionsSnap = await getDocs(sessionsRef);

            if (!sessionsSnap.empty) {
                const batch = writeBatch(db);
                sessionsSnap.docs.forEach((sessionDoc) => {
                    batch.delete(sessionDoc.ref);
                });
                await batch.commit();
            }

            await deleteDoc(userRef);

            // 3. Clear local cache and delete Firebase Auth account
            localStorage.removeItem('mathGame_progress');
            await deleteUser(currentUser);

            navigate('/');
        } catch (err: unknown) {
            const code = typeof err === 'object' && err !== null && 'code' in err ? String((err as { code?: unknown }).code) : '';
            const message = err instanceof Error ? err.message : '';
            if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                setDeleteError('Incorrect password. Please try again.');
            } else if (code === 'auth/popup-closed-by-user') {
                setDeleteError('Google verification was cancelled.');
            } else if (code === 'auth/requires-recent-login') {
                setDeleteError('Please sign out, sign back in, and try deleting your account again.');
            } else {
                setDeleteError(message || 'Failed to delete account. Please try again.');
            }
        }
        setDeleteLoading(false);
    };

    const stats = progress?.analytics || {
        totalEquationsSolved: 0,
        totalTimePlayed: 0,
        sessionsPlayed: 0,
        operatorUsage: { add: 0, subtract: 0, multiply: 0, divide: 0 },
        totalCombos: 0
    };

    const formatTime = (seconds: number) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        if (h > 0) return `${h}h ${m}m`;
        return `${m}m`;
    };

    // --- DATA RESET (For Beta Testing) ---
    const handleResetStats = async () => {
        if (!currentUser || !window.confirm("Are you sure? This will WIPEOUT all your career stats, sessions, and progress. This cannot be undone.")) return;

        try {
            const { doc, deleteDoc, collection, getDocs, writeBatch } = await import('firebase/firestore');
            const { db, ensureUserDocument } = await import('../firebase');

            const userRef = doc(db, 'users', currentUser.uid);
            const sessionsRef = collection(userRef, 'sessions');

            // 1. Delete all session documents
            const sessionsSnap = await getDocs(sessionsRef);
            if (!sessionsSnap.empty) {
                const batch = writeBatch(db);
                sessionsSnap.docs.forEach(sessionDoc => {
                    batch.delete(sessionDoc.ref);
                });
                await batch.commit();
            }

            // 2. Delete the entire user document (removes ALL fields including corrupted ones)
            await deleteDoc(userRef);

            // 3. Recreate a fresh user document with defaults
            await ensureUserDocument(currentUser.uid);

            alert("Reset complete! Your data has been wiped.");
            window.location.reload();
        } catch (e) {
            console.error("Reset failed", e);
            alert("Failed to reset stats: " + (e instanceof Error ? e.message : String(e)));
        }
    };

    return (
        <div className="h-screen bg-[#0a0a0f] text-white font-sans overflow-hidden flex flex-col">
            <div className="flex-1 overflow-y-auto p-6 scrollbar-hide">
                <div className="max-w-md mx-auto pb-20">
                    <div className="flex items-center gap-4 mb-8">
                        <button
                            onClick={() => navigate(isStandalone ? '/' : '/modes')}
                            className="p-2 -ml-2 hover:bg-white/10 rounded-xl transition-colors"
                        >
                            <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                        <h1 className="text-xl font-black italic">PROFILE</h1>
                    </div>

                    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 mb-6 text-center">
                        <div className="w-20 h-20 bg-gradient-to-br from-purple-500 to-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center text-2xl font-bold shadow-lg ring-4 ring-white/10">
                            {name[0].toUpperCase()}
                        </div>
                        <h2 className="text-xl font-bold mb-1">{name}</h2>
                        <p className="text-sm text-gray-400">{email}</p>
                    </div>

                    {/* ANALYTICS SECTION */}
                    <div className="space-y-4">
                        <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest pl-2">Career Stats</h3>

                        <div className="grid grid-cols-2 gap-3">
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                                <span className="text-2xl font-black text-white">{stats.totalEquationsSolved}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Solved</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                                <span className="text-2xl font-black text-white">{formatTime(stats.totalTimePlayed)}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Time Played</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                                <span className="text-2xl font-black text-yellow-400">{progress?.totalStars || 0}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Stars</span>
                            </div>
                            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col items-center">
                                <span className="text-2xl font-black text-blue-400">{stats.sessionsPlayed}</span>
                                <span className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Sessions</span>
                            </div>
                        </div>

                        <h3 className="text-gray-500 font-bold text-xs uppercase tracking-widest pl-2 mt-6">Operator Mastery</h3>
                        <div className="bg-white/5 border border-white/10 rounded-2xl p-5">
                            {/* Simple bars for operators */}
                            {[
                                { key: 'add', label: '+', color: 'bg-blue-500' },
                                { key: 'subtract', label: '-', color: 'bg-pink-500' },
                                { key: 'multiply', label: '×', color: 'bg-purple-500' },
                                { key: 'divide', label: '÷', color: 'bg-teal-500' },
                            ].map(op => {
                                const val = stats.operatorUsage[op.key as keyof typeof stats.operatorUsage] || 0;
                                const max = Math.max(1, Math.max(...Object.values(stats.operatorUsage)));
                                const pct = max > 0 ? (val / max) * 100 : 0;

                                return (
                                    <div key={op.key} className="flex items-center gap-3 mb-3 last:mb-0">
                                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-gray-300">
                                            {op.label}
                                        </div>
                                        <div className="flex-1">
                                            <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                                                <motion.div
                                                    initial={{ width: 0 }}
                                                    whileInView={{ width: `${pct}%` }}
                                                    className={`h-full ${op.color}`}
                                                />
                                            </div>
                                        </div>
                                        <div className="w-12 text-right font-bold text-sm text-gray-400">
                                            {val}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>

                    </div>

                    {/* Sign Out Button */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={handleSignOut}
                        className="w-full mt-8 py-4 bg-white/5 border border-white/10 text-gray-200 font-bold rounded-xl hover:bg-white/10 transition-all"
                    >
                        Sign Out
                    </motion.button>

                    {/* Danger Zone: Delete Account */}
                    <motion.button
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            setDeleteError('');
                            setDeletePassword('');
                            setDeleteConfirmText('');
                            setShowDeleteModal(true);
                        }}
                        className="w-full mt-3 py-3.5 bg-red-500/10 border border-red-500/20 text-red-400 font-bold text-sm rounded-xl hover:bg-red-500/20 transition-all"
                    >
                        Delete Account
                    </motion.button>

                    {/* Privacy Policy Link */}
                    <div className="mt-6 text-center">
                        <a
                            href="/privacy.html"
                            className="text-xs text-gray-500 hover:text-gray-300 underline underline-offset-4 transition-colors"
                        >
                            Privacy Policy
                        </a>
                    </div>

                    {/* Debug Reset Link (DEV ONLY) */}
                    {import.meta.env.DEV && (
                        <div className="pt-8 pb-4 text-center">
                            <button onClick={handleResetStats} className="text-[10px] text-red-500/30 hover:text-red-500 font-bold uppercase tracking-widest transition-colors">
                                [Debug] Reset All Data
                            </button>
                            <div className="text-[10px] text-gray-700 mt-2 font-mono">
                                UID: {currentUser?.uid?.substring(0, 8)}...
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* Delete Account Confirmation Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
                    >
                        <motion.form
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            onSubmit={handleDeleteAccount}
                            className="w-full max-w-md bg-[#12121a] border border-red-500/30 rounded-3xl p-6 shadow-2xl"
                        >
                            <h3 className="text-xl font-black text-red-400 mb-2">Delete Account</h3>
                            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
                                This permanently deletes your Six-7 account, career stats, and session history. This action cannot be undone.
                            </p>

                            {deleteError && (
                                <div className="bg-red-500/10 border border-red-500/40 text-red-400 px-3 py-2.5 rounded-xl mb-4 text-xs text-center">
                                    {deleteError}
                                </div>
                            )}

                            <div className="space-y-3 mb-5">
                                {hasPasswordProvider && (
                                    <div>
                                        <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                            Current Password
                                        </label>
                                        <input
                                            type="password"
                                            required
                                            autoComplete="current-password"
                                            value={deletePassword}
                                            onChange={(e) => setDeletePassword(e.target.value)}
                                            className="w-full bg-black/30 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                            placeholder="Enter your password"
                                        />
                                    </div>
                                )}

                                <div>
                                    <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">
                                        Type DELETE to confirm
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={deleteConfirmText}
                                        onChange={(e) => setDeleteConfirmText(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl px-3.5 py-2.5 text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                                        placeholder="DELETE"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-3">
                                <button
                                    type="button"
                                    disabled={deleteLoading}
                                    onClick={() => setShowDeleteModal(false)}
                                    className="flex-1 py-3 bg-white/10 hover:bg-white/15 text-gray-300 font-bold text-sm rounded-xl transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={deleteLoading}
                                    className="flex-1 py-3 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-bold text-sm rounded-xl transition-colors"
                                >
                                    {deleteLoading
                                        ? 'Deleting...'
                                        : hasGoogleProvider && !hasPasswordProvider
                                            ? 'Verify & Delete'
                                            : 'Delete Forever'}
                                </button>
                            </div>
                        </motion.form>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
