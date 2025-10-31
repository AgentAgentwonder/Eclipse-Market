import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import { RefreshCw, Download, TrendingUp, AlertCircle } from 'lucide-react';
import {
  Position,
  PortfolioAnalytics as PortfolioAnalyticsType,
  SectorAllocation as SectorAllocationType,
  ConcentrationAlert,
  PricePoint,
} from '../types/portfolio';
import { CorrelationHeatmap } from '../components/portfolio/CorrelationHeatmap';
import { SectorAllocationChart } from '../components/portfolio/SectorAllocationChart';
import { RiskDiversificationSummary } from '../components/portfolio/RiskDiversificationSummary';
import { ConcentrationAlerts } from '../components/portfolio/ConcentrationAlerts';

function PortfolioAnalytics() {
  const [analytics, setAnalytics] = useState<PortfolioAnalyticsType | null>(null);
  const [sectors, setSectors] = useState<SectorAllocationType[]>([]);
  const [alerts, setAlerts] = useState<ConcentrationAlert[]>([]);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setError(null);

      // Fetch positions first
      const positionsData = await invoke<Position[]>('get_positions');
      setPositions(positionsData);

      if (positionsData.length === 0) {
        setLoading(false);
        return;
      }

      // Fetch time series data for each position
      const timeSeriesPromises = positionsData.map(async pos => {
        try {
          const history = await invoke<PricePoint[]>('get_price_history', {
            address: pos.mint,
            timeframe: '1M',
            apiKey: null,
          });
          return { symbol: pos.symbol, history };
        } catch (err) {
          console.error(`Failed to fetch history for ${pos.symbol}:`, err);
          return { symbol: pos.symbol, history: [] };
        }
      });

      const timeSeriesResults = await Promise.all(timeSeriesPromises);

      // Convert to HashMap format expected by backend
      const timeSeries: Record<string, PricePoint[]> = {};
      timeSeriesResults.forEach(result => {
        if (result.history.length > 0) {
          timeSeries[result.symbol] = result.history;
        }
      });

      // Fetch analytics with time series data
      const [analyticsData, sectorsData, alertsData] = await Promise.all([
        invoke<PortfolioAnalyticsType>('calculate_portfolio_analytics', {
          positions: positionsData,
          timeSeries,
          riskFreeRate: 0.03,
        }),
        invoke<SectorAllocationType[]>('get_sector_allocation', {
          positions: positionsData,
        }),
        invoke<ConcentrationAlert[]>('get_concentration_alerts', {
          positions: positionsData,
        }),
      ]);

      setAnalytics(analyticsData);
      setSectors(sectorsData);
      setAlerts(alertsData);
    } catch (err) {
      console.error('Failed to fetch portfolio analytics:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to load analytics data'
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    // Refresh analytics every 5 minutes
    const interval = setInterval(fetchData, 300000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    // Clear cache before refreshing
    invoke('clear_portfolio_cache')
      .then(() => fetchData())
      .catch(err => {
        console.error('Failed to clear cache:', err);
        fetchData();
      });
  };

  const handleExportReport = async () => {
    if (!analytics) return;

    try {
      const report = {
        analytics,
        sectors,
        alerts,
        positions,
        exportedAt: new Date().toISOString(),
      };

      const blob = new Blob([JSON.stringify(report, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `portfolio-analytics-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export report:', err);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <AlertCircle className="w-12 h-12 text-red-400 mb-4" />
        <p className="text-red-400 text-lg font-semibold">Failed to Load Analytics</p>
        <p className="text-gray-400 mt-2">{error}</p>
        <button
          onClick={handleRefresh}
          className="mt-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
        >
          Retry
        </button>
      </div>
    );
  }

  if (positions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center">
        <TrendingUp className="w-12 h-12 text-gray-400 mb-4" />
        <p className="text-gray-400 text-lg">No positions found</p>
        <p className="text-gray-500 text-sm mt-2">
          Add positions to your portfolio to see analytics
        </p>
      </div>
    );
  }

  if (!analytics) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-gray-400">No analytics data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Portfolio Analytics</h1>
          <p className="text-gray-400 text-sm mt-1">
            Advanced risk metrics, diversification analysis, and insights
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportReport}
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
          >
            <Download className="w-4 h-4" />
            Export Report
          </button>
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {alerts.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <ConcentrationAlerts alerts={alerts} />
        </motion.div>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <RiskDiversificationSummary
          diversification={analytics.diversification}
          sharpe={analytics.sharpe}
          factors={analytics.factors}
        />
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <CorrelationHeatmap correlation={analytics.correlation} />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <SectorAllocationChart sectors={sectors} />
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700"
      >
        <h3 className="text-lg font-semibold mb-4">Concentration Risk Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {analytics.concentration.map((risk, index) => {
            const colors = {
              low: 'border-green-500/50 bg-green-500/10',
              medium: 'border-yellow-500/50 bg-yellow-500/10',
              high: 'border-orange-500/50 bg-orange-500/10',
              critical: 'border-red-500/50 bg-red-500/10',
            };

            return (
              <motion.div
                key={risk.symbol}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className={`border rounded-lg p-4 ${colors[risk.riskLevel]}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="font-semibold">{risk.symbol}</span>
                  <span className="text-sm text-gray-400">
                    {risk.allocation.toFixed(1)}%
                  </span>
                </div>
                <div className="mb-2">
                  <span
                    className={`text-xs px-2 py-1 rounded ${
                      risk.riskLevel === 'critical'
                        ? 'bg-red-500/20 text-red-300'
                        : risk.riskLevel === 'high'
                          ? 'bg-orange-500/20 text-orange-300'
                          : risk.riskLevel === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-300'
                            : 'bg-green-500/20 text-green-300'
                    }`}
                  >
                    {risk.riskLevel.toUpperCase()} RISK
                  </span>
                </div>
                <p className="text-xs text-gray-400">{risk.recommendation}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="text-center text-sm text-gray-500"
      >
        <p>
          Analytics calculated at {new Date(analytics.calculatedAt).toLocaleString()}
        </p>
        <p className="mt-1">
          Data refreshes automatically every 5 minutes or manually via the refresh button
        </p>
      </motion.div>
    </div>
  );
}

export default PortfolioAnalytics;
