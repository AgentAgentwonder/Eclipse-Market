import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, BookOpen, Video } from 'lucide-react';
import { useHelpStore } from '../../store/helpStore';

export function WhatsThisMode() {
  const {
    whatsThisMode,
    exitWhatsThisMode,
    setHighlightedElement,
    highlightedElement,
    content,
    openPanel,
  } = useHelpStore();

  const findHelpItem = useCallback(
    (element: HTMLElement) => {
      for (const section of content.sections) {
        for (const item of section.items) {
          for (const selector of item.selectors) {
            if (element.matches(selector) || element.closest(selector)) {
              return { section, item };
            }
          }
        }
      }
      return null;
    },
    [content]
  );

  const handleClick = useCallback(
    (e: MouseEvent) => {
      if (!whatsThisMode) return;

      e.preventDefault();
      e.stopPropagation();

      const target = e.target as HTMLElement;
      const helpData = findHelpItem(target);

      if (helpData) {
        openPanel(helpData.section.id, helpData.item.id);
        exitWhatsThisMode();
      }
    },
    [whatsThisMode, findHelpItem, openPanel, exitWhatsThisMode]
  );

  const handleMouseOver = useCallback(
    (e: MouseEvent) => {
      if (!whatsThisMode) return;

      const target = e.target as HTMLElement;
      const helpData = findHelpItem(target);

      if (helpData) {
        setHighlightedElement(target);
      } else {
        setHighlightedElement(null);
      }
    },
    [whatsThisMode, findHelpItem, setHighlightedElement]
  );

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        exitWhatsThisMode();
      }
    },
    [exitWhatsThisMode]
  );

  useEffect(() => {
    if (whatsThisMode) {
      document.addEventListener('click', handleClick, true);
      document.addEventListener('mouseover', handleMouseOver);
      document.addEventListener('keydown', handleKeyDown);

      return () => {
        document.removeEventListener('click', handleClick, true);
        document.removeEventListener('mouseover', handleMouseOver);
        document.removeEventListener('keydown', handleKeyDown);
      };
    }
  }, [whatsThisMode, handleClick, handleMouseOver, handleKeyDown]);

  if (!whatsThisMode) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] pointer-events-none"
        aria-live="polite"
        aria-atomic="true"
      >
        {/* Instructions Banner */}
        <motion.div
          initial={{ y: -100 }}
          animate={{ y: 0 }}
          exit={{ y: -100 }}
          className="absolute top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-3 pointer-events-auto border border-purple-400"
        >
          <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
            <BookOpen className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-sm">What's This? Mode Active</p>
            <p className="text-xs text-purple-100">{content.whatsThis.hint}</p>
          </div>
          <button
            onClick={exitWhatsThisMode}
            className="ml-2 p-2 hover:bg-white/10 rounded-lg transition pointer-events-auto"
            aria-label="Exit What's This mode"
          >
            <X className="w-4 h-4" />
          </button>
        </motion.div>

        {/* Highlighted Element Tooltip */}
        {highlightedElement && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="absolute pointer-events-none"
            style={{
              top: highlightedElement.getBoundingClientRect().bottom + 8,
              left: highlightedElement.getBoundingClientRect().left,
            }}
          >
            <div className="bg-slate-900 border border-purple-500/30 rounded-xl p-3 shadow-2xl max-w-xs">
              <p className="text-xs text-purple-400 font-semibold mb-1">Click to learn more</p>
              <p className="text-xs text-white/60">
                View contextual help and documentation for this feature
              </p>
            </div>
          </motion.div>
        )}
      </motion.div>
    </AnimatePresence>
  );
}
