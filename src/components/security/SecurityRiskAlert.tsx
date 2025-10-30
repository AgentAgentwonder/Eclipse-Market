import { AlertTriangle, ShieldAlert, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { RiskLevel } from '../../types/audit';

interface SecurityRiskAlertProps {
  isOpen: boolean;
  onClose: () => void;
  onProceed?: () => void;
  riskLevel: RiskLevel;
  securityScore: number;
  findingsCount: number;
}

const titles: Record<RiskLevel, string> = {
  low: 'Low Risk Detected',
  medium: 'Moderate Risk Detected',
  high: 'High Risk Detected',
  critical: 'Critical Risk Detected',
};

const descriptions: Record<RiskLevel, string> = {
  low: 'This contract shows minor security warnings. Review before proceeding.',
  medium: 'This contract has several concerning findings. Proceed with caution.',
  high: 'Multiple high severity issues detected. We recommend avoiding interactions.',
  critical: 'Critical vulnerabilities detected. Interaction is strongly discouraged.',
};

const backdropColors: Record<RiskLevel, string> = {
  low: 'bg-blue-500/10 border-blue-500/30',
  medium: 'bg-yellow-500/10 border-yellow-500/30',
  high: 'bg-orange-500/10 border-orange-500/30',
  critical: 'bg-red-500/10 border-red-500/30',
};

const iconColors: Record<RiskLevel, string> = {
  low: 'text-blue-300',
  medium: 'text-yellow-300',
  high: 'text-orange-300',
  critical: 'text-red-300',
};

export function SecurityRiskAlert({
  isOpen,
  onClose,
  onProceed,
  riskLevel,
  securityScore,
  findingsCount,
}: SecurityRiskAlertProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className={`relative w-full max-w-md rounded-3xl border ${backdropColors[riskLevel]} p-6 shadow-2xl`}
          >
            <button
              onClick={onClose}
              className="absolute right-4 top-4 rounded-full p-2 text-white/60 hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <div className={`rounded-xl bg-black/20 p-3 ${iconColors[riskLevel]}`}>
                {riskLevel === 'critical' ? (
                  <ShieldAlert className="h-6 w-6" />
                ) : (
                  <AlertTriangle className="h-6 w-6" />
                )}
              </div>
              <div>
                <h3 className="text-xl font-bold text-white">{titles[riskLevel]}</h3>
                <p className="mt-1 text-sm text-white/70">{descriptions[riskLevel]}</p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl border border-white/10 bg-black/20 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-white/60">Security Score</span>
                <span className="text-lg font-semibold text-white">{securityScore}</span>
              </div>
              <div className="mt-3 flex items-center justify-between text-sm text-white/60">
                <span>Flagged Findings</span>
                <span className="font-semibold text-white">{findingsCount}</span>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm text-white/70">
              <p>
                High risk trades may result in loss of funds. Review the full audit report and
                consider avoiding interaction with this contract.
              </p>
              {riskLevel === 'critical' && (
                <p className="font-semibold text-red-300">
                  This contract is flagged as a potential honeypot. Do not proceed unless you fully
                  understand the risks.
                </p>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 rounded-xl bg-white/10 py-2 font-semibold text-white hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  onClose();
                  onProceed?.();
                }}
                className="flex-1 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 py-2 font-semibold text-white hover:from-purple-600 hover:to-pink-600"
              >
                Proceed Anyway
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
