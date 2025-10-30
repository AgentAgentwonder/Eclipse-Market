import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  rounded?: string;
}

export function Skeleton({ className, width = '100%', height = '1rem', rounded = '0.75rem' }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-slate-700/60 ${className || ''}`}
      style={{ width, height, borderRadius: rounded }}
    />
  );
}
