import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, X, Shield, AlertOctagon } from 'lucide-react';
import { ConcentrationAlert } from '../../types/portfolio';

interface ConcentrationAlertsProps {
  alerts: ConcentrationAlert[];
  onDismiss?: (alertId: string) => void;
}

export function ConcentrationAlerts({ alerts, onDismiss }: ConcentrationAlertsProps) {
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set());

  const handleDismiss = (alertId: string) => {
    setDismissedIds(prev => new Set(prev).add(alertId));
    onDismiss?.(alertId);
  };

  const visibleAlerts = alerts.filter(alert => !dismissedIds.has(alert.id));

  if (visibleAlerts.length === 0) {
    return (
      <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
        <div className="flex items-center gap-2 mb-2">
          <Shield className="w-5 h-5 text-green-400" />
          <h2 className="text-xl font-semibold">Concentration Risk Alerts</h2>
        </div>
        <p className="text-gray-400 text-sm">
          No concentration risk alerts. Your portfolio is well-diversified!
        </p>
      </div>
    );
  }

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <AlertTriangle className="w-5 h-5 text-orange-400" />
        <h2 className="text-xl font-semibold">Concentration Risk Alerts</h2>
        <span className="ml-auto text-sm text-gray-400">
          {visibleAlerts.length} alert{visibleAlerts.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="space-y-3">
        <AnimatePresence>
          {visibleAlerts.map((alert, index) => {
            const isCritical = alert.severity === 'critical';
            const borderColor = isCritical ? 'border-red-500/50' : 'border-orange-500/50';
            const bgColor = isCritical
              ? 'bg-red-500/10 hover:bg-red-500/20'
              : 'bg-orange-500/10 hover:bg-orange-500/20';
            const iconColor = isCritical ? 'text-red-400' : 'text-orange-400';

            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: index * 0.05 }}
                className={`border ${borderColor} ${bgColor} rounded-lg p-4 transition-colors relative`}
              >
                <button
                  onClick={() => handleDismiss(alert.id)}
                  className="absolute top-2 right-2 p-1 rounded hover:bg-gray-700/50 transition-colors"
                  aria-label="Dismiss alert"
                >
                  <X className="w-4 h-4 text-gray-400" />
                </button>

                <div className="flex items-start gap-3 pr-8">
                  {isCritical ? (
                    <AlertOctagon className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                  ) : (
                    <AlertTriangle className={`w-5 h-5 ${iconColor} flex-shrink-0 mt-0.5`} />
                  )}

                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{alert.symbol}</span>
                      <span className="text-sm text-gray-400">
                        {alert.allocation.toFixed(1)}% allocation
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${
                          isCritical ? 'bg-red-500/20 text-red-300' : 'bg-orange-500/20 text-orange-300'
                        }`}
                      >
                        {isCritical ? 'CRITICAL' : 'WARNING'}
                      </span>
                    </div>

                    <p className="text-sm text-gray-300">{alert.message}</p>

                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span>Threshold: {alert.threshold.toFixed(0)}%</span>
                      <span>•</span>
                      <span>Created: {new Date(alert.createdAt).toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-3 border-t border-gray-700">
                  <div className="relative w-full h-2 bg-gray-700 rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(alert.allocation, 100)}%` }}
                      transition={{ delay: 0.2 + index * 0.05, duration: 0.5 }}
                      className={`h-full ${isCritical ? 'bg-red-500' : 'bg-orange-500'}`}
                    ></motion.div>
                    <div
                      className="absolute top-0 bottom-0 w-0.5 bg-white/50"
                      style={{ left: `${alert.threshold}%` }}
                    ></div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
