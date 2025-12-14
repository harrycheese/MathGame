
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

// Debug Config (Safe Log - masks keys)
console.log("Firebase Config Check:", {
    apiKey: firebaseConfig.apiKey ? "***" : "MISSING",
    projectId: firebaseConfig.projectId,
    authDomain: firebaseConfig.authDomain
});

// Modern Persistence Setup
let dbInstance;
try {
    dbInstance = initializeFirestore(app, {
        localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager()
        }),
        experimentalForceLongPolling: true, // Force robust connection (Fixes 'Client Offline' on restricted networks)
    });
    console.log("Firebase Persistence Initialized Successfully (Long Polling Enabled)");
} catch (e) {
    console.error("Firebase Persistence Init Failed:", e);
    // Fallback if needed, but for now we want to see the error
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

                // Update total stars (Need to be careful not to double count if replaying)
                // Simplified: just recalculate or increment diff? 
                // Firestore increment is safer but logic is tricky with re-plays.
                // For now, let's just increment if it's a new level, or diff if separate.
                // Actually, let's just leave totalStars for a recalculation or cloud function later.
                // Or:
                const starDiff = result.stars - (oldResult?.stars || 0);
                if (starDiff > 0) {
                    updates.totalStars = increment(starDiff);
                }

                await updateDoc(userRef, updates);
            }
        }
    } catch (error) {
        console.error("Error saving progress:", error);
    }
};

export const getUserProgress = async (userId: string): Promise<UserProgress | null> => {
    try {
        const userRef = doc(db, 'users', userId);
        const snap = await getDoc(userRef);
        if (snap.exists()) return snap.data() as UserProgress;
        return null;
    } catch (error) {
        console.error("Error loading progress (Offline?):", error);
        return null;
    }
};
