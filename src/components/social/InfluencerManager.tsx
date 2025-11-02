import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Star, TrendingUp, Users, Search, Filter, Trash2, Plus } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { InfluencerScore } from '../../hooks/useSocialData';

interface InfluencerManagerProps {
  influencers: InfluencerScore[];
  onRefresh?: (minImpact?: number) => void;
  isLoading?: boolean;
}

export function InfluencerManager({ influencers, onRefresh, isLoading }: InfluencerManagerProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [minImpactFilter, setMinImpactFilter] = useState<number>(0);
  const [sortBy, setSortBy] = useState<'impact_score' | 'post_count' | 'total_engagement'>('impact_score');

  const filteredInfluencers = useMemo(() => {
    let filtered = influencers.filter(inf => {
      const matchesSearch =
        searchQuery === '' ||
        inf.author.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
        inf.token?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesImpact = inf.impact_score >= minImpactFilter;

      return matchesSearch && matchesImpact;
    });

    filtered = filtered.sort((a, b) => {
      switch (sortBy) {
        case 'impact_score':
          return b.impact_score - a.impact_score;
        case 'post_count':
          return b.post_count - a.post_count;
        case 'total_engagement':
          return b.total_engagement - a.total_engagement;
        default:
          return 0;
      }
    });

    return filtered;
  }, [influencers, searchQuery, minImpactFilter, sortBy]);

  const impactLevelColor = (score: number) => {
    if (score >= 0.8) return 'text-pink-400';
    if (score >= 0.6) return 'text-orange-400';
    if (score >= 0.4) return 'text-yellow-400';
    if (score >= 0.2) return 'text-lime-400';
    return 'text-slate-400';
  };

  const impactLevelLabel = (score: number) => {
    if (score >= 0.8) return 'Extreme Impact';
    if (score >= 0.6) return 'High Impact';
    if (score >= 0.4) return 'Moderate Impact';
    if (score >= 0.2) return 'Low Impact';
    return 'Minimal Impact';
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-700/60">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
            Influencer Dashboard
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Track high-impact social accounts with sentiment-weighted engagement metrics.
          </p>
        </div>

        <button
          onClick={() => onRefresh?.(minImpactFilter)}
          disabled={isLoading}
          className="px-4 py-2 rounded-xl bg-purple-500/20 border border-purple-500/40 text-purple-300 text-sm font-medium hover:bg-purple-500/30 transition disabled:opacity-50"
        >
          {isLoading ? 'Refreshing…' : 'Refresh Scores'}
        </button>
      </div>

      <div className="flex flex-wrap gap-3 mb-6">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search influencers, tokens…"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-slate-900/80 border border-slate-700/70 rounded-xl pl-10 pr-4 py-2 text-sm text-white/90 focus:outline-none focus:ring-2 focus:ring-purple-500/40"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs">
          <Filter className="w-3 h-3 text-slate-400" />
          <label className="text-slate-400">Min Impact:</label>
          <input
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={minImpactFilter}
            onChange={e => setMinImpactFilter(parseFloat(e.target.value) || 0)}
            className="w-16 bg-transparent text-white/80 focus:outline-none"
          />
        </div>

        <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 rounded-xl px-3 py-2 text-xs">
          <TrendingUp className="w-3 h-3 text-slate-400" />
          <label className="text-slate-400">Sort by:</label>
          <select
            value={sortBy}
            onChange={e => setSortBy(e.target.value as typeof sortBy)}
            className="bg-transparent text-white/80 focus:outline-none"
          >
            <option value="impact_score">Impact Score</option>
            <option value="post_count">Post Count</option>
            <option value="total_engagement">Total Engagement</option>
          </select>
        </div>
      </div>

      <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2">
        {filteredInfluencers.length === 0 && !isLoading && (
          <div className="rounded-2xl border border-dashed border-slate-700/60 px-4 py-10 text-center text-sm text-slate-400">
            No influencers match your filters. Try adjusting the search or impact threshold.
          </div>
        )}

        {isLoading && (
          <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-6 text-center text-sm text-slate-400">
            Loading influencer scores…
          </div>
        )}

        {filteredInfluencers.map((influencer, idx) => {
          const impactColor = impactLevelColor(influencer.impact_score);
          const impactLabel = impactLevelLabel(influencer.impact_score);

          return (
            <motion.div
              key={`${influencer.author}-${influencer.source}-${influencer.token ?? 'global'}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="relative rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`rounded-full w-12 h-12 flex items-center justify-center font-bold text-lg border-2 ${impactColor} bg-slate-950`}
                  style={{
                    borderColor: `var(--tw-text-opacity, 1)`,
                  }}
                >
                  {influencer.author[0]?.toUpperCase()}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-white/90">{influencer.author}</div>
                      <span className="px-2 py-0.5 rounded-md bg-slate-800/60 border border-slate-700/60 text-xs uppercase text-slate-400">
                        {influencer.source}
                      </span>
                    </div>
                    <button
                      className="text-slate-400 hover:text-rose-400 transition"
                      onClick={() => {
                        // TODO: Integrate with influencer tracking removal
                        console.log('Remove influencer:', influencer.author);
                      }}
                      title="Remove from tracking"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {influencer.token && (
                    <div className="text-xs text-slate-400 mb-2">Tracked for: {influencer.token}</div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                    <div className="rounded-xl bg-slate-950/60 border border-slate-900 px-3 py-2">
                      <div className="text-slate-400 mb-1">Impact Score</div>
                      <div className={`text-lg font-semibold ${impactColor}`}>
                        {(influencer.impact_score * 100).toFixed(0)}%
                      </div>
                      <div className="text-slate-500 text-[10px]">{impactLabel}</div>
                    </div>

                    <div className="rounded-xl bg-slate-950/60 border border-slate-900 px-3 py-2">
                      <div className="text-slate-400 mb-1">Posts</div>
                      <div className="text-lg font-semibold text-white/90">
                        {influencer.post_count.toLocaleString()}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-950/60 border border-slate-900 px-3 py-2">
                      <div className="text-slate-400 mb-1">Engagement</div>
                      <div className="text-lg font-semibold text-sky-300">
                        {influencer.total_engagement.toLocaleString()}
                      </div>
                    </div>

                    <div className="rounded-xl bg-slate-950/60 border border-slate-900 px-3 py-2">
                      <div className="text-slate-400 mb-1">Avg Sentiment</div>
                      <div className={`text-lg font-semibold ${influencer.avg_sentiment >= 0 ? 'text-emerald-300' : 'text-rose-300'}`}>
                        {(influencer.avg_sentiment >= 0 ? '+' : '')}{influencer.avg_sentiment.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  <div className="mt-3 text-xs text-slate-400">
                    Last computed {formatDistanceToNow(influencer.computed_at * 1000, { addSuffix: true })}
                  </div>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 pt-6 border-t border-slate-800/60">
        <button
          className="w-full py-3 rounded-xl border-2 border-dashed border-purple-500/40 text-purple-300 font-medium hover:bg-purple-500/10 transition flex items-center justify-center gap-2"
          onClick={() => {
            // TODO: Integrate influencer manual add flow
            console.log('Add influencer tracking');
          }}
        >
          <Plus className="w-4 h-4" />
          Track New Influencer
        </button>
      </div>
    </div>
  );
}
