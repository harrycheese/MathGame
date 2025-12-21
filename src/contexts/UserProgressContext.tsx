import { createContext, useContext, useState, useEffect, useCallback } from 'react';
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
    refetch: () => Promise<void>; // Added: manual refresh function
}

const UserProgressContext = createContext<UserProgressContextType | undefined>(undefined);

export const UserProgressProvider = ({ children }: { children: ReactNode }) => {
    const { currentUser } = useAuth();
    const [progress, setProgress] = useState<UserProgress | null>(null);
    const [loading, setLoading] = useState(true);

    // Load function extracted so it can be called on demand
    const loadProgress = useCallback(async () => {
        if (!currentUser) {
            setProgress(null);
            setLoading(false);
            return;
        }

        setLoading(true);
        let loadedData: UserProgress | null = null;

        try {
            loadedData = await getUserProgress(currentUser.uid);
        } catch {
            // Firebase load failed, will try localStorage fallback
        }

        // Fallback to LocalStorage if Firebase missing or failed
        // Only use localStorage if user is logged in (not for fresh guests)
        if (!loadedData && currentUser && !currentUser.isAnonymous) {
            const local = localStorage.getItem(LS_KEY);
            if (local) {
                try {
                    const parsed = JSON.parse(local);
                    if (parsed && parsed.currentLevel) {
                        loadedData = parsed;
                    }
                } catch {
                    // Invalid local storage data, ignore
                }
            }
        }

        setProgress(loadedData);
        setLoading(false);
    }, [currentUser]);

    // Initial Load - reset and reload when user changes
    useEffect(() => {
        setProgress(null); // Reset before loading
        loadProgress();
    }, [loadProgress]);

    const saveLevel = async (level: number, result: LevelResult) => {
        // Get current state (Memory is Source of Truth)
        let current = progress;

        if (!current) {
            // Fallback init
            current = {
                currentLevel: 1,
                totalStars: 0,
                levelStats: {},
                unlockedOperators: ['+']
            };
        }

        // Compute new state synchronously
        const oldResult = current.levelStats?.[level];
        const isImprovement = !oldResult || result.score > oldResult.score || result.stars > oldResult.stars;

        if (!isImprovement) {
            return;
        }

        const next = { ...current };
        next.levelStats = { ...current.levelStats, [level]: result };

        // Unlock next level logic
        if (level >= current.currentLevel && result.stars > 0) {
            next.currentLevel = level + 1;
        }

        // Update Memory Instantly
        setProgress(next);

        // PERSIST (Dual Write Strategy)
        // Always save to LocalStorage as a backup/cache
        localStorage.setItem(LS_KEY, JSON.stringify(next));

        // If logged in, ALSO try to save to Firebase
        if (currentUser) {
            // Fire and forget - don't let network error stop the UI or local save
            saveLevelProgress(currentUser.uid, level, result).catch(() => {
                // Firebase save failed, but LocalStorage is safe
            });
        }
    };

    return (
        <UserProgressContext.Provider value={{ progress, loading, saveLevel, refetch: loadProgress }}>
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
