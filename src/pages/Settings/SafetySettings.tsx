import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  Clock,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Save,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  Info,
} from 'lucide-react';
import { useSafetyStore } from '../../store/safetyStore';
import type { SafetyPolicy } from '../../types/safety';

export function SafetySettings() {
  const { policy: storedPolicy, fetchPolicy, updatePolicy, loading, error } = useSafetyStore();
  const [policy, setPolicy] = useState<SafetyPolicy | null>(null);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    fetchPolicy();
  }, [fetchPolicy]);

  useEffect(() => {
    if (storedPolicy) {
      setPolicy(storedPolicy);
    }
  }, [storedPolicy]);

  const handleSave = async () => {
    if (!policy) return;
    
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updatePolicy(policy);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save safety settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleReset = () => {
    if (storedPolicy) {
      setPolicy(storedPolicy);
    }
  };

  const updateField = <K extends keyof SafetyPolicy>(
    field: K,
    value: SafetyPolicy[K]
  ) => {
    if (!policy) return;
    setPolicy({ ...policy, [field]: value });
  };

  if (!policy) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
          <p className="text-white/60">Loading safety settings...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Safety Mode Engine</h2>
        <p className="text-white/60">
          Configure mistake protection, cooldowns, and transaction safety policies
        </p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-semibold mb-1">Error</p>
            <p className="text-red-400/80 text-sm">{error}</p>
          </div>
        </motion.div>
      )}

      {saveSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-400" />
          <p className="text-green-400 font-semibold">Settings saved successfully</p>
        </motion.div>
      )}

      {/* Master Switch */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Shield className="w-6 h-6 text-purple-400 mt-1" />
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Enable Safety Mode</h3>
              <p className="text-sm text-white/60">
                Master switch for all safety features and trade protections
              </p>
            </div>
          </div>
          <label className="relative inline-block w-14 h-8">
            <input
              type="checkbox"
              checked={policy.enabled}
              onChange={e => updateField('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-14 h-8 bg-slate-600 rounded-full peer peer-checked:bg-purple-500 transition-colors cursor-pointer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-transform" />
          </label>
        </div>
      </div>

      {/* Cooldown Settings */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 space-y-4">
        <div className="flex items-start gap-3">
          <Clock className="w-6 h-6 text-purple-400 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">Trade Cooldown</h3>
            <p className="text-sm text-white/60 mb-4">
              Prevent rapid-fire trading mistakes with mandatory cooldown periods
            </p>

            <div className="flex items-center gap-4 mb-4">
              <label className="relative inline-block w-14 h-8">
                <input
                  type="checkbox"
                  checked={policy.cooldown_enabled}
                  onChange={e => updateField('cooldown_enabled', e.target.checked)}
                  disabled={!policy.enabled}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-slate-600 rounded-full peer peer-checked:bg-purple-500 transition-colors cursor-pointer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-transform peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
              </label>
              <span className="text-sm text-white/70">Enable cooldown period</span>
            </div>

            {policy.cooldown_enabled && (
              <div className="space-y-2">
                <label className="block text-sm text-white/70">Cooldown duration (seconds)</label>
                <input
                  type="number"
                  value={policy.cooldown_seconds}
                  onChange={e => updateField('cooldown_seconds', parseInt(e.target.value) || 0)}
                  disabled={!policy.enabled}
                  min="0"
                  max="300"
                  className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
                <p className="text-xs text-white/40">
                  Recommended: 15-60 seconds between trades
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Trade Limits */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 space-y-4">
        <div className="flex items-start gap-3">
          <DollarSign className="w-6 h-6 text-purple-400 mt-1" />
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Trade Limits</h3>
              <p className="text-sm text-white/60">
                Set maximum trade amounts and daily trade frequency
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-white/70">
                Maximum trade amount (USD)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={policy.max_trade_amount_usd || ''}
                  onChange={e =>
                    updateField(
                      'max_trade_amount_usd',
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  disabled={!policy.enabled}
                  placeholder="No limit"
                  min="0"
                  className="flex-1 bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
                <button
                  onClick={() => updateField('max_trade_amount_usd', null)}
                  disabled={!policy.enabled}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white/70 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-white/70">
                Maximum daily trades
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={policy.max_daily_trades || ''}
                  onChange={e =>
                    updateField(
                      'max_daily_trades',
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  disabled={!policy.enabled}
                  placeholder="No limit"
                  min="0"
                  className="flex-1 bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
                <button
                  onClick={() => updateField('max_daily_trades', null)}
                  disabled={!policy.enabled}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white/70 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Risk Management */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 space-y-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-6 h-6 text-purple-400 mt-1" />
          <div className="flex-1 space-y-4">
            <div>
              <h3 className="text-lg font-semibold text-white mb-1">Risk Management</h3>
              <p className="text-sm text-white/60">
                Configure thresholds for price impact and token security
              </p>
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-white/70">
                Maximum price impact (%)
              </label>
              <input
                type="number"
                value={policy.max_price_impact_percent}
                onChange={e =>
                  updateField('max_price_impact_percent', parseFloat(e.target.value) || 0)
                }
                disabled={!policy.enabled}
                min="0"
                max="100"
                step="0.1"
                className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white disabled:opacity-50"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-sm text-white/70">
                Maximum slippage (%)
              </label>
              <input
                type="number"
                value={policy.max_slippage_percent}
                onChange={e =>
                  updateField('max_slippage_percent', parseFloat(e.target.value) || 0)
                }
                disabled={!policy.enabled}
                min="0"
                max="100"
                step="0.1"
                className="w-full bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white disabled:opacity-50"
              />
            </div>

            <div className="flex items-center gap-4 p-3 bg-slate-700/50 rounded-lg">
              <input
                type="checkbox"
                id="block-high-risk"
                checked={policy.block_high_risk}
                onChange={e => updateField('block_high_risk', e.target.checked)}
                disabled={!policy.enabled}
                className="w-4 h-4 rounded border-purple-500/30 text-purple-500 focus:ring-purple-500 focus:ring-offset-0 disabled:opacity-50"
              />
              <div className="flex-1">
                <label htmlFor="block-high-risk" className="text-sm font-medium text-white cursor-pointer">
                  Block high-risk tokens
                </label>
                {policy.block_high_risk && (
                  <div className="mt-2 space-y-2">
                    <label className="block text-xs text-white/60">
                      Security score threshold
                    </label>
                    <input
                      type="number"
                      value={policy.high_risk_threshold}
                      onChange={e =>
                        updateField('high_risk_threshold', parseFloat(e.target.value) || 0)
                      }
                      disabled={!policy.enabled}
                      min="0"
                      max="100"
                      className="w-full bg-slate-700/50 border border-purple-500/20 rounded px-3 py-1.5 text-sm text-white disabled:opacity-50"
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Transaction Simulation */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20">
        <div className="flex items-start gap-3">
          <TrendingUp className="w-6 h-6 text-purple-400 mt-1" />
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white mb-1">Transaction Simulation</h3>
                <p className="text-sm text-white/60">
                  Preview trade outcomes before execution
                </p>
              </div>
              <label className="relative inline-block w-14 h-8">
                <input
                  type="checkbox"
                  checked={policy.require_simulation}
                  onChange={e => updateField('require_simulation', e.target.checked)}
                  disabled={!policy.enabled}
                  className="sr-only peer"
                />
                <div className="w-14 h-8 bg-slate-600 rounded-full peer peer-checked:bg-purple-500 transition-colors cursor-pointer peer-checked:after:translate-x-6 after:content-[''] after:absolute after:top-1 after:left-1 after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-transform peer-disabled:opacity-50 peer-disabled:cursor-not-allowed" />
              </label>
            </div>

            <div className="flex items-start gap-2 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <Info className="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-blue-300">
                Simulations provide estimates for output amounts, price impact, MEV risk, and success probability
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Insurance Settings */}
      <div className="bg-slate-800/50 rounded-xl p-6 border border-purple-500/20 space-y-4">
        <div className="flex items-start gap-3">
          <Shield className="w-6 h-6 text-purple-400 mt-1" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-white mb-1">Insurance Protection</h3>
            <p className="text-sm text-white/60 mb-4">
              Optional insurance coverage for large trades
            </p>

            <div className="space-y-2">
              <label className="block text-sm text-white/70">
                Require insurance above (USD)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={policy.require_insurance_above_usd || ''}
                  onChange={e =>
                    updateField(
                      'require_insurance_above_usd',
                      e.target.value ? parseFloat(e.target.value) : null
                    )
                  }
                  disabled={!policy.enabled}
                  placeholder="Never require"
                  min="0"
                  className="flex-1 bg-slate-700/50 border border-purple-500/20 rounded-lg px-4 py-2 text-white disabled:opacity-50"
                />
                <button
                  onClick={() => updateField('require_insurance_above_usd', null)}
                  disabled={!policy.enabled}
                  className="px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm text-white/70 disabled:opacity-50"
                >
                  Clear
                </button>
              </div>
              <p className="text-xs text-white/40">
                Insurance will be recommended (not required) for trades above this amount
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/30 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? (
            <>
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              Save Settings
            </>
          )}
        </button>
        <button
          onClick={handleReset}
          disabled={saving || loading}
          className="px-6 py-3 bg-slate-700/50 hover:bg-slate-700 rounded-xl font-semibold text-white/70 hover:text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
