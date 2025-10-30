import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMotionPreferences } from '../../hooks/useMotionPreferences';
import { ANIMATION_DURATIONS, ANIMATION_EASINGS } from '../../utils/animations';

interface MoonPhaseIndicatorProps {
  /** Value between 0 and 1 representing the lunar cycle position */
  phase: number;
  size?: number;
  showLabel?: boolean;
  className?: string;
}

const PHASE_LABELS = [
  'New Moon',
  'Waxing Crescent',
  'First Quarter',
  'Waxing Gibbous',
  'Full Moon',
  'Waning Gibbous',
  'Last Quarter',
  'Waning Crescent',
];

const normalizePhase = (phase: number) => {
  if (Number.isNaN(phase) || !Number.isFinite(phase)) return 0;
  return Math.max(0, Math.min(1, phase));
};

/**
 * Displays the current moon phase with eclipse-inspired animation.
 */
export const MoonPhaseIndicator: React.FC<MoonPhaseIndicatorProps> = React.memo(
  ({ phase, size = 48, showLabel = true, className = '' }) => {
    const reducedMotion = useMotionPreferences();
    const normalizedPhase = normalizePhase(phase);

    const phaseLabel = useMemo(() => {
      const index = Math.round(normalizedPhase * (PHASE_LABELS.length - 1));
      return PHASE_LABELS[index];
    }, [normalizedPhase]);

    const rotation = normalizedPhase * 360;
    const shadowOffset = (normalizedPhase - 0.5) * 50;

    return (
      <div className={`flex flex-col items-center ${className}`} aria-label={`Moon phase: ${phaseLabel}`}>
        <div
          className="relative flex items-center justify-center rounded-full border border-slate-600/50 shadow-inner"
          style={{
            width: size,
            height: size,
            background: 'radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.15) 0%, rgba(10, 14, 26, 0.9) 60%)',
          }}
        >
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 107, 53, 0.5), transparent)',
            }}
            animate={
              reducedMotion
                ? undefined
                : {
                    rotate: rotation,
                    transition: {
                      duration: ANIMATION_DURATIONS.slow,
                      ease: ANIMATION_EASINGS.orbital,
                    },
                  }
            }
          />

          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: 'linear-gradient(90deg, rgba(5, 8, 16, 0.85), rgba(5, 8, 16, 0))',
              transform: `translateX(${shadowOffset}%)`,
            }}
            animate={
              reducedMotion
                ? undefined
                : {
                    transform: [`translateX(${shadowOffset}%)`, `translateX(${shadowOffset}%)`],
                    transition: {
                      duration: ANIMATION_DURATIONS.normal,
                      ease: ANIMATION_EASINGS.smooth,
                    },
                  }
            }
          />

          <div
            className="absolute inset-1 rounded-full border border-white/10"
            style={{ boxShadow: '0 0 10px rgba(255, 255, 255, 0.1)' }}
          />
        </div>

        {showLabel && (
          <span className="mt-2 text-xs text-slate-300">{phaseLabel}</span>
        )}
      </div>
    );
  }
);

MoonPhaseIndicator.displayName = 'MoonPhaseIndicator';
