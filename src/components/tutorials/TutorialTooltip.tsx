import { forwardRef, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, SkipForward } from 'lucide-react';
import { Tutorial, TutorialStep } from '../../types/tutorials';

interface TutorialTooltipProps {
  step: TutorialStep;
  tutorial: Tutorial;
  currentStep: number;
  totalSteps: number;
  onNext: () => void;
  onPrevious: () => void;
  onSkip: () => void;
  onClose: () => void;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  isFirstStep: boolean;
  isLastStep: boolean;
}

export const TutorialTooltip = forwardRef<HTMLDivElement, TutorialTooltipProps>(
  ({
    step,
    tutorial,
    currentStep,
    totalSteps,
    onNext,
    onPrevious,
    onSkip,
    onClose,
    Icon,
    isFirstStep,
    isLastStep,
  }, ref) => {
    const tooltipRef = useRef<HTMLDivElement | null>(null);
    const mergedRef = (node: HTMLDivElement | null) => {
      tooltipRef.current = node;
      if (typeof ref === 'function') {
        ref(node);
      } else if (ref) {
        (ref as React.MutableRefObject<HTMLDivElement | null>).current = node;
      }
    };

    useEffect(() => {
      if (tooltipRef.current) {
        tooltipRef.current.focus();
      }
    }, [step.id]);

    return (
      <AnimatePresence mode="wait">
        <motion.div
          key={step.id}
          ref={mergedRef}
          tabIndex={-1}
          initial={{ opacity: 0, y: 8, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 8, scale: 0.98 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className={`fixed z-[101] max-w-sm w-[320px] rounded-xl bg-slate-900 border border-purple-500/30 shadow-2xl p-4 text-left focus:outline-none ${
            step.placement === 'left' ? 'translate-x-[-360px]' : ''
          }`}
          role="dialog"
          aria-modal="true"
          aria-labelledby={`tutorial-step-${step.id}`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <h4 id={`tutorial-step-${step.id}`} className="font-semibold">
                  {step.title}
                </h4>
                <p className="text-xs text-white/50">
                  Step {currentStep + 1} of {totalSteps}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1 rounded-lg hover:bg-white/5 transition"
              aria-label="Close tutorial"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-white/80 mt-3 leading-relaxed">{step.content}</p>

          {step.points && step.points.length > 0 && (
            <ul className="mt-3 space-y-2">
              {step.points.map((point, index) => (
                <li key={index} className="text-xs text-white/70 flex gap-2 items-start">
                  <span className="w-5 h-5 flex items-center justify-center rounded-full bg-purple-500/20 text-[10px] text-purple-400">
                    {index + 1}
                  </span>
                  {point}
                </li>
              ))}
            </ul>
          )}

          {step.videoUrl && (
            <div className="mt-3 rounded-lg overflow-hidden bg-slate-800">
              <video src={step.videoUrl} controls className="w-full" aria-label="Tutorial video" />
            </div>
          )}

          <div className="mt-4 flex items-center justify-between gap-2">
            <button
              onClick={onSkip}
              className="text-xs text-white/50 hover:text-white transition flex items-center gap-1"
              aria-label="Skip tutorial"
            >
              <SkipForward className="w-3 h-3" />
              Skip
            </button>

            <div className="flex gap-2">
              {!isFirstStep && (
                <button
                  onClick={onPrevious}
                  className="px-3 py-2 bg-slate-800 hover:bg-slate-700 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-3 h-3" />
                  Prev
                </button>
              )}
              <button
                onClick={onNext}
                className="px-3 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg text-xs font-semibold transition flex items-center gap-1"
                aria-label={isLastStep ? 'Finish tutorial' : 'Next step'}
              >
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ChevronRight className="w-3 h-3" />}
              </button>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    );
  }
);

TutorialTooltip.displayName = 'TutorialTooltip';
