export interface TileData {
    id: string; // Unique ID for React keys and animation
    value: number;
    row: number;
    col: number;
    status: 'idle' | 'selected' | 'matched' | 'wrong';
}

export interface LevelResult {
    score: number;
    stars: number;
    completedAt: number; // Timestamp
}

export interface OperatorStats {
    add: number;
    subtract: number;
    multiply: number;
    divide: number;
}

export interface UserAnalytics {
    totalEquationsSolved: number;
    totalTimePlayed: number; // in seconds
    averageSolveTime: number; // accumulated moving average or calculated on fly

    // Operator Usage
    operatorUsage: OperatorStats;

    // Complexity Tracking
    averageComplexityScore: number;
    maxComplexityScore: number;

    // Survival Mode Specifics
    totalCombos: number;
    maxComboStreak: number;

    // Activity
    lastPlayed: number; // Timestamp
    sessionsPlayed: number;
}

export interface GameSession {
    mode: 'campaign' | 'survival' | 'zen';
    level?: number | null; // null for non-campaign modes (Firestore doesn't allow undefined)
    score: number;
    timeTaken: number; // seconds
    completedAt: number; // timestamp
    result: 'win' | 'loss' | 'abandoned';
    analytics: {
        operatorCounts: OperatorStats;
        combos: number;
        complexityScore: number;
    };
}

export interface UserProgress {
    currentLevel: number;
    totalStars: number;
    levelStats: Record<string, LevelResult>; // Key is level number (as string for Firestore)
    unlockedOperators: string[];
    analytics?: UserAnalytics; // Optional for backward compatibility with existing users
}
