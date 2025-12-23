import { motion, AnimatePresence } from 'framer-motion';
import { Tile } from './Tile';
import type { TileData } from '../types/game';

interface GameBoardProps {
    grid: TileData[][];
    onTileClick: (row: number, col: number) => void;
    hintState?: { tileId: string; operator: string } | null;
}

export const GameBoard = ({ grid, onTileClick, hintState }: GameBoardProps) => {
    // Calculate grid rows dynamically (for 50/50 when grid shrinks)
    const gridRows = grid.length;
    const isHalved = gridRows < 6;

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md mx-auto p-4 bg-black/40 rounded-3xl border border-white/10 shadow-2xl flex flex-col"
            style={{
                aspectRatio: '1', // Always maintain square aspect ratio
            }}
        >
            {/* Empty space at top when grid is halved - creates gravity effect */}
            {isHalved && (
                <div className="flex-1" />
            )}

            <div
                className="grid gap-3"
                style={{
                    gridTemplateColumns: 'repeat(6, 1fr)',
                    gridTemplateRows: `repeat(${gridRows}, 1fr)`,
                    height: isHalved ? `${(gridRows / 6) * 100}%` : '100%',
                }}
            >
                <AnimatePresence mode="popLayout">
                    {grid.map((row) => (
                        row.map((tile) => (
                            <motion.div
                                key={tile.id}
                                layout
                                initial={{ opacity: 0, scale: 0.5, y: -100 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0, y: 50 }}
                                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                            >
                                <Tile
                                    tile={tile}
                                    onClick={onTileClick}
                                    isHinted={hintState?.tileId === tile.id}
                                    hintOperator={hintState?.tileId === tile.id ? hintState.operator : undefined}
                                />
                            </motion.div>
                        ))
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
