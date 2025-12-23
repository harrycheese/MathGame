import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState, useRef } from 'react';

interface TimerCircleProps {
    timeRemaining: number; // in seconds
    maxTime: number; // initial max for calculating percentage
    timeBonus: number | null; // when set, shows +Xs animation inside
    countdown?: number | null; // Pre-game countdown (3, 2, 1)
}

export const TimerCircle = ({ timeRemaining, maxTime, timeBonus, countdown }: TimerCircleProps) => {
    const [showBonus, setShowBonus] = useState<number | null>(null);
    const [bonusKey, setBonusKey] = useState(0); // Force re-animation on each bonus
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Calculate percentage for ring fill
    const percentage = Math.max(0, Math.min(100, (timeRemaining / maxTime) * 100));

    // Color based on time remaining
    const getColors = () => {
        if (percentage > 50) return {
            ring: '#22c55e', // green-500
            text: 'text-green-400',
            glow: 'rgba(34, 197, 94, 0.3)',
            label: 'text-green-500/80'
        };
        if (percentage > 25) return {
            ring: '#eab308', // yellow-500
            text: 'text-yellow-400',
            glow: 'rgba(234, 179, 8, 0.3)',
            label: 'text-yellow-500/80'
        };
        return {
            ring: '#ef4444', // red-500
            text: 'text-red-400',
            glow: 'rgba(239, 68, 68, 0.4)',
            label: 'text-red-500/80'
        };
    };

    const colors = getColors();

    // Format time as M:SS
    const formatTime = (seconds: number) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    // Show bonus animation inside circle
    useEffect(() => {
        if (timeBonus && timeBonus > 0) {
            // Clear any existing timeout if we get a NEW bonus fast
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            setShowBonus(timeBonus);
            setBonusKey(prev => prev + 1);

            // Set new timeout to clear the display
            timeoutRef.current = setTimeout(() => {
                setShowBonus(null);
                timeoutRef.current = null;
            }, 1000);
        }
        // NOTE: We intentionally DO NOT clear the timeout in the cleanup function
        // because the parent component (GameEngine) resets `timeBonus` to null after 1s.
        // If we cleared it here, the resetting of the prop would cancel our visibility timer!
    }, [timeBonus]);

    // SVG circle parameters (matches target size ~128px)
    const size = 128;
    const strokeWidth = 6;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const strokeDashoffset = circumference - (percentage / 100) * circumference;

    return (
        <div className="relative flex flex-col items-center justify-center group">
            {/* Glow effect */}
            <div
                className="absolute -inset-4 rounded-full blur-xl opacity-30 animate-pulse transition-colors duration-500"
                style={{ backgroundColor: colors.glow }}
            />

            {/* Timer Circle - removed backdrop-blur for Safari performance */}
            <div
                className="relative w-32 h-32 bg-gray-900/95 rounded-full border border-white/10 shadow-2xl ring-1 ring-white/10 overflow-hidden"
            >
                {/* SVG Ring */}
                <svg
                    className="absolute inset-0 w-full h-full -rotate-90"
                    viewBox={`0 0 ${size} ${size}`}
                >
                    {/* Background ring */}
                    <circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke="rgba(255,255,255,0.1)"
                        strokeWidth={strokeWidth}
                    />
                    {/* Progress ring */}
                    <motion.circle
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={colors.ring}
                        strokeWidth={strokeWidth}
                        strokeLinecap="round"
                        style={{
                            strokeDasharray: circumference,
                            strokeDashoffset, // Ensure initial value is defined to prevent "undefined" animation error
                        }}
                        initial={{ strokeDashoffset }}
                        animate={{
                            strokeDashoffset: strokeDashoffset,
                        }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                </svg>

                {/* Content (Countdown, Time, or Bonus) */}
                <div className="absolute inset-0 z-10">
                    <AnimatePresence>
                        {countdown !== null && countdown !== undefined && countdown > 0 ? (
                            // COUNTDOWN: 3, 2, 1
                            <motion.div
                                key={`countdown-${countdown}`}
                                initial={{ scale: 2, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.5, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 flex items-center justify-center pt-2 text-5xl font-black text-white"
                                style={{ textShadow: '0 0 40px rgba(255, 255, 255, 0.8)' }}
                            >
                                {countdown}
                            </motion.div>
                        ) : countdown === 0 ? (
                            // GO!
                            <motion.div
                                key="go"
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 1.5, opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0 flex items-center justify-center pt-2 text-3xl font-black text-green-400"
                                style={{ textShadow: '0 0 30px rgba(34, 197, 94, 0.8)' }}
                            >
                                GO!
                            </motion.div>
                        ) : showBonus ? (
                            <motion.div
                                key={`bonus-${bonusKey}`}
                                initial={{ scale: 0.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                exit={{ scale: 0.8, opacity: 0 }}
                                transition={{
                                    type: "spring",
                                    stiffness: 400,
                                    damping: 15
                                }}
                                className={`absolute inset-0 flex items-center justify-center pt-2 text-4xl font-black ${showBonus >= 5 ? 'text-yellow-400' : 'text-green-400'}`}
                                style={{
                                    textShadow: showBonus >= 5
                                        ? '0 0 30px rgba(250, 204, 21, 0.8)'
                                        : '0 0 30px rgba(34, 197, 94, 0.8)'
                                }}
                            >
                                +{showBonus}s
                            </motion.div>
                        ) : (
                            <motion.div
                                key="time"
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 0.2 }}
                                className="absolute inset-0"
                            >
                                <span className={`absolute top-6 left-0 right-0 text-center text-[10px] font-bold ${colors.label} tracking-[0.2em] uppercase`}>
                                    TIME
                                </span>
                                <div className="absolute inset-0 flex items-center justify-center pt-2">
                                    <motion.span
                                        className={`text-4xl font-black italic ${colors.text} tracking-tight leading-none`}
                                        animate={{
                                            scale: percentage < 25 ? [1, 1.05, 1] : 1,
                                        }}
                                        transition={{
                                            duration: 0.5,
                                            repeat: percentage < 25 ? Infinity : 0,
                                        }}
                                        style={{ textShadow: `0 0 20px ${colors.glow}` }}
                                    >
                                        {formatTime(timeRemaining)}
                                    </motion.span>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};
