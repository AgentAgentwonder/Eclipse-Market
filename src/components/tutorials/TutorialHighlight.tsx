import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

interface TutorialHighlightProps {
  target: string;
  offset?: number;
}

export function TutorialHighlight({ target, offset = 8 }: TutorialHighlightProps) {
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    const updatePosition = () => {
      const element = document.querySelector(target);
      if (element) {
        const rect = element.getBoundingClientRect();
        setPosition({
          top: rect.top - offset,
          left: rect.left - offset,
          width: rect.width + offset * 2,
          height: rect.height + offset * 2,
        });
      }
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);

    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [target, offset]);

  if (!position) return null;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[99] pointer-events-none"
        style={{
          backgroundColor: 'rgba(0, 0, 0, 0.5)',
          WebkitMaskImage: `
            radial-gradient(
              ellipse at ${position.left + position.width / 2}px ${position.top + position.height / 2}px,
              transparent 0,
              transparent ${Math.max(position.width, position.height) / 2 + offset}px,
              black ${Math.max(position.width, position.height) / 2 + offset + 100}px
            )
          `,
          maskImage: `
            radial-gradient(
              ellipse at ${position.left + position.width / 2}px ${position.top + position.height / 2}px,
              transparent 0,
              transparent ${Math.max(position.width, position.height) / 2 + offset}px,
              black ${Math.max(position.width, position.height) / 2 + offset + 100}px
            )
          `,
        }}
      />

      {/* Highlight Border */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="fixed z-[99] pointer-events-none rounded-lg border-2 border-purple-500 shadow-[0_0_20px_rgba(168,85,247,0.5)]"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
        }}
      />

      {/* Pulsing ring */}
      <motion.div
        initial={{ opacity: 0.8, scale: 1 }}
        animate={{
          opacity: [0.8, 0, 0.8],
          scale: [1, 1.1, 1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="fixed z-[98] pointer-events-none rounded-lg border-2 border-purple-400"
        style={{
          top: position.top,
          left: position.left,
          width: position.width,
          height: position.height,
        }}
      />
    </>
  );
}
