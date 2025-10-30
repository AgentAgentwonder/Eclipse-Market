import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMotionPreferences } from '../../hooks/useMotionPreferences';
import { progressVariants, shimmerVariants } from '../../utils/animations';

interface ProgressBarProps {
  /** Progress value between 0 and 100 */
  value: number;
  /** Optional label for the progress bar */
  label?: string;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Size variant */
  size?: 'sm' | 'md' | 'lg';
  /** Color variant */
  variant?: 'primary' | 'success' | 'warning' | 'error';
  /** Show shimmer loading effect when indeterminate */
  indeterminate?: boolean;
  className?: string;
}

const sizeMap = {
  sm: 'h-1',
  md: 'h-2',
  lg: 'h-3',
};

const colorMap = {
  primary: {
    bg: 'bg-slate-700/50',
    fill: 'bg-gradient-to-r from-purple-500 to-pink-500',
    glow: 'shadow-purple-500/50',
  },
  success: {
    bg: 'bg-slate-700/50',
    fill: 'bg-gradient-to-r from-emerald-500 to-teal-500',
    glow: 'shadow-emerald-500/50',
  },
  warning: {
    bg: 'bg-slate-700/50',
    fill: 'bg-gradient-to-r from-amber-500 to-orange-500',
    glow: 'shadow-amber-500/50',
  },
  error: {
    bg: 'bg-slate-700/50',
    fill: 'bg-gradient-to-r from-red-500 to-rose-500',
    glow: 'shadow-red-500/50',
  },
};

/**
 * Animated Progress Bar with lunar eclipse-inspired styling
 */
export const ProgressBar: React.FC<ProgressBarProps> = React.memo(
  ({
    value,
    label,
    showPercentage = false,
    size = 'md',
    variant = 'primary',
    indeterminate = false,
    className = '',
  }) => {
    const reducedMotion = useMotionPreferences();
    const normalizedValue = Math.max(0, Math.min(100, value));
    const progress = normalizedValue / 100;
    const colors = colorMap[variant];

    const shimmerStyle = useMemo(
      () => ({
        background: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.3) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
      }),
      []
    );

    return (
      <div className={`w-full ${className}`} role="progressbar" aria-valuenow={normalizedValue} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        {(label || showPercentage) && (
          <div className="flex items-center justify-between mb-2">
            {label && <span className="text-sm text-slate-300">{label}</span>}
            {showPercentage && <span className="text-sm text-slate-400">{normalizedValue}%</span>}
          </div>
        )}

        <div className={`relative w-full ${sizeMap[size]} ${colors.bg} rounded-full overflow-hidden border border-slate-600/30`}>
          {indeterminate ? (
            <motion.div
              className={`absolute inset-0 ${colors.fill}`}
              style={shimmerStyle}
              variants={shimmerVariants}
              animate={reducedMotion ? undefined : 'animate'}
            />
          ) : (
            <motion.div
              className={`h-full ${colors.fill} ${colors.glow} shadow-lg rounded-full`}
              initial="initial"
              animate="animate"
              custom={progress}
              variants={reducedMotion ? {} : progressVariants}
              style={{ width: `${normalizedValue}%` }}
            />
          )}
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = 'ProgressBar';
