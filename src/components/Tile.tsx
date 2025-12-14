import { motion } from 'framer-motion';
import type { TileData } from '../types/game';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TileProps {
    tile: TileData;
    onClick: (row: number, col: number) => void;
}

export const Tile = ({ tile, onClick }: TileProps) => {
    const { value, status, row, col } = tile;

    const isSelected = status === 'selected';
    const isMatched = status === 'matched';
    const isWrong = status === 'wrong';

    const baseClasses = "relative flex items-center justify-center text-4xl font-bold rounded-2xl cursor-pointer select-none transition-colors duration-300";

    // Styles for different states using Glassmorphism
    const stateClasses = clsx({
        'bg-white/10 backdrop-blur-md border border-white/20 text-white shadow-lg hover:bg-white/20': status === 'idle',
        'bg-game-primary/80 backdrop-blur-md border-game-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105': isSelected,
        'bg-game-success/80 backdrop-blur-md border-game-success text-white shadow-[0_0_20px_rgba(16,185,129,0.6)]': isMatched,
        'bg-game-accent/80 backdrop-blur-md border-game-accent text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]': isWrong,
    });

    return (
        <motion.div
            layout
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                width: '100%',
                aspectRatio: '1',
                gridColumn: col + 1,
                gridRow: row + 1,
                zIndex: isSelected || isWrong ? 10 : 1,
            }}
        >
            <motion.div
                className={twMerge(baseClasses, stateClasses)}
                animate={{
                    scale: isSelected ? 1.05 : 1,
                    x: isWrong ? [0, -5, 5, -5, 5, 0] : 0
                }}
                transition={{
                    default: { type: 'spring', stiffness: 300, damping: 25 },
                    x: { type: 'tween', duration: 0.4 }
                }}
                onClick={() => onClick(row, col)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ width: '100%', height: '100%' }}
            >
                <span className="drop-shadow-md">{value}</span>

                {/* Glossy overlay effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
            </motion.div>
        </motion.div>
    );
};
