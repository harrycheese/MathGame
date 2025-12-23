import { useState, useCallback, useEffect, useRef } from 'react';
import type { TileData } from '../types/game';
import confetti from 'canvas-confetti';
import { getLevelConfig } from '../config/levelConfig';
import type { LevelConfig } from '../config/levelConfig';

const GRID_SIZE = 6;

// Easter Egg Messages (randomly selected)
const SQUARE_MESSAGES = ['PERFECTLY SQUARED!', '🧊 SQUARE UP!', 'BOXY!'];
const PRIME_MESSAGES = ['OPTIMUS PRIME!', '🤖 PRIME TIME!', 'AUTOBOTS, ROLL OUT!', 'PRIIIME!'];

// Helper: Check if number is a perfect square
const isPerfectSquare = (n: number): boolean => {
    if (n < 0) return false;
    const sqrt = Math.sqrt(n);
    return sqrt === Math.floor(sqrt);
};

// Helper: Check if number is prime
const isPrime = (n: number): boolean => {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i <= Math.sqrt(n); i += 2) {
        if (n % i === 0) return false;
    }
    return true;
};

export const useGameEngine = (initialMode: 'campaign' | 'survival' | 'zen' = 'survival', initialLevel: number = 1) => {
    const [level, _setLevel] = useState<number>(initialLevel);
    const [config, setConfig] = useState<LevelConfig>(getLevelConfig(initialLevel));

    // Campaign Mode: Win Condition State
    const [isLevelComplete, setIsLevelComplete] = useState(false);
    const [stars, setStars] = useState(0);
    const [startTime] = useState<number>(Date.now()); // Simple start tracking

    // Feedback State
    const [feedbackMessage, setFeedbackMessage] = useState<string | null>(null);

    const [grid, setGrid] = useState<TileData[][]>([]);
    const [target, setTarget] = useState<number>(10);
    const [score, setScore] = useState<number>(0);

    const [selectedTiles, setSelectedTiles] = useState<TileData[]>([]);
    const [comboStreak, setComboStreak] = useState<number>(0);
    const lastMatchTimeRef = useRef<number>(0); // Using ref to avoid stale closure
    const [lastOperator, setLastOperator] = useState<string | null>(null);
    const [operatorCounts, setOperatorCounts] = useState<Record<string, number>>({
        '+': 0, '-': 0, '×': 0, '÷': 0
    });
    // Analytics State
    const [totalCombos, setTotalCombos] = useState(0);
    const [maxComboStreak, setMaxComboStreak] = useState(0);
    const [totalComplexity, setTotalComplexity] = useState(0);

    const [memeState, setMemeState] = useState<boolean>(false);
    // Easter Egg States
    const [squareState, setSquareState] = useState<string | null>(null); // Message for square easter egg
    const [primeState, setPrimeState] = useState<string | null>(null); // Message for prime easter egg

    // Timer State (for Survival mode)
    const INITIAL_TIME = 60; // seconds
    const [timeRemaining, setTimeRemaining] = useState<number>(INITIAL_TIME);
    const [isGameOver, setIsGameOver] = useState<boolean>(false);
    const [timeBonus, setTimeBonus] = useState<number | null>(null);

    // Timer pause during easter egg animations
    const [isTimerPaused, setIsTimerPaused] = useState<boolean>(false);

    // Pre-game countdown (3, 2, 1, GO!)
    const [countdown, setCountdown] = useState<number | null>(initialMode === 'survival' ? 3 : null);

    // Update config when level changes (only for campaign mode)
    // Zen and Survival modes have all operators unlocked, no level progression
    useEffect(() => {
        if (initialMode === 'campaign') {
            setConfig(getLevelConfig(level));
        } else {
            // For zen/survival: all ops unlocked with reasonable number range
            setConfig({
                level: 1,
                ops: ['+', '-', '×', '÷'], // All operators
                minVal: 1,
                maxVal: 15, // Reasonable range for mental math
                targetScore: 999999,
                minScoreToPass: 0,
                description: initialMode === 'zen' ? 'ENDLESS CALM' : 'TIME CHALLENGE',
                threeStarSeconds: 9999,
                twoStarSeconds: 9999,
                requiredOps: undefined
            });
        }
    }, [level, initialMode]);

    // Helper: Generate a random number based on current config
    const generateNumber = useCallback((cfg: LevelConfig) => {
        return Math.floor(Math.random() * (cfg.maxVal - cfg.minVal + 1)) + cfg.minVal;
    }, []);

    // Helper: Create a unique ID
    const generateId = () => Math.random().toString(36).substr(2, 9);

    // Initialize Grid with current config settings
    const initializeGrid = useCallback(() => {
        const currentConfig = getLevelConfig(level); // Force fresh config read
        const newGrid: TileData[][] = [];
        for (let r = 0; r < GRID_SIZE; r++) {
            const row: TileData[] = [];
            for (let c = 0; c < GRID_SIZE; c++) {
                row.push({
                    id: generateId(),
                    value: generateNumber(currentConfig),
                    row: r,
                    col: c,
                    status: 'idle',
                });
            }
            newGrid.push(row);
        }
        setGrid(newGrid);
    }, [level, generateNumber]);

    // Pre-game countdown effect (3, 2, 1, then start)
    useEffect(() => {
        if (initialMode !== 'survival' || countdown === null) return;

        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        } else {
            // Countdown finished, start the game
            setCountdown(null);
        }
    }, [initialMode, countdown]);

    // Timer countdown effect (only for survival mode, after countdown finishes)
    useEffect(() => {
        if (initialMode !== 'survival' || isGameOver || countdown !== null || isTimerPaused) return;

        const interval = setInterval(() => {
            setTimeRemaining(prev => {
                if (prev <= 1) {
                    setIsGameOver(true);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(interval);
    }, [initialMode, isGameOver, countdown, isTimerPaused]);


    // SMART TARGET GENERATION (Op-First)
    const generateTarget = useCallback((currentGrid: TileData[][], currentConfig: LevelConfig) => {
        const flatTiles = currentGrid.flat().filter(t => t.value > 0);
        if (flatTiles.length < 2) return 10;

        // 1. Pick a random operator from allowed list
        const allowedOps = currentConfig.ops;
        const op = allowedOps[Math.floor(Math.random() * allowedOps.length)];

        // 2. Pick tile A
        const tileA = flatTiles[Math.floor(Math.random() * flatTiles.length)];
        let tileB = flatTiles[Math.floor(Math.random() * flatTiles.length)];

        let attempts = 0;
        while (tileB.id === tileA.id && attempts < 10) {
            tileB = flatTiles[Math.floor(Math.random() * flatTiles.length)];
            attempts++;
        }

        let valA = tileA.value;
        let valB = tileB.value;
        let result = valA + valB;

        switch (op) {
            case '+': result = valA + valB; break;
            case '-': result = Math.abs(valA - valB); break;
            case '×': result = valA * valB; break;
            case '÷':
                if (valA > valB && valA % valB === 0) result = valA / valB;
                else if (valB > valA && valB % valA === 0) result = valB / valA;
                else result = valA + valB;
                break;
        }
        return result;
    }, []);

    // Init on mount
    useEffect(() => {
        initializeGrid();
    }, [initializeGrid]);

    // Set initial target
    useEffect(() => {
        if (grid.length > 0 && score === 0 && target === 10) {
            setTarget(generateTarget(grid, config));
        }
    }, [grid, generateTarget, target, score, config]);


    // SCORING ENGINE 2.0
    const calculateScore = (op: string, valA: number, valB: number, timeTaken: number) => {
        const BASE = 10;
        let opMult = 1;
        if (op === '-') opMult = 1.2;
        if (op === '×') opMult = 2.0;
        if (op === '÷') opMult = 3.0;
        const magnitude = 1 + ((valA + valB) / 100);
        const safeTime = Math.min(timeTaken, 10000);
        const speedRatio = Math.max(0, (5000 - safeTime) / 5000);
        const speedBonus = 1 + (speedRatio);
        return Math.floor(BASE * opMult * magnitude * speedBonus);
    };

    const calculateMatchComplexity = (op: string, valA: number, valB: number) => {
        let weight = 1;
        if (op === '-') weight = 1.2;
        if (op === '×') weight = 2;
        if (op === '÷') weight = 3;
        return (valA + valB) * weight;
    };

    const handleMatchSuccess = useCallback((tileA: TileData, tileB: TileData, operator: string) => {
        const now = Date.now();
        const timeSinceLast = lastMatchTimeRef.current > 0 ? now - lastMatchTimeRef.current : Infinity;

        lastMatchTimeRef.current = now;

        // EASTER EGG Check (Meme - Six Seven)
        const isMeme = (tileA.value === 6 && tileB.value === 7) || (tileA.value === 7 && tileB.value === 6);
        if (isMeme) {
            setMemeState(true);
            setIsTimerPaused(true); // Pause timer during animation
            setTimeout(() => {
                setMemeState(false);
                setIsTimerPaused(false); // Resume timer
            }, 2000);

            // EXPLOSION EFFECT
            confetti({
                particleCount: 300,
                spread: 180,
                startVelocity: 50,
                origin: { x: 0.5, y: 0.4 },
                colors: ['#FF0000', '#FFA500', '#FFFF00', '#FFFFFF'], // Fire colors
                ticks: 300,
                gravity: 1.2,
                scalar: 1.2
            });
        }

        // EASTER EGG: Perfect Square (e.g., 2×2=4, 3×3=9)
        const isSquareMatch = operator === '×' && tileA.value === tileB.value && isPerfectSquare(target);
        if (isSquareMatch && !isMeme) {
            const msg = SQUARE_MESSAGES[Math.floor(Math.random() * SQUARE_MESSAGES.length)];
            setSquareState(msg);
            setIsTimerPaused(true); // Pause timer during animation
            setTimeout(() => {
                setSquareState(null);
                setIsTimerPaused(false); // Resume timer
            }, 2000);
            // Square confetti effect
            confetti({
                particleCount: 80,
                spread: 60,
                origin: { x: 0.5, y: 0.4 },
                colors: ['#60A5FA', '#818CF8', '#A78BFA'], // Blue/purple
                shapes: ['square'],
            });
        }

        // EASTER EGG: Prime Number Target (only for × and ÷ - relates to prime definition)
        const isPrimeTarget = isPrime(target);
        const isPrimeOperator = operator === '×' || operator === '÷';
        if (isPrimeTarget && isPrimeOperator && !isMeme && !isSquareMatch) {
            const msg = PRIME_MESSAGES[Math.floor(Math.random() * PRIME_MESSAGES.length)];
            setPrimeState(msg);
            setIsTimerPaused(true); // Pause timer during animation
            setTimeout(() => {
                setPrimeState(null);
                setIsTimerPaused(false); // Resume timer
            }, 2000);
            // Robot/metallic confetti
            confetti({
                particleCount: 60,
                spread: 50,
                origin: { x: 0.5, y: 0.4 },
                colors: ['#EF4444', '#3B82F6', '#9CA3AF'], // Red, Blue, Silver (Transformers)
            });
        }

        // Track Stats
        setOperatorCounts(prev => ({ ...prev, [operator]: (prev[operator] || 0) + 1 }));
        setLastOperator(operator);
        setTimeout(() => setLastOperator(null), 1000);

        // Complexity
        const complexity = calculateMatchComplexity(operator, tileA.value, tileB.value);
        setTotalComplexity(prev => prev + complexity);

        // Score
        const points = calculateScore(operator, tileA.value, tileB.value, timeSinceLast);

        // Combo
        const isCombo = timeSinceLast < 3500; // 3.5 seconds for combo
        let finalPoints = points;
        if (isCombo) {
            setComboStreak(p => {
                const newStreak = p + 1;
                setMaxComboStreak(m => Math.max(m, newStreak));
                return newStreak;
            });
            setTotalCombos(prev => prev + 1);
            finalPoints = Math.floor(points * (1 + (comboStreak * 0.1)));
        } else {
            setComboStreak(0);
        }

        setScore(s => s + finalPoints);

        // Add time bonus for survival mode
        if (initialMode === 'survival') {
            const bonus = isCombo ? 5 : 3;
            setTimeRemaining(prev => prev + bonus);
            setTimeBonus(bonus);
            // Clear bonus display after animation
            setTimeout(() => setTimeBonus(null), 1000);
        }

        // Regular Confetti (Only if not meme, to avoid visual clutter)
        if (!isMeme) {
            const centerOrigin = { x: 0.5, y: 0.5 };
            if (isCombo || finalPoints > 50) {
                confetti({ particleCount: 100, spread: 70, origin: centerOrigin, colors: ['#3b82f6', '#8b5cf6', '#10b981'] });
            } else {
                confetti({ particleCount: 30, spread: 50, origin: centerOrigin });
            }
        }

        // Mark matched
        setGrid(prev => prev.map(row => row.map(t => {
            if (t.id === tileA.id || t.id === tileB.id) return { ...t, status: 'matched' as const };
            return t;
        })));
        setSelectedTiles([]);

        // Grid Refill & Level Check
        setTimeout(() => {
            setGrid(prev => {
                const newGrid = prev.map(row => [...row]);
                for (let c = 0; c < GRID_SIZE; c++) {
                    const columnValues: TileData[] = [];
                    for (let r = 0; r < GRID_SIZE; r++) { columnValues.push(prev[r][c]); }
                    const activeTiles = columnValues.filter(t => t.status !== 'matched');
                    const missingCount = GRID_SIZE - activeTiles.length;
                    const newTiles: TileData[] = [];
                    for (let i = 0; i < missingCount; i++) {
                        newTiles.push({
                            id: generateId(), value: generateNumber(config), row: i, col: c, status: 'idle'
                        });
                    }
                    const finalColumn = [...newTiles, ...activeTiles];
                    for (let r = 0; r < GRID_SIZE; r++) {
                        newGrid[r][c] = { ...finalColumn[r], row: r, col: c, status: 'idle' };
                    }
                }

                // CHECK LEVEL PROGRESSION
                const currentTotalScore = score + finalPoints;

                if (initialMode === 'survival') {
                    // No level progression in survival - just keep playing
                    // Level display can show "streaks" or milestones if desired
                } else if (initialMode === 'zen') {
                    // Zen mode: No progression, just endless play
                    // Do nothing special
                } else {
                    // CAMPAIGN WIN LOGIC
                    // 1. Check Score
                    const scoreMet = currentTotalScore >= config.targetScore;

                    // 2. Check Quests (Required Ops)
                    let questsMet = true;
                    if (config.requiredOps) {
                        // Current counts including this match
                        const currentCounts = { ...operatorCounts, [operator]: (operatorCounts[operator] || 0) + 1 };
                        for (const [op, requiredCount] of Object.entries(config.requiredOps)) {
                            if ((currentCounts[op] || 0) < requiredCount) {
                                questsMet = false;
                                break;
                            }
                        }
                    }

                    if (scoreMet && questsMet) {
                        setIsLevelComplete(true);

                        // Calculate Stars
                        const endlessTime = (Date.now() - startTime) / 1000;
                        let earnedStars = 1;
                        // Use new config fields or fallback
                        const goldTime = config.threeStarSeconds || 60;
                        const silverTime = config.twoStarSeconds || (goldTime * 1.5);

                        if (endlessTime <= goldTime) earnedStars = 3;
                        else if (endlessTime <= silverTime) earnedStars = 2;

                        setStars(earnedStars);

                        // Bigger confetti for 3 stars
                        const particleCount = earnedStars === 3 ? 500 : 200;
                        confetti({ particleCount, spread: 360, origin: { y: 0.5 }, colors: ['#FFD700', '#FFA500', '#FFFFFF'] });
                    }
                    // Else: Overtime! (UI should show what's missing)
                }

                setTimeout(() => setTarget(generateTarget(newGrid, config)), 0);
                return newGrid;
            });
        }, 500);

    }, [comboStreak, generateNumber, generateTarget, config, score, initialMode, target, operatorCounts, startTime]);

    const handleMatchFail = useCallback((tileA: TileData, tileB: TileData) => {
        setGrid(prev => prev.map(row => row.map(t => {
            if (t.id === tileA.id || t.id === tileB.id) return { ...t, status: 'wrong' as const };
            return t;
        })));
        setTimeout(() => {
            setGrid(prev => prev.map(row => row.map(t => {
                if (t.id === tileA.id || t.id === tileB.id) return { ...t, status: 'idle' as const };
                return t;
            })));
            setSelectedTiles([]);
        }, 500);
    }, []);

    const checkMatch = useCallback((tileA: TileData, tileB: TileData) => {
        const valA = tileA.value;
        const valB = tileB.value;
        const ops = config.ops;

        // PRIORITY: If both tiles equal and target is perfect square, prefer × for easter egg
        const shouldPrioritizeMultiply = valA === valB && isPerfectSquare(target) && ops.includes('×') && valA * valB === target;
        if (shouldPrioritizeMultiply) {
            handleMatchSuccess(tileA, tileB, '×');
            return;
        }

        if (ops.includes('+') && valA + valB === target) { handleMatchSuccess(tileA, tileB, '+'); return; }
        if (ops.includes('-') && Math.abs(valA - valB) === target) { handleMatchSuccess(tileA, tileB, '-'); return; }
        if (ops.includes('×') && valA * valB === target) { handleMatchSuccess(tileA, tileB, '×'); return; }
        if (ops.includes('÷') && ((valA / valB === target) || (valB / valA === target))) { handleMatchSuccess(tileA, tileB, '÷'); return; }

        // Feedback for locked operators
        if (!ops.includes('-') && Math.abs(valA - valB) === target) {
            setFeedbackMessage("Great math! But this level focuses only on ADDITION.");
            setTimeout(() => setFeedbackMessage(null), 2500);
        } else if (!ops.includes('×') && valA * valB === target) {
            setFeedbackMessage("Great math! But Multiplication comes later.");
            setTimeout(() => setFeedbackMessage(null), 2500);
        } else if (!ops.includes('÷') && ((valA / valB === target) || (valB / valA === target))) {
            setFeedbackMessage("Smart! But save Division for Level 50.");
            setTimeout(() => setFeedbackMessage(null), 2500);
        }

        handleMatchFail(tileA, tileB);
    }, [target, config, handleMatchSuccess, handleMatchFail]);

    const handleTileClick = useCallback((row: number, col: number) => {
        const tile = grid[row][col];
        if (tile.status === 'matched' || tile.status === 'wrong') return;
        if (tile.status === 'selected') {
            setGrid(prev => {
                const next = [...prev]; next[row][col] = { ...tile, status: 'idle' }; return next;
            });
            setSelectedTiles(prev => prev.filter(t => t.id !== tile.id));
            return;
        }
        const newSelected = [...selectedTiles, tile];
        setGrid(prev => { const next = [...prev]; next[row][col] = { ...tile, status: 'selected' }; return next; });
        setSelectedTiles(newSelected);
        if (newSelected.length === 2) checkMatch(newSelected[0], newSelected[1]);
    }, [grid, selectedTiles, checkMatch]);

    const shuffleBoard = useCallback(() => {
        setGrid(prev => {
            const flatTiles = prev.flat();
            for (let i = flatTiles.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                const temp = flatTiles[i].value;
                flatTiles[i].value = flatTiles[j].value;
                flatTiles[j].value = temp;
                flatTiles[i].status = 'idle';
                flatTiles[j].status = 'idle';
            }
            const newGrid: TileData[][] = [];
            let index = 0;
            for (let r = 0; r < GRID_SIZE; r++) {
                const row: TileData[] = [];
                for (let c = 0; c < GRID_SIZE; c++) {
                    row.push({ ...prev[r][c], value: flatTiles[index].value, status: 'idle' });
                    index++;
                }
                newGrid.push(row);
            }
            setTimeout(() => setTarget(generateTarget(newGrid, config)), 0);
            return newGrid;
        });
        setSelectedTiles([]);
        confetti({ particleCount: 50, spread: 120, origin: { y: 0.6 } });
    }, [generateTarget, config]);

    return {
        grid, target, score, level, isLevelComplete,
        lastOperator, memeState, operatorCounts,
        handleTileClick, shuffleBoard, config, feedbackMessage, stars,
        // Timer state (for survival mode)
        timeRemaining, isGameOver, timeBonus, INITIAL_TIME, countdown,
        // Easter Egg states
        squareState, primeState,
        // Analytics
        sessionAnalytics: {
            operatorCounts,
            totalCombos,
            maxComboStreak,
            totalComplexity
        },
        startTime // Exposed for accurate duration tracking
    };
};
