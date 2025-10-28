import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import { Database, Trash2, RefreshCw, TrendingUp, HardDrive, Activity, Clock } from 'lucide-react';

interface CacheTypeSummary {
  type: string;
  hits: number;
  misses: number;
  hitRate: number;
  evictions: number;
  entries: number;
  sizeBytes: number;
}

interface CacheWarmingProgress {
  startedAt: number | null;
  completedAt: number | null;
  totalItems: number;
  processedItems: number;
  inProgress: boolean;
}

interface CacheStatistics {
  totalEntries: number;
  totalSizeBytes: number;
  totalHits: number;
  totalMisses: number;
  totalHitRate: number;
  totalEvictions: number;
  perType: CacheTypeSummary[];
  warming: CacheWarmingProgress;
  ttlConfig: CacheTTLConfig;
}

interface CacheTTLConfig {
  price: number | null;
  token_metadata: number | null;
  historical: number | null;
  user_settings: number | null;
}

interface WarmRequest {
  key: string;
  type: 'price' | 'token_metadata' | 'historical' | 'user_settings';
  value?: any;
}

export function CacheSettings() {
  const [stats, setStats] = useState<CacheStatistics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [ttlConfig, setTtlConfig] = useState<CacheTTLConfig>({
    price: 1,
    token_metadata: 3600,
    historical: 86400,
    user_settings: null,
  });
  const [warmingKeys, setWarmingKeys] = useState<string>('');

  useEffect(() => {
    loadStats();
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      if (stats?.warming?.inProgress) {
        loadStats();
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [stats?.warming?.inProgress]);

  const loadStats = async () => {
    try {
      setLoading(true);
      const result = await invoke<CacheStatistics>('get_cache_stats');
      setStats(result);
      setTtlConfig(result.ttlConfig);
      setError(null);
    } catch (err) {
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const clearCache = async (cacheType: string) => {
    try {
      await invoke('clear_cache', { cacheType });
      setSuccess(`Cleared ${cacheType} cache`);
      loadStats();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err as string);
    }
  };

  const clearAllCaches = async () => {
    try {
      await invoke('clear_all_caches');
      setSuccess('Cleared all caches');
      loadStats();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err as string);
    }
  };

  const warmCache = async () => {
    if (!warmingKeys.trim()) {
      setError('Please enter at least one key to warm');
      return;
    }

    try {
      const keys = warmingKeys.split('\n').map((k) => k.trim()).filter((k) => k);
      const requests: WarmRequest[] = keys.map((key) => ({
        key,
        type: 'price',
        value: undefined,
      }));

      await invoke('warm_cache', { requests });
      setSuccess('Cache warming started');
      loadStats();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err as string);
    }
  };

  const updateTTL = async () => {
    try {
      await invoke('update_cache_ttl', { config: ttlConfig });
      setSuccess('TTL configuration updated');
      loadStats();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err as string);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const formatTTL = (seconds: number | null) => {
    if (seconds === null) return 'Never';
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
    return `${Math.floor(seconds / 86400)}d`;
  };

  const getCacheTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      price: 'Price Data',
      token_metadata: 'Token Metadata',
      historical: 'Historical Data',
      user_settings: 'User Settings',
    };
    return labels[type] || type;
  };

  if (loading && !stats) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-white/60 mt-4">Loading cache statistics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold mb-2">Cache Management</h2>
        <p className="text-white/60">Monitor and manage application cache</p>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
        >
          <Activity className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
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
          <Activity className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-400 text-sm font-medium">Success</p>
            <p className="text-green-400/80 text-sm mt-1">{success}</p>
          </div>
        </motion.div>
      )}

      {/* Overall Stats */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Total Entries</span>
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-2xl font-bold">{stats.totalEntries.toLocaleString()}</p>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Cache Size</span>
              <HardDrive className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-2xl font-bold">{formatBytes(stats.totalSizeBytes)}</p>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Hit Rate</span>
              <TrendingUp className="w-5 h-5 text-green-400" />
            </div>
            <p className="text-2xl font-bold">{stats.totalHitRate.toFixed(1)}%</p>
          </div>

          <div className="bg-slate-800/50 rounded-2xl p-4 border border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <span className="text-white/60 text-sm">Evictions</span>
              <Activity className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-2xl font-bold">{stats.totalEvictions.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Per-Type Stats */}
      {stats && stats.perType.length > 0 && (
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <h3 className="text-xl font-bold mb-4">Cache by Type</h3>
          <div className="space-y-4">
            {stats.perType.map((cache) => (
              <div key={cache.type} className="bg-slate-900/50 rounded-2xl p-4 border border-purple-500/10">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{getCacheTypeLabel(cache.type)}</h4>
                  <button
                    onClick={() => clearCache(cache.type)}
                    className="p-2 rounded-lg hover:bg-red-500/20 text-red-400 transition-colors"
                    title="Clear cache"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                  <div>
                    <span className="text-white/60">Entries</span>
                    <p className="font-semibold">{cache.entries.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Size</span>
                    <p className="font-semibold">{formatBytes(cache.sizeBytes)}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Hit Rate</span>
                    <p className={`font-semibold ${cache.hitRate >= 80 ? 'text-green-400' : cache.hitRate >= 50 ? 'text-yellow-400' : 'text-red-400'}`}>
                      {cache.hitRate.toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-white/60">Hits</span>
                    <p className="font-semibold">{cache.hits.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Misses</span>
                    <p className="font-semibold">{cache.misses.toLocaleString()}</p>
                  </div>
                  <div>
                    <span className="text-white/60">Evictions</span>
                    <p className="font-semibold">{cache.evictions.toLocaleString()}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TTL Configuration */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-6 h-6 text-purple-400" />
          <h3 className="text-xl font-bold">TTL Configuration</h3>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-2 block">
              Price Data TTL (seconds, 1 = 1 second)
            </label>
            <input
              type="number"
              value={ttlConfig.price || ''}
              onChange={(e) => setTtlConfig({ ...ttlConfig, price: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl focus:outline-none focus:border-purple-500/50"
            />
            <p className="text-xs text-white/40 mt-1">Current: {formatTTL(ttlConfig.price)}</p>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">
              Token Metadata TTL (seconds, 3600 = 1 hour)
            </label>
            <input
              type="number"
              value={ttlConfig.token_metadata || ''}
              onChange={(e) => setTtlConfig({ ...ttlConfig, token_metadata: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl focus:outline-none focus:border-purple-500/50"
            />
            <p className="text-xs text-white/40 mt-1">Current: {formatTTL(ttlConfig.token_metadata)}</p>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">
              Historical Data TTL (seconds, 86400 = 1 day)
            </label>
            <input
              type="number"
              value={ttlConfig.historical || ''}
              onChange={(e) => setTtlConfig({ ...ttlConfig, historical: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl focus:outline-none focus:border-purple-500/50"
            />
            <p className="text-xs text-white/40 mt-1">Current: {formatTTL(ttlConfig.historical)}</p>
          </div>

          <div>
            <label className="text-sm text-white/60 mb-2 block">
              User Settings TTL (seconds, leave blank for no expiry)
            </label>
            <input
              type="number"
              value={ttlConfig.user_settings || ''}
              onChange={(e) => setTtlConfig({ ...ttlConfig, user_settings: e.target.value ? parseInt(e.target.value) : null })}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl focus:outline-none focus:border-purple-500/50"
            />
            <p className="text-xs text-white/40 mt-1">Current: {formatTTL(ttlConfig.user_settings)}</p>
          </div>

          <button
            onClick={updateTTL}
            className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:from-purple-600 hover:to-pink-600 transition-all"
          >
            Update TTL Configuration
          </button>
        </div>
      </div>

      {/* Cache Warming */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
        <div className="flex items-center gap-3 mb-4">
          <RefreshCw className="w-6 h-6 text-blue-400" />
          <h3 className="text-xl font-bold">Cache Warming</h3>
        </div>

        {stats?.warming.inProgress && (
          <div className="mb-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Warming in progress...</span>
              <span className="text-sm text-white/60">
                {stats.warming.processedItems} / {stats.warming.totalItems}
              </span>
            </div>
            <div className="w-full bg-slate-900 rounded-full h-2 overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-300"
                style={{ width: `${(stats.warming.processedItems / stats.warming.totalItems) * 100}%` }}
              />
            </div>
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="text-sm text-white/60 mb-2 block">
              Token Addresses to Pre-load (one per line)
            </label>
            <textarea
              value={warmingKeys}
              onChange={(e) => setWarmingKeys(e.target.value)}
              placeholder="So11111111111111111111111111111111111111112&#10;DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263&#10;JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN"
              rows={5}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl focus:outline-none focus:border-purple-500/50 font-mono text-sm"
            />
          </div>

          <button
            onClick={warmCache}
            disabled={stats?.warming.inProgress}
            className="w-full py-3 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl font-semibold hover:from-blue-600 hover:to-purple-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {stats?.warming.inProgress ? 'Warming...' : 'Warm Cache'}
          </button>
        </div>
      </div>

      {/* Clear All */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-red-500/20 p-6">
        <h3 className="text-xl font-bold mb-4 text-red-400">Danger Zone</h3>
        <p className="text-white/60 text-sm mb-4">Clear all cached data. This cannot be undone.</p>
        <button
          onClick={clearAllCaches}
          className="w-full py-3 bg-red-500 hover:bg-red-600 rounded-xl font-semibold transition-colors"
        >
          Clear All Caches
        </button>
      </div>
    </div>
  );
}
