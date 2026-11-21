
import { initializeApp } from 'firebase/app';
import { initializeAuth, indexedDBLocalPersistence, browserLocalPersistence, getAuth } from 'firebase/auth';
import { getAnalytics } from 'firebase/analytics';

// Your web app's Firebase configuration
const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
import { doc, setDoc, getDoc, updateDoc, increment, initializeFirestore, persistentLocalCache, persistentMultipleTabManager } from 'firebase/firestore';
import { type LevelResult, type UserProgress } from './types/game';

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Explicitly configure Auth persistence to IndexedDB with localStorage fallback
// to prevent Android background / process kill from losing auth tokens
let authInstance;
try {
    authInstance = initializeAuth(app, {
        persistence: [indexedDBLocalPersistence, browserLocalPersistence]
    });
} catch {
    authInstance = getAuth(app);
}
export const auth = authInstance;
export const analytics = getAnalytics(app);

// Modern Persistence Setup
let dbInstance;
try {
    dbInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        }),
        experimentalForceLongPolling: true, // Force robust connection
    });
} catch (e) {
    // Persistence init failed - rethrow to surface the issue
    throw e;
}
export const db = dbInstance;

// Persistence Helpers
export const saveLevelProgress = async (userId: string, level: number, result: LevelResult) => {
    const userRef = doc(db, 'users', userId);

    try {
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // Create new user profile if not exists
            const initialData: UserProgress = {
                currentLevel: level === 1 && result.stars > 0 ? 2 : 1,
                totalStars: result.stars,
                levelStats: { [level]: result },
                unlockedOperators: ['+']
            };
            await setDoc(userRef, initialData);
        } else {
            // Update existing
            const key = `levelStats.${level}`;
            const data = userSnap.data() as UserProgress;

            // Check if we improved the score/stars for this level
            const oldResult = data.levelStats?.[level];
            const isImprovement = !oldResult || result.score > oldResult.score || result.stars > oldResult.stars;

            if (isImprovement) {
                const updates: any = {
                    [key]: result
                };

                // Unlock next level if this was the latest level
                if (level >= (data.currentLevel || 1) && result.stars > 0) {
                    updates.currentLevel = level + 1;
                }

                // Update total stars diff
                const starDiff = result.stars - (oldResult?.stars || 0);
                if (starDiff > 0) {
                    updates.totalStars = increment(starDiff);
                }

                await updateDoc(userRef, updates);
            }
        }
    } catch {
        // Error saving progress - silent fail for offline support
    }
};

export const getUserProgress = async (userId: string): Promise<UserProgress | null> => {
    try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        if (snap.exists()) return snap.data() as UserProgress;
        return null;
    } catch {
        // Error loading progress (likely offline)
        return null;
    }
};

import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { logEvent } from 'firebase/analytics';
import type { GameSession, UserAnalytics } from './types/game';

// Ensure user document exists (call on auth)
// Uses getDoc check - will NOT overwrite existing data
export const ensureUserDocument = async (userId: string) => {
    try {
        const userRef = doc(db, 'users', userId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            // Create fresh user document with defaults
            await setDoc(userRef, {
                currentLevel: 1,
                totalStars: 0,
                unlockedOperators: ['+'],
                createdAt: Date.now(),
                analytics: {
                    totalEquationsSolved: 0,
                    totalTimePlayed: 0,
                    sessionsPlayed: 0,
                    lastPlayed: null,
                    operatorUsage: { add: 0, subtract: 0, multiply: 0, divide: 0 },
                    totalCombos: 0
                }
            });
        }
        // If doc exists, do nothing - preserve existing data
    } catch (e) {
        console.error("Error ensuring user document:", e);
    }
};

