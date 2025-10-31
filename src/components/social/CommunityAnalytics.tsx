import { motion } from 'framer-motion';
import { MessageSquare } from 'lucide-react';

interface CommunityAnalyticsProps {
  tokenAddress: string;
  data: any;
}

export default function CommunityAnalytics({ tokenAddress, data }: CommunityAnalyticsProps) {
  if (!data) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 border border-slate-700 rounded-lg p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <MessageSquare className="w-5 h-5 text-blue-400" />
        <h2 className="text-xl font-semibold">Community Analytics</h2>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-slate-900/60 rounded-lg p-4">
          <div className="text-xs text-gray-400 uppercase">Active Users (24h)</div>
          <div className="text-2xl font-bold text-blue-400">{data.active_users_24h}</div>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-4">
          <div className="text-xs text-gray-400 uppercase">Engagement Rate</div>
          <div className="text-2xl font-bold text-purple-400">{data.engagement_rate.toFixed(1)}</div>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-4">
          <div className="text-xs text-gray-400 uppercase">Community Growth (30d)</div>
          <div className="text-2xl font-bold text-green-400">
            {data.community_growth_30d > 0 ? '+' : ''}
            {data.community_growth_30d.toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-900/60 rounded-lg p-4">
          <div className="text-xs text-gray-400 uppercase">Health Score</div>
          <div className="text-2xl font-bold text-yellow-400">{data.health_score.toFixed(0)}/100</div>
        </div>
      </div>

      <div className="bg-slate-900/40 rounded-lg p-4">
        <div className="text-sm font-semibold text-gray-300 mb-3">Sentiment Distribution</div>
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="text-center">
            <div className="text-green-400 text-lg font-bold">
              {data.sentiment_distribution.bulls_percentage.toFixed(0)}%
            </div>
            <div className="text-gray-500">Bulls</div>
          </div>
          <div className="text-center">
            <div className="text-gray-400 text-lg font-bold">
              {data.sentiment_distribution.neutral_percentage.toFixed(0)}%
            </div>
            <div className="text-gray-500">Neutral</div>
          </div>
          <div className="text-center">
            <div className="text-red-400 text-lg font-bold">
              {data.sentiment_distribution.bears_percentage.toFixed(0)}%
            </div>
            <div className="text-gray-500">Bears</div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
