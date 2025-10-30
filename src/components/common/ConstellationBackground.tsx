import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useMotionPreferences } from '../../hooks/useMotionPreferences';
import { constellationLinkVariants, floatingVariants } from '../../utils/animations';

interface ConstellationBackgroundProps {
  /** Number of stars to render */
  starCount?: number;
  /** Number of constellation lines to render */
  linkCount?: number;
  /** Opacity of the constellation */
  opacity?: number;
  className?: string;
}

interface Star {
  x: number;
  y: number;
  size: number;
  opacity: number;
}

interface Link {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

const generateStars = (count: number, seed = 42): Star[] => {
  const stars: Star[] = [];
  // Simple seeded random for consistency
  let random = seed;
  const seededRandom = () => {
    random = (random * 9301 + 49297) % 233280;
    return random / 233280;
  };

  for (let i = 0; i < count; i++) {
    stars.push({
      x: seededRandom() * 100,
      y: seededRandom() * 100,
      size: seededRandom() * 2 + 1,
      opacity: seededRandom() * 0.5 + 0.3,
    });
  }
  return stars;
};

const generateLinks = (stars: Star[], count: number): Link[] => {
  const links: Link[] = [];
  const maxDistance = 20; // Max distance for connection

  for (let i = 0; i < stars.length && links.length < count; i++) {
    for (let j = i + 1; j < stars.length && links.length < count; j++) {
      const dx = stars[j].x - stars[i].x;
      const dy = stars[j].y - stars[i].y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      if (distance < maxDistance) {
        links.push({
          x1: stars[i].x,
          y1: stars[i].y,
          x2: stars[j].x,
          y2: stars[j].y,
        });
      }
    }
  }
  return links;
};

/**
 * Animated constellation background with stars and connecting lines
 */
export const ConstellationBackground: React.FC<ConstellationBackgroundProps> = React.memo(
  ({ starCount = 50, linkCount = 30, opacity = 0.3, className = '' }) => {
    const reducedMotion = useMotionPreferences();

    const stars = useMemo(() => generateStars(starCount), [starCount]);
    const links = useMemo(() => generateLinks(stars, linkCount), [stars, linkCount]);

    return (
      <div
        className={`absolute inset-0 pointer-events-none overflow-hidden ${className}`}
        style={{ opacity }}
        aria-hidden="true"
      >
        <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
          {/* Constellation links */}
          <g className="constellation-links">
            {links.map((link, i) => (
              <motion.line
                key={`link-${i}`}
                x1={`${link.x1}%`}
                y1={`${link.y1}%`}
                x2={`${link.x2}%`}
                y2={`${link.y2}%`}
                stroke="rgba(255, 107, 53, 0.3)"
                strokeWidth="1"
                variants={reducedMotion ? {} : constellationLinkVariants}
                initial="hidden"
                animate="visible"
                transition={{ delay: i * 0.05 }}
              />
            ))}
          </g>

          {/* Stars */}
          <g className="constellation-stars">
            {stars.map((star, i) => (
              <motion.circle
                key={`star-${i}`}
                cx={`${star.x}%`}
                cy={`${star.y}%`}
                r={star.size}
                fill="rgba(192, 204, 218, 0.8)"
                opacity={star.opacity}
                variants={reducedMotion ? {} : floatingVariants}
                animate="animate"
                transition={{ delay: i * 0.02 }}
              />
            ))}
          </g>
        </svg>
      </div>
    );
  }
);

ConstellationBackground.displayName = 'ConstellationBackground';
