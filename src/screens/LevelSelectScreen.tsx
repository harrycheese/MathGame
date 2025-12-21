import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { getLevelConfig } from '../config/levelConfig';
import { useUserProgress } from '../hooks/useUserProgress';

export const LevelSelectScreen = () => {
    const navigate = useNavigate();
    const { progress, loading } = useUserProgress();

    // Default to Level 1 unlocked if loading or no data
    const currentUnlockedLevel = progress?.currentLevel || 1;

    const levels = Array.from({ length: 100 }, (_, i) => i + 1);

    const handleLevelSelect = (level: number) => {
        if (level > currentUnlockedLevel) return; // Locked

        // In real app, we'd save "Current Selected Level" to context
        // For now, we'll pass it via state or just navigate
        // Ideally we update the Context to know we are in "Campaign Mode" at "Level X"
        // For this MVP, we will rely on URL or simple navigation state

        navigate('/play', { state: { mode: 'campaign', level } });
    };

    return (
        <div className="min-h-screen bg-gray-950 text-white p-6 pb-24">
            {/* Mobile-first container */}
            <div className="max-w-md mx-auto">
                {/* Header */}
                <div className="flex items-center mb-8 sticky top-0 bg-gray-950/80 backdrop-blur-md z-10 py-4 -mx-6 px-6 border-b border-white/5">
                    <button
                        onClick={() => navigate('/modes')}
                        className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mr-4"
                    >
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                    </button>
                    <div>
                        <h1 className="text-2xl font-black italic tracking-tighter">CAMPAIGN</h1>
                        <p className="text-xs text-blue-400 font-bold tracking-widest uppercase">THE 100 LEVEL JOURNEY</p>
                    </div>
                </div>

                <div className={`grid grid-cols-4 gap-4 ${loading ? 'opacity-50' : ''}`}>
                    {levels.map((level) => {
                        const isUnlocked = level <= currentUnlockedLevel;
                        const stars = progress?.levelStats?.[level]?.stars || 0;
                        const config = getLevelConfig(level);

                        return (
                            <motion.button
                                key={level}
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ delay: level < 20 ? level * 0.05 : 0 }}
                                onClick={() => handleLevelSelect(level)}
                                disabled={!isUnlocked}
                                title={isUnlocked ? `${config.description} (Target: ${config.targetScore})` : 'Locked'}
                                className={`
                                relative aspect-square rounded-2xl flex flex-col items-center justify-center border-2 transition-all
                                ${isUnlocked
                                        ? 'bg-gray-900 border-blue-500/30 text-white hover:bg-blue-900/20 hover:border-blue-400'
                                        : 'bg-gray-900/50 border-white/5 text-gray-700 cursor-not-allowed'}
                            `}
                            >
                                <span className={`text-xl font-black ${isUnlocked ? 'text-white' : 'text-gray-700'}`}>
                                    {level}
                                </span>

                                {/* Stars Badge */}
                                {isUnlocked && stars > 0 && (
                                    <div className="flex gap-0.5 mt-1">
                                        {[1, 2, 3].map(s => (
                                            <div key={s} className={`w-1.5 h-1.5 rounded-full ${s <= stars ? 'bg-yellow-400 shadow-glow' : 'bg-gray-700'}`} />
                                        ))}
                                    </div>
                                )}

                                {/* Operator Hint (e.g. at Lvl 10 show '-') */}
                                {level === 10 && <div className="absolute -top-2 -right-2 bg-pink-500 text-xs px-1.5 rounded-md font-bold shadow-lg">-</div>}
                                {level === 30 && <div className="absolute -top-2 -right-2 bg-purple-500 text-xs px-1.5 rounded-md font-bold shadow-lg">×</div>}
                                {level === 50 && <div className="absolute -top-2 -right-2 bg-blue-500 text-xs px-1.5 rounded-md font-bold shadow-lg">÷</div>}

                            </motion.button>
                        );
                    })}
                </div>

                {/* Legend */}
                <div className="fixed bottom-0 left-0 right-0 bg-gray-950/90 backdrop-blur p-4 border-t border-white/10 flex justify-center gap-6 text-xs text-gray-400">
                    <div className="flex items-center gap-2">
                        <div className="flex gap-0.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-yellow-400" />
                            <div className="w-1.5 h-1.5 rounded-full bg-gray-700" />
                        </div>
                        <span>Stars Earned</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="px-1.5 py-0.5 bg-pink-500 rounded text-[10px] text-white font-bold">-</div>
                        <span>New Mechanic</span>
                    </div>
                </div>
            </div>
        </div>
    );
};
