import React from 'react';
import { motion } from 'framer-motion';
import { useMotionPreferences } from '../../hooks/useMotionPreferences';
import { shimmerVariants } from '../../utils/animations';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
  variant?: 'default' | 'shimmer';
}

export function Skeleton({ 
  className, 
  width = '100%', 
  height = '1rem', 
  rounded = '0.75rem',
  variant = 'shimmer',
}: SkeletonProps) {
  const reducedMotion = useMotionPreferences();

  if (variant === 'default' || reducedMotion) {
    return (
      <div
        className={`animate-pulse bg-slate-700/60 ${className || ''}`}
        style={{ width, height, borderRadius: rounded }}
        role="status"
        aria-label="Loading"
      />
    );
  }

  return (
    <motion.div
      className={`bg-slate-700/60 overflow-hidden ${className || ''}`}
      style={{ 
        width, 
        height, 
        borderRadius: rounded,
        backgroundImage: 'linear-gradient(90deg, transparent 0%, rgba(255, 255, 255, 0.1) 50%, transparent 100%)',
        backgroundSize: '200% 100%',
      }}
      variants={shimmerVariants}
      animate="animate"
      role="status"
      aria-label="Loading"
    />
  );
}
