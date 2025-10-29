import { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  RefreshCw,
  PieChart as PieChartIcon,
  ArrowUpDown,
  DollarSign,
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from 'recharts';
import { AIPortfolioAdvisor } from '../components/portfolio/AIPortfolioAdvisor';
import { Position, PortfolioMetrics } from '../types/portfolio';

type SortField = 'symbol' | 'value' | 'pnl' | 'pnlPercent' | 'allocation';
type SortDirection = 'asc' | 'desc';

const COLORS = ['#8b5cf6', '#ec4899', '#06b6d4', '#10b981', '#f59e0b', '#ef4444'];

function Portfolio() {
  const [metrics, setMetrics] = useState<PortfolioMetrics | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc');
  const [selectedPeriod, setSelectedPeriod] = useState<'daily' | 'weekly' | 'monthly' | 'all'>(
    'daily'
  );

  const fetchPortfolioData = async () => {
    try {
      const [metricsData, positionsData] = await Promise.all([
        invoke<PortfolioMetrics>('get_portfolio_metrics'),
        invoke<Position[]>('get_positions'),
      ]);

      setMetrics(metricsData);
      setPositions(positionsData);
    } catch (error) {
      console.error('Failed to fetch portfolio data:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchPortfolioData();
    const interval = setInterval(fetchPortfolioData, 30000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchPortfolioData();
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };

  const sortedPositions = useMemo(() => {
    const sorted = [...positions].sort((a, b) => {
      let aVal: number;
      let bVal: number;

      switch (sortField) {
        case 'symbol':
          return sortDirection === 'asc'
            ? a.symbol.localeCompare(b.symbol)
            : b.symbol.localeCompare(a.symbol);
        case 'value':
          aVal = a.totalValue;
          bVal = b.totalValue;
          break;
        case 'pnl':
          aVal = a.unrealizedPnl;
          bVal = b.unrealizedPnl;
          break;
        case 'pnlPercent':
          aVal = a.unrealizedPnlPercent;
          bVal = b.unrealizedPnlPercent;
          break;
        case 'allocation':
          aVal = a.allocation;
          bVal = b.allocation;
          break;
        default:
          return 0;
      }

      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    });

    return sorted;
  }, [positions, sortField, sortDirection]);

  const allocationData = useMemo(() => {
    return positions.map(p => ({
      name: p.symbol,
      value: p.allocation,
      amount: p.totalValue,
    }));
  }, [positions]);

  const pnlData = useMemo(() => {
    return positions.map(p => ({
      name: p.symbol,
      pnl: p.unrealizedPnl,
    }));
  }, [positions]);

  const getPeriodPnl = () => {
    if (!metrics) return { value: 0, percent: 0 };

    switch (selectedPeriod) {
      case 'daily':
        return { value: metrics.dailyPnl, percent: metrics.dailyPnlPercent };
      case 'weekly':
        return { value: metrics.weeklyPnl, percent: metrics.weeklyPnlPercent };
      case 'monthly':
        return { value: metrics.monthlyPnl, percent: metrics.monthlyPnlPercent };
      case 'all':
        return { value: metrics.allTimePnl, percent: metrics.allTimePnlPercent };
    }
  };

  const periodPnl = getPeriodPnl();
  const isPositive = periodPnl.value >= 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">No portfolio data available</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <AIPortfolioAdvisor positions={positions} metrics={metrics} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 shadow-lg"
        >
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-5 h-5" />
            <h3 className="text-sm font-medium opacity-90">Total Value</h3>
          </div>
          <p className="text-3xl font-bold">
            $
            {metrics.totalValue.toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700"
        >
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h3 className="text-sm font-medium text-gray-300">Realized P&L</h3>
          </div>
          <p
            className={`text-2xl font-bold ${metrics.realizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            $
            {Math.abs(metrics.realizedPnl).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700"
        >
          <div className="flex items-center gap-2 mb-2">
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-green-400" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-400" />
            )}
            <h3 className="text-sm font-medium text-gray-300">Unrealized P&L</h3>
          </div>
          <p
            className={`text-2xl font-bold ${metrics.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
          >
            $
            {Math.abs(metrics.unrealizedPnl).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700"
        >
          <div className="mb-2">
            <select
              value={selectedPeriod}
              onChange={e => setSelectedPeriod(e.target.value as any)}
              className="bg-gray-700 text-sm rounded px-2 py-1 outline-none"
            >
              <option value="daily">Daily P&L</option>
              <option value="weekly">Weekly P&L</option>
              <option value="monthly">Monthly P&L</option>
              <option value="all">All-Time P&L</option>
            </select>
          </div>
          <p className={`text-2xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : '-'}$
            {Math.abs(periodPnl.value).toLocaleString(undefined, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })}
          </p>
          <p className={`text-sm ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive ? '+' : ''}
            {periodPnl.percent.toFixed(2)}%
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-purple-400" />
            <h2 className="text-xl font-semibold">Allocation</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={allocationData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, value }) => `${name} ${value.toFixed(1)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {allocationData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip
                formatter={(value: unknown, name: unknown, props: any) => {
                  const v = typeof value === 'number' ? value : 0;
                  const n = typeof name === 'string' ? name : '';
                  return [`${v.toFixed(2)}% (${props.payload.amount.toLocaleString()})`, n];
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
          <div className="flex items-center gap-2 mb-4">
            <TrendingUp className="w-5 h-5 text-green-400" />
            <h2 className="text-xl font-semibold">P&L by Position</h2>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={pnlData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="name" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: '1px solid #374151' }}
                formatter={(value: unknown) => {
                  const v = typeof value === 'number' ? value : 0;
                  return [`${v.toLocaleString()}`, 'P&L'];
                }}
              />
              <Bar dataKey="pnl" fill="#8b5cf6">
                {pnlData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10b981' : '#ef4444'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-gray-800 rounded-xl shadow-lg border border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-700">
          <h2 className="text-xl font-semibold">Positions</h2>
          <p className="text-sm text-gray-400 mt-1">
            Last updated: {new Date(metrics.lastUpdated).toLocaleString()}
          </p>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-700/50">
              <tr>
                <th
                  className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('symbol')}
                >
                  <div className="flex items-center gap-1">
                    Symbol
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">
                  Avg Entry
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('value')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Value
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('pnl')}
                >
                  <div className="flex items-center justify-end gap-1">
                    P&L
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('pnlPercent')}
                >
                  <div className="flex items-center justify-end gap-1">
                    P&L %
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
                <th
                  className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-700"
                  onClick={() => handleSort('allocation')}
                >
                  <div className="flex items-center justify-end gap-1">
                    Allocation
                    <ArrowUpDown className="w-3 h-3" />
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-700">
              {sortedPositions.map((position, index) => (
                <tr key={position.mint} className="hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium">{position.symbol}</div>
                    <div className="text-xs text-gray-400 truncate max-w-[120px]">
                      {position.mint}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    {position.amount.toLocaleString(undefined, { maximumFractionDigits: 6 })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    $
                    {position.currentPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-gray-400">
                    $
                    {position.avgEntryPrice.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 6,
                    })}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right font-medium">
                    $
                    {position.totalValue.toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-right font-medium ${
                      position.unrealizedPnl >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {position.unrealizedPnl >= 0 ? '+' : '-'}$
                    {Math.abs(position.unrealizedPnl).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </td>
                  <td
                    className={`px-6 py-4 whitespace-nowrap text-right font-medium ${
                      position.unrealizedPnlPercent >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}
                  >
                    {position.unrealizedPnlPercent >= 0 ? '+' : ''}
                    {position.unrealizedPnlPercent.toFixed(2)}%
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <span
                      className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                      style={{
                        backgroundColor: `${COLORS[index % COLORS.length]}20`,
                        color: COLORS[index % COLORS.length],
                      }}
                    >
                      {position.allocation.toFixed(2)}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default Portfolio;
