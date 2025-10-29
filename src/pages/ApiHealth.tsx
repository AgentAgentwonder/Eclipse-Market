import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import type { ApiHealthDashboard, ApiHealthMetrics, TimeSeriesDataPoint } from '../types/webhooks';

const ApiHealth = () => {
  const [dashboard, setDashboard] = useState<ApiHealthDashboard | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState(new Date());

  useEffect(() => {
    loadDashboard();
    const interval = setInterval(loadDashboard, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  const loadDashboard = async () => {
    try {
      const result = await invoke<ApiHealthDashboard>('get_api_health_dashboard');
      setDashboard(result);
      setLastUpdate(new Date());
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
        return <CheckCircle className="w-5 h-5 text-green-400" />;
      case 'degraded':
        return <AlertTriangle className="w-5 h-5 text-yellow-400" />;
      case 'down':
        return <XCircle className="w-5 h-5 text-red-400" />;
      default:
        return <Activity className="w-5 h-5 text-white/40" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'degraded':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'down':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      default:
        return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
    }
  };

  const formatServiceName = (serviceName: string) => {
    const names: Record<string, string> = {
      helius: 'Helius',
      birdeye: 'Birdeye',
      jupiter: 'Jupiter',
      solana_rpc: 'Solana RPC',
    };
    return names[serviceName] || serviceName;
  };

  const renderServiceCard = (serviceName: string, metrics: ApiHealthMetrics) => {
    return (
      <motion.div
        key={serviceName}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20"
      >
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            {getStatusIcon(metrics.healthStatus)}
            <div>
              <h3 className="text-xl font-bold">{formatServiceName(serviceName)}</h3>
              <p className="text-sm text-white/60">API Service</p>
            </div>
          </div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase border ${getStatusColor(metrics.healthStatus)}`}
          >
            {metrics.healthStatus}
          </span>
        </div>

        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="p-3 bg-slate-900/50 rounded-xl">
            <p className="text-xs text-white/60 mb-1">Uptime</p>
            <p className="text-2xl font-bold text-green-400">{metrics.uptimePercent.toFixed(2)}%</p>
          </div>
          <div className="p-3 bg-slate-900/50 rounded-xl">
            <p className="text-xs text-white/60 mb-1">Avg Latency</p>
            <p className="text-2xl font-bold text-blue-400">{metrics.avgLatencyMs.toFixed(0)}ms</p>
          </div>
          <div className="p-3 bg-slate-900/50 rounded-xl">
            <p className="text-xs text-white/60 mb-1">Error Rate</p>
            <p className="text-2xl font-bold text-red-400">{metrics.errorRate.toFixed(2)}%</p>
          </div>
          <div className="p-3 bg-slate-900/50 rounded-xl">
            <p className="text-xs text-white/60 mb-1">Total Requests</p>
            <p className="text-2xl font-bold text-purple-400">
              {metrics.totalRequests.toLocaleString()}
            </p>
          </div>
        </div>

        <div className="space-y-2 text-sm">
          <div className="flex items-center justify-between p-2 bg-slate-900/30 rounded">
            <span className="text-white/60">Successful Requests</span>
            <span className="font-semibold text-green-400">
              {metrics.successfulRequests.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center justify-between p-2 bg-slate-900/30 rounded">
            <span className="text-white/60">Failed Requests</span>
            <span className="font-semibold text-red-400">
              {metrics.failedRequests.toLocaleString()}
            </span>
          </div>
        </div>

        {metrics.rateLimitInfo && (
          <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-blue-400">Rate Limit Status</span>
              <span className="text-xs text-white/60">
                {metrics.rateLimitInfo.remaining}/{metrics.rateLimitInfo.limit}
              </span>
            </div>
            <div className="w-full bg-slate-900/50 rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  metrics.rateLimitInfo.usagePercent > 80
                    ? 'bg-red-500'
                    : metrics.rateLimitInfo.usagePercent > 60
                      ? 'bg-yellow-500'
                      : 'bg-green-500'
                }`}
                style={{ width: `${metrics.rateLimitInfo.usagePercent}%` }}
              />
            </div>
            {metrics.rateLimitInfo.usagePercent > 80 && (
              <p className="text-xs text-yellow-400 mt-2">
                ⚠️ Approaching rate limit. Consider throttling requests.
              </p>
            )}
          </div>
        )}

        {metrics.lastError && (
          <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-xs font-medium text-red-400 mb-1">Last Error</p>
            <p className="text-xs text-white/60">{metrics.lastError}</p>
            {metrics.lastFailure && (
              <p className="text-xs text-white/40 mt-1">
                {new Date(metrics.lastFailure).toLocaleString()}
              </p>
            )}
          </div>
        )}

        {metrics.failoverActive && (
          <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-yellow-400" />
            <span className="text-sm text-yellow-400">Failover active</span>
          </div>
        )}

        {metrics.lastSuccess && (
          <p className="text-xs text-white/40 mt-4">
            Last successful request: {new Date(metrics.lastSuccess).toLocaleString()}
          </p>
        )}
      </motion.div>
    );
  };

  const renderChart = (serviceName: string, data: TimeSeriesDataPoint[]) => {
    if (data.length === 0) return null;

    const chartData = data.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      }),
      latency: point.latencyMs,
      errorRate: point.errorRate,
      successRate: point.successRate,
    }));

    return (
      <div className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
        <div className="flex items-center gap-3 mb-4">
          <BarChart3 className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-bold">{formatServiceName(serviceName)} - 24h Metrics</h3>
        </div>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" stroke="#94a3b8" fontSize={12} />
            <YAxis stroke="#94a3b8" fontSize={12} />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #475569',
                borderRadius: '8px',
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="latency"
              stroke="#3b82f6"
              name="Latency (ms)"
              strokeWidth={2}
            />
            <Line
              type="monotone"
              dataKey="successRate"
              stroke="#22c55e"
              name="Success Rate (%)"
              strokeWidth={2}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-white/60 mt-4">Loading API health dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
        >
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 font-medium">Error loading dashboard</p>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!dashboard) {
    return null;
  }

  return (
    <div className="max-w-7xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold mb-2">API Health Dashboard</h1>
            <p className="text-white/60">
              Monitor uptime, latency, and error rates across all integrations
            </p>
          </div>
          <motion.button
            onClick={loadDashboard}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            Refresh
          </motion.button>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="p-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
            <div className="flex items-center gap-3">
              {getStatusIcon(dashboard.overallHealth)}
              <div>
                <p className="text-sm text-white/60">Overall Health</p>
                <p className="text-xl font-bold capitalize">{dashboard.overallHealth}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
            <div className="flex items-center gap-3">
              <Clock className="w-5 h-5 text-blue-400" />
              <div>
                <p className="text-sm text-white/60">Last Update</p>
                <p className="text-xl font-bold">{lastUpdate.toLocaleTimeString()}</p>
              </div>
            </div>
          </div>
          <div className="p-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
            <div className="flex items-center gap-3">
              <Activity className="w-5 h-5 text-purple-400" />
              <div>
                <p className="text-sm text-white/60">Services</p>
                <p className="text-xl font-bold">{Object.keys(dashboard.services).length}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          {Object.entries(dashboard.services).map(([serviceName, metrics]) =>
            renderServiceCard(serviceName, metrics)
          )}
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-bold">Historical Metrics</h2>
          {Object.entries(dashboard.history).map(([serviceName, data]) =>
            renderChart(serviceName, data)
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default ApiHealth;
