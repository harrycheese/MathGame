import { useGameEngine } from './hooks/useGameEngine';
import { GameBoard } from './components/GameBoard';
import { GameHUD } from './components/GameHUD';
import { GameControls } from './components/GameControls';

function App() {
  const { grid, target, score, level, lastOperator, operatorCounts, handleTileClick, shuffleBoard } = useGameEngine();

  return (
    <div className="min-h-screen bg-game-background flex flex-col items-center justify-center p-4 selection:bg-game-primary selection:text-white overflow-hidden relative">
      {/* Background Decor */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[600px] h-[600px] bg-game-primary/20 rounded-full blur-[120px] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-game-secondary/20 rounded-full blur-[100px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_reverse]" />
        <div className="absolute top-[40%] left-[30%] w-[300px] h-[300px] bg-game-accent/10 rounded-full blur-[80px]" />
      </div>

      <div className="z-10 w-full max-w-lg flex flex-col h-full justify-center items-center">

        {/* 1. Status & Goal */}
        <GameHUD
          target={target}
          score={score}
          level={level}
          operatorCounts={operatorCounts}
          lastOperator={lastOperator}
        />

        {/* 2. Work (Grid) */}
        <GameBoard
          grid={grid}
          onTileClick={handleTileClick}
        />

        {/* 3. Tools (Dock) */}
        <GameControls
          onShuffle={shuffleBoard}
        />

      </div>
    </div>
  );
}

export default App;
