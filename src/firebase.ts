
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
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
export const auth = getAuth(app);
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
