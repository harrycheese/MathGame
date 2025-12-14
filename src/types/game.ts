export interface TileData {
    id: string; // Unique ID for React keys and animation
    value: number;
    row: number;
    col: number;
    status: 'idle' | 'selected' | 'matched' | 'wrong';
}

export interface GameState {
    grid: TileData[][];
    target: number;
    score: number;
    level: number;
    selectedTiles: TileData[];
    comboStreak: number;
    isPlaying: boolean;
}

export interface Coordinates {
    row: number;
    col: number;
}
