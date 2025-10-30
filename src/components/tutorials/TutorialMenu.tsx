import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, Play, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import { useTutorialStore } from '../../store/tutorialStore';

interface TutorialMenuProps {
  currentPage?: string;
  isOpen: boolean;
  onClose: () => void;
}

export function TutorialMenu({ currentPage, isOpen, onClose }: TutorialMenuProps) {
  const { tutorials, progress, startTutorial, resetTutorial, autoStart, setAutoStart } = useTutorialStore(state => ({
    tutorials: state.tutorials,
    progress: state.progress,
    startTutorial: state.startTutorial,
    resetTutorial: state.resetTutorial,
    autoStart: state.autoStart,
    setAutoStart: state.setAutoStart,
  }));

  const availableTutorials = tutorials.filter(tutorial => {
    if (currentPage && tutorial.requiredPages.length > 0) {
      if (!tutorial.requiredPages.includes(currentPage)) {
        return false;
      }
    }
    return true;
  });

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="bg-slate-900 border border-purple-500/20 rounded-2xl shadow-2xl w-full max-w-3xl overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 border-b border-purple-500/20 bg-gradient-to-r from-purple-500/10 to-blue-500/10">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen className="w-6 h-6" />
              Available Tutorials
            </h2>
            <p className="text-sm text-white/60 mt-1">
              Learn how to use Eclipse Market Pro with interactive guides
            </p>
          </div>

          <div className="p-6 space-y-3 max-h-[70vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 bg-slate-800/30 border border-purple-500/10 rounded-xl">
              <div>
                <p className="text-sm font-medium text-white/80">Auto-start tutorials</p>
                <p className="text-xs text-white/50">Launch relevant tours automatically when visiting pages</p>
              </div>
              <button
                onClick={() => setAutoStart(!autoStart)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition border ${
                  autoStart
                    ? 'bg-purple-600 border-purple-500 text-white shadow-lg shadow-purple-500/30'
                    : 'bg-slate-800 border-purple-500/20 text-white/70 hover:border-purple-500/40'
                }`}
                aria-pressed={autoStart}
              >
                {autoStart ? 'Enabled' : 'Disabled'}
              </button>
            </div>

            {availableTutorials.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-white/60">No tutorials available for this page.</p>
              </div>
            ) : (
              availableTutorials.map(tutorial => {
                const tutorialProgress = progress[tutorial.id];
                const isCompleted = tutorialProgress?.completed;
                const isSkipped = tutorialProgress?.skipped;

                return (
                  <div
                    key={tutorial.id}
                    className="p-4 bg-slate-800/30 hover:bg-slate-800/50 border border-purple-500/10 hover:border-purple-500/20 rounded-xl transition group"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">{tutorial.title}</h3>
                          {isCompleted && (
                            <CheckCircle2 className="w-5 h-5 text-green-400" title="Completed" />
                          )}
                          {isSkipped && (
                            <XCircle className="w-5 h-5 text-orange-400" title="Skipped" />
                          )}
                        </div>
                        <p className="text-sm text-white/60 mt-1">{tutorial.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded-md text-xs font-medium text-purple-300">
                            {tutorial.category}
                          </span>
                          <span className="text-xs text-white/50">
                            {tutorial.steps.length} steps
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 ml-4">
                        {(isCompleted || isSkipped) && (
                          <button
                            onClick={() => resetTutorial(tutorial.id)}
                            className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg transition"
                            title="Reset tutorial"
                            aria-label={`Reset ${tutorial.title}`}
                          >
                            <RotateCcw className="w-4 h-4" />
                          </button>
                        )}
                        <button
                          onClick={() => {
                            startTutorial(tutorial.id);
                            onClose();
                          }}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600 rounded-lg text-sm font-semibold transition"
                          aria-label={`Start ${tutorial.title}`}
                        >
                          <Play className="w-4 h-4" />
                          {isCompleted || isSkipped ? 'Restart' : 'Start'}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-6 border-t border-purple-500/20">
            <button
              onClick={onClose}
              className="w-full px-4 py-3 bg-slate-800/50 hover:bg-slate-800 rounded-xl text-sm font-medium transition"
            >
              Close
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
