import React from 'react';
import { motion } from 'framer-motion';
import { useMotionPreferences } from '../../hooks/useMotionPreferences';
import { ANIMATION_DURATIONS, ANIMATION_EASINGS } from '../../utils/animations';

interface EclipseLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: { container: 32, sun: 24, moon: 20 },
  md: { container: 48, sun: 36, moon: 30 },
  lg: { container: 64, sun: 48, moon: 40 },
};

/**
 * Eclipse Loader - animated loading indicator with sun/moon eclipse animation
 * Respects reduced motion accessibility settings
 */
export const EclipseLoader: React.FC<EclipseLoaderProps> = ({ size = 'md', className = '' }) => {
  const reducedMotion = useMotionPreferences();
  const dimensions = sizeMap[size];

  const sunVariants = reducedMotion
    ? {}
    : {
        animate: {
          scale: [1, 1.1, 1],
          opacity: [0.8, 1, 0.8],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: ANIMATION_EASINGS.smooth,
          },
        },
      };

  const moonVariants = reducedMotion
    ? {}
    : {
        animate: {
          x: ['-100%', '100%'],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: ANIMATION_EASINGS.orbital,
          },
        },
      };

  const coronaVariants = reducedMotion
    ? {}
    : {
        animate: {
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.6, 0.3],
          transition: {
            duration: 2,
            repeat: Infinity,
            ease: ANIMATION_EASINGS.smooth,
          },
        },
      };

  return (
    <div
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: dimensions.container, height: dimensions.container }}
      role="status"
      aria-label="Loading"
    >
      {/* Corona glow */}
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(255, 107, 53, 0.4) 0%, transparent 70%)',
        }}
        variants={coronaVariants}
        animate="animate"
      />

      {/* Sun */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: dimensions.sun,
          height: dimensions.sun,
          background: 'linear-gradient(135deg, #FF8C42, #FF6B35)',
          boxShadow: '0 0 20px rgba(255, 107, 53, 0.6)',
        }}
        variants={sunVariants}
        animate="animate"
      />

      {/* Moon (eclipse) */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: dimensions.moon,
          height: dimensions.moon,
          background: 'linear-gradient(135deg, #1A2235, #0A0E1A)',
          border: '2px solid rgba(192, 204, 218, 0.3)',
          boxShadow: 'inset 0 0 10px rgba(0, 0, 0, 0.5)',
        }}
        variants={moonVariants}
        animate="animate"
      />

      <span className="sr-only">Loading...</span>
    </div>
  );
};
