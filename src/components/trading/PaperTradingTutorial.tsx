import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, TrendingUp, BarChart3, RotateCcw, Settings, X } from 'lucide-react';
import { usePaperTradingStore } from '../../store/paperTradingStore';

export function PaperTradingTutorial() {
  const { isPaperMode, hasSeenTutorial, setHasSeenTutorial } = usePaperTradingStore();
  const [showTutorial, setShowTutorial] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isPaperMode && !hasSeenTutorial) {
      setShowTutorial(true);
    }
  }, [isPaperMode, hasSeenTutorial]);

  const handleClose = () => {
    setShowTutorial(false);
    setHasSeenTutorial(true);
    setCurrentStep(0);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleClose();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const steps = [
    {
      icon: FileText,
      title: 'Welcome to Paper Trading',
      description:
        'Practice trading strategies with $10,000 virtual balance. No real money is at risk.',
      points: [
        'Learn trading strategies safely',
        'Track your performance metrics',
        'Test new ideas without risk',
        'Switch to live trading anytime',
      ],
    },
    {
      icon: TrendingUp,
      title: 'How Paper Trading Works',
      description: 'All trades are simulated with realistic pricing and fees.',
      points: [
        'Trades execute at current market prices',
        'Fees and slippage are simulated',
        'Virtual balance updates in real-time',
        'Positions are tracked like real trades',
      ],
    },
    {
      icon: BarChart3,
      title: 'Track Your Performance',
      description: 'View your paper trading dashboard to see detailed analytics.',
      points: [
        'Total P&L and balance over time',
        'Win rate and trade statistics',
        'Best and worst performing trades',
        'Open positions and history',
      ],
    },
    {
      icon: Settings,
      title: 'Ready to Go Live?',
      description: "When you're ready to trade with real money, switch modes in Settings.",
      points: [
        'Go to Settings > Trading Execution',
        'Toggle off Paper Trading Mode',
        'Confirm you understand real trades',
        'Start trading with real money',
      ],
    },
  ];

  const step = steps[currentStep];

  return (
    <AnimatePresence>
      {showTutorial && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={handleClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-lg"
          >
            <div className="bg-slate-900 border border-orange-500/30 rounded-2xl shadow-2xl overflow-hidden">
              {/* Header */}
              <div className="p-6 border-b border-orange-500/20 bg-gradient-to-r from-orange-500/10 to-yellow-500/10">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-yellow-500 flex items-center justify-center">
                      <step.icon className="w-6 h-6" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold">{step.title}</h3>
                      <p className="text-sm text-white/60">
                        Step {currentStep + 1} of {steps.length}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleClose}
                    className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4">
                <p className="text-white/80">{step.description}</p>

                <div className="space-y-2">
                  {step.points.map((point, idx) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 bg-slate-800/50 rounded-lg"
                    >
                      <div className="w-6 h-6 rounded-full bg-orange-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <span className="text-xs font-bold text-orange-400">{idx + 1}</span>
                      </div>
                      <p className="text-sm text-white/70">{point}</p>
                    </div>
                  ))}
                </div>

                {/* Progress */}
                <div className="flex gap-1 pt-4">
                  {steps.map((_, idx) => (
                    <div
                      key={idx}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        idx === currentStep
                          ? 'bg-orange-500'
                          : idx < currentStep
                            ? 'bg-orange-500/50'
                            : 'bg-slate-700'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Footer */}
              <div className="p-6 border-t border-orange-500/20 flex gap-3">
                {currentStep > 0 && (
                  <button
                    onClick={handlePrevious}
                    className="px-4 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-colors"
                  >
                    Previous
                  </button>
                )}
                <button
                  onClick={handleNext}
                  className="flex-1 px-4 py-3 bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600 rounded-xl font-semibold transition-colors"
                >
                  {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
