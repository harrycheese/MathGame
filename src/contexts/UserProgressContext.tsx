import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { getUserProgress, saveLevelProgress } from '../firebase';
import type { UserProgress, LevelResult } from '../types/game';

// Local Storage Key
const LS_KEY = 'mathGame_progress';

interface UserProgressContextType {
    progress: UserProgress | null;
    loading: boolean;
    saveLevel: (level: number, result: LevelResult) => Promise<void>;
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export const UserProgressProvider = ({ children }: { children: ReactNode }) => {
    const { currentUser } = useAuth();
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [loading, setLoading] = useState(true);

    // Initial Load
    useEffect(() => {
        const load = async () => {
            let loadedData: UserProgress | null = null;

            if (currentUser) {
                try {
                    loadedData = await getUserProgress(currentUser.uid);
                } catch (e) {
                    console.warn("Context: Firebase load failed (Offline?), trying local fallback", e);
                }
            }

            // 2. Fallback to LocalStorage if Firebase missing or failed
            if (!loadedData) {
                const local = localStorage.getItem(LS_KEY);
                if (local) {
                    try {
                        const parsed = JSON.parse(local);
                        // Only use local if it looks valid
                        if (parsed && parsed.currentLevel) {
                            console.log("Context: Loaded from LocalStorage Fallback");
                            loadedData = parsed;
                        }
                    } catch (e) {
                        console.error("Failed to parse local progress", e);
                    }
                }
            }

            if (loadedData) {
                setProgress(loadedData);
            }
            setLoading(false);
        };
        load();
    }, [currentUser]);

    const saveLevel = async (level: number, result: LevelResult) => {
        console.log("Context: saveLevel called", { level, result, currentProgress: progress });

        // 1. Get current state (Memory is Source of Truth)
        let current = progress;

        if (!current) {
            // Fallback init
            current = {
                currentLevel: 1,
                totalStars: 0,
                levelStats: {},
                unlockedOperators: ['+']
            };
            console.log("Context: No progress found, initialized default", current);
        }

        // 2. Compute new state synchronously
        const oldResult = current.levelStats[level];
        const isImprovement = !oldResult || result.score > oldResult.score || result.stars > oldResult.stars;

        console.log("Context: Improvement check", { oldResult, newResult: result, isImprovement });

        if (!isImprovement) {
            console.log("Context: No improvement, skipping save");
            return;
        }

        const next = { ...current };
        next.levelStats = { ...current.levelStats, [level]: result };

        // Unlock next level logic
        if (level >= current.currentLevel && result.stars > 0) {
            console.log(`Context: Unlocking next level! ${current.currentLevel} -> ${level + 1}`);
            next.currentLevel = level + 1;
        }

        // 3. Update Memory Instantly
        setProgress(next);

        // 4. PERSIST (Dual Write Strategy)
        // Always save to LocalStorage as a backup/cache
        console.log("Context: Saving to LocalStorage (Backup)");
        localStorage.setItem(LS_KEY, JSON.stringify(next));

        // If logged in, ALSO try to save to Firebase
        if (currentUser) {
            console.log("Context: Persisting to Firebase");
            // Fire and forget - don't let network error stop the UI or local save
            saveLevelProgress(currentUser.uid, level, result).catch(e => {
                console.warn("Context: Firebase save failed (Offline?), but LocalStorage is safe.", e);
            });
        }
    };

    return (
        <UserProgressContext.Provider value={{ progress, loading, saveLevel }}>
            {children}
        </UserProgressContext.Provider>
    );
};

// Export hook to consume context
export const useUserProgressContext = () => {
    const context = useContext(UserProgressContext);
    if (!context) {
        throw new Error('useUserProgressContext must be used within a UserProgressProvider');
    }
    return context;
};
