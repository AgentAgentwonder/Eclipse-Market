import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, Shield, Zap, CheckCircle, XCircle, ShieldAlert } from 'lucide-react';
import { useState, useEffect } from 'react';
import { useTradingSettingsStore } from '../store/tradingSettingsStore';
import { useSecurityAudit } from '../hooks/useSecurityAudit';
import { SecurityScoreBadge } from './security/SecurityScoreBadge';
import { SecurityRiskAlert } from './security/SecurityRiskAlert';
import type { QuoteResult } from '../hooks/useJupiter';

interface TradeConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  quote: QuoteResult;
  fromToken: { symbol: string; decimals: number; mint?: string };
  toToken: { symbol: string; decimals: number; mint?: string };
  amount: string;
  loading?: boolean;
}

export function TradeConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  quote,
  fromToken,
  toToken,
  amount,
  loading = false,
}: TradeConfirmationModalProps) {
  const { slippage, mevProtection, gasOptimization, shouldBlockTrade, getPriorityFeeForPreset } =
    useTradingSettingsStore();

  const [showSecurityAlert, setShowSecurityAlert] = useState(false);
  const [securityApproved, setSecurityApproved] = useState(false);

  // Scan the destination token for security risks
  const { audit: toTokenAudit, loading: auditLoading } = useSecurityAudit({
    contractAddress: isOpen ? toToken.mint : undefined,
    autoFetch: isOpen && Boolean(toToken.mint),
  });

  const priceImpact = quote.route.priceImpactPct;
  const slippageBps = quote.quote.slippageBps || slippage.tolerance;
  const slippagePercent = slippageBps / 100;

  const isBlocked = shouldBlockTrade(priceImpact, slippageBps);
  const isHighImpact = priceImpact > 5;
  const isHighSlippage = slippagePercent > 1;

  // Security check - block high/critical risk tokens unless approved
  const hasSecurityRisk = toTokenAudit && (toTokenAudit.riskLevel === 'high' || toTokenAudit.riskLevel === 'critical');
  const isBlockedBySecurity = hasSecurityRisk && !securityApproved;

  // Reset security approval when modal closes
  useEffect(() => {
    if (!isOpen) {
      setSecurityApproved(false);
      setShowSecurityAlert(false);
    }
  }, [isOpen]);

  const handleConfirm = () => {
    if (isBlockedBySecurity) {
      setShowSecurityAlert(true);
      return;
    }
    onConfirm();
  };

  const priorityFeeConfig = getPriorityFeeForPreset(gasOptimization.priorityFeePreset);
  const estimatedGasCost = (priorityFeeConfig.microLamports / 1e9).toFixed(6);

  const formatAmount = (value: string, decimals: number): string => {
    const num = parseFloat(value) / Math.pow(10, decimals);
    return num.toFixed(Math.min(decimals, 6));
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none"
          >
            <div
              className="bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-purple-500/20 shadow-2xl max-w-lg w-full pointer-events-auto overflow-hidden"
              onClick={e => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-4 border-b border-purple-500/20 flex items-center justify-between">
                <h2 className="text-2xl font-bold">Confirm Swap</h2>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-4 max-h-[70vh] overflow-y-auto">
                {/* Blocked Warning */}
                {isBlocked && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
                  >
                    <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-red-400 font-semibold mb-1">Trade Blocked</p>
                      <p className="text-red-400/80 text-sm">
                        This trade exceeds your maximum slippage tolerance of{' '}
                        {slippage.maxTolerance / 100}%. Adjust your settings or try a smaller
                        amount.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* High Impact Warning */}
                {!isBlocked && isHighImpact && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-xl flex items-start gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-yellow-400 font-semibold mb-1">High Price Impact</p>
                      <p className="text-yellow-400/80 text-sm">
                        This trade has a price impact of {priceImpact.toFixed(2)}%. Consider trading
                        a smaller amount to reduce slippage.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* High Slippage Warning */}
                {!isBlocked && isHighSlippage && (
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="p-4 bg-orange-500/10 border border-orange-500/30 rounded-xl flex items-start gap-3"
                  >
                    <AlertTriangle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-orange-400 font-semibold mb-1">High Slippage Tolerance</p>
                      <p className="text-orange-400/80 text-sm">
                        Your slippage tolerance is set to {slippagePercent.toFixed(2)}%. You may
                        receive significantly less than expected.
                      </p>
                    </div>
                  </motion.div>
                )}

                {/* Security Check */}
                <div className="space-y-3 rounded-xl border border-purple-500/20 bg-slate-900/50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-white/70">Contract Security</div>
                      <div className="text-xs text-white/40">
                        {toToken.mint ? `${toToken.mint.slice(0, 4)}...${toToken.mint.slice(-4)}` : 'Unknown contract'}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      {auditLoading && (
                        <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
                      )}
                      {toTokenAudit && !auditLoading && (
                        <SecurityScoreBadge
                          score={toTokenAudit.securityScore}
                          riskLevel={toTokenAudit.riskLevel}
                          size="sm"
                        />
                      )}
                    </div>
                  </div>

                  {toTokenAudit ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-sm text-white/70">
                        <ShieldAlert className="h-4 w-4 text-purple-300" />
                        <span>
                          {toTokenAudit.findings.length > 0
                            ? `${toTokenAudit.findings.length} finding${toTokenAudit.findings.length === 1 ? '' : 's'} flagged`
                            : 'No critical findings detected'}
                        </span>
                      </div>
                      {hasSecurityRisk ? (
                        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">
                          High risk security rating detected for {toToken.symbol}. Review the findings before proceeding.
                        </div>
                      ) : (
                        <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-3 text-sm text-emerald-200">
                          Security checks completed. No high risk indicators present.
                        </div>
                      )}
                      {toTokenAudit.findings.length > 0 && (
                        <button
                          onClick={() => {
                            setShowSecurityAlert(true);
                          }}
                          className="w-full rounded-lg bg-white/10 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/20"
                        >
                          Review Findings
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-sm text-white/50">
                      {auditLoading
                        ? 'Scanning contract for vulnerabilities...'
                        : 'Security data unavailable for this contract.'}
                    </div>
                  )}
                </div>

                {/* Trade Details */}
                <div className="space-y-3 p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex justify-between">
                    <span className="text-white/60">You Pay</span>
                    <span className="font-semibold">
                      {amount} {fromToken.symbol}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">You Receive (Est.)</span>
                    <span className="font-semibold">
                      {formatAmount(quote.quote.outputAmount, toToken.decimals)} {toToken.symbol}
                    </span>
                  </div>
                  <div className="h-px bg-purple-500/20" />
                  <div className="flex justify-between">
                    <span className="text-white/60">Price Impact</span>
                    <span className={priceImpact > 5 ? 'text-red-400 font-semibold' : 'text-white'}>
                      {priceImpact.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Slippage Tolerance</span>
                    <span className="text-white">{slippagePercent.toFixed(2)}%</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Minimum Received</span>
                    <span className="text-white">
                      {formatAmount(quote.quote.otherAmountThreshold, toToken.decimals)}{' '}
                      {toToken.symbol}
                    </span>
                  </div>
                </div>

                {/* MEV Protection */}
                {mevProtection.enabled && (
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-start gap-3">
                    <Shield className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-green-400 font-semibold mb-1">MEV Protection Active</p>
                      <p className="text-green-400/80 text-sm">
                        {mevProtection.useJito && 'Using Jito bundle submission'}
                        {mevProtection.useJito && mevProtection.usePrivateRPC && ' & '}
                        {mevProtection.usePrivateRPC && 'Private RPC endpoint'}
                      </p>
                    </div>
                  </div>
                )}

                {/* Gas Optimization */}
                <div className="p-4 bg-slate-900/50 rounded-xl space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Zap className="w-4 h-4 text-purple-400" />
                      <span className="text-white/60 text-sm">Priority Fee</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold capitalize">
                        {gasOptimization.priorityFeePreset}
                      </div>
                      <div className="text-xs text-white/40">
                        ~{priorityFeeConfig.estimatedConfirmationTime}
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-white/60">Estimated Gas Cost</span>
                    <span className="text-white">{estimatedGasCost} SOL</span>
                  </div>
                </div>

                {/* Route Info */}
                {quote.route.hops.length > 0 && (
                  <div className="p-4 bg-slate-900/50 rounded-xl">
                    <div className="text-sm text-white/60 mb-2">Route</div>
                    <div className="flex flex-wrap gap-2">
                      {quote.route.hops.map((hop, idx) => (
                        <div
                          key={idx}
                          className="px-3 py-1 bg-purple-500/20 border border-purple-500/30 rounded-lg text-sm"
                        >
                          {hop.dex || 'Unknown DEX'}
                          {hop.percent < 100 && (
                            <span className="text-white/60 ml-1">({hop.percent.toFixed(0)}%)</span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="px-6 py-4 border-t border-purple-500/20 flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirm}
                  disabled={loading || isBlocked}
                  className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Confirming...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Confirm Swap
                    </>
                  )}
                </button>
              </div>

              {isBlockedBySecurity && toTokenAudit && (
                <div className="px-6 pb-4 text-xs text-red-300">
                  Security review required — {toToken.symbol} is flagged as {toTokenAudit.riskLevel} risk.
                </div>
              )}
            </div>
          </motion.div>

          {/* Security Risk Alert Modal */}
          {toTokenAudit && (
            <SecurityRiskAlert
              isOpen={showSecurityAlert}
              onClose={() => setShowSecurityAlert(false)}
              onProceed={() => {
                setSecurityApproved(true);
                setShowSecurityAlert(false);
                // Automatically proceed after approval
                onConfirm();
              }}
              riskLevel={toTokenAudit.riskLevel}
              securityScore={toTokenAudit.securityScore}
              findingsCount={toTokenAudit.findings.length}
            />
          )}
        </>
      )}
    </AnimatePresence>
  );
}
