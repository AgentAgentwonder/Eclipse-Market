import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendRecord, SentimentSnapshot } from '../../hooks/useSocialData';
import { TrendingUp, Activity } from 'lucide-react';

interface SentimentTrendChartProps {
  trends: TrendRecord[];
  snapshots: SentimentSnapshot[];
  selectedToken?: string;
}

export function SentimentTrendChart({ trends, snapshots, selectedToken }: SentimentTrendChartProps) {
  const chartData = useMemo(() => {
    const filteredTrends = selectedToken
      ? trends.filter(t => t.token === selectedToken)
      : trends;

    const grouped = filteredTrends.reduce<Record<string, TrendRecord[]>>((acc, trend) => {
      const key = trend.token;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(trend);
      return acc;
    }, {});

    const series = Object.entries(grouped).map(([token, tokenTrends]) => {
      const sortedTrends = tokenTrends.sort((a, b) => a.window_minutes - b.window_minutes);
      return {
        token,
        data: sortedTrends.map(trend => ({
          time: `${trend.window_minutes}m`,
          minutes: trend.window_minutes,
          mentions: trend.mentions,
          velocity: trend.velocity,
          acceleration: trend.acceleration,
          sentiment_avg: trend.sentiment_avg,
          engagement: trend.engagement_total,
        })),
      };
    });

    return series;
  }, [trends, selectedToken]);

  const snapshotMap = useMemo(() => {
    return snapshots.reduce<Record<string, SentimentSnapshot>>((acc, snap) => {
      acc[snap.token] = snap;
      return acc;
    }, {});
  }, [snapshots]);

  if (chartData.length === 0) {
    return (
      <div className="glass-panel rounded-3xl p-8 border border-dashed border-slate-600 text-sm text-slate-400 flex items-center justify-center gap-3">
        <TrendingUp className="w-8 h-8 text-slate-500" />
        <span>No trend data available. Run analysis to compute token trends.</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {chartData.slice(0, 5).map((series, idx) => {
        const snapshot = snapshotMap[series.token];

        return (
          <div key={series.token} className="glass-card rounded-3xl p-6 border border-slate-700/60">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-purple-400" />
                  {series.token}
                </h3>
                {snapshot && (
                  <p className="text-xs text-slate-400 mt-1">
                    {snapshot.mention_count.toLocaleString()} mentions · Sentiment: {(snapshot.avg_score >= 0 ? '+' : '')}{snapshot.avg_score.toFixed(2)}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="text-sm text-slate-400">Latest Velocity</div>
                <div className="text-xl font-semibold text-sky-300">
                  {series.data[series.data.length - 1]?.velocity.toFixed(2) ?? 0}/min
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={series.data}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                <XAxis
                  dataKey="time"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="left"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  stroke="rgba(255,255,255,0.3)"
                  tick={{ fill: 'rgba(255,255,255,0.6)', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'rgba(15, 23, 42, 0.95)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px',
                    padding: '12px',
                    backdropFilter: 'blur(12px)',
                  }}
                  itemStyle={{ color: '#fff', fontSize: 13 }}
                  labelStyle={{ color: 'rgba(255,255,255,0.7)', marginBottom: 6 }}
                />
                <Legend
                  wrapperStyle={{
                    paddingTop: '12px',
                    fontSize: 12,
                  }}
                  iconType="line"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="mentions"
                  stroke="#22d3ee"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Mentions"
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="sentiment_avg"
                  stroke="#a78bfa"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Sentiment"
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="velocity"
                  stroke="#fb923c"
                  strokeWidth={2}
                  dot={{ r: 3 }}
                  name="Velocity"
                  strokeDasharray="5 5"
                />
              </LineChart>
            </ResponsiveContainer>

            <div className="mt-4 grid grid-cols-3 gap-3 text-sm">
              {series.data.map(point => (
                <div key={point.time} className="bg-slate-900/60 border border-slate-800/60 rounded-xl p-3">
                  <div className="text-xs text-slate-400 mb-1">{point.time} window</div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-400">Acceleration</span>
                    <span className={`font-medium ${point.acceleration >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {(point.acceleration >= 0 ? '+' : '')}{point.acceleration.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs mt-1">
                    <span className="text-slate-400">Engagement</span>
                    <span className="text-white/70">{point.engagement.toLocaleString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}
