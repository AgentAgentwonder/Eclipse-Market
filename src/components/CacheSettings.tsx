import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Database,
  Zap,
  TrendingUp,
  RefreshCw,
  Trash2,
  CheckCircle,
  AlertCircle,
  Clock,
  Gauge,
  FlaskConical,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface CacheStatistics {
  totalHits: number;
  totalMisses: number;
  hitRate: number;
  totalEvictions: number;
  totalEntries: number;
  totalSizeBytes: number;
  diskHits: number;
  diskMisses: number;
  warmLoads: number;
  perTypeStats: Record<string, TypeStatistics>;
  lastWarmed: number | null;
}

interface TypeStatistics {
  hits: number;
  misses: number;
  hitRate: number;
  entries: number;
  sizeBytes: number;
}

interface WarmProgress {
  total: number;
  completed: number;
  percentage: number;
  currentKey: string | null;
}

interface CacheTtlConfig {
  prices: number;
  metadata: number;
  history: number;
}

interface CacheTestResult {
  testName: string;
  passed: boolean;
  cachedLatencyMs: number;
  uncachedLatencyMs: number;
  latencyImprovementPercent: number;
  hitRate: number;
  cacheHits: number;
  cacheMisses: number;
  message: string;
}

const TTL_MIN_MS = 100;
const TTL_MAX_MS = 604_800_000;
const TTL_PRESETS: Array<{ label: string; value: number }> = [
  { label: '100ms', value: 100 },
  { label: '250ms', value: 250 },
  { label: '1s', value: 1_000 },
  { label: '5s', value: 5_000 },
  { label: '30s', value: 30_000 },
  { label: '1m', value: 60_000 },
  { label: '5m', value: 300_000 },
  { label: '15m', value: 900_000 },
  { label: '1h', value: 3_600_000 },
  { label: '6h', value: 21_600_000 },
  { label: '12h', value: 43_200_000 },
  { label: '1d', value: 86_400_000 },
  { label: '7d', value: 604_800_000 },
];

