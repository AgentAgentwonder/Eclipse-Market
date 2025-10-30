import { useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, SkipForward, RotateCcw } from 'lucide-react';
import * as Icons from 'lucide-react';
import { useTutorialStore } from '../../store/tutorialStore';
import { TutorialTooltip } from './TutorialTooltip';
import { TutorialHighlight } from './TutorialHighlight';

export function TutorialEngine() {
  const {
    tutorials,
    activeTutorialId,
    currentStep,
    isPlaying,
    nextStep,
    previousStep,
    skipTutorial,
    stopTutorial,
  } = useTutorialStore();

  const tutorial = tutorials.find(t => t.id === activeTutorialId);
  const step = tutorial?.steps[currentStep];

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (!isPlaying) return;

      if (e.key === 'Escape') {
        skipTutorial();
      } else if (e.key === 'ArrowRight') {
        nextStep();
      } else if (e.key === 'ArrowLeft') {
        previousStep();
      }
    },
    [isPlaying, skipTutorial, nextStep, previousStep]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Scroll to target element when step changes
  useEffect(() => {
    if (step?.target && isPlaying) {
      const element = document.querySelector(step.target);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [step, isPlaying]);

  if (!isPlaying || !tutorial || !step) {
    return null;
  }

  const Icon = step.icon ? Icons[step.icon as keyof typeof Icons] : Icons.HelpCircle;
  const isLastStep = currentStep === tutorial.steps.length - 1;
  const isFirstStep = currentStep === 0;

  // If step has a target, render tooltip
  if (step.target) {
    return (
      <>
        <TutorialHighlight target={step.target} offset={step.highlightOffset || 8} />
        <TutorialTooltip
          step={step}
          tutorial={tutorial}
          currentStep={currentStep}
          totalSteps={tutorial.steps.length}
          onNext={nextStep}
          onPrevious={previousStep}
          onSkip={skipTutorial}
          onClose={stopTutorial}
          Icon={Icon as any}
          isFirstStep={isFirstStep}
          isLastStep={isLastStep}
        />
      </>
    );
  }

  // Otherwise render centered modal
  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            skipTutorial();
          }
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-purple-500/30 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden"
        >
          {/* Header */}
          <div className="p-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center">
                  <Icon className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{step.title}</h3>
                  <p className="text-sm text-white/60">
                    Step {currentStep + 1} of {tutorial.steps.length}
                  </p>
                </div>
              </div>
              <button
                onClick={stopTutorial}
                className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                aria-label="Close tutorial"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            <p className="text-white/80 leading-relaxed">{step.content}</p>

            {step.points && step.points.length > 0 && (
              <div className="space-y-2">
                {step.points.map((point, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg"
                  >
                    <div className="w-6 h-6 rounded-full bg-purple-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <span className="text-xs font-bold text-purple-400">{idx + 1}</span>
                    </div>
                    <p className="text-sm text-white/70">{point}</p>
                  </div>
                ))}
              </div>
            )}

            {step.videoUrl && (
              <div className="rounded-lg overflow-hidden bg-slate-800">
                <video
                  src={step.videoUrl}
                  controls
                  className="w-full"
                  aria-label="Tutorial video"
                />
              </div>
            )}

            {/* Progress */}
            <div className="flex gap-1 pt-4">
              {tutorial.steps.map((_, idx) => (
                <div
                  key={idx}
                  className={`h-1 flex-1 rounded-full transition-colors ${
                    idx === currentStep
                      ? 'bg-purple-500'
                      : idx < currentStep
                        ? 'bg-purple-500/50'
                        : 'bg-slate-700'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-purple-500/20 flex items-center justify-between gap-3">
            <button
              onClick={skipTutorial}
              className="px-4 py-2 text-sm text-white/60 hover:text-white transition-colors flex items-center gap-2"
              aria-label="Skip tutorial"
            >
              <SkipForward className="w-4 h-4" />
              Skip
            </button>

            <div className="flex gap-2">
              {!isFirstStep && (
                <button
                  onClick={previousStep}
                  className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-colors flex items-center gap-2"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Previous
                </button>
              )}
              <button
                onClick={nextStep}
                className="px-4 py-3 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-xl font-semibold transition-colors flex items-center gap-2 min-w-[120px] justify-center"
                aria-label={isLastStep ? 'Finish tutorial' : 'Next step'}
              >
                {isLastStep ? 'Finish' : 'Next'}
                {!isLastStep && <ChevronRight className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
