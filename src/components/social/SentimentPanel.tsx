import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface SentimentPanelProps {
  tokenAddress: string;
  data: any;
}

export default function SentimentPanel({ tokenAddress, data }: SentimentPanelProps) {
  if (!data) return null;

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return 'text-green-400';
    if (score < -0.2) return 'text-red-400';
    return 'text-gray-400';
  };

  const getSentimentIcon = (score: number) => {
    if (score > 0.2) return TrendingUp;
    if (score < -0.2) return TrendingDown;
    return Minus;
  };

  const getSentimentLabel = () => {
    const score = data.current_score;
    if (score > 0.6) return 'Very Bullish';
    if (score > 0.2) return 'Bullish';
    if (score < -0.6) return 'Very Bearish';
    if (score < -0.2) return 'Bearish';
    return 'Neutral';
  };

  const Icon = getSentimentIcon(data.current_score);
  const normalizedScore = ((data.current_score + 1) / 2) * 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm rounded-lg border border-slate-700 p-6"
    >
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-semibold">Social Sentiment</h2>
          <p className="text-sm text-gray-400 mt-1">Aggregate sentiment across platforms</p>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-bold ${getSentimentColor(data.current_score)}`}>
            {getSentimentLabel()}
          </div>
          <div className="text-sm text-gray-400 flex items-center gap-1 justify-end mt-1">
            <Icon className="w-4 h-4" />
            {data.change_24h > 0 ? '+' : ''}
            {(data.change_24h * 100).toFixed(1)}% (24h)
          </div>
        </div>
      </div>

      {/* Score Gauge */}
      <div className="mb-6">
        <div className="h-8 bg-slate-900 rounded-full overflow-hidden relative">
          <div className="absolute inset-0 flex">
            <div className="flex-1 bg-gradient-to-r from-red-500/20 to-red-500/10" />
            <div className="flex-1 bg-gradient-to-r from-gray-500/10 to-gray-500/10" />
            <div className="flex-1 bg-gradient-to-r from-green-500/10 to-green-500/20" />
          </div>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${normalizedScore}%` }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
            className="absolute left-0 top-0 h-full bg-gradient-to-r from-blue-500 to-purple-600"
          />
        </div>
        <div className="flex justify-between text-xs text-gray-500 mt-2">
          <span>Bearish</span>
          <span>Neutral</span>
          <span>Bullish</span>
        </div>
      </div>

      {/* Multi-timeframe */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {data.multi_timeframe?.map((period: any) => (
          <div key={period.period} className="bg-slate-900/50 rounded-lg p-3">
            <div className="text-xs text-gray-400">{period.period}</div>
            <div className={`text-lg font-bold ${getSentimentColor(period.score)}`}>
              {(period.score * 100).toFixed(0)}
            </div>
            <div className="text-xs text-gray-500">
              {period.change > 0 ? '+' : ''}
              {(period.change * 100).toFixed(1)}%
            </div>
          </div>
        ))}
      </div>

      {/* Breakdown */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-400">
            {data.breakdown?.positive_count || 0}
          </div>
          <div className="text-xs text-gray-400">Positive</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-400">
            {data.breakdown?.neutral_count || 0}
          </div>
          <div className="text-xs text-gray-400">Neutral</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-400">
            {data.breakdown?.negative_count || 0}
          </div>
          <div className="text-xs text-gray-400">Negative</div>
        </div>
      </div>
    </motion.div>
  );
}
