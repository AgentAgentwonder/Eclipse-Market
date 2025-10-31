import { motion } from 'framer-motion';
import { AlertTriangle, ShieldAlert, Zap } from 'lucide-react';
import type { EarlyWarning } from './LaunchPredictorPanel';
import { getColorStyle } from './colorStyles';

interface EarlyWarningsProps {
  warnings: EarlyWarning[];
  getRiskColor: (riskLevel: string) => string;
}

const severityIcons: Record<string, JSX.Element> = {
  Low: <ShieldAlert className="w-5 h-5" />,
  Medium: <AlertTriangle className="w-5 h-5" />,
  High: <AlertTriangle className="w-5 h-5" />,
  Critical: <Zap className="w-5 h-5" />,
};

export function EarlyWarnings({ warnings, getRiskColor }: EarlyWarningsProps) {
  if (!warnings.length) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-900/60 border border-emerald-500/20 rounded-3xl p-6"
      >
        <div className="flex items-center gap-2 text-emerald-300">
          <ShieldAlert className="w-5 h-5" />
          <span className="text-sm font-medium">No early warnings triggered</span>
        </div>
        <p className="text-xs text-slate-400 mt-3">
          Launch momentum, developer trust, and liquidity signals are all operating inside expected success bounds.
        </p>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.2 }}
      className="bg-slate-900/60 border border-purple-500/20 rounded-3xl p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <AlertTriangle className="w-6 h-6 text-amber-400" />
        <h3 className="text-xl font-semibold">Early Warnings</h3>
      </div>

      <div className="space-y-4">
        {warnings.map((warning, idx) => {
          const tone = getRiskColor(warning.severity);
          const colorStyles = getColorStyle(tone);
          return (
            <motion.div
              key={`${warning.warningType}-${idx}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 * idx }}
              className={`p-4 rounded-2xl backdrop-blur ${colorStyles.badgeBorder} ${colorStyles.badgeBg}`}
            >
              <div className="flex items-center justify-between">
                <div className={`${colorStyles.text.replace('text-', 'text-')} flex items-center gap-2 font-medium text-sm`}>
                  {severityIcons[warning.severity]}
                  <span className="uppercase text-xs tracking-wider">{warning.severity} Severity</span>
                </div>
                <span className="text-xs text-slate-400">
                  {new Date(warning.detectedAt).toLocaleString()}
                </span>
              </div>
              <div className="mt-3 text-sm text-white">{warning.message}</div>
              <div className="text-xs text-slate-400 mt-2">Signal: {warning.warningType}</div>
            </motion.div>
          );
        })}
      </div>
      <p className="text-xs text-slate-500 mt-4">
        Warnings are generated when developer history, liquidity backing, or marketing signals deviate from successful launch baselines. Use the Watchlist Integration panel to monitor alerts over time.
      </p>
    </motion.div>
  );
}
