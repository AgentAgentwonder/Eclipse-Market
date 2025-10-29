import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Zap,
  Activity,
  Clock,
  TrendingUp,
  Play,
  RotateCcw,
  CheckCircle,
  XCircle,
  Loader2,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

interface LatencyStats {
  p50: number;
  p95: number;
  p99: number;
  mean: number;
  min: number;
  max: number;
  sample_count: number;
}

interface PerformanceMetrics {
  latency: LatencyStats;
  throughput: number;
  messages_received: number;
  messages_processed: number;
  errors: number;
  uptime_ms: number;
  cpu_usage: number;
}

interface LatencyHistoryPoint {
  timestamp: number;
  p50: number;
  p95: number;
  p99: number;
}

export function PerformanceDashboard() {
  const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<PerformanceMetrics | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [latencyHistory, setLatencyHistory] = useState<LatencyHistoryPoint[]>([]);
  const [autoRefresh, setAutoRefresh] = useState(false);

  const loadMetrics = async () => {
    try {
      const data = await invoke<PerformanceMetrics>('get_performance_metrics');
      setMetrics(data);

      // Add to history
      setLatencyHistory(prev => {
        const newPoint: LatencyHistoryPoint = {
          timestamp: Date.now(),
          p50: data.latency.p50,
          p95: data.latency.p95,
          p99: data.latency.p99,
        };

        // Keep last 50 points
        const updated = [...prev, newPoint];
        if (updated.length > 50) {
          updated.shift();
        }
        return updated;
      });

      setError(null);
    } catch (err) {
      console.error('Failed to load performance metrics:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadMetrics();
  }, []);

  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      loadMetrics();
    }, 1000);

    return () => clearInterval(interval);
  }, [autoRefresh]);

  const runTest = async () => {
    setTesting(true);
    setTestResult(null);
    setError(null);

    try {
      const result = await invoke<PerformanceMetrics>('run_performance_test', {
        numUpdates: 10000,
      });
      setTestResult(result);
      await loadMetrics();
    } catch (err) {
      console.error('Failed to run performance test:', err);
      setError(String(err));
    } finally {
      setTesting(false);
    }
  };

  const resetStats = async () => {
    try {
      await invoke('reset_performance_stats');
      setLatencyHistory([]);
      setTestResult(null);
      await loadMetrics();
    } catch (err) {
      console.error('Failed to reset stats:', err);
      setError(String(err));
    }
  };

  const formatLatency = (microseconds: number): string => {
    if (microseconds < 1000) {
      return `${microseconds.toFixed(2)} μs`;
    } else {
      return `${(microseconds / 1000).toFixed(2)} ms`;
    }
  };

  const formatThroughput = (msgPerSec: number): string => {
    if (msgPerSec > 1000000) {
      return `${(msgPerSec / 1000000).toFixed(2)} M/s`;
    } else if (msgPerSec > 1000) {
      return `${(msgPerSec / 1000).toFixed(2)} K/s`;
    } else {
      return `${msgPerSec.toFixed(2)} msg/s`;
    }
  };

  const formatCpuUsage = (usage: number): string => `${usage.toFixed(1)}%`;

  const isP95Passing = (p95: number) => p95 < 1000; // < 1ms

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Performance Dashboard</h2>
            <p className="text-white/60 text-sm">Real-time price engine metrics</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            className={`px-4 py-2 rounded-xl font-medium transition-all ${
              autoRefresh
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'bg-slate-700/50 text-white/60 border border-slate-600/30'
            }`}
          >
            {autoRefresh ? 'Auto-refresh ON' : 'Auto-refresh OFF'}
          </button>
          <motion.button
            onClick={resetStats}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl font-medium text-white border border-slate-600/30 flex items-center gap-2"
          >
            <RotateCcw className="w-4 h-4" />
            Reset
          </motion.button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {/* Key Metrics */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="p-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">P50 Latency</span>
              <Clock className="w-4 h-4 text-blue-400" />
            </div>
            <div className="text-2xl font-bold">{formatLatency(metrics.latency.p50)}</div>
          </div>

          <div className="p-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">P95 Latency</span>
              {isP95Passing(metrics.latency.p95) ? (
                <CheckCircle className="w-4 h-4 text-green-400" />
              ) : (
                <XCircle className="w-4 h-4 text-red-400" />
              )}
            </div>
            <div
              className={`text-2xl font-bold ${
                isP95Passing(metrics.latency.p95) ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {formatLatency(metrics.latency.p95)}
            </div>
            <div className="text-xs text-white/40 mt-1">Target: &lt;1ms</div>
          </div>

          <div className="p-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">P99 Latency</span>
              <Activity className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold">{formatLatency(metrics.latency.p99)}</div>
          </div>

          <div className="p-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Throughput</span>
              <TrendingUp className="w-4 h-4 text-emerald-400" />
            </div>
            <div className="text-2xl font-bold">{formatThroughput(metrics.throughput)}</div>
          </div>

          <div className="p-4 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">CPU Usage</span>
              <Activity className="w-4 h-4 text-amber-400" />
            </div>
            <div className="text-2xl font-bold">{formatCpuUsage(metrics.cpu_usage)}</div>
          </div>
        </div>
      )}

      {/* Latency Chart */}
      {latencyHistory.length > 0 && (
        <div className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
          <h3 className="text-lg font-semibold mb-4">Latency Over Time</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={latencyHistory}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                <XAxis
                  dataKey="timestamp"
                  stroke="#94a3b8"
                  tickFormatter={ts => new Date(ts).toLocaleTimeString()}
                />
                <YAxis
                  stroke="#94a3b8"
                  label={{
                    value: 'Latency (μs)',
                    angle: -90,
                    position: 'insideLeft',
                    fill: '#94a3b8',
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#1e293b',
                    border: '1px solid #475569',
                    borderRadius: '0.5rem',
                  }}
                  formatter={(value: number) => formatLatency(value)}
                  labelFormatter={ts => new Date(ts).toLocaleTimeString()}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="p50"
                  stroke="#3b82f6"
                  name="P50"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p95"
                  stroke="#ef4444"
                  name="P95"
                  strokeWidth={2}
                  dot={false}
                />
                <Line
                  type="monotone"
                  dataKey="p99"
                  stroke="#8b5cf6"
                  name="P99"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Detailed Stats */}
      {metrics && (
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
            <h3 className="text-lg font-semibold mb-4">Latency Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Mean</span>
                <span className="font-mono">{formatLatency(metrics.latency.mean)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Min</span>
                <span className="font-mono">{formatLatency(metrics.latency.min)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Max</span>
                <span className="font-mono">{formatLatency(metrics.latency.max)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Samples</span>
                <span className="font-mono">{metrics.latency.sample_count.toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
            <h3 className="text-lg font-semibold mb-4">Engine Statistics</h3>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-white/60">Messages Received</span>
                <span className="font-mono">{metrics.messages_received.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Messages Processed</span>
                <span className="font-mono">{metrics.messages_processed.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Errors</span>
                <span className="font-mono text-red-400">{metrics.errors}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Uptime</span>
                <span className="font-mono">{(metrics.uptime_ms / 1000).toFixed(1)}s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">Error Rate</span>
                <span className="font-mono">
                  {metrics.messages_received > 0
                    ? ((metrics.errors / metrics.messages_received) * 100).toFixed(4)
                    : '0.0000'}
                  %
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-white/60">CPU Usage</span>
                <span className="font-mono">{formatCpuUsage(metrics.cpu_usage)}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Performance Test */}
      <div className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20">
        <h3 className="text-lg font-semibold mb-4">Performance Test</h3>
        <p className="text-white/60 text-sm mb-4">
          Run a benchmark test with 10,000 price updates to measure end-to-end latency.
        </p>

        <motion.button
          onClick={runTest}
          disabled={testing}
          whileHover={{ scale: testing ? 1 : 1.02 }}
          whileTap={{ scale: testing ? 1 : 0.98 }}
          className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          {testing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Running Test...
            </>
          ) : (
            <>
              <Play className="w-5 h-5" />
              Run Performance Test
            </>
          )}
        </motion.button>

        {testResult && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 space-y-4"
          >
            <div className="flex items-center gap-2">
              {isP95Passing(testResult.latency.p95) ? (
                <>
                  <CheckCircle className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-semibold">Test Passed</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-red-400" />
                  <span className="text-red-400 font-semibold">Test Failed</span>
                </>
              )}
            </div>

            <div className="grid md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-900/50 rounded-xl">
                <div className="text-white/60 text-sm mb-1">P95 Latency</div>
                <div
                  className={`text-xl font-bold ${
                    isP95Passing(testResult.latency.p95) ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {formatLatency(testResult.latency.p95)}
                </div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-xl">
                <div className="text-white/60 text-sm mb-1">Throughput</div>
                <div className="text-xl font-bold">{formatThroughput(testResult.throughput)}</div>
              </div>

              <div className="p-4 bg-slate-900/50 rounded-xl">
                <div className="text-white/60 text-sm mb-1">Messages</div>
                <div className="text-xl font-bold">
                  {testResult.messages_processed.toLocaleString()}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
