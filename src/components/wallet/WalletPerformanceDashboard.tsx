import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import {
  WalletPerformanceData,
  PerformanceScore,
  TokenPerformance,
  Trade,
  ScoreAlert,
  BenchmarkComparison,
} from '../../types/performance';
import { PerformanceScoreBadge } from './PerformanceScoreBadge';
import {
  TrendingUp,
  TrendingDown,
  Target,
  Clock,
  Award,
  AlertTriangle,
  DollarSign,
  Activity,
  BarChart3,
  Trophy,
  Users,
} from 'lucide-react';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface WalletPerformanceDashboardProps {
  walletAddress: string;
}

export const WalletPerformanceDashboard: React.FC<WalletPerformanceDashboardProps> = ({
  walletAddress,
}) => {
  const [loading, setLoading] = useState(true);
  const [performanceData, setPerformanceData] = useState<WalletPerformanceData | null>(null);
  const [alerts, setAlerts] = useState<ScoreAlert[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'tokens' | 'timing' | 'trades'>('overview');

  useEffect(() => {
    loadPerformanceData();
  }, [walletAddress]);

  const loadPerformanceData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [data, alertsData] = await Promise.all([
        invoke<WalletPerformanceData>('get_wallet_performance_data', {
          walletAddress,
        }),
        invoke<ScoreAlert[]>('get_performance_alerts', {
          walletAddress,
          limit: 10,
        }),
      ]);

      setPerformanceData(data);
      setAlerts(alertsData);
    } catch (err) {
      console.error('Error loading performance data:', err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.round(seconds / 3600)}h`;
    return `${Math.round(seconds / 86400)}d`;
  };

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatPercent = (value: number): string => {
    return `${value.toFixed(2)}%`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
        <p className="text-red-500">Error loading performance data: {error}</p>
      </div>
    );
  }

  if (!performanceData) {
    return (
      <div className="bg-gray-800 rounded-lg p-8 text-center">
        <Activity size={48} className="mx-auto mb-4 text-gray-500" />
        <p className="text-gray-400">No trading data available for this wallet</p>
        <p className="text-sm text-gray-500 mt-2">Start trading to see performance metrics</p>
      </div>
    );
  }

  const { score, scoreHistory, tokenPerformance, timingAnalysis, bestWorst, benchmark } = performanceData;

  const scoreHistoryChart = {
    labels: scoreHistory.map((s) =>
      new Date(s.calculatedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    ).reverse(),
    datasets: [
      {
        label: 'Performance Score',
        data: scoreHistory.map((s) => s.score).reverse(),
        borderColor: 'rgb(59, 130, 246)',
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const dayNames = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const hourlyPnl = new Array(24).fill(0);
  const dailyPnl = new Array(7).fill(0);

  timingAnalysis.forEach((t) => {
    hourlyPnl[t.hourOfDay] += t.avgPnl;
    dailyPnl[t.dayOfWeek] += t.avgPnl;
  });

  return (
    <div className="space-y-6">
      {/* Alerts Section */}
      {alerts.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle size={20} className="text-yellow-500" />
            <h3 className="font-semibold text-yellow-500">Recent Score Changes</h3>
          </div>
          <div className="space-y-2">
            {alerts.slice(0, 3).map((alert) => (
              <div key={alert.id} className="text-sm text-gray-300">
                <span className={alert.changePercent > 0 ? 'text-green-400' : 'text-red-400'}>
                  {alert.reason}
                </span>
                <span className="text-gray-500 ml-2">
                  ({new Date(alert.createdAt).toLocaleDateString()})
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Score Overview */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-white">Performance Score</h2>
          <PerformanceScoreBadge
            score={score.score}
            size="lg"
            previousScore={scoreHistory[1]?.score}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <MetricCard
            icon={Target}
            label="Win Rate"
            value={formatPercent(score.winRate)}
            trend={score.winRate >= 50 ? 'up' : 'down'}
          />
          <MetricCard
            icon={DollarSign}
            label="Net P&L"
            value={formatCurrency(score.netPnl)}
            trend={score.netPnl >= 0 ? 'up' : 'down'}
          />
          <MetricCard
            icon={Activity}
            label="Profit Factor"
            value={score.profitFactor.toFixed(2)}
            trend={score.profitFactor >= 1 ? 'up' : 'down'}
          />
          <MetricCard
            icon={BarChart3}
            label="Sharpe Ratio"
            value={score.sharpeRatio.toFixed(2)}
            trend={score.sharpeRatio >= 0 ? 'up' : 'down'}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingUp size={16} className="text-green-500" />
              <span className="text-sm text-gray-400">Winning Trades</span>
            </div>
            <p className="text-2xl font-bold text-green-500">{score.winningTrades}</p>
            <p className="text-xs text-gray-500">Avg: {formatCurrency(score.avgProfitPerTrade)}</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <TrendingDown size={16} className="text-red-500" />
              <span className="text-sm text-gray-400">Losing Trades</span>
            </div>
            <p className="text-2xl font-bold text-red-500">{score.losingTrades}</p>
            <p className="text-xs text-gray-500">Avg: {formatCurrency(score.avgLossPerTrade)}</p>
          </div>

          <div className="bg-gray-900 rounded-lg p-4">
            <div className="flex items-center gap-2 mb-2">
              <Clock size={16} className="text-blue-500" />
              <span className="text-sm text-gray-400">Avg Hold Time</span>
            </div>
            <p className="text-2xl font-bold text-blue-500">
              {formatDuration(score.avgHoldDurationSeconds)}
            </p>
            <p className="text-xs text-gray-500">{score.totalTrades} total trades</p>
          </div>
        </div>
      </div>

      {/* Benchmark Comparison */}
      {benchmark && (
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center gap-2 mb-4">
            <Users size={20} className="text-purple-500" />
            <h3 className="text-lg font-semibold text-white">Benchmark Comparison</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <BenchmarkCard
              label="Your Score"
              value={benchmark.walletScore.toFixed(1)}
              color="blue"
            />
            <BenchmarkCard
              label="Market Average"
              value={benchmark.marketAvgScore.toFixed(1)}
              color="gray"
            />
            <BenchmarkCard
              label="Percentile"
              value={`${benchmark.percentile.toFixed(0)}th`}
              color="purple"
            />
            <BenchmarkCard
              label="Rank"
              value={`#${benchmark.rank} / ${benchmark.totalWallets}`}
              color="yellow"
            />
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-700">
        <TabButton
          label="Score History"
          active={activeTab === 'overview'}
          onClick={() => setActiveTab('overview')}
        />
        <TabButton
          label="Token Performance"
          active={activeTab === 'tokens'}
          onClick={() => setActiveTab('tokens')}
        />
        <TabButton
          label="Timing Analysis"
          active={activeTab === 'timing'}
          onClick={() => setActiveTab('timing')}
        />
        <TabButton
          label="Best/Worst Trades"
          active={activeTab === 'trades'}
          onClick={() => setActiveTab('trades')}
        />
      </div>

      {/* Tab Content */}
      <div className="bg-gray-800 rounded-lg p-6">
        {activeTab === 'overview' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Score History</h3>
            <div className="h-64">
              <Line
                data={scoreHistoryChart}
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { display: false },
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 100,
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                      ticks: { color: '#9ca3af' },
                    },
                    x: {
                      grid: { color: 'rgba(255, 255, 255, 0.1)' },
                      ticks: { color: '#9ca3af' },
                    },
                  },
                }}
              />
            </div>
          </div>
        )}

        {activeTab === 'tokens' && (
          <div>
            <h3 className="text-lg font-semibold text-white mb-4">Performance by Token</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-700">
                    <th className="text-left py-2 px-3 text-gray-400 font-medium">Token</th>
                    <th className="text-right py-2 px-3 text-gray-400 font-medium">Trades</th>
                    <th className="text-right py-2 px-3 text-gray-400 font-medium">Win Rate</th>
                    <th className="text-right py-2 px-3 text-gray-400 font-medium">Net P&L</th>
                    <th className="text-right py-2 px-3 text-gray-400 font-medium">Volume</th>
                  </tr>
                </thead>
                <tbody>
                  {tokenPerformance.map((token) => (
                    <tr key={token.tokenMint} className="border-b border-gray-700/50">
                      <td className="py-3 px-3 text-white font-medium">{token.tokenSymbol}</td>
                      <td className="py-3 px-3 text-right text-gray-300">{token.totalTrades}</td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={
                            token.winRate >= 50 ? 'text-green-500' : 'text-red-500'
                          }
                        >
                          {formatPercent(token.winRate)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span
                          className={
                            token.netPnl >= 0 ? 'text-green-500' : 'text-red-500'
                          }
                        >
                          {formatCurrency(token.netPnl)}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-right text-gray-300">
                        {formatCurrency(token.totalVolume)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'timing' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-white mb-4">Performance by Day of Week</h3>
              <div className="h-48">
                <Bar
                  data={{
                    labels: dayNames,
                    datasets: [
                      {
                        label: 'Avg P&L',
                        data: dailyPnl,
                        backgroundColor: dailyPnl.map((v) =>
                          v >= 0 ? 'rgba(34, 197, 94, 0.5)' : 'rgba(239, 68, 68, 0.5)'
                        ),
                        borderColor: dailyPnl.map((v) =>
                          v >= 0 ? 'rgb(34, 197, 94)' : 'rgb(239, 68, 68)'
                        ),
                        borderWidth: 1,
                      },
                    ],
                  }}
                  options={{
                    responsive: true,
                    maintainAspectRatio: false,
                    plugins: { legend: { display: false } },
                    scales: {
                      y: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#9ca3af' },
                      },
                      x: {
                        grid: { color: 'rgba(255, 255, 255, 0.1)' },
                        ticks: { color: '#9ca3af' },
                      },
                    },
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {activeTab === 'trades' && (
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Trophy size={20} className="text-green-500" />
                <h3 className="text-lg font-semibold text-white">Best Trades</h3>
              </div>
              <TradesList trades={bestWorst.bestTrades} />
            </div>

            <div>
              <div className="flex items-center gap-2 mb-4">
                <AlertTriangle size={20} className="text-red-500" />
                <h3 className="text-lg font-semibold text-white">Worst Trades</h3>
              </div>
              <TradesList trades={bestWorst.worstTrades} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

const MetricCard: React.FC<{
  icon: React.ElementType;
  label: string;
  value: string;
  trend: 'up' | 'down';
}> = ({ icon: Icon, label, value, trend }) => (
  <div className="bg-gray-900 rounded-lg p-4">
    <div className="flex items-center justify-between mb-2">
      <Icon size={20} className={trend === 'up' ? 'text-green-500' : 'text-red-500'} />
      {trend === 'up' ? (
        <TrendingUp size={16} className="text-green-500" />
      ) : (
        <TrendingDown size={16} className="text-red-500" />
      )}
    </div>
    <p className="text-sm text-gray-400">{label}</p>
    <p className={`text-xl font-bold ${trend === 'up' ? 'text-green-500' : 'text-red-500'}`}>
      {value}
    </p>
  </div>
);

const BenchmarkCard: React.FC<{
  label: string;
  value: string;
  color: 'blue' | 'gray' | 'purple' | 'yellow';
}> = ({ label, value, color }) => {
  const colorClasses = {
    blue: 'text-blue-500',
    gray: 'text-gray-400',
    purple: 'text-purple-500',
    yellow: 'text-yellow-500',
  };

  return (
    <div className="bg-gray-900 rounded-lg p-4">
      <p className="text-sm text-gray-400 mb-1">{label}</p>
      <p className={`text-2xl font-bold ${colorClasses[color]}`}>{value}</p>
    </div>
  );
};

const TabButton: React.FC<{
  label: string;
  active: boolean;
  onClick: () => void;
}> = ({ label, active, onClick }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 font-medium transition-colors ${
      active
        ? 'text-blue-500 border-b-2 border-blue-500'
        : 'text-gray-400 hover:text-gray-300'
    }`}
  >
    {label}
  </button>
);

const TradesList: React.FC<{ trades: Trade[] }> = ({ trades }) => {
  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  return (
    <div className="space-y-2">
      {trades.map((trade) => (
        <div
          key={trade.id}
          className="bg-gray-900 rounded-lg p-4 flex items-center justify-between"
        >
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-medium text-white">{trade.tokenSymbol}</span>
              <span
                className={`text-xs px-2 py-0.5 rounded ${
                  trade.side === 'buy'
                    ? 'bg-green-500/20 text-green-500'
                    : 'bg-red-500/20 text-red-500'
                }`}
              >
                {trade.side.toUpperCase()}
              </span>
            </div>
            <p className="text-sm text-gray-400">
              {new Date(trade.timestamp).toLocaleDateString()} •{' '}
              {trade.amount.toFixed(4)} @ {formatCurrency(trade.price)}
            </p>
          </div>
          <div className="text-right">
            <p
              className={`text-lg font-bold ${
                (trade.pnl ?? 0) >= 0 ? 'text-green-500' : 'text-red-500'
              }`}
            >
              {formatCurrency(trade.pnl ?? 0)}
            </p>
            <p className="text-xs text-gray-500">
              {trade.holdDurationSeconds
                ? `${Math.round(trade.holdDurationSeconds / 3600)}h hold`
                : 'Open'}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
};
