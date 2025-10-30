import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import { TrendingUp, AlertTriangle, PieChart, RefreshCw } from 'lucide-react';
import { PortfolioSummary, RiskMetrics } from '../../types/defi';
import { LendingDashboard } from './LendingDashboard';
import { YieldDashboard } from './YieldDashboard';
import { PositionManager } from './PositionManager';
import { GovernancePanel } from './GovernancePanel';
import { RiskWarning } from './RiskWarning';

type TabType = 'overview' | 'lending' | 'yield' | 'positions' | 'governance';

interface DeFiHubProps {
  wallet: string;
}

export function DeFiHub({ wallet }: DeFiHubProps) {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [summary, setSummary] = useState<PortfolioSummary | null>(null);
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchData = async () => {
    try {
      const [summaryData, riskData] = await Promise.all([
        invoke<PortfolioSummary>('get_defi_portfolio_summary', { wallet }),
        invoke<RiskMetrics[]>('get_defi_risk_metrics', { wallet }),
      ]);

      setSummary(summaryData);
      setRiskMetrics(riskData);
    } catch (error) {
      console.error('Failed to fetch DeFi data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, [wallet]);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchData();
  };

  const criticalRisks = riskMetrics.filter(m => m.riskLevel === 'critical' || m.riskLevel === 'high');

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">DeFi Control Center</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {criticalRisks.length > 0 && (
        <RiskWarning metrics={criticalRisks} />
      )}

      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <PieChart className="w-5 h-5" />
              <h3 className="text-sm font-medium opacity-90">Total Value</h3>
            </div>
            <p className="text-3xl font-bold">
              ${summary.totalValueUsd.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-gradient-to-br from-green-600 to-teal-600 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-sm font-medium opacity-90">Average APY</h3>
            </div>
            <p className="text-3xl font-bold">
              {summary.averageApy.toFixed(2)}%
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-gradient-to-br from-blue-600 to-indigo-600 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp className="w-5 h-5" />
              <h3 className="text-sm font-medium opacity-90">24h Earnings</h3>
            </div>
            <p className="text-3xl font-bold">
              ${summary.totalEarnings24h.toFixed(2)}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-gradient-to-br from-orange-600 to-red-600 rounded-xl p-6 shadow-lg"
          >
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5" />
              <h3 className="text-sm font-medium opacity-90">Risk Alerts</h3>
            </div>
            <p className="text-3xl font-bold">
              {criticalRisks.length}
            </p>
          </motion.div>
        </div>
      )}

      <div className="flex border-b border-gray-700">
        <button
          onClick={() => setActiveTab('overview')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'overview'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Overview
        </button>
        <button
          onClick={() => setActiveTab('lending')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'lending'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Lending
        </button>
        <button
          onClick={() => setActiveTab('yield')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'yield'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Yield Farming
        </button>
        <button
          onClick={() => setActiveTab('positions')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'positions'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Positions
        </button>
        <button
          onClick={() => setActiveTab('governance')}
          className={`px-6 py-3 font-medium transition-colors ${
            activeTab === 'governance'
              ? 'text-purple-400 border-b-2 border-purple-400'
              : 'text-gray-400 hover:text-gray-300'
          }`}
        >
          Governance
        </button>
      </div>

      <div className="mt-6">
        {activeTab === 'overview' && summary && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">Lending</h3>
                <p className="text-2xl font-bold text-green-400">
                  ${summary.lendingValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">Borrowing</h3>
                <p className="text-2xl font-bold text-red-400">
                  ${summary.borrowingValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className="bg-gray-800 rounded-xl p-6">
                <h3 className="text-lg font-semibold mb-2">LP & Farming</h3>
                <p className="text-2xl font-bold text-blue-400">
                  ${(summary.lpValue + summary.farmingValue).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
            <PositionManager wallet={wallet} positions={summary.positions} />
          </div>
        )}
        {activeTab === 'lending' && <LendingDashboard wallet={wallet} />}
        {activeTab === 'yield' && <YieldDashboard wallet={wallet} />}
        {activeTab === 'positions' && summary && (
          <PositionManager wallet={wallet} positions={summary.positions} />
        )}
        {activeTab === 'governance' && <GovernancePanel wallet={wallet} />}
      </div>
    </div>
  );
}
