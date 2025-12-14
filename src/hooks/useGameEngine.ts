import { useState, useCallback, useEffect } from 'react';
import type { TileData } from '../types/game';
import confetti from 'canvas-confetti';

const GRID_SIZE = 6;

export const useGameEngine = () => {
    const [grid, setGrid] = useState<TileData[][]>([]);
    const [target, setTarget] = useState<number>(10);
    const [score, setScore] = useState<number>(0);
    const [level, setLevel] = useState<number>(1);
    const [selectedTiles, setSelectedTiles] = useState<TileData[]>([]);
    const [comboStreak, setComboStreak] = useState<number>(0);
    const [lastMatchTime, setLastMatchTime] = useState<number>(0);
    const [lastOperator, setLastOperator] = useState<string | null>(null);
    const [operatorCounts, setOperatorCounts] = useState<Record<string, number>>({
        '+': 0, '-': 0, '×': 0, '÷': 0
    });

    // Helper: Generate a random number based on level
    const generateNumber = useCallback((lvl: number) => {
        const max = Math.min(9 + Math.floor(lvl / 2), 20);
        return Math.floor(Math.random() * max) + 1;
    }, []);

    // Helper: Create a unique ID
    const generateId = () => Math.random().toString(36).substr(2, 9);

    // Initialize Grid
    const initializeGrid = useCallback(() => {
        const newGrid: TileData[][] = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            const row: TileData[] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                row.push({
                    id: generateId(),
                    value: generateNumber(1),
                    row: r,
                    col: c,
                    status: 'idle',
                });
            }
            newGrid.push(row);
        }
        setGrid(newGrid);
    }, [generateNumber]);

    // Generate a valid target from the current grid
    const generateTarget = useCallback((currentGrid: TileData[][]) => {
        const flatTiles = currentGrid.flat().filter(t => t.value > 0);
        if (flatTiles.length < 2) return 10;

        // Pick tile A
        const tileA = flatTiles[Math.floor(Math.random() * flatTiles.length)];
        // Pick tile B
        let tileB = flatTiles[Math.floor(Math.random() * flatTiles.length)];
        while (tileB.id === tileA.id && flatTiles.length > 1) {
            tileB = flatTiles[Math.floor(Math.random() * flatTiles.length)];
        }

        return tileA.value + tileB.value;
    }, []);

    useEffect(() => {
        initializeGrid();
    }, [initializeGrid]);

    // Set initial target after grid is ready
    useEffect(() => {
        if (grid.length > 0 && target === 10 && score === 0) {
            setTarget(generateTarget(grid));
        }
    }, [grid, generateTarget, target, score]);

    const handleMatchSuccess = useCallback((tileA: TileData, tileB: TileData, operator: string) => {
        const now = Date.now();
        const timeDiff = now - lastMatchTime;
        const isCombo = timeDiff < 2000;

        // Track Operator Stats
        setOperatorCounts(prev => ({
            ...prev,
            [operator]: (prev[operator] || 0) + 1
        }));

        // Set last operator for animation
        setLastOperator(operator);
        setTimeout(() => setLastOperator(null), 1000);

        let points = 10;
        if (isCombo) {
            setComboStreak(p => p + 1);
            points *= (comboStreak + 1);
        } else {
            setComboStreak(0);
        }
        setLastMatchTime(now);
        setScore(s => s + points);

        // ... (confetti same) ...
        const centerOrigin = { x: 0.5, y: 0.5 };
        if (isCombo) {
            confetti({
                particleCount: 100,
                spread: 70,
                origin: centerOrigin,
                colors: ['#3b82f6', '#8b5cf6', '#10b981']
            });
        } else {
            confetti({
                particleCount: 30,
                spread: 50,
                origin: centerOrigin
            });
        }

        // Mark matched
        setGrid(prev => {
            const next = prev.map(row => row.map(t => {
                if (t.id === tileA.id || t.id === tileB.id) {
                    return { ...t, status: 'matched' as const };
                }
                return t;
            }));
            return next;
        });

        setSelectedTiles([]);

        // Logic for replacement (REVERTED TO 500ms)
        setTimeout(() => {
            setGrid(prev => {
                // Drop Logic
                const newGrid = prev.map(row => [...row]);

                for (let c = 0; c < GRID_SIZE; c++) {
                    const columnValues: TileData[] = [];
                    for (let r = 0; r < GRID_SIZE; r++) {
                        columnValues.push(prev[r][c]);
                    }

                    const activeTiles = columnValues.filter(t => t.status !== 'matched');
                    const missingCount = GRID_SIZE - activeTiles.length;

                    const newTiles: TileData[] = [];
                    for (let i = 0; i < missingCount; i++) {
                        newTiles.push({
                            id: generateId(),
                            value: generateNumber(level),
                            row: i,
                            col: c,
                            status: 'idle'
                        });
                    }

                    const finalColumn = [...newTiles, ...activeTiles];
                    for (let r = 0; r < GRID_SIZE; r++) {
                        newGrid[r][c] = {
                            ...finalColumn[r],
                            row: r,
                            col: c,
                            status: 'idle'
                        };
                    }
                }

                // Check Level Up
                if (score > 0 && score % 100 === 0) {
                    setLevel(l => l + 1);
                    // Maybe confetti burst?
                }

                setTimeout(() => setTarget(generateTarget(newGrid)), 0);
                return newGrid;
            });
        }, 500); // Back to fast!

    }, [lastMatchTime, comboStreak, generateNumber, generateTarget, level, score]);

    const handleMatchFail = useCallback((tileA: TileData, tileB: TileData) => {
        setGrid(prev => prev.map(row => row.map(t => {
            if (t.id === tileA.id || t.id === tileB.id) {
                return { ...t, status: 'wrong' as const };
            }
            return t;
        })));

        setTimeout(() => {
            setGrid(prev => prev.map(row => row.map(t => {
                if (t.id === tileA.id || t.id === tileB.id) {
                    return { ...t, status: 'idle' as const };
                }
                return t;
            })));
            setSelectedTiles([]);
        }, 500);
    }, []);

    const checkMatch = useCallback((tileA: TileData, tileB: TileData) => {
        const valA = tileA.value;
        const valB = tileB.value;

        // Check all ops
        if (valA + valB === target) {
            handleMatchSuccess(tileA, tileB, '+');
            return;
        }
        if (Math.abs(valA - valB) === target) {
            handleMatchSuccess(tileA, tileB, '-');
            return;
        }
        if (valA * valB === target) {
            handleMatchSuccess(tileA, tileB, '×');
            return;
        }
        if ((valA / valB === target) || (valB / valA === target)) {
            handleMatchSuccess(tileA, tileB, '÷');
            return;
        }

        handleMatchFail(tileA, tileB);
    }, [target, handleMatchSuccess, handleMatchFail]);

    const handleTileClick = useCallback((row: number, col: number) => {
        const tile = grid[row][col];
        if (tile.status === 'matched' || tile.status === 'wrong') return;

        // Deselect if already selected
        if (tile.status === 'selected') {
            setGrid(prev => {
                const next = [...prev];
                next[row][col] = { ...tile, status: 'idle' };
                return next;
            });
            setSelectedTiles(prev => prev.filter(t => t.id !== tile.id));
            return;
        }

        const newSelected = [...selectedTiles, tile];

        // Visual update
        setGrid(prev => {
            const next = [...prev];
            next[row][col] = { ...tile, status: 'selected' };
            return next;
        });
        setSelectedTiles(newSelected);

        if (newSelected.length === 2) {
            checkMatch(newSelected[0], newSelected[1]);
        }
    }, [grid, selectedTiles, checkMatch]);

    const shuffleBoard = useCallback(() => {
        setGrid(prev => {
            const flatTiles = prev.flat();
            // Fisher-Yates
            for (let i = flatTiles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = flatTiles[i].value;
                flatTiles[i].value = flatTiles[j].value;
                flatTiles[j].value = temp;

                // force idle
                flatTiles[i].status = 'idle';
                flatTiles[j].status = 'idle';
            }

            const newGrid: TileData[][] = [];
            let index = 0;
            for (let r = 0; r < GRID_SIZE; r++) {
                const row: TileData[] = [];
                for (let c = 0; c < GRID_SIZE; c++) {
                    row.push({
                        ...prev[r][c],
                        value: flatTiles[index].value,
                        status: 'idle'
                    });
                    index++;
                }
                newGrid.push(row);
            }

            setTimeout(() => setTarget(generateTarget(newGrid)), 0);
            return newGrid;
        });
        setSelectedTiles([]);
        // Visual feedback for shuffle?
        confetti({
            particleCount: 50,
            spread: 120,
            origin: { y: 0.6 }
        });
    }, [generateTarget]);

    return {
        grid,
        target,
        score,
        level,
        lastOperator,
        operatorCounts,
        handleTileClick,
        shuffleBoard
    };
};
