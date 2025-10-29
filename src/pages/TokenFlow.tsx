import { useState } from 'react';
import { motion } from 'framer-motion';
import { Network, Share2, AlertTriangle, Settings } from 'lucide-react';
import { TokenFlowProvider, useTokenFlowContext } from '../contexts/TokenFlowContext';
import FlowVisualization from '../components/tokenFlow/FlowVisualization';
import ClusterMonitor from '../components/tokenFlow/ClusterMonitor';
import FlowAlerts from '../components/tokenFlow/FlowAlerts';
import FlowAnalysisPanel from '../components/tokenFlow/FlowAnalysisPanel';
import FlowExportModal from '../components/tokenFlow/FlowExportModal';

function TokenFlowContent() {
  const [activeTab, setActiveTab] = useState<'visualization' | 'clusters' | 'alerts'>('visualization');
  const [exportModalOpen, setExportModalOpen] = useState(false);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Token Flow Intelligence</h1>
          <p className="text-gray-400">
            Visualize token flows, detect clusters, and identify suspicious patterns
          </p>
        </div>
        <button
          onClick={() => setExportModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-all"
        >
          <Share2 className="w-4 h-4" />
          Export
        </button>
      </div>

      <div className="flex items-center gap-4 border-b border-purple-500/20 pb-4">
        {[
          { id: 'visualization', label: 'Flow Visualization', icon: Network },
          { id: 'clusters', label: 'Wallet Clusters', icon: Settings },
          { id: 'alerts', label: 'Alerts', icon: AlertTriangle },
        ].map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => setActiveTab(id as any)}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg transition-all ${
              activeTab === id
                ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                : 'text-gray-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className="font-medium">{label}</span>
          </button>
        ))}
      </div>

      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        transition={{ duration: 0.3 }}
      >
        {activeTab === 'visualization' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <FlowVisualization />
            </div>
            <div>
              <FlowAnalysisPanel />
            </div>
          </div>
        )}

        {activeTab === 'clusters' && <ClusterMonitor />}

        {activeTab === 'alerts' && <FlowAlerts />}
      </motion.div>

      <FlowExportModal isOpen={exportModalOpen} onClose={() => setExportModalOpen(false)} />
    </div>
  );
}

export default function TokenFlow() {
  return (
    <TokenFlowProvider>
      <TokenFlowContent />
    </TokenFlowProvider>
  );
}
