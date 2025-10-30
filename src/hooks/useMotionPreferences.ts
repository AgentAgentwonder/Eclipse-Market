import { useMemo } from 'react';
import { useReducedMotion as useFramerReducedMotion } from 'framer-motion';
import { useAccessibilityStore } from '../store/accessibilityStore';

/**
 * Combines user accessibility settings with system preferences to determine reduced motion state.
 */
export function useMotionPreferences() {
  const reducedMotionSetting = useAccessibilityStore(state => state.reducedMotion);
  const prefersReduced = useFramerReducedMotion();

  return useMemo(() => reducedMotionSetting || prefersReduced, [reducedMotionSetting, prefersReduced]);
}

/**
 * Utility hook to guard animation configs based on motion preferences.
 */
export function useAccessibleMotion<T>({ value, fallback }: { value: T; fallback: T }) {
  const reduceMotion = useMotionPreferences();

  return useMemo(() => (reduceMotion ? fallback : value), [reduceMotion, value, fallback]);
}
