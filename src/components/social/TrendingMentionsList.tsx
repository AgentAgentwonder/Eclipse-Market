import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { Filter, MessageSquare, Hash, Users, Zap, Sparkles } from 'lucide-react';
import { MentionAggregate, SocialPost } from '../../hooks/useSocialData';

interface TrendingMentionsListProps {
  aggregates: MentionAggregate[];
  posts: SocialPost[];
  onFilterChange?: (filters: { source?: string; token?: string; influencer?: string }) => void;
  isLoading?: boolean;
}

const sourceLabels: Record<string, string> = {
  twitter: 'Twitter / X',
  reddit: 'Reddit',
  discord: 'Discord',
  telegram: 'Telegram',
};

export function TrendingMentionsList({ aggregates, posts, onFilterChange, isLoading }: TrendingMentionsListProps) {
  const [sourceFilter, setSourceFilter] = useState<string>('all');
  const [tokenFilter, setTokenFilter] = useState<string>('all');
  const [activePostId, setActivePostId] = useState<string | null>(null);

  const tokenOptions = useMemo(() => {
    const tokens = Array.from(new Set(aggregates.map(agg => agg.token)));
    return tokens.sort();
  }, [aggregates]);

  const filteredAggregates = useMemo(() => {
    return aggregates.filter(agg => {
      const matchesSource = sourceFilter === 'all' || agg.source === sourceFilter;
      const matchesToken = tokenFilter === 'all' || agg.token === tokenFilter;
      return matchesSource && matchesToken;
    });
  }, [aggregates, sourceFilter, tokenFilter]);

  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const matchesSource = sourceFilter === 'all' || post.source === sourceFilter;
      const matchesToken = tokenFilter === 'all' || post.token === tokenFilter;
      return matchesSource && matchesToken;
    });
  }, [posts, sourceFilter, tokenFilter]);

  const handleSourceChange = (source: string) => {
    setSourceFilter(source);
    onFilterChange?.({
      source: source === 'all' ? undefined : source,
      token: tokenFilter === 'all' ? undefined : tokenFilter,
    });
  };

  const handleTokenChange = (token: string) => {
    setTokenFilter(token);
    onFilterChange?.({
      source: sourceFilter === 'all' ? undefined : sourceFilter,
      token: token === 'all' ? undefined : token,
    });
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-700/60">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <MessageSquare className="w-5 h-5 text-emerald-400" />
            Trending Mentions
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Explore cross-platform chatter velocity, weighted by sentiment polarity and engagement.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 rounded-xl px-3 py-2">
            <Filter className="w-3 h-3 text-slate-400" />
            <select
              value={sourceFilter}
              onChange={event => handleSourceChange(event.target.value)}
              className="bg-transparent focus:outline-none text-white/80"
            >
              <option value="all">All Sources</option>
              {Array.from(new Set(aggregates.map(agg => agg.source))).map(source => (
                <option key={source} value={source}>
                  {sourceLabels[source] ?? source}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2 bg-slate-900/80 border border-slate-700/70 rounded-xl px-3 py-2">
            <Hash className="w-3 h-3 text-slate-400" />
            <select
              value={tokenFilter}
              onChange={event => handleTokenChange(event.target.value)}
              className="bg-transparent focus:outline-none text-white/80"
            >
              <option value="all">All Tokens</option>
              {tokenOptions.map(token => (
                <option key={token} value={token}>
                  {token}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-5 gap-6">
        <div className="lg:col-span-2 space-y-3 overflow-y-auto max-h-[420px] pr-2">
          <AnimatePresence>
            {filteredAggregates.length === 0 && !isLoading && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="rounded-2xl border border-dashed border-slate-700/60 px-4 py-8 text-center text-sm text-slate-400"
              >
                No matches for the selected filters.
              </motion.div>
            )}

            {filteredAggregates.map(aggregate => {
              const total = aggregate.mention_count;
              const posPct = total ? aggregate.positive_count / total : 0;
              const negPct = total ? aggregate.negative_count / total : 0;
              const neuPct = total ? aggregate.neutral_count / total : 0;
              const isActive = filteredPosts.some(post => post.token === aggregate.token);

              return (
                <motion.button
                  key={`${aggregate.token}-${aggregate.source}`}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  onClick={() => {
                    const token = aggregate.token;
                    if (tokenFilter !== token) {
                      handleTokenChange(token);
                    }
                    setActivePostId(null);
                  }}
                  className={`w-full text-left rounded-2xl border px-4 py-3 transition ${
                    isActive
                      ? 'border-emerald-500/40 bg-emerald-500/10 shadow-lg shadow-emerald-500/10'
                      : 'border-slate-800/60 bg-slate-900/70 hover:border-emerald-400/30'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs text-slate-400">
                    <span className="uppercase tracking-wide">
                      {sourceLabels[aggregate.source] ?? aggregate.source}
                    </span>
                    <span>{formatDistanceToNow(aggregate.last_updated * 1000, { addSuffix: true })}</span>
                  </div>
                  <div className="mt-2 flex items-baseline justify-between gap-3">
                    <div>
                      <div className="text-sm text-slate-300">{aggregate.token}</div>
                      <div className="text-lg font-semibold text-white/90">
                        {aggregate.mention_count.toLocaleString()} mentions
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 text-xs text-slate-400">
                      <span className="text-emerald-300">{(posPct * 100).toFixed(0)}% positive</span>
                      <span className="text-rose-300">{(negPct * 100).toFixed(0)}% negative</span>
                      <span className="text-slate-300">{(neuPct * 100).toFixed(0)}% neutral</span>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-slate-950/60 rounded-full overflow-hidden">
                    <div className="h-full bg-gradient-to-r from-emerald-400/80 to-emerald-500/80" style={{ width: `${posPct * 100}%` }} />
                    <div className="h-full bg-gradient-to-r from-rose-400/80 to-rose-500/80" style={{ width: `${negPct * 100}%` }} />
                    <div className="h-full bg-gradient-to-r from-slate-500/80 to-slate-400/80" style={{ width: `${neuPct * 100}%` }} />
                  </div>
                </motion.button>
              );
            })}
          </AnimatePresence>
        </div>

        <div className="lg:col-span-3 space-y-3 max-h-[420px] overflow-y-auto pr-2">
          {isLoading && (
            <div className="rounded-2xl border border-slate-800/60 bg-slate-900/60 px-4 py-6 text-center text-sm text-slate-400">
              Loading mentions…
            </div>
          )}

          {!isLoading && filteredPosts.length === 0 && (
            <div className="rounded-2xl border border-dashed border-slate-700/60 px-4 py-8 text-center text-sm text-slate-400">
              No posts available for the selected filters.
            </div>
          )}

          <AnimatePresence>
            {filteredPosts.map(post => (
              <motion.div
                key={post.id}
                layout
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="relative rounded-2xl border border-slate-800/60 bg-slate-900/60 p-4"
              >
                <div className="flex items-start gap-4">
                  <div className="rounded-full w-10 h-10 bg-gradient-to-br from-emerald-500/20 to-cyan-500/20 border border-emerald-500/20 flex items-center justify-center">
                    <Users className="w-5 h-5 text-emerald-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-slate-400">
                      <span className="font-medium text-white/80">{post.author || 'Unknown'}</span>
                      <span>{formatDistanceToNow(post.timestamp * 1000, { addSuffix: true })}</span>
                    </div>
                    <div className="text-sm text-slate-200 mt-2 whitespace-pre-line">
                      {post.text}
                    </div>
                    {post.token && (
                      <div className="mt-2 inline-flex items-center gap-2 text-xs uppercase tracking-wide text-emerald-400">
                        <Sparkles className="w-3 h-3" />
                        {post.token}
                      </div>
                    )}
                    <div className="mt-3 text-xs text-slate-400 flex justify-between">
                      <span>Source: {sourceLabels[post.source] ?? post.source}</span>
                      <span>Engagement: {post.engagement.toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