export const saveSessionAnalytics = async (userId: string, session: GameSession): Promise<string | null> => {
    try {
        const userRef = doc(db, 'users', userId);
        const sessionsRef = collection(userRef, 'sessions');

        // 1. Save detailed history (History Collection)
        const docRef = await addDoc(sessionsRef, {
            ...session,
            savedAt: serverTimestamp() // Server-side timestamp for accuracy
        });

        // 2. Google Analytics Logging
        const eventName = session.result === 'win' ? 'level_complete' : 'game_over';
        logEvent(analytics, eventName, {
            level: session.level,
            score: session.score,
            time_taken: session.timeTaken,
            mode: session.mode,
            result: session.result
        });

        // 3. Update Aggregates (Atomic Increments)
        // First ensure user doc exists
        await ensureUserDocument(userId);

        const totalSolved = (session.analytics.operatorCounts.add || 0) +
            (session.analytics.operatorCounts.subtract || 0) +
            (session.analytics.operatorCounts.multiply || 0) +
            (session.analytics.operatorCounts.divide || 0);

        const updates: any = {
            'analytics.totalEquationsSolved': increment(totalSolved),
            'analytics.totalTimePlayed': increment(session.timeTaken),
            'analytics.sessionsPlayed': increment(1),
            'analytics.lastPlayed': Date.now(),

            // Operator Usage
            'analytics.operatorUsage.add': increment(session.analytics.operatorCounts.add || 0),
            'analytics.operatorUsage.subtract': increment(session.analytics.operatorCounts.subtract || 0),
            'analytics.operatorUsage.multiply': increment(session.analytics.operatorCounts.multiply || 0),
            'analytics.operatorUsage.divide': increment(session.analytics.operatorCounts.divide || 0),

            // Survival
            'analytics.totalCombos': increment(session.analytics.combos || 0),
        };

        // Use updateDoc - it correctly handles dotted keys as nested paths
        await updateDoc(userRef, updates);

        return docRef.id; // Return ID so we can update it later

    } catch (e) {
        console.error("Error saving analytics:", e);
        return null;
    }
};

// Update an existing session (for Zen Mode autosave)
export const updateSessionAnalytics = async (userId: string, sessionId: string, session: GameSession, deltas: UserAnalytics) => {
    try {
        const userRef = doc(db, 'users', userId);
        const sessionRef = doc(db, 'users', userId, 'sessions', sessionId);

        // 1. Update Session Doc (Overwrite with latest snapshot)
        await setDoc(sessionRef, {
            ...session,
            updatedAt: serverTimestamp()
        }, { merge: true });

        // 2. Update Aggregates (Atomic Increments using DELTAS)
        // Only increment if there is a delta change
        if (deltas.totalEquationsSolved > 0 || deltas.totalTimePlayed > 0) {
            const updates: any = {
                'analytics.lastPlayed': Date.now(),
            };

            if (deltas.totalEquationsSolved > 0) updates['analytics.totalEquationsSolved'] = increment(deltas.totalEquationsSolved);
            if (deltas.totalTimePlayed > 0) updates['analytics.totalTimePlayed'] = increment(deltas.totalTimePlayed);
            if (deltas.sessionsPlayed > 0) updates['analytics.sessionsPlayed'] = increment(deltas.sessionsPlayed); // Usually 0 for updates

            if (deltas.operatorUsage.add > 0) updates['analytics.operatorUsage.add'] = increment(deltas.operatorUsage.add);
            if (deltas.operatorUsage.subtract > 0) updates['analytics.operatorUsage.subtract'] = increment(deltas.operatorUsage.subtract);
            if (deltas.operatorUsage.multiply > 0) updates['analytics.operatorUsage.multiply'] = increment(deltas.operatorUsage.multiply);
            if (deltas.operatorUsage.divide > 0) updates['analytics.operatorUsage.divide'] = increment(deltas.operatorUsage.divide);

            if (deltas.totalCombos > 0) updates['analytics.totalCombos'] = increment(deltas.totalCombos);

            await updateDoc(userRef, updates);
        }

    } catch (e) {
        console.error("Error updating analytics:", e);
    }
};
