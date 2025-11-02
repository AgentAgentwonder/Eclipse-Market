import { useState, useCallback, useEffect } from 'react';
import { motion } from 'framer-motion';
import { RefreshCw, Activity, AlertTriangle } from 'lucide-react';
import { useSocialData } from '../hooks/useSocialData';
import { useSentimentStore } from '../store/sentimentStore';
import { SocialMomentumOverview } from '../components/social/SocialMomentumOverview';
import { SentimentTrendChart } from '../components/social/SentimentTrendChart';
import { TrendingMentionsList } from '../components/social/TrendingMentionsList';
import { InfluencerManager } from '../components/social/InfluencerManager';
import { AlertsConfigurator } from '../components/social/AlertsConfigurator';
import { FollowedWalletFeed } from '../components/social/FollowedWalletFeed';

export default function SocialIntelligence() {
  const [selectedToken, setSelectedToken] = useState<string | undefined>(undefined);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const {
    sentimentSnapshots,
    trendingTokens,
    influencers,
    fomoFudGauges,
    mentions,
    mentionAggregates,
    loading,
    error,
    runAnalysis,
    fetchInfluencers,
    fetchMentions,
    fetchMentionAggregates,
    refreshAll,
  } = useSocialData(selectedToken, autoRefresh, 30000);

  const { config, updateConfig, fetchConfig } = useSentimentStore(state => ({
    config: state.config,
    updateConfig: state.updateConfig,
    fetchConfig: state.fetchConfig,
  }));

  useEffect(() => {
    fetchConfig();
  }, [fetchConfig]);

  const handleRunAnalysis = useCallback(
    async (token?: string) => {
      await runAnalysis(token);
    },
    [runAnalysis]
  );

  const handleRefreshMentions = useCallback(() => {
    fetchMentions();
    fetchMentionAggregates();
  }, [fetchMentions, fetchMentionAggregates]);

  const handleSaveAlertConfig = useCallback(
    async (newConfig: typeof config) => {
      if (!newConfig) return;
      setIsSaving(true);
      try {
        await updateConfig(newConfig);
      } catch (err) {
        console.error('Failed to save alert config:', err);
      } finally {
        setIsSaving(false);
      }
    },
    [updateConfig]
  );

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-bold text-white/95">Social Intelligence</h1>
          <p className="text-slate-400 mt-2">
            Real-time sentiment analysis, FOMO/FUD gauges, influencer tracking, and whale signals across social platforms.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900/60 border border-slate-700/70 rounded-xl px-4 py-2 text-sm">
            <span className="text-slate-400">Auto-refresh</span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={() => setAutoRefresh(!autoRefresh)}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-gradient-to-r from-emerald-500 to-cyan-500 transition" />
              <span className="sr-only">Toggle auto-refresh</span>
            </label>
          </div>

          <motion.button
            whileTap={{ scale: 0.96 }}
            onClick={() => refreshAll()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/80 to-indigo-500/80 text-white font-medium shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh All
          </motion.button>
        </div>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel rounded-2xl p-4 border border-rose-500/40 bg-rose-500/5"
        >
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-rose-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <div className="text-sm font-semibold text-rose-300">Error Loading Social Data</div>
              <div className="text-xs text-slate-400 mt-1">{error}</div>
            </div>
          </div>
        </motion.div>
      )}

      <div className="space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <SocialMomentumOverview
            snapshots={sentimentSnapshots}
            gauges={fomoFudGauges}
            onRunAnalysis={handleRunAnalysis}
            isRefreshing={loading}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-semibold text-white/90 flex items-center gap-2">
              <Activity className="w-6 h-6 text-indigo-400" />
              Sentiment Trends
            </h2>
            <div className="flex items-center gap-2 text-xs">
              <label className="text-slate-400">Token Filter:</label>
              <select
                value={selectedToken ?? 'all'}
                onChange={e => setSelectedToken(e.target.value === 'all' ? undefined : e.target.value)}
                className="bg-slate-900/80 border border-slate-700/70 rounded-xl px-3 py-2 text-white/80 focus:outline-none"
              >
                <option value="all">All Tokens</option>
                {Array.from(new Set(sentimentSnapshots.map(s => s.token))).map(token => (
                  <option key={token} value={token}>
                    {token}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <SentimentTrendChart
            trends={trendingTokens}
            snapshots={sentimentSnapshots}
            selectedToken={selectedToken}
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <TrendingMentionsList
            aggregates={mentionAggregates}
            posts={mentions}
            onFilterChange={filters => {
              setSelectedToken(filters.token);
              handleRefreshMentions();
            }}
            isLoading={loading}
          />
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
          >
            <InfluencerManager
              influencers={influencers}
              onRefresh={fetchInfluencers}
              isLoading={loading}
            />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.4 }}
          >
            <AlertsConfigurator
              config={config}
              onSave={handleSaveAlertConfig}
              isSaving={isSaving}
            />
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
        >
          <FollowedWalletFeed isEnabled={false} />
        </motion.div>
      </div>
    </div>
  );
}
