import { Variants, Transition } from 'framer-motion';

/**
 * Lunar Eclipse Animation Tokens and Primitives
 * 
 * These animation utilities provide consistent, theme-aware motion
 * that respects accessibility settings and the lunar/eclipse aesthetic.
 */

// Animation Duration Tokens
export const ANIMATION_DURATIONS = {
  instant: 0.01,
  fast: 0.15,
  normal: 0.3,
  slow: 0.5,
  glacial: 0.8,
} as const;

// Easing Tokens
export const ANIMATION_EASINGS = {
  smooth: [0.4, 0, 0.2, 1],
  bounce: [0.68, -0.55, 0.265, 1.55],
  orbital: [0.645, 0.045, 0.355, 1],
  eclipse: [0.25, 0.46, 0.45, 0.94],
} as const;

// Orbital Transition - for celestial-inspired circular/elliptical motion
export const orbitalTransition = (duration = ANIMATION_DURATIONS.normal): Transition => ({
  duration,
  ease: ANIMATION_EASINGS.orbital,
});

// Eclipse Transition - for smooth appearing/disappearing effects
export const eclipseTransition = (duration = ANIMATION_DURATIONS.normal): Transition => ({
  duration,
  ease: ANIMATION_EASINGS.eclipse,
});

/**
 * Orbital Variants - for elements that should enter/exit in circular motion
 */
export const orbitalVariants: Variants = {
  hidden: {
    opacity: 0,
    scale: 0.8,
    rotate: -180,
  },
  visible: {
    opacity: 1,
    scale: 1,
    rotate: 0,
    transition: orbitalTransition(),
  },
  exit: {
    opacity: 0,
    scale: 0.8,
    rotate: 180,
    transition: orbitalTransition(ANIMATION_DURATIONS.fast),
  },
};

/**
 * Corona Glow Variants - for pulsing glow effects
 */
export const coronaGlowVariants: Variants = {
  idle: {
    opacity: 0.6,
    scale: 1,
    filter: 'brightness(1)',
  },
  glow: {
    opacity: [0.6, 0.9, 0.6],
    scale: [1, 1.05, 1],
    filter: ['brightness(1)', 'brightness(1.3)', 'brightness(1)'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: ANIMATION_EASINGS.smooth,
    },
  },
};

/**
 * Constellation Link Variants - for drawing animated lines/connections
 */
export const constellationLinkVariants: Variants = {
  hidden: {
    pathLength: 0,
    opacity: 0,
  },
  visible: {
    pathLength: 1,
    opacity: 1,
    transition: {
      pathLength: {
        duration: 1.5,
        ease: ANIMATION_EASINGS.smooth,
      },
      opacity: {
        duration: 0.5,
      },
    },
  },
};

/**
 * Panel Reveal Variants - for sliding panels and modals
 */
export const panelRevealVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 20,
    scale: 0.95,
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: eclipseTransition(),
  },
  exit: {
    opacity: 0,
    y: -20,
    scale: 0.95,
    transition: eclipseTransition(ANIMATION_DURATIONS.fast),
  },
};

/**
 * Card Hover Variants - for interactive card effects
 */
export const cardHoverVariants: Variants = {
  rest: {
    scale: 1,
    y: 0,
  },
  hover: {
    scale: 1.02,
    y: -4,
    transition: {
      duration: ANIMATION_DURATIONS.fast,
      ease: ANIMATION_EASINGS.smooth,
    },
  },
};

/**
 * Fade In Stagger - for staggered list animations
 */
export const fadeInStaggerVariants = {
  container: {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  },
  item: {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: eclipseTransition(),
    },
  },
};

/**
 * Moon Phase Rotation - for circular phase indicators
 */
export const moonPhaseVariants = (phase: number): Variants => ({
  initial: {
    rotate: 0,
  },
  animate: {
    rotate: phase * 360,
    transition: {
      duration: ANIMATION_DURATIONS.slow,
      ease: ANIMATION_EASINGS.orbital,
    },
  },
});

/**
 * Progress Animation - for progress bars and loaders
 */
export const progressVariants: Variants = {
  initial: {
    scaleX: 0,
    originX: 0,
  },
  animate: (progress: number) => ({
    scaleX: progress,
    transition: {
      duration: ANIMATION_DURATIONS.normal,
      ease: ANIMATION_EASINGS.smooth,
    },
  }),
};

/**
 * Shimmer Effect - for loading states
 */
export const shimmerVariants: Variants = {
  animate: {
    backgroundPosition: ['200% 0', '-200% 0'],
    transition: {
      duration: 2,
      repeat: Infinity,
      ease: 'linear',
    },
  },
};

/**
 * Floating Animation - for ambient hover effects
 */
export const floatingVariants: Variants = {
  animate: {
    y: [0, -10, 0],
    transition: {
      duration: 3,
      repeat: Infinity,
      ease: ANIMATION_EASINGS.smooth,
    },
  },
};

/**
 * Parallax Spring Config - for scroll-based parallax effects
 */
export const parallaxSpringConfig = {
  stiffness: 100,
  damping: 30,
  restDelta: 0.001,
};

/**
 * Get animation duration respecting accessibility settings
 */
export const getAnimationDuration = (
  duration: number,
  reducedMotion: boolean
): number => {
  return reducedMotion ? 0.01 : duration;
};

/**
 * Get animation variants respecting accessibility settings
 */
export const getAccessibleVariants = (
  variants: Variants,
  reducedMotion: boolean
): Variants => {
  if (!reducedMotion) return variants;

  // Strip out animations for reduced motion
  return Object.keys(variants).reduce((acc, key) => {
    const variant = variants[key];
    if (typeof variant === 'object' && variant !== null) {
      // Remove transition properties
      const { transition, ...rest } = variant as any;
      acc[key] = rest;
    } else {
      acc[key] = variant;
    }
    return acc;
  }, {} as Variants);
};

/**
 * Create a transition respecting accessibility settings
 */
export const createAccessibleTransition = (
  transition: Transition,
  reducedMotion: boolean
): Transition => {
  if (reducedMotion) {
    return {
      duration: 0.01,
    };
  }
  return transition;
};
