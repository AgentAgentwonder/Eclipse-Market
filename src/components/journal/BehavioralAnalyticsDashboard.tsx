import { FC, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { BehavioralAnalytics, JournalFilters } from '../../types/journal';
import { Activity, Clock, TrendingUp, Brain, ArrowRight } from 'lucide-react';

interface Props {
  filters: JournalFilters;
}

export const BehavioralAnalyticsDashboard: FC<Props> = ({ filters }) => {
  const [analytics, setAnalytics] = useState<BehavioralAnalytics | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      try {
        const data = await invoke<BehavioralAnalytics>('get_behavioral_analytics', { filters });
        setAnalytics(data);
      } catch (error) {
        console.error('Failed to load behavioral analytics', error);
      } finally {
        setLoading(false);
      }
    };

    loadAnalytics();
  }, [filters]);

  if (loading) {
    return <div className="text-center text-gray-400 py-6">Loading behavioral analytics...</div>;
  }

  if (!analytics) {
    return <div className="text-center text-gray-400 py-6">No analytics available yet.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="border border-gray-800 bg-gray-900/80 rounded-xl p-5">
          <div className="flex items-center gap-3 text-gray-400 text-sm mb-2">
            <Activity className="w-4 h-4 text-emerald-400" />
            Consistency Score
          </div>
          <div className="text-3xl font-semibold text-white">{(analytics.consistency_score * 100).toFixed(0)}%</div>
          <p className="text-sm text-gray-400 mt-2">
            Measures how consistently you document trades and follow your journaling routine.
          </p>
        </div>

        <div className="border border-gray-800 bg-gray-900/80 rounded-xl p-5">
          <div className="flex items-center gap-3 text-gray-400 text-sm mb-2">
            <TrendingUp className="w-4 h-4 text-blue-400" />
            Emotional Volatility
          </div>
          <div className="text-3xl font-semibold text-white">{analytics.emotional_volatility.toFixed(2)}</div>
          <p className="text-sm text-gray-400 mt-2">
            Standard deviation of stress levels across logged trades. Lower values indicate more emotional stability.
          </p>
        </div>

        <div className="border border-gray-800 bg-gray-900/80 rounded-xl p-5">
          <div className="flex items-center gap-3 text-gray-400 text-sm mb-2">
            <Clock className="w-4 h-4 text-purple-400" />
            Peak Performance Hours
          </div>
          <div className="flex flex-wrap gap-2">
            {analytics.best_trading_hours.length === 0 ? (
              <span className="text-gray-400 text-sm">Not enough data</span>
            ) : (
              analytics.best_trading_hours.map(hour => (
                <span key={hour} className="px-3 py-1 bg-purple-500/10 text-purple-300 border border-purple-500/30 rounded-full text-sm">
                  {hour}:00
                </span>
              ))
            )}
          </div>
          <p className="text-sm text-gray-400 mt-2">
            Hours where your win rate is highest, based on logged trades.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="border border-gray-800 bg-gray-900/80 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Discipline Trend</h3>
          <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
            {analytics.discipline_trend.length === 0 ? (
              <div className="text-gray-400 text-sm">No discipline data recorded yet.</div>
            ) : (
              analytics.discipline_trend.map(point => (
                <div key={point.timestamp} className="flex items-center justify-between">
                  <div className="text-sm text-gray-400">{new Date(point.timestamp * 1000).toLocaleString()}</div>
                  <div className="text-emerald-400 font-medium">{(point.score * 100).toFixed(0)}%</div>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="border border-gray-800 bg-gray-900/80 rounded-xl p-5">
          <h3 className="text-lg font-semibold text-white mb-4">Win Rate by Emotion</h3>
          {Object.keys(analytics.win_rate_by_emotion).length === 0 ? (
            <div className="text-gray-400 text-sm">No emotion-based performance data recorded yet.</div>
          ) : (
            <div className="space-y-3">
              {Object.entries(analytics.win_rate_by_emotion)
                .sort((a, b) => b[1] - a[1])
                .map(([emotion, rate]) => (
                  <div key={emotion} className="flex items-center justify-between">
                    <span className="text-gray-300 capitalize">{emotion.replace(/_/g, ' ')}</span>
                    <span className="text-emerald-400 font-semibold">{rate.toFixed(1)}%</span>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>

      <div className="border border-gray-800 bg-gray-900/80 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <Brain className="w-5 h-5 text-blue-400" /> Cognitive Biases Detected
        </h3>
        {analytics.cognitive_biases.length === 0 ? (
          <div className="text-gray-400 text-sm">No cognitive biases detected in recent entries.</div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analytics.cognitive_biases.map((bias, index) => (
              <div key={index} className="border border-blue-500/30 bg-blue-500/5 rounded-lg p-4">
                <div className="text-blue-300 font-medium capitalize">
                  {bias.bias_type.replace(/_/g, ' ')}
                </div>
                <div className="text-sm text-blue-200/80 mt-1">Severity: {(bias.severity * 100).toFixed(0)}%</div>
                <div className="text-sm text-blue-200/80">Instances: {bias.instances}</div>
                <div className="text-sm text-blue-100 mt-2">{bias.description}</div>
                <div className="text-sm text-blue-200/80 italic mt-2">Mitigation: {bias.mitigation_strategy}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="border border-gray-800 bg-gray-900/80 rounded-xl p-5">
        <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <ArrowRight className="w-5 h-5 text-emerald-400" /> Growth Indicators
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <MetricCard label="Overall Improvement" value={(analytics.growth_indicators.improvement_rate * 100).toFixed(1) + '%'} />
          <MetricCard label="Consistency" value={(analytics.growth_indicators.consistency_improvement * 100).toFixed(1) + '%'} />
          <MetricCard label="Emotional Control" value={(analytics.growth_indicators.emotional_control_improvement * 100).toFixed(1) + '%'} />
          <MetricCard label="Strategy Refinement" value={(analytics.growth_indicators.strategy_refinement_score * 100).toFixed(1) + '%'} />
        </div>
      </div>
    </div>
  );
};

const MetricCard: FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
    <div className="text-sm text-gray-400 mb-1">{label}</div>
    <div className="text-2xl font-semibold text-white">{value}</div>
  </div>
);
