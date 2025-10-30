import { useTransform, useScroll, MotionValue, MotionStyle } from 'framer-motion';
import { useRef } from 'react';
import { useMotionPreferences } from './useMotionPreferences';

interface UseParallaxOptions {
  /** Distance to move the element. Positive values move down, negative up. */
  distance?: number;
  /** Clamp the parallax effect to a specific range */
  clamp?: boolean;
}

interface ParallaxResult<T extends HTMLElement> {
  ref: React.RefObject<T>;
  style: MotionStyle | undefined;
}

/**
 * Hook for creating scroll-based parallax effects that respect reduced motion settings
 * @param options Configuration for parallax behavior
 * @returns Object containing ref to attach to element and motion values
 */
export function useParallax<T extends HTMLElement = HTMLDivElement>({
  distance = 100,
  clamp = true,
}: UseParallaxOptions = {}): ParallaxResult<T> {
  const ref = useRef<T>(null);
  const reducedMotion = useMotionPreferences();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  });

  const y = useTransform(
    scrollYProgress,
    [0, 1],
    clamp ? [0, distance] : [-distance, distance],
    { clamp }
  );

  return {
    ref,
    style: reducedMotion ? undefined : { y },
  };
}

/**
 * Hook for creating ambient motion effects on scroll
 */
export function useAmbientScroll(): MotionStyle | undefined {
  const reducedMotion = useMotionPreferences();
  const { scrollY } = useScroll();

  const opacity = useTransform(scrollY, [0, 300], [1, 0.3]);
  const scale = useTransform(scrollY, [0, 300], [1, 0.95]);

  return reducedMotion ? undefined : { opacity, scale };
}

/**
 * Hook for creating depth-based parallax layers
 * @param depth Layer depth (0 = no movement, 1 = full movement)
 */
export function useParallaxLayer(depth: number = 0.5): MotionStyle | undefined {
  const reducedMotion = useMotionPreferences();
  const { scrollY } = useScroll();

  const y = useTransform(scrollY, [0, 1000], [0, -1000 * depth]);

  return reducedMotion ? undefined : { y };
}