export function CacheSettings() {
  const [stats, setStats] = useState<CacheStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [warming, setWarming] = useState(false);
  const [warmProgress, setWarmProgress] = useState<WarmProgress | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const [ttlConfig, setTtlConfig] = useState<CacheTtlConfig | null>(null);
  const [pendingTtlConfig, setPendingTtlConfig] = useState<CacheTtlConfig | null>(null);
  const [ttlLoading, setTtlLoading] = useState(false);
  const [testResult, setTestResult] = useState<CacheTestResult | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    loadStatistics();
    loadTtlConfig();
    const interval = setInterval(loadStatistics, 5000); // Update every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const loadStatistics = async () => {
    try {
      const statistics = await invoke<CacheStatistics>('get_cache_statistics');
      setStats(statistics);
      setLoading(false);
    } catch (err) {
      console.error('Failed to load cache statistics:', err);
      setError(String(err));
      setLoading(false);
    }
  };

  const loadTtlConfig = async () => {
    setTtlLoading(true);
    try {
      const config = await invoke<CacheTtlConfig>('get_ttl_config');
      setTtlConfig(config);
      setPendingTtlConfig(config);
    } catch (err) {
      console.error('Failed to load TTL config:', err);
      setError(String(err));
    } finally {
      setTtlLoading(false);
    }
  };

  const handleSaveTtlConfig = async () => {
    if (!pendingTtlConfig) return;
    setTtlLoading(true);
    setError(null);
    setSuccess(null);
    try {
      await invoke('update_ttl_config', { config: pendingTtlConfig });
      setTtlConfig(pendingTtlConfig);
      setSuccess('TTL configuration saved successfully');
      await loadStatistics();
    } catch (err) {
      console.error('Failed to save TTL config:', err);
      setError(String(err));
    } finally {
      setTtlLoading(false);
    }
  };

  const handleResetTtlConfig = async () => {
    if (!window.confirm('Reset TTL configuration to default values?')) return;
    setTtlLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const defaults = await invoke<CacheTtlConfig>('reset_ttl_config');
      setTtlConfig(defaults);
      setPendingTtlConfig(defaults);
      setSuccess('TTL configuration reset to defaults');
    } catch (err) {
      console.error('Failed to reset TTL config:', err);
      setError(String(err));
    } finally {
      setTtlLoading(false);
    }
  };

  const formatTtl = (ms: number): string => {
    if (ms < 1_000) return `${ms}ms`;
    if (ms < 60_000) return `${(ms / 1_000).toFixed(1)}s`;
    if (ms < 3_600_000) return `${(ms / 60_000).toFixed(1)}m`;
    if (ms < 86_400_000) return `${(ms / 3_600_000).toFixed(1)}h`;
    return `${(ms / 86_400_000).toFixed(1)}d`;
  };

  const handleTestCache = async () => {
    setTesting(true);
    setError(null);
    setTestResult(null);
    try {
      const result = await invoke<CacheTestResult>('test_cache_performance');
      setTestResult(result);
      if (result.passed) {
        setSuccess('Cache performance test passed');
      } else {
        setError('Cache performance test did not meet 50% improvement threshold');
      }
    } catch (err) {
      console.error('Failed to test cache:', err);
      setError(String(err));
    } finally {
      setTesting(false);
    }
  };

  const ttlChanged = useMemo(() => {
    if (!ttlConfig || !pendingTtlConfig) return false;
    return (
      ttlConfig.prices !== pendingTtlConfig.prices ||
      ttlConfig.metadata !== pendingTtlConfig.metadata ||
      ttlConfig.history !== pendingTtlConfig.history
    );
  }, [ttlConfig, pendingTtlConfig]);

  const updateTtlField = (field: keyof CacheTtlConfig, value: number) => {
    const clamped = Math.min(
      Math.max(Number.isNaN(value) ? TTL_MIN_MS : value, TTL_MIN_MS),
      TTL_MAX_MS
    );
    setPendingTtlConfig(prev => {
      if (prev) {
        return { ...prev, [field]: clamped };
      }
      const base = ttlConfig ?? { prices: clamped, metadata: clamped, history: clamped };
      return { ...base, [field]: clamped };
    });
  };

  const renderTtlControl = (label: string, field: keyof CacheTtlConfig, description: string) => {
    if (!pendingTtlConfig) {
      return (
        <div className="p-6 bg-slate-900/40 rounded-xl border border-purple-500/10 flex items-center justify-center">
          <div className="inline-block w-6 h-6 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin" />
        </div>
      );
    }

    const value = pendingTtlConfig[field];
    const current = ttlConfig?.[field];
    const diff = current !== undefined ? value - current : 0;
    const diffPercent = current && current > 0 ? (diff / current) * 100 : 0;
    const diffColor =
      diff === 0 ? 'text-white/60' : diff > 0 ? 'text-emerald-400' : 'text-amber-300';
    const diffLabel =
      current === undefined
        ? 'New configuration'
        : diff === 0
          ? 'No change'
          : diff > 0
            ? `+${Math.min(diffPercent, 500).toFixed(0)}% retention`
            : `-${Math.min(Math.abs(diffPercent), 500).toFixed(0)}% retention`;

    const impactLabel =
      diff === 0
        ? 'No change expected in hit rate.'
        : diff > 0
          ? 'Longer TTL reduces API calls and boosts hit rate.'
          : 'Shorter TTL refreshes data more often at the cost of extra API calls.';

    return (
      <div className="space-y-4 p-4 bg-slate-900/40 rounded-xl border border-purple-500/10">
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-xs uppercase tracking-wide text-white/40">{label}</p>
            <p className="text-lg font-semibold">{formatTtl(value)}</p>
          </div>
          <div className="text-right">
            {current !== undefined && (
              <p className={`text-xs font-semibold ${diffColor}`}>
                {diff === 0
                  ? 'Stable'
                  : diff > 0
                    ? `+${formatTtl(value - current)}`
                    : `-${formatTtl(current - value)}`}
              </p>
            )}
            <p className="text-xs text-white/40">{diffLabel}</p>
          </div>
        </div>

        <p className="text-sm text-white/60">{description}</p>

        <div>
          <input
            type="range"
            min={TTL_MIN_MS}
            max={TTL_MAX_MS}
            step={100}
            value={value}
            onChange={event => updateTtlField(field, Number(event.target.value))}
            className="w-full accent-purple-500"
          />
          <div className="flex justify-between text-xs text-white/30 mt-2">
            <span>{formatTtl(TTL_MIN_MS)}</span>
            <span>{formatTtl(TTL_MAX_MS)}</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          {TTL_PRESETS.map(preset => (
            <button
              key={`${field}-${preset.value}`}
              type="button"
              onClick={() => updateTtlField(field, preset.value)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors border ${
                value === preset.value
                  ? 'bg-purple-500/30 border-purple-400 text-purple-200'
                  : 'bg-slate-900/50 border-purple-500/20 text-white/50 hover:bg-purple-500/10 hover:text-white'
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>

        <p className="text-xs text-white/50">{impactLabel}</p>
      </div>
    );
  };

  const handleWarmCache = async () => {
    setWarming(true);
    setError(null);
    setSuccess(null);

    try {
      // Define top tokens to warm
      const topTokens = [
        'So11111111111111111111111111111111111111112', // SOL
        'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v', // USDC
        'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB', // USDT
        'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263', // BONK
        'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN', // JUP
        '7vfCXTUXx5WJV5JADk17DUJ4ksgau7utNKj4b963voxs', // ETH
        'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So', // mSOL
        '7dHbWXmci3dT8UFYWYZweBLXgycu7Y3iL6trKn1Y7ARj', // stSOL
        'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE', // ORCA
        '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R', // RAY
      ];

      const keys = topTokens.map(addr => `token_price_${addr}`);
      const progress = await invoke<WarmProgress>('warm_cache', { keys });
      setWarmProgress(progress);
      setSuccess(`Successfully warmed ${progress.completed} of ${progress.total} cache entries`);
      await loadStatistics();
    } catch (err) {
      console.error('Failed to warm cache:', err);
      setError(String(err));
    } finally {
      setWarming(false);
    }
  };

  const handleClearCache = async () => {
    if (!window.confirm('Are you sure you want to clear the entire cache?')) {
      return;
    }

    try {
      await invoke('clear_cache');
      setSuccess('Cache cleared successfully');
      await loadStatistics();
    } catch (err) {
      console.error('Failed to clear cache:', err);
      setError(String(err));
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  };

  const formatTimestamp = (timestamp: number | null): string => {
    if (!timestamp) return 'Never';
    return new Date(timestamp * 1000).toLocaleString();
  };

  const getHitRateColor = (hitRate: number): string => {
    if (hitRate >= 0.8) return 'text-green-400';
    if (hitRate >= 0.5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getHitRateBackground = (hitRate: number): string => {
    if (hitRate >= 0.8) return 'bg-green-500/20 border-green-500/30';
    if (hitRate >= 0.5) return 'bg-yellow-500/20 border-yellow-500/30';
    return 'bg-red-500/20 border-red-500/30';
  };

  const diskHitRate = stats ? stats.diskHits / Math.max(stats.diskHits + stats.diskMisses, 1) : 0;

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-white/60 mt-4">Loading cache statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">Cache Management</h2>
            <p className="text-white/60 text-sm">Monitor and manage application cache</p>
          </div>
        </div>
        <motion.button
          onClick={loadStatistics}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="p-3 bg-slate-800/50 hover:bg-slate-700/50 rounded-xl border border-purple-500/20 transition-all"
        >
          <RefreshCw className="w-5 h-5" />
        </motion.button>
      </div>

      {/* Alerts */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-medium">Error</p>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-400 text-sm font-medium">Success</p>
            <p className="text-green-400/80 text-sm mt-1">{success}</p>
          </div>
        </motion.div>
      )}

      {/* Overall Statistics */}
      {stats && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Hit Rate</h3>
                <TrendingUp className={`w-5 h-5 ${getHitRateColor(stats.hitRate)}`} />
              </div>
              <div className={`text-4xl font-bold mb-2 ${getHitRateColor(stats.hitRate)}`}>
                {(stats.hitRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-white/60">
                {stats.totalHits.toLocaleString()} hits / {stats.totalMisses.toLocaleString()}{' '}
                misses
              </div>
              <div className="mt-4 h-2 bg-slate-900/50 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    stats.hitRate >= 0.8
                      ? 'bg-green-500'
                      : stats.hitRate >= 0.5
                        ? 'bg-yellow-500'
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${stats.hitRate * 100}%` }}
                />
              </div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Cache Size</h3>
                <Database className="w-5 h-5 text-blue-400" />
              </div>
              <div className="text-4xl font-bold mb-2 text-blue-400">
                {formatBytes(stats.totalSizeBytes)}
              </div>
              <div className="text-sm text-white/60">
                {stats.totalEntries.toLocaleString()} entries
              </div>
              <div className="mt-4 h-2 bg-slate-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{
                    width: `${Math.min((stats.totalSizeBytes / (100 * 1024 * 1024)) * 100, 100)}%`,
                  }}
                />
              </div>
              <div className="text-xs text-white/40 mt-1">Max: 100 MB</div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Evictions</h3>
                <Trash2 className="w-5 h-5 text-purple-400" />
              </div>
              <div className="text-4xl font-bold mb-2 text-purple-400">
                {stats.totalEvictions.toLocaleString()}
              </div>
              <div className="text-sm text-white/60">Last warmed:</div>
              <div className="text-xs text-white/40 mt-1">{formatTimestamp(stats.lastWarmed)}</div>
            </div>

            <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Disk Cache</h3>
                <Database className="w-5 h-5 text-cyan-400" />
              </div>
              <div className={`text-4xl font-bold mb-2 ${getHitRateColor(diskHitRate)}`}>
                {(diskHitRate * 100).toFixed(1)}%
              </div>
              <div className="text-sm text-white/60">
                {stats.diskHits.toLocaleString()} hits / {stats.diskMisses.toLocaleString()} misses
              </div>
              <div className="text-xs text-white/40 mt-1">
                {stats.warmLoads.toLocaleString()} entries warmed from disk
              </div>
            </div>
          </div>

          {/* TTL Configuration */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <Clock className="w-6 h-6 text-orange-400" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold">TTL Configuration</h3>
                <p className="text-sm text-white/60">
                  Configure cache time-to-live for different data types
                </p>
              </div>
            </div>

            <div className="space-y-4">
              {renderTtlControl(
                'Token Prices',
                'prices',
                'Fast-changing real-time token price data'
              )}
              {renderTtlControl(
                'Metadata',
                'metadata',
                'Token info, top coins, trending lists, and market data'
              )}
              {renderTtlControl(
                'History Data',
                'history',
                'Price history and other slow-changing backfill data'
              )}
            </div>

            {ttlChanged && (
              <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <p className="text-sm text-blue-400">
                  You have unsaved TTL configuration changes. Click Save to apply.
                </p>
              </div>
            )}

            <div className="flex gap-3 mt-6">
              <motion.button
                onClick={handleSaveTtlConfig}
                disabled={!ttlChanged || ttlLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <CheckCircle className="w-5 h-5" />
                {ttlLoading ? 'Saving...' : 'Save TTL Configuration'}
              </motion.button>

              <motion.button
                onClick={handleResetTtlConfig}
                disabled={ttlLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="py-3 px-6 bg-slate-700/50 hover:bg-slate-600/50 border border-purple-500/20 rounded-xl font-semibold transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                <RefreshCw className="w-5 h-5" />
                Reset
              </motion.button>
            </div>
          </div>

          {/* Cache Performance Test */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
            <div className="flex items-center gap-3 mb-4">
              <FlaskConical className="w-6 h-6 text-cyan-400" />
              <div className="flex-1">
                <h3 className="text-xl font-semibold">Cache Performance Test</h3>
                <p className="text-sm text-white/60">
                  Verify cache efficiency and performance improvements
                </p>
              </div>
            </div>

            <motion.button
              onClick={handleTestCache}
              disabled={testing}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full py-4 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-xl font-semibold text-white shadow-lg shadow-cyan-500/30 hover:shadow-cyan-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Gauge className="w-5 h-5" />
              {testing ? 'Running Test...' : 'Run Performance Test'}
            </motion.button>

            {testResult && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-4 p-4 rounded-xl border ${
                  testResult.passed
                    ? 'bg-green-500/10 border-green-500/30'
                    : 'bg-amber-500/10 border-amber-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  {testResult.passed ? (
                    <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1">
                    <p
                      className={`font-semibold ${testResult.passed ? 'text-green-400' : 'text-amber-400'}`}
                    >
                      {testResult.testName}
                    </p>
                    <p className="text-sm mt-1 text-white/80">{testResult.message}</p>
                    <div className="grid grid-cols-2 gap-3 mt-3 text-sm">
                      <div>
                        <p className="text-white/40">Cached Latency</p>
                        <p className="font-semibold text-emerald-400">
                          {testResult.cachedLatencyMs.toFixed(3)}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40">Uncached Latency</p>
                        <p className="font-semibold text-red-400">
                          {testResult.uncachedLatencyMs.toFixed(3)}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40">Improvement</p>
                        <p className="font-semibold text-cyan-400">
                          {testResult.latencyImprovementPercent.toFixed(1)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-white/40">Test Hit Rate</p>
                        <p className="font-semibold text-purple-400">
                          {(testResult.hitRate * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* Per-Type Statistics */}
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
            <h3 className="text-xl font-semibold mb-4">Cache Statistics by Type</h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-purple-500/20">
                    <th className="text-left py-3 px-4 text-sm font-medium text-white/60">Type</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">
                      Hit Rate
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">Hits</th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">
                      Misses
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">
                      Entries
                    </th>
                    <th className="text-right py-3 px-4 text-sm font-medium text-white/60">Size</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(stats.perTypeStats).map(([type, typeStats]) => (
                    <tr
                      key={type}
                      className="border-b border-purple-500/10 hover:bg-slate-700/30 transition-colors"
                    >
                      <td className="py-3 px-4 font-medium">{type}</td>
                      <td className="text-right py-3 px-4">
                        <span className={`font-semibold ${getHitRateColor(typeStats.hitRate)}`}>
                          {(typeStats.hitRate * 100).toFixed(1)}%
                        </span>
                      </td>
                      <td className="text-right py-3 px-4 text-white/60">
                        {typeStats.hits.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-white/60">
                        {typeStats.misses.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-white/60">
                        {typeStats.entries.toLocaleString()}
                      </td>
                      <td className="text-right py-3 px-4 text-white/60">
                        {formatBytes(typeStats.sizeBytes)}
                      </td>
                    </tr>
                  ))}
                  {Object.keys(stats.perTypeStats).length === 0 && (
                    <tr>
                      <td colSpan={6} className="text-center py-8 text-white/40">
                        No cache data available
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-4">
            <motion.button
              onClick={handleWarmCache}
              disabled={warming}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-4 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-xl font-semibold text-white shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Zap className="w-5 h-5" />
              {warming ? 'Warming Cache...' : 'Warm Cache Now'}
            </motion.button>

            <motion.button
              onClick={handleClearCache}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="py-4 px-6 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-semibold text-red-400 transition-all flex items-center justify-center gap-2"
            >
              <Trash2 className="w-5 h-5" />
              Clear Cache
            </motion.button>
          </div>

          {/* Warm Progress */}
          {warmProgress && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl"
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-blue-400">Cache Warming Progress</span>
                <span className="text-sm font-bold text-blue-400">
                  {warmProgress.percentage.toFixed(0)}%
                </span>
              </div>
              <div className="h-2 bg-slate-900/50 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-300"
                  style={{ width: `${warmProgress.percentage}%` }}
                />
              </div>
              <div className="text-xs text-white/60 mt-2">
                {warmProgress.completed} of {warmProgress.total} entries warmed
              </div>
            </motion.div>
          )}
        </>
      )}
    </div>
  );
}
