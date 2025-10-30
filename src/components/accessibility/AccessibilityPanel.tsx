import { motion } from 'framer-motion';
import { Eye, Zap, Volume2, Keyboard, Maximize2, RefreshCw } from 'lucide-react';
import { useAccessibilityStore } from '../../store/accessibilityStore';

export function AccessibilityPanel() {
  const {
    fontScale,
    highContrastMode,
    reducedMotion,
    screenReaderOptimizations,
    keyboardNavigationHints,
    focusIndicatorEnhanced,
    setFontScale,
    toggleHighContrast,
    toggleReducedMotion,
    toggleScreenReaderOptimizations,
    toggleKeyboardNavigationHints,
    toggleFocusIndicatorEnhanced,
    resetToDefaults,
  } = useAccessibilityStore();

  return (
    <div className="space-y-6">
      {/* Font Scaling */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Maximize2 className="w-5 h-5 text-purple-400" aria-hidden="true" />
          <h3 className="text-lg font-semibold">Font Size</h3>
        </div>
        <p className="text-sm text-white/60 mb-4">
          Adjust font scaling from 100% to 200% for better readability.
        </p>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <label htmlFor="font-scale-slider" className="text-sm font-medium min-w-[60px]">
              {Math.round(fontScale * 100)}%
            </label>
            <input
              id="font-scale-slider"
              type="range"
              min="1.0"
              max="2.0"
              step="0.1"
              value={fontScale}
              onChange={e => setFontScale(parseFloat(e.target.value))}
              className="flex-1 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
              aria-label="Font scale percentage"
              aria-valuemin={100}
              aria-valuemax={200}
              aria-valuenow={Math.round(fontScale * 100)}
            />
          </div>
          <div className="flex justify-between text-xs text-white/40">
            <span>100%</span>
            <span>150%</span>
            <span>200%</span>
          </div>
        </div>
      </div>

      {/* High Contrast Mode */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-purple-400" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold">High Contrast Mode</h3>
              <p className="text-sm text-white/60 mt-1">
                Increase contrast for better visibility and reduced eye strain.
              </p>
            </div>
          </div>
          <button
            onClick={toggleHighContrast}
            className={`relative w-14 h-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              highContrastMode ? 'bg-purple-500' : 'bg-slate-700'
            }`}
            role="switch"
            aria-checked={highContrastMode}
            aria-label="Toggle high contrast mode"
          >
            <motion.div
              animate={{ x: highContrastMode ? 24 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
            />
          </button>
        </div>
      </div>

      {/* Reduced Motion */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-purple-400" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold">Reduced Motion</h3>
              <p className="text-sm text-white/60 mt-1">
                Minimize animations and transitions for users sensitive to motion.
              </p>
            </div>
          </div>
          <button
            onClick={toggleReducedMotion}
            className={`relative w-14 h-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              reducedMotion ? 'bg-purple-500' : 'bg-slate-700'
            }`}
            role="switch"
            aria-checked={reducedMotion}
            aria-label="Toggle reduced motion"
          >
            <motion.div
              animate={{ x: reducedMotion ? 24 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
            />
          </button>
        </div>
      </div>

      {/* Screen Reader Optimizations */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Volume2 className="w-5 h-5 text-purple-400" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold">Screen Reader Support</h3>
              <p className="text-sm text-white/60 mt-1">
                Enhanced ARIA labels and descriptions for screen reader users.
              </p>
            </div>
          </div>
          <button
            onClick={toggleScreenReaderOptimizations}
            className={`relative w-14 h-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              screenReaderOptimizations ? 'bg-purple-500' : 'bg-slate-700'
            }`}
            role="switch"
            aria-checked={screenReaderOptimizations}
            aria-label="Toggle screen reader optimizations"
          >
            <motion.div
              animate={{ x: screenReaderOptimizations ? 24 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
            />
          </button>
        </div>
      </div>

      {/* Keyboard Navigation Hints */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Keyboard className="w-5 h-5 text-purple-400" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold">Keyboard Navigation Hints</h3>
              <p className="text-sm text-white/60 mt-1">
                Display keyboard shortcuts and navigation hints.
              </p>
            </div>
          </div>
          <button
            onClick={toggleKeyboardNavigationHints}
            className={`relative w-14 h-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              keyboardNavigationHints ? 'bg-purple-500' : 'bg-slate-700'
            }`}
            role="switch"
            aria-checked={keyboardNavigationHints}
            aria-label="Toggle keyboard navigation hints"
          >
            <motion.div
              animate={{ x: keyboardNavigationHints ? 24 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
            />
          </button>
        </div>
      </div>

      {/* Enhanced Focus Indicators */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Eye className="w-5 h-5 text-purple-400" aria-hidden="true" />
            <div>
              <h3 className="text-lg font-semibold">Enhanced Focus Indicators</h3>
              <p className="text-sm text-white/60 mt-1">
                Make focus indicators more visible for keyboard navigation.
              </p>
            </div>
          </div>
          <button
            onClick={toggleFocusIndicatorEnhanced}
            className={`relative w-14 h-8 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-slate-900 ${
              focusIndicatorEnhanced ? 'bg-purple-500' : 'bg-slate-700'
            }`}
            role="switch"
            aria-checked={focusIndicatorEnhanced}
            aria-label="Toggle enhanced focus indicators"
          >
            <motion.div
              animate={{ x: focusIndicatorEnhanced ? 24 : 2 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              className="absolute top-1 w-6 h-6 bg-white rounded-full shadow-lg"
            />
          </button>
        </div>
      </div>

      {/* Reset Button */}
      <div className="flex justify-end">
        <motion.button
          onClick={resetToDefaults}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="px-6 py-3 bg-slate-800/50 hover:bg-slate-800/70 border border-purple-500/20 rounded-xl font-semibold flex items-center gap-2"
          aria-label="Reset accessibility settings to defaults"
        >
          <RefreshCw className="w-5 h-5" />
          Reset to Defaults
        </motion.button>
      </div>

      {/* Accessibility Info */}
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-6">
        <h4 className="font-semibold text-blue-400 mb-2">Additional Accessibility Features</h4>
        <ul className="space-y-2 text-sm text-white/60">
          <li>• All interactive elements support keyboard navigation (Tab, Enter, Space)</li>
          <li>• ARIA labels provide context for screen readers throughout the app</li>
          <li>• Alt text is provided for all meaningful images and icons</li>
          <li>• Color is never used as the only means of conveying information</li>
          <li>• Form fields have associated labels and error messages</li>
        </ul>
      </div>
    </div>
  );
}
