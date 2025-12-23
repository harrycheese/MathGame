import { motion, AnimatePresence } from 'framer-motion';
import { Tile } from './Tile';
import type { TileData } from '../types/game';

interface GameBoardProps {
    grid: TileData[][];
    onTileClick: (row: number, col: number) => void;
}

export const GameBoard = ({ grid, onTileClick }: GameBoardProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md mx-auto aspect-square p-4 bg-black/40 rounded-3xl border border-white/10 shadow-2xl"
        >
            <div className="grid grid-cols-6 gap-3 h-full">
                {/* Changed from popLayout to sync - popLayout causes expensive layout recalcs on Safari */}
                <AnimatePresence mode="sync">
                    {grid.map((row) => (
                        row.map((tile) => (
                            <Tile
                                key={tile.id}
                                tile={tile}
                                onClick={onTileClick}
                            />
                        ))
                    ))}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
