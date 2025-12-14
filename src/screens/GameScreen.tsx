import { useLocation, useNavigate } from 'react-router-dom';
import { useGameEngine } from '../hooks/useGameEngine';
import { GameHUD } from '../components/GameHUD';
import { GameBoard } from '../components/GameBoard';
import { GameControls } from '../components/GameControls';
import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useUserProgress } from '../hooks/useUserProgress';

export const GameScreen = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const { saveLevel } = useUserProgress();

    // Read params passed from LevelSelect
    const mode = location.state?.mode === 'campaign' ? 'campaign' : 'survival';
    const initialLevel = location.state?.level || 1;

    const {
        grid, target, score, level, isLevelComplete,
        lastOperator, operatorCounts,
        handleTileClick, shuffleBoard, memeState, config, feedbackMessage, stars
    } = useGameEngine(mode, initialLevel);

    const [showHelp, setShowHelp] = useState(false);

    // Auto-save when Level Complete
    // Auto-save when Level Complete
    useEffect(() => {
        if (isLevelComplete && mode === 'campaign') {
            console.log("GameScreen: Level Complete! Saving...", { level, score, stars });
            saveLevel(level, {
                score,
                stars,
                completedAt: Date.now()
            });
        }
    }, [isLevelComplete, mode, level, score, stars]);

    return (
        <div className="min-h-screen bg-gray-950 flex flex-col items-center px-4 pt-2 relative overflow-hidden select-none touch-none">
            {/* Background elements */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0f] to-[#0a0a0f] z-0" />

            <div className="z-10 w-full max-w-md flex flex-col items-center h-full">
                {/* 1. Dashboard (HUD) */}
                <GameHUD
                    target={target}
                    score={score}
                    level={level}
                    operatorCounts={operatorCounts}
                    lastOperator={lastOperator}
                    memeState={memeState}
                    allowedOps={config.ops}
                    requiredOps={config.requiredOps}

                />

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
                <div className="flex-1 flex items-center justify-center w-full max-w-md">
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
        </div>
    );
};
