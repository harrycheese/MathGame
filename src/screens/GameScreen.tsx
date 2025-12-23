import { useLocation, useNavigate } from 'react-router-dom';
import { useGameEngine } from '../hooks/useGameEngine';
import { GameHUD } from '../components/GameHUD';
import { GameBoard } from '../components/GameBoard';
import { GameControls } from '../components/GameControls';
import { TargetCircle } from '../components/TargetCircle';
import { TimerCircle } from '../components/TimerCircle';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, useRef } from 'react';
import { useUserProgress } from '../hooks/useUserProgress';
import { saveSessionAnalytics, updateSessionAnalytics, auth } from '../firebase';
import type { OperatorStats } from '../types/game';

export const GameScreen = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { saveLevel } = useUserProgress();
    const savedSessionRef = useRef(false); // Prevent double-save on re-renders (Final Save)

    // Autosave Refs (Zen Mode)
    const currentSessionIdRef = useRef<string | null>(null);
    const lastSavedAnalyticsRef = useRef<any>({
        score: 0,
        timeTaken: 0,
        operatorCounts: { add: 0, subtract: 0, multiply: 0, divide: 0 },
        combos: 0,
        complexityScore: 0
    });

    // Read params passed from LevelSelect or GameModes
    const modeParam = location.state?.mode;
    const mode: 'campaign' | 'survival' | 'zen' =
        modeParam === 'campaign' ? 'campaign' :
            modeParam === 'zen' ? 'zen' : 'survival';
    const initialLevel = location.state?.level || 1;

    const {
        grid, target, score, level, isLevelComplete,
        lastOperator, operatorCounts,
        handleTileClick, shuffleBoard, memeState, config, feedbackMessage, stars,
        timeRemaining, isGameOver, timeBonus, INITIAL_TIME, countdown,
        squareState, primeState, // Easter egg states
        sessionAnalytics,
        startTime
    } = useGameEngine(mode, initialLevel);

    const [showHelp, setShowHelp] = useState(false);

    // Helper to map UI operators to Schema operators
    const getMappedOperatorStats = (ops: Record<string, number>): OperatorStats => ({
        add: ops['+'] || 0,
        subtract: ops['-'] || 0,
        multiply: ops['×'] || 0,
        divide: ops['÷'] || 0
    });



    // --- UNIVERSAL AUTOSAVE & SAVING LOGIC ---
    const saveProgress = async (finalResult?: 'win' | 'loss' | 'abandoned', overrideTime?: number) => {
        if (!auth.currentUser) return;

        const now = Date.now();
        const currentTimeTaken = overrideTime !== undefined ? overrideTime : ((now - startTime) / 1000);
        const currentMappedOps = getMappedOperatorStats(sessionAnalytics.operatorCounts);

        // Calculate DELTAS (Change since last save)
        const last = lastSavedAnalyticsRef.current;
        const deltas = {
            totalEquationsSolved: 0, // Calculated from ops
            totalTimePlayed: Math.max(0, currentTimeTaken - last.timeTaken),
            averageSolveTime: 0,
            operatorUsage: {
                add: Math.max(0, currentMappedOps.add - last.operatorCounts.add),
                subtract: Math.max(0, currentMappedOps.subtract - last.operatorCounts.subtract),
                multiply: Math.max(0, currentMappedOps.multiply - last.operatorCounts.multiply),
                divide: Math.max(0, currentMappedOps.divide - last.operatorCounts.divide),
            },
            averageComplexityScore: 0,
            maxComplexityScore: 0,
            totalCombos: Math.max(0, sessionAnalytics.totalCombos - last.combos),
            maxComboStreak: 0,
            lastPlayed: now,
            sessionsPlayed: 0
        };

        deltas.totalEquationsSolved = deltas.operatorUsage.add + deltas.operatorUsage.subtract + deltas.operatorUsage.multiply + deltas.operatorUsage.divide;

        // Validation: If strict nothing happened and checking for autosave (no final result), skip
        if (!finalResult && deltas.totalEquationsSolved === 0 && deltas.totalTimePlayed < 1) return;

        const sessionData = {
            mode: mode,
            level: mode === 'campaign' ? level : null, // null is valid in Firestore, undefined is not
            score,
            timeTaken: currentTimeTaken,
            completedAt: now,
            result: finalResult || 'abandoned', // Default to abandoned if intermediate save
            analytics: {
                operatorCounts: currentMappedOps,
                combos: sessionAnalytics.totalCombos,
                complexityScore: sessionAnalytics.totalComplexity
            }
        };

        if (!currentSessionIdRef.current) {
            // First Save -> Create Session
            const newId = await saveSessionAnalytics(auth.currentUser.uid, sessionData);
            if (newId) currentSessionIdRef.current = newId;
        } else {
            // Subsequent Save -> Update Session + Increment Delta
            await updateSessionAnalytics(auth.currentUser.uid, currentSessionIdRef.current, sessionData, deltas as any);
        }

        // Update Snapshot
        lastSavedAnalyticsRef.current = {
            score,
            timeTaken: currentTimeTaken,
            operatorCounts: { ...currentMappedOps },
            combos: sessionAnalytics.totalCombos,
            complexityScore: sessionAnalytics.totalComplexity
        };
    };

    // Keep a ref to the latest saveProgress function to avoid stale closures in intervals
    const saveProgressRef = useRef(saveProgress);
    useEffect(() => {
        saveProgressRef.current = saveProgress;
    });

    // Periodic Autosave Interval (30s) - Runs for ALL modes now
    useEffect(() => {
        if (isLevelComplete || isGameOver) return; // Stop autosaving if finished

        const interval = setInterval(() => {
            // Periodic autosave triggered
            saveProgressRef.current(); // Use ref to get latest function
        }, 30000);

        return () => clearInterval(interval);
    }, [isLevelComplete, isGameOver]); // Only re-setup when game ends

    // Save on Visibility Change (Tab Switch/Close)
    useEffect(() => {
        if (isLevelComplete || isGameOver) return;
        const handleVisibilityChange = () => {
            if (document.visibilityState === 'hidden') {
                // Autosave on tab hide
                saveProgressRef.current();
            }
        };
        document.addEventListener('visibilitychange', handleVisibilityChange);
        return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
    }, [isLevelComplete, isGameOver]);


    // Auto-save when Level Complete (CAMPAIGN)
    useEffect(() => {
        if (isLevelComplete && mode === 'campaign' && !savedSessionRef.current) {
            savedSessionRef.current = true;
            const now = Date.now();

            // 1. Save Progress (Unlock next level etc)
            saveLevel(level, {
                score,
                stars,
                completedAt: now
            });

            // 2. Save Final Analytics (Win)
            saveProgress('win', (now - startTime) / 1000);
        }
    }, [isLevelComplete, mode, level, score, stars, saveLevel, sessionAnalytics, startTime]);

    // Auto-save on Game Over (SURVIVAL)
    useEffect(() => {
        if (isGameOver && mode === 'survival' && !savedSessionRef.current) {
            savedSessionRef.current = true;
            // 2. Save Final Analytics (Loss)
            saveProgress('loss', (Date.now() - startTime) / 1000);
        }
    }, [isGameOver, mode, score, sessionAnalytics, startTime]);

    // Handle manual exit (Back button)
    const handleExit = () => {
        // Validation: If not finished, save stats on exit
        if (!isLevelComplete && !isGameOver && !savedSessionRef.current) {
            savedSessionRef.current = true;
            saveProgress('abandoned'); // Explicitly mark as abandoned
        }
        navigate('/modes');
    };

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center px-4 pt-2 relative overflow-hidden select-none touch-none">
            {/* Background elements */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0f] to-[#0a0a0f] z-0" />

            <div className="z-10 w-full max-w-md flex flex-col items-center h-full">
                {/* 1. Dashboard (HUD) - Header row with operators, score, level */}
                <GameHUD
                    target={target}
                    score={score}
                    level={mode === 'campaign' ? level : undefined}
                    operatorCounts={operatorCounts}
                    lastOperator={lastOperator}
                    memeState={memeState}
                    squareState={squareState}
                    primeState={primeState}
                    allowedOps={config.ops}
                    requiredOps={mode === 'campaign' ? config.requiredOps : undefined}
                    showTarget={mode !== 'survival'} // Hide target in HUD for survival (shown separately)
                    onExit={handleExit}
                />

                {/* SURVIVAL MODE: Target + Timer Side by Side */}
                {mode === 'survival' && (
                    <div className="flex items-center justify-center gap-6 py-2 mb-2">
                        <TargetCircle target={target} memeState={memeState} squareState={squareState} primeState={primeState} />
                        <TimerCircle
                            timeRemaining={timeRemaining}
                            maxTime={INITIAL_TIME}
                            timeBonus={timeBonus}
                            countdown={countdown}
                        />
                    </div>
                )}

                {/* INSTRUCTION / FEEDBACK */}
                <div className="h-8 flex items-center justify-center mb-2 gap-2">
                    <AnimatePresence mode='wait'>
                        {feedbackMessage ? (
                            <motion.div
                                key="feedback"
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="px-4 py-1.5 bg-red-500/20 text-red-200 border border-red-500/30 rounded-full text-xs font-bold uppercase tracking-wider backdrop-blur"
                            >
                                {feedbackMessage}
                            </motion.div>
                        ) : showHelp ? (
                            <motion.div
                                key="help"
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.9 }}
                                className="px-4 py-1.5 bg-blue-500/20 text-blue-200 border border-blue-500/30 rounded-full text-xs font-bold tracking-wide backdrop-blur text-center"
                            >
                                {(() => {
                                    const quests = config.requiredOps || {};

                                    if (quests['-']) return `Find pairs that equal ${target}. Try Subtraction!`;
                                    if (quests['×']) return `Find pairs that equal ${target}. Try Multiplication!`;
                                    if (quests['÷']) return `Find pairs that equal ${target}. Try Division!`;

                                    if (config.level <= 2) return `Find pairs that add up to ${target}`;

                                    return `Find pairs that equal ${target}`;
                                })()}
                            </motion.div>
                        ) : (
                            <motion.div
                                key="instruction"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/5 border border-white/5"
                            >
                                <span className="text-xs text-gray-400 font-bold uppercase tracking-widest">
                                    {config.description}
                                </span>
                                {/* Coaching Tooltip Trigger */}
                                <button
                                    onClick={() => { setShowHelp(true); setTimeout(() => setShowHelp(false), 3000); }}
                                    className="w-4 h-4 rounded-full bg-white/10 text-[10px] text-gray-400 flex items-center justify-center hover:bg-white/20 hover:text-white transition-colors"
                                >
                                    i
                                </button>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* Campaign Progress Bar */}
                {mode === 'campaign' && (
                    <div className="w-full max-w-md mt-2 flex flex-col gap-1">
                        {/* Objectives Header */}
                        <div className="flex items-end justify-between px-1">
                            <div className="flex items-baseline gap-2">
                                <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">
                                    Progress
                                </span>
                                <span className="text-xs font-black text-white tracking-wider">
                                    {score} <span className="text-gray-600">/</span> {config.targetScore}
                                </span>
                            </div>


                        </div>

                        <div className="w-full h-1.5 bg-gray-800 rounded-full overflow-hidden relative border border-white/5">
                            <motion.div
                                className="h-full bg-blue-500"
                                initial={{ width: 0 }}
                                animate={{ width: `${Math.min(100, (score / config.targetScore) * 100)}%` }}
                            />
                        </div>
                    </div>
                )}

                {/* 2. Work (Grid) */}
                <div className={`flex-1 flex items-center justify-center w-full max-w-md ${countdown !== null && countdown >= 0 ? 'pointer-events-none opacity-70' : ''}`}>
                    <GameBoard
                        grid={grid}
                        onTileClick={handleTileClick}
                    />
                </div>

                {/* 3. Utilities (Controls) */}
                <div className="w-full max-w-md pb-8">
                    <GameControls onShuffle={shuffleBoard} />
                </div>
            </div>

            {/* Victory Modal */}
            <AnimatePresence>
                {isLevelComplete && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-gray-900 w-full max-w-sm rounded-[32px] p-8 border border-white/10 shadow-2xl relative overflow-hidden"
                        >
                            {/* Background decoration */}
                            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-blue-500/20 to-transparent pointer-events-none" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                {/* Trophy / Header */}
                                <div className="mb-2 uppercase tracking-widest text-xs font-bold text-blue-400">Mission Accomplished</div>
                                <h2 className="text-4xl font-black text-white italic tracking-tighter mb-8 drop-shadow-lg">
                                    VICTORY!
                                </h2>

                                {/* STAR RATING */}
                                <div className="flex justify-center gap-4 mb-10">
                                    {[1, 2, 3].map((starIdx) => (
                                        <motion.div
                                            key={starIdx}
                                            initial={{ scale: 0, rotate: -180, opacity: 0 }}
                                            animate={{
                                                scale: starIdx <= stars ? 1 : 0.8,
                                                rotate: 0,
                                                opacity: 1
                                            }}
                                            transition={{
                                                delay: starIdx * 0.2,
                                                type: "spring",
                                                stiffness: 200,
                                                damping: 10
                                            }}
                                            className="relative"
                                        >
                                            {/* Star Glow */}
                                            {starIdx <= stars && (
                                                <div className="absolute inset-0 bg-yellow-500 blur-xl opacity-50" />
                                            )}

                                            <svg className={`relative w-14 h-14 ${starIdx <= stars ? 'text-yellow-400 fill-yellow-400 drop-shadow-md' : 'text-gray-800 fill-gray-800'}`}
                                                viewBox="0 0 24 24"
                                            >
                                                <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                                            </svg>
                                        </motion.div>
                                    ))}
                                </div>

                                {/* Stats Summary */}
                                <div className="grid grid-cols-2 gap-4 w-full mb-8">
                                    <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Score</span>
                                        <span className="text-xl font-black text-white">{score}</span>
                                    </div>
                                    <div className="bg-white/5 rounded-2xl p-3 flex flex-col items-center">
                                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Level</span>
                                        <span className="text-xl font-black text-white">{level}</span>
                                    </div>
                                </div>

                                <button
                                    onClick={() => navigate('/campaign')}
                                    className="w-full py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-2xl font-black tracking-widest shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2 group"
                                >
                                    <span>CONTINUE</span>
                                    <svg className="w-5 h-5 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                    </svg>
                                </button>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Game Over Modal (Survival Mode) */}
            <AnimatePresence>
                {isGameOver && mode === 'survival' && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-md p-4"
                    >
                        <motion.div
                            initial={{ scale: 0.9, y: 20 }}
                            animate={{ scale: 1, y: 0 }}
                            className="bg-gray-900 w-full max-w-sm rounded-[32px] p-8 border border-red-500/30 shadow-2xl relative overflow-hidden"
                        >
                            {/* Background decoration */}
                            <div className="absolute top-0 left-0 right-0 h-32 bg-gradient-to-b from-red-500/20 to-transparent pointer-events-none" />

                            <div className="relative z-10 flex flex-col items-center text-center">
                                {/* Header */}
                                <div className="mb-2 uppercase tracking-widest text-xs font-bold text-red-400">Time's Up</div>
                                <h2 className="text-4xl font-black text-white italic tracking-tighter mb-8 drop-shadow-lg">
                                    {score === 67 ? (
                                        <motion.span
                                            animate={{
                                                scale: [1, 1.1, 1],
                                                rotate: [-5, 5, -5],
                                                y: [0, -5, 5, 0]
                                            }}
                                            transition={{ duration: 0.5, repeat: Infinity }}
                                            className="text-yellow-400 inline-block"
                                            style={{ textShadow: '0 0 30px rgba(250, 204, 21, 0.8)' }}
                                        >
                                            Siiiix... Seveennn!
                                        </motion.span>
                                    ) : 'GAME OVER'}
                                </h2>

                                {/* Stats Summary */}
                                <div className={`w-full rounded-2xl p-4 mb-8 ${score === 67 ? 'bg-yellow-500/20 border border-yellow-500/30' : 'bg-white/5'}`}>
                                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">Final Score</span>
                                    <motion.div
                                        className={`text-4xl font-black ${score === 67 ? 'text-yellow-400' : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400'}`}
                                        animate={score === 67 ? { scale: [1, 1.05, 1] } : {}}
                                        transition={{ duration: 0.5, repeat: score === 67 ? Infinity : 0 }}
                                        style={score === 67 ? { textShadow: '0 0 20px rgba(250, 204, 21, 0.5)' } : {}}
                                    >
                                        {score}
                                    </motion.div>
                                </div>

                                <div className="flex gap-3 w-full">
                                    <button
                                        onClick={() => navigate('/modes')}
                                        className="flex-1 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold tracking-wider transition-all"
                                    >
                                        EXIT
                                    </button>
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="flex-1 py-4 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-2xl font-black tracking-widest shadow-lg shadow-blue-500/25 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span>RETRY</span>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                        </svg>
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
