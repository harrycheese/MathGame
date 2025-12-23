import { motion } from 'framer-motion';
import type { TileData } from '../types/game';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface TileProps {
    tile: TileData;
    onClick: (row: number, col: number) => void;
    isHinted?: boolean; // Power-up: golden glow hint
}

export const Tile = ({ tile, onClick, isHinted }: TileProps) => {
    const { value, status, row, col } = tile;

    // Hidden tile (removed by 50/50) - render invisible placeholder
    if (value === 0) {
        return (
            <div
                style={{
                    width: '100%',
                    aspectRatio: '1',
                    gridColumn: col + 1,
                    gridRow: row + 1,
                }}
            />
        );
    }

    const isSelected = status === 'selected';
    const isMatched = status === 'matched';
    const isWrong = status === 'wrong';

    const baseClasses = "relative flex items-center justify-center text-4xl font-bold rounded-2xl cursor-pointer select-none transition-colors duration-300";

    // Styles for different states
    const stateClasses = clsx({
        'bg-slate-800/90 border border-white/20 text-white shadow-lg hover:bg-slate-700/90': status === 'idle' && !isHinted,
        'bg-game-primary/90 border-game-primary text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] scale-105': isSelected,
        'bg-game-success/90 border-game-success text-white shadow-[0_0_20px_rgba(16,185,129,0.6)]': isMatched,
        'bg-game-accent/90 border-game-accent text-white shadow-[0_0_15px_rgba(244,63,94,0.5)]': isWrong,
        // Hinted state - Golden glow
        'bg-amber-900/90 border-2 border-amber-400 text-white shadow-[0_0_25px_rgba(251,191,36,0.6)]': isHinted && status === 'idle',
    });

    return (
        <motion.div
            transition={{ type: 'spring', stiffness: 300, damping: 25 }}
            style={{
                width: '100%',
                aspectRatio: '1',
                gridColumn: col + 1,
                gridRow: row + 1,
                zIndex: isSelected || isWrong || isHinted ? 10 : 1,
                willChange: 'transform',
            }}
        >
            <motion.div
                className={twMerge(baseClasses, stateClasses)}
                animate={{
                    scale: isSelected ? 1.05 : 1,
                    x: isWrong ? [0, -5, 5, -5, 5, 0] : 0,
                }}
                transition={{
                    scale: { type: 'spring', stiffness: 300, damping: 25 },
                    x: { type: 'tween', duration: 0.4 },
                }}
                onClick={() => onClick(row, col)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                style={{ width: '100%', height: '100%' }}
            >
                <span className="drop-shadow-md">{value}</span>

                {/* Glossy overlay effect */}
                <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />

                {/* Hinted glow ring animation */}
                {isHinted && (
                    <motion.div
                        className="absolute -inset-1 rounded-2xl border-2 border-amber-400 pointer-events-none"
                        animate={{
                            opacity: [0.5, 1, 0.5],
                            scale: [1, 1.02, 1]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                    />
                )}
            </motion.div>
        </motion.div>
    );
};
