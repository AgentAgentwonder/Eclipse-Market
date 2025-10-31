import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Activity, Gauge, Radar } from 'lucide-react';
import { GaugeReading, SentimentSnapshot } from '../../hooks/useSocialData';
import { formatDistanceToNow } from 'date-fns';

interface SocialMomentumOverviewProps {
  snapshots: SentimentSnapshot[];
  gauges: GaugeReading[];
  onRunAnalysis?: (token?: string) => void;
  isRefreshing?: boolean;
}

const levelColors: Record<string, string> = {
  extreme: 'text-pink-400',
  high: 'text-orange-400',
  elevated: 'text-amber-400',
  moderate: 'text-lime-400',
  calm: 'text-sky-400',
  low: 'text-slate-400',
};

export function SocialMomentumOverview({ snapshots, gauges, onRunAnalysis, isRefreshing }: SocialMomentumOverviewProps) {
  const primarySnapshot = snapshots[0];

  const gaugeByToken = useMemo(() => {
    return gauges.reduce<Record<string, GaugeReading>>((acc, gauge) => {
      acc[gauge.token] = gauge;
      return acc;
    }, {});
  }, [gauges]);

  if (!primarySnapshot) {
    return (
      <div className="glass-panel rounded-3xl p-8 border border-dashed border-slate-600 text-sm text-slate-400 flex flex-col items-center justify-center gap-3">
        <Activity className="w-8 h-8 text-slate-500" />
        <div>No social intelligence snapshots available yet. Run an analysis to populate metrics.</div>
        <button
          onClick={() => onRunAnalysis?.()}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/80 to-indigo-500/80 text-white hover:from-purple-500 hover:to-indigo-500 transition shadow-lg shadow-purple-500/20"
        >
          Run Global Analysis
        </button>
      </div>
    );
  }

  const cards = snapshots.slice(0, 3).map(snapshot => {
    const gauge = gaugeByToken[snapshot.token];
    const positivePct = snapshot.positive_mentions / Math.max(snapshot.mention_count, 1);
    const negativePct = snapshot.negative_mentions / Math.max(snapshot.mention_count, 1);

    return {
      token: snapshot.token,
      score: snapshot.avg_score,
      mentions: snapshot.mention_count,
      momentum: snapshot.momentum,
      positivePct,
      negativePct,
      gauge,
      lastUpdated: snapshot.updated_at,
    };
  });

  return (
    <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
      {cards.map(card => {
        const gauge = card.gauge;
        const fomoLevel = gauge ? levelColors[gauge.fomo_level] ?? 'text-orange-300' : 'text-orange-300';
        const fudLevel = gauge ? levelColors[gauge.fud_level] ?? 'text-slate-400' : 'text-slate-400';

        return (
          <motion.div
            key={card.token}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.05 }}
            className="glass-card rounded-3xl p-6 border border-slate-700/60"
          >
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-white/90">{card.token}</h3>
                <p className="text-xs text-slate-400 mt-1">
                  Last updated {formatDistanceToNow(card.lastUpdated * 1000, { addSuffix: true })}
                </p>
              </div>
              <button
                onClick={() => onRunAnalysis?.(card.token)}
                className="text-xs px-3 py-1 rounded-lg border border-slate-600/60 text-slate-300 hover:text-white hover:border-slate-500/80 transition"
              >
                Refresh token
              </button>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-slate-400">Sentiment</span>
                  <TrendingUp className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-semibold mt-2 text-emerald-300">
                  {(card.score >= 0 ? '+' : '') + card.score.toFixed(2)}
                </div>
                <div className="text-xs text-slate-500">Momentum {(card.momentum >= 0 ? '+' : '') + card.momentum.toFixed(2)}</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800/60">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase tracking-wide text-slate-400">Mentions</span>
                  <Activity className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-semibold mt-2 text-white/90">
                  {card.mentions.toLocaleString()}
                </div>
                <div className="text-xs text-slate-500">{(card.positivePct * 100).toFixed(0)}% positive · {(card.negativePct * 100).toFixed(0)}% negative</div>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-slate-900/50 border border-slate-800/60 p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wide text-slate-400">FOMO / FUD Gauges</span>
                <Gauge className="w-4 h-4 text-purple-400" />
              </div>
              {gauge ? (
                <div className="mt-3 grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className={`text-lg font-medium ${fomoLevel}`}>{(gauge.fomo_score * 100).toFixed(0)}%</div>
                      <span className="text-xs uppercase tracking-wide text-slate-400">FOMO</span>
                    </div>
                    <div className="text-xs text-slate-500 capitalize">{gauge.fomo_level}</div>
                    <div className="h-2 rounded-full bg-slate-800 mt-1">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-amber-400 via-orange-500 to-pink-500"
                        style={{ width: `${Math.min(gauge.fomo_score, 1) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1">
                    <div className="flex items-center gap-2">
                      <div className={`text-lg font-medium ${fudLevel}`}>{(gauge.fud_score * 100).toFixed(0)}%</div>
                      <span className="text-xs uppercase tracking-wide text-slate-400">FUD</span>
                    </div>
                    <div className="text-xs text-slate-500 capitalize">{gauge.fud_level}</div>
                    <div className="h-2 rounded-full bg-slate-800 mt-1">
                      <div
                        className="h-2 rounded-full bg-gradient-to-r from-slate-600 via-indigo-500 to-purple-500"
                        style={{ width: `${Math.min(gauge.fud_score, 1) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="mt-3 text-xs text-slate-500">No gauge data available for this token</div>
              )}

              {gauge && (
                <div className="mt-4 grid grid-cols-2 gap-2 text-xs text-slate-400">
                  {Object.entries(gauge.drivers).map(([driver, value]) => (
                    <div key={driver} className="flex items-center gap-2 bg-slate-950/50 border border-slate-900 rounded-xl px-3 py-2">
                      <Radar className="w-3 h-3 text-purple-400" />
                      <span className="flex-1 capitalize">{driver.replace(/_/g, ' ')}</span>
                      <span className="text-white/80">{(value * 100).toFixed(0)}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        );
      })}

      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="glass-panel rounded-3xl p-6 border border-slate-700/80 flex flex-col justify-between"
      >
        <div>
          <h3 className="text-lg font-semibold text-white/90">Global Momentum</h3>
          <p className="text-sm text-slate-400 mt-2">
            Aggregate social velocity across tracked tokens with sentiment-driven alerting thresholds.
          </p>
        </div>
        <div className="space-y-4 mt-6 text-sm">
          <div className="flex items-center justify-between">
            <span className="text-slate-400">Tracked tokens</span>
            <span className="text-white/90">{snapshots.length}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">High FOMO tokens</span>
            <span className="text-white/90">
              {gauges.filter(g => g.fomo_score > 0.75).length}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400">High FUD tokens</span>
            <span className="text-white/90">
              {gauges.filter(g => g.fud_score > 0.75).length}
            </span>
          </div>
        </div>
        <button
          onClick={() => onRunAnalysis?.()}
          disabled={isRefreshing}
          className="mt-6 px-4 py-3 rounded-xl bg-gradient-to-r from-indigo-500/80 to-purple-500/90 text-white font-medium hover:from-indigo-500 hover:to-purple-500 transition disabled:opacity-50"
        >
          {isRefreshing ? 'Refreshing...' : 'Refresh All Tokens'}
        </button>
      </motion.div>
    </div>
  );
}
