import React from 'react';
import { useIntersectionObserver } from '../../hooks/useIntersectionObserver';
import { Skeleton } from './Skeleton';

interface LazyLoadProps {
  height?: number | string;
  placeholder?: React.ReactNode;
  children: React.ReactNode;
  rootMargin?: string;
  threshold?: number | number[];
}

export function LazyLoad({
  children,
  height = 200,
  placeholder,
  rootMargin = '200px',
  threshold = 0.01,
}: LazyLoadProps) {
  const { ref, isIntersecting } = useIntersectionObserver<HTMLDivElement>({ rootMargin, threshold });

  return (
    <div ref={ref} style={{ minHeight: height }}>
      {isIntersecting ? children : placeholder || <Skeleton height={typeof height === 'number' ? `${height}px` : height} />}
    </div>
  );
}
