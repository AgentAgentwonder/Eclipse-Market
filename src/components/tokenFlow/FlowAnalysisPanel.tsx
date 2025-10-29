import { motion } from 'framer-motion';
import { Activity, TrendingUp, AlertCircle, Network } from 'lucide-react';
import { useTokenFlowContext } from '../../contexts/TokenFlowContext';

export default function FlowAnalysisPanel() {
  const { analysis, loading } = useTokenFlowContext();

  if (loading) {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6">
        <div className="text-center text-gray-400">Loading analysis...</div>
      </div>
    );
  }

  if (!analysis) {
    return null;
  }

  const stats = [
    {
      label: 'Total Nodes',
      value: analysis.graph.nodes.length,
      icon: Network,
      color: 'from-purple-500 to-pink-500',
    },
    {
      label: 'Total Flows',
      value: analysis.graph.edges.length,
      icon: Activity,
      color: 'from-blue-500 to-cyan-500',
    },
    {
      label: 'Clusters',
      value: analysis.clusters.length,
      icon: TrendingUp,
      color: 'from-green-500 to-emerald-500',
    },
    {
      label: 'Alerts',
      value: analysis.alerts.length,
      icon: AlertCircle,
      color: 'from-orange-500 to-red-500',
    },
  ];

  const totalVolume = analysis.graph.edges.reduce((sum, edge) => sum + edge.amount, 0);
  const suspiciousClusters = analysis.clusters.filter(c => c.suspicious).length;

  return (
    <div className="space-y-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6"
      >
        <h2 className="text-xl font-bold mb-4">Analysis Overview</h2>
        <div className="space-y-3">
          {stats.map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="flex items-center justify-between bg-slate-700/30 rounded-xl p-4"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center`}>
                  <stat.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-sm text-gray-300">{stat.label}</span>
              </div>
              <span className="text-2xl font-bold">{stat.value}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold mb-4">Volume Metrics</h3>
        <div className="space-y-4">
          <div>
            <div className="text-sm text-gray-400 mb-1">Total Volume</div>
            <div className="text-2xl font-bold">{totalVolume.toLocaleString()}</div>
          </div>
          <div>
            <div className="text-sm text-gray-400 mb-1">Average Flow Size</div>
            <div className="text-2xl font-bold">
              {(totalVolume / Math.max(analysis.graph.edges.length, 1)).toFixed(0)}
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="bg-slate-800/50 backdrop-blur-xl border border-purple-500/20 rounded-2xl p-6"
      >
        <h3 className="text-lg font-bold mb-4">Risk Indicators</h3>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Suspicious Clusters</span>
            <span className={`text-lg font-bold ${suspiciousClusters > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {suspiciousClusters}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Wash Trading Patterns</span>
            <span className={`text-lg font-bold ${analysis.washTrading.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {analysis.washTrading.length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm text-gray-400">Circular Flows</span>
            <span className={`text-lg font-bold ${analysis.circularFlows.length > 0 ? 'text-red-400' : 'text-green-400'}`}>
              {analysis.circularFlows.length}
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
