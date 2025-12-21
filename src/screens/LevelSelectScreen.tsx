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
        <div className="h-screen bg-gray-950 text-white flex flex-col overflow-hidden">
            {/* Mobile-first container centering */}
            <div className="w-full max-w-md mx-auto flex flex-col h-full relative">

                {/* Fixed Header */}
                <div className="flex-none flex items-center p-6 pb-4 bg-gray-950/80 backdrop-blur-md z-20 border-b border-white/5">
                    <button
                        onClick={() => navigate('/modes')}
                        className="w-10 h-10 bg-white/5 rounded-full flex items-center justify-center mr-4 shrink-0 hover:bg-white/10 transition-colors"
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

                {/* Scrollable Content Area */}
                <div className="flex-1 overflow-y-auto p-6 pt-2 pb-32">
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

                                </motion.button>
                            );
                        })}

                        {/* Coming Soon Indicator */}
                        <div className="col-span-4 py-8 text-center bg-white/5 rounded-2xl border border-dashed border-white/10 mt-4">
                            <p className="text-gray-500 text-sm font-bold uppercase tracking-widest">More Coming Soon...</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
