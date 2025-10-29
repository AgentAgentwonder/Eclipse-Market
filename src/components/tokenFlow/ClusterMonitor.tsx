import { motion } from 'framer-motion';
import { Users, TrendingUp, TrendingDown, AlertTriangle } from 'lucide-react';
import { useTokenFlowContext } from '../../contexts/TokenFlowContext';

export default function ClusterMonitor() {
  const { analysis, loading } = useTokenFlowContext();

  if (loading) {
    return <div className="text-center text-gray-400">Loading clusters...</div>;
  }

  if (!analysis || !analysis.clusters.length) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-8">
        <p className="text-center text-gray-400">No clusters detected</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {analysis.clusters.map((cluster, index) => (
        <motion.div
          key={cluster.id}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6"
        >
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <Users className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-lg font-bold">{cluster.id}</h3>
                <p className="text-sm text-gray-400">{cluster.wallets.length} wallets</p>
              </div>
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              cluster.risk === 'high'
                ? 'bg-red-500/20 text-red-400'
                : cluster.risk === 'medium'
                ? 'bg-yellow-500/20 text-yellow-400'
                : 'bg-green-500/20 text-green-400'
            }`}>
              {cluster.risk.toUpperCase()} RISK
            </div>
          </div>

          <div className="grid grid-cols-4 gap-4 mb-4">
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Total Volume</div>
              <div className="text-lg font-bold">{cluster.totalVolume.toLocaleString()}</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Transactions</div>
              <div className="text-lg font-bold">{cluster.transactionCount}</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">Win Rate</div>
              <div className="text-lg font-bold">{(cluster.performance.winRate * 100).toFixed(1)}%</div>
            </div>
            <div className="bg-slate-700/30 rounded-lg p-3">
              <div className="text-xs text-gray-400 mb-1">PnL</div>
              <div className={`text-lg font-bold flex items-center gap-1 ${
                cluster.performance.totalPnL >= 0 ? 'text-green-400' : 'text-red-400'
              }`}>
                {cluster.performance.totalPnL >= 0 ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                {cluster.performance.totalPnL.toLocaleString()}
              </div>
            </div>
          </div>

          <div className="mb-4">
            <div className="text-sm font-medium mb-2">Distribution Pattern</div>
            <div className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
              cluster.performance.distributionPattern === 'accumulation'
                ? 'bg-blue-500/20 text-blue-400'
                : cluster.performance.distributionPattern === 'distribution'
                ? 'bg-orange-500/20 text-orange-400'
                : 'bg-gray-500/20 text-gray-400'
            }`}>
              {cluster.performance.distributionPattern.toUpperCase()}
            </div>
          </div>

          {cluster.suspicious && (
            <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <div className="text-sm font-medium text-red-400 mb-1">Suspicious Activity</div>
                  <ul className="text-xs text-red-300 space-y-1">
                    {cluster.suspicionReasons.map((reason, idx) => (
                      <li key={idx}>• {reason}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {cluster.performance.topTokens.length > 0 && (
            <div className="mt-4">
              <div className="text-sm font-medium mb-2">Top Tokens</div>
              <div className="space-y-2">
                {cluster.performance.topTokens.map((token, idx) => (
                  <div key={idx} className="flex items-center justify-between bg-slate-700/30 rounded-lg p-2">
                    <span className="text-sm font-medium">{token.symbol}</span>
                    <span className="text-sm text-gray-400">{token.volume.toLocaleString()}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
}
