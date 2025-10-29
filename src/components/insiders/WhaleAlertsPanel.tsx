import { motion } from 'framer-motion';
import { AlertTriangle, Bell, Loader2, ExternalLink, Shield } from 'lucide-react';
import { useWhaleAlerts } from '../../hooks/useSmartMoney';
import type { WhaleAlert } from '../../types/smartMoney';
import { formatDistance } from 'date-fns';

export function WhaleAlertsPanel() {
  const { alerts, loading, refresh } = useWhaleAlerts(30);

  const formatAmount = (amount: number) => {
    if (amount >= 1_000_000) return `$${(amount / 1_000_000).toFixed(2)}M`;
    if (amount >= 1_000) return `$${(amount / 1_000).toFixed(2)}K`;
    return `$${amount.toFixed(0)}`;
  };

  const shorten = (value: string) => `${value.slice(0, 6)}...${value.slice(-4)}`;

  const renderAlert = (alert: WhaleAlert) => (
    <motion.div
      key={alert.id}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 rounded-xl bg-slate-800/40 border border-purple-500/20 hover:border-purple-500/40 transition-colors"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-yellow-400" />
          <span className="text-sm text-gray-400">
            {formatDistance(new Date(alert.timestamp), new Date(), { addSuffix: true })}
          </span>
        </div>
        <span className="text-xs px-2 py-1 rounded-full bg-yellow-500/20 text-yellow-300">
          Threshold ${alert.threshold.toLocaleString()}
        </span>
      </div>

      <div className="flex items-start gap-4">
        <div className="p-2 rounded-lg bg-yellow-500/10">
          <Shield className="w-5 h-5 text-yellow-400" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <p className="font-semibold text-sm">
              {alert.wallet_label || shorten(alert.wallet_address)}
            </p>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                alert.action_type === 'buy'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-300'
              }`}
            >
              {alert.action_type.toUpperCase()}
            </span>
          </div>
          <p className="text-sm text-gray-300 mb-2">
            {formatAmount(alert.amount_usd)} {alert.token_symbol ? `in ${alert.token_symbol}` : ''}
          </p>
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Tx: {shorten(alert.tx_signature)}</span>
            <button
              onClick={() => window.open(`https://solscan.io/tx/${alert.tx_signature}`, '_blank')}
              className="flex items-center gap-2 text-purple-400 hover:text-purple-300"
            >
              View
              <ExternalLink className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );

  return (
    <div className="bg-slate-800/50 rounded-xl border border-purple-500/20">
      <div className="px-6 py-4 border-b border-purple-500/20 flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-yellow-400" />
          Whale Alerts
        </h3>
        <button
          onClick={refresh}
          className="text-sm text-purple-400 hover:text-purple-300 transition-colors"
        >
          Refresh
        </button>
      </div>

      <div className="p-6 space-y-4">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-yellow-400" />
          </div>
        ) : alerts.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>No whale activity detected recently</p>
            <p className="text-sm mt-2">Whale alerts will appear here when thresholds are breached</p>
          </div>
        ) : (
          alerts.map(renderAlert)
        )}
      </div>
    </div>
  );
}
