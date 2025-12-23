
import { OperatorTray } from './OperatorTray';
import { TargetCircle } from './TargetCircle';

interface GameHUDProps {
    target: number;
    score: number;
    level?: number; // Optional for zen mode
    operatorCounts: Record<string, number>;
    lastOperator?: string | null;
    memeState?: boolean;
    allowedOps: string[];
    requiredOps?: Record<string, number>;
    showTarget?: boolean; // false = hide target (for survival mode side-by-side)
    isResettingTarget?: boolean;
    onExit?: () => void;
}

export const GameHUD = ({ target, score, level, operatorCounts, lastOperator, memeState, allowedOps, requiredOps, showTarget = true, isResettingTarget, onExit }: GameHUDProps) => {
    return (
        <div className="flex flex-col items-center w-full max-w-md mx-auto z-20 mb-2">

            {/* HEADER ROW: Utilities */}
            <div className="w-full flex items-center justify-between px-4 mb-4">

                {/* Left Group: Exit & Operators */}
                <div className="flex items-center gap-4">
                    <button
                        onClick={onExit || (() => window.location.href = '/modes')}
                        className="w-12 h-12 bg-white/5 border border-white/10 rounded-xl flex items-center justify-center text-gray-400 hover:bg-white/10 hover:text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <OperatorTray
                        operatorCounts={operatorCounts}
                        lastOperator={lastOperator}
                        allowedOps={allowedOps}
                        requiredOps={requiredOps}
                    />
                </div>

                {/* Right Group: Status Pill - removed backdrop-blur for Safari */}
                <div className="flex items-center gap-4 px-5 py-2 bg-gray-900/95 rounded-full border border-white/10 shadow-xl">
                    {level !== undefined && (
                        <>
                            <div className="flex flex-col items-center">
                                <span className="text-[10px] font-bold text-gray-500 tracking-wider">LVL</span>
                                <span className="text-xl font-black text-white leading-none">{level}</span>
                            </div>
                            <div className="w-px h-6 bg-white/10" />
                        </>
                    )}

                    {/* Score & Quests Container */}
                    <div className="flex flex-col items-end">
                        <div className="flex flex-col items-center">
                            <span className="text-[10px] font-bold text-gray-500 tracking-wider">SCORE</span>
                            <span className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-400 leading-none">
                                {score}
                            </span>
                        </div>

                    </div>
                </div>
            </div>

            {/* HERO ROW: The Target (Centered & Large) - Now using shared TargetCircle */}
            {showTarget && (
                <div className="py-2 mb-2">
                    <TargetCircle
                        target={target}
                        memeState={memeState}
                        isResettingTarget={isResettingTarget}
                    />
                </div>
            )}

        </div>
    );
};
