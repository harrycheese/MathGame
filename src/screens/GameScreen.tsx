
import { useGameEngine } from '../hooks/useGameEngine';
import { GameHUD } from '../components/GameHUD';
import { GameBoard } from '../components/GameBoard';
import { GameControls } from '../components/GameControls';

export const GameScreen = () => {
    const {
        grid, target, score, level,
        lastOperator, operatorCounts,
        handleTileClick, shuffleBoard, memeState
    } = useGameEngine();

    return (
        <div className="min-h-screen bg-[#0a0a0f] text-white font-sans overflow-hidden select-none">
            {/* Background elements */}
            <div className="fixed inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-blue-900/20 via-[#0a0a0f] to-[#0a0a0f] z-0" />

            <div className="relative z-10 container mx-auto px-4 py-8 flex flex-col h-screen max-h-[900px]">
                {/* 1. Dashboard (HUD) */}
                <GameHUD
                    target={target}
                    score={score}
                    level={level}
                    operatorCounts={operatorCounts}
                    lastOperator={lastOperator}
                    memeState={memeState}
                />

                {/* 2. Work (Grid) */}
                <GameBoard
                    grid={grid}
                    onTileClick={handleTileClick}
                />

                {/* 3. Utilities (Controls) */}
                <GameControls
                    onShuffle={shuffleBoard}
                />
            </div>
        </div>
    );
};
