import { AlertTriangle, X, Eye } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export interface SuspiciousActivity {
  activityType: string;
  description: string;
  timestamp: string;
  walletAddress: string;
  severity: string;
}

interface SecurityAlertProps {
  alerts: SuspiciousActivity[];
  onDismiss?: (activity: SuspiciousActivity) => void;
  onInvestigate?: (activity: SuspiciousActivity) => void;
  onViewLog?: () => void;
}

const severityStyles: Record<string, string> = {
  high: 'bg-red-500/20 text-red-300 border-red-500/40',
  medium: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/40',
  low: 'bg-blue-500/20 text-blue-300 border-blue-500/40',
};

export function SecurityAlert({ alerts, onDismiss, onInvestigate, onViewLog }: SecurityAlertProps) {
  if (!alerts.length) return null;

  return (
    <div className="space-y-3">
      <AnimatePresence>
        {alerts.map(alert => {
          const key = `${alert.walletAddress}-${alert.timestamp}-${alert.activityType}`;
          return (
            <motion.div
              key={key}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`p-4 rounded-xl border ${severityStyles[alert.severity] || severityStyles.medium}`}
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold text-sm uppercase tracking-wide text-white/80">
                        Suspicious activity detected
                      </p>
                      <p className="text-xs text-white/60">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-white/10 text-white/80 capitalize">
                      {alert.activityType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="bg-black/20 rounded-lg p-3 border border-white/5">
                    <p className="text-xs text-white/60 uppercase tracking-wide">Wallet</p>
                    <p className="font-mono text-sm text-white truncate">{alert.walletAddress}</p>
                  </div>

                  <p className="text-sm text-white/80 leading-relaxed">{alert.description}</p>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onInvestigate?.(alert)}
                      className="inline-flex items-center gap-2 px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-sm font-medium transition-colors"
                    >
                      <Eye className="w-4 h-4" />
                      Investigate
                    </button>
                    <button
                      onClick={() => onViewLog?.()}
                      className="text-sm text-white/60 hover:text-white/80 transition-colors"
                    >
                      View activity log
                    </button>
                  </div>
                </div>
                <button
                  onClick={() => onDismiss?.(alert)}
                  className="text-white/40 hover:text-white/70 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
