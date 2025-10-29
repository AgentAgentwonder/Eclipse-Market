import { motion } from 'framer-motion';
import { AlertTriangle, CheckCircle2, CircleDot } from 'lucide-react';
import { useTokenFlowContext } from '../../contexts/TokenFlowContext';

const severityColors: Record<string, string> = {
  low: 'bg-slate-600/30 text-slate-200',
  medium: 'bg-yellow-500/20 text-yellow-200',
  high: 'bg-orange-500/20 text-orange-200',
  critical: 'bg-red-500/20 text-red-200',
};

const severityLabels: Record<string, string> = {
  low: 'Low',
  medium: 'Medium',
  high: 'High',
  critical: 'Critical',
};

export default function FlowAlerts() {
  const { analysis, loading } = useTokenFlowContext();

  if (loading) {
    return <div className="text-center text-gray-400">Loading alerts...</div>;
  }

  if (!analysis) {
    return null;
  }

  const alerts = [...analysis.alerts].sort((a, b) => b.timestamp - a.timestamp);

  return (
    <div className="space-y-4">
      {alerts.map((alert, index) => (
        <motion.div
          key={alert.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6"
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-xl bg-gradient-to-br from-purple-500/40 to-pink-500/40`}> 
                {alert.alertType === 'wash_trading' || alert.alertType === 'circular_flow' ? (
                  <AlertTriangle className="w-5 h-5 text-pink-200" />
                ) : (
                  <CircleDot className="w-5 h-5 text-purple-200" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-1">{alert.title}</h3>
                <p className="text-sm text-gray-400 mb-2">{alert.description}</p>
                <div className="flex flex-wrap gap-2 text-xs text-gray-400">
                  {alert.wallets.length > 0 && (
                    <span className="px-3 py-1 bg-white/5 rounded-full">
                      {alert.wallets.length} wallets
                    </span>
                  )}
                  {alert.tokenAddress && (
                    <span className="px-3 py-1 bg-white/5 rounded-full">
                      Token {truncateAddress(alert.tokenAddress)}
                    </span>
                  )}
                  <span className="px-3 py-1 bg-white/5 rounded-full">
                    {new Date(alert.timestamp * 1000).toLocaleString()}
                  </span>
                </div>
              </div>
            </div>

            <div className={`text-xs font-semibold px-3 py-1 rounded-full ${severityColors[alert.severity]}`}>
              {severityLabels[alert.severity] || alert.severity}
            </div>
          </div>

          <div className="mt-4">
            <div className="text-xs text-gray-400 mb-2">Metadata</div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-300">
              {Object.entries(alert.metadata || {}).map(([key, value]) => (
                <div key={key} className="bg-slate-700/40 rounded-lg px-3 py-2">
                  <div className="uppercase text-[10px] tracking-wide text-gray-500">{key}</div>
                  <div className="font-medium">{formatMetadataValue(value)}</div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      ))}

      {analysis.washTrading.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-amber-200">
            <AlertTriangle className="w-5 h-5" />
            <div>
              <div className="text-sm font-semibold">Wash Trading Patterns Detected</div>
              <div className="text-xs text-amber-100/80">
                {analysis.washTrading.length} distinct wash trading sequences identified across monitored wallets.
              </div>
            </div>
          </div>
        </div>
      )}

      {analysis.circularFlows.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-2xl p-6">
          <div className="flex items-center gap-3 text-red-200">
            <CheckCircle2 className="w-5 h-5" />
            <div>
              <div className="text-sm font-semibold">Circular Flows Detected</div>
              <div className="text-xs text-red-100/80">
                {analysis.circularFlows.length} circular flows with elevated risk confidence identified.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function truncateAddress(address: string) {
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatMetadataValue(value: unknown) {
  if (typeof value === 'number') {
    return value.toLocaleString(undefined, {
      maximumFractionDigits: 2,
    });
  }

  if (typeof value === 'object' && value !== null) {
    return JSON.stringify(value);
  }

  return String(value);
}
