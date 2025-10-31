import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  Wallet,
  AlertCircle,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
  Activity,
  MessageSquare,
} from 'lucide-react';
import { useSocialStore } from '../store/socialStore';
import { format } from 'date-fns';
import type {
  SocialMention,
  FomoFudGauge,
  WhaleMovement,
  WhaleBehaviorInsight,
  SocialAlert,
} from '../types/social';

export function SocialMomentum() {
  const { snapshot, loading, refreshing, error, fetchDashboard, refreshData } = useSocialStore();
  const [selectedToken, setSelectedToken] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading && !snapshot) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-400">Loading social intelligence...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-red-400">Error: {error}</div>
      </div>
    );
  }

  if (!snapshot) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-xl text-gray-400">No data available</div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Social Momentum</h1>
          <p className="text-gray-400 mt-1">
            Real-time social intelligence across platforms
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
          >
            <Settings className="w-4 h-4" />
            Settings
          </button>
          <button
            onClick={refreshData}
            disabled={refreshing}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>
      </div>

      {/* Rate Limit Status */}
      {snapshot.rateLimitStatus.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {snapshot.rateLimitStatus.map((status) => (
            <div
              key={status.source}
              className="bg-gray-800 border border-gray-700 rounded-lg p-4"
            >
              <div className="flex justify-between items-center">
                <span className="font-semibold capitalize">{status.source}</span>
                {status.remaining !== undefined && (
                  <span className="text-sm text-gray-400">
                    {status.remaining}/{status.limit} remaining
                  </span>
                )}
              </div>
              {status.lastError && (
                <div className="text-xs text-yellow-500 mt-1">{status.lastError}</div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Alerts */}
      {snapshot.alerts.length > 0 && (
        <AlertsSection alerts={snapshot.alerts.filter((a) => !a.acknowledged)} />
      )}

      {/* FOMO/FUD Gauges */}
      <FomoFudGauges gauges={snapshot.sentimentGauges} onSelectToken={setSelectedToken} />

      {/* Social Momentum Grid */}
      <MomentumGrid momentum={snapshot.momentum} onSelectToken={setSelectedToken} />

      {/* Trend Data */}
      <TrendSection trends={snapshot.trendData} />

      {/* Whale Activity */}
      <WhaleSection
        movements={snapshot.whaleMovements.slice(0, 10)}
        insights={snapshot.whaleInsights.slice(0, 5)}
        followEvents={snapshot.walletsYouFollow.slice(0, 10)}
      />

      {/* Recent Mentions */}
      <MentionsSection mentions={snapshot.mentions.slice(0, 20)} />

      {/* Influencers */}
      <InfluencersSection influencers={snapshot.topInfluencers} />
    </div>
  );
}

function AlertsSection({ alerts }: { alerts: SocialAlert[] }) {
  if (alerts.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4"
    >
      <h2 className="text-xl font-bold flex items-center gap-2 mb-4">
        <AlertCircle className="w-5 h-5 text-yellow-500" />
        Active Alerts ({alerts.length})
      </h2>
      <div className="space-y-2">
        {alerts.map((alert) => (
          <div key={alert.id} className="bg-gray-800 border border-gray-700 rounded p-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="font-semibold">{alert.title}</div>
                <div className="text-sm text-gray-400">{alert.message}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {format(new Date(alert.timestamp * 1000), 'PPpp')}
                </div>
              </div>
              <span
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  alert.severity === 'critical'
                    ? 'bg-red-900 text-red-200'
                    : alert.severity === 'high'
                    ? 'bg-orange-900 text-orange-200'
                    : alert.severity === 'medium'
                    ? 'bg-yellow-900 text-yellow-200'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {alert.severity}
              </span>
            </div>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function FomoFudGauges({
  gauges,
  onSelectToken,
}: {
  gauges: FomoFudGauge[];
  onSelectToken: (token: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">FOMO/FUD Gauges</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {gauges.map((gauge) => (
          <motion.div
            key={gauge.tokenAddress}
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer"
            onClick={() => onSelectToken(gauge.tokenAddress)}
          >
            <div className="font-bold text-lg mb-2">{gauge.tokenSymbol}</div>
            <div className="space-y-3">
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>FOMO</span>
                  <span className="text-green-400">{(gauge.fomoScore * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-green-500 transition-all duration-300"
                    style={{ width: `${gauge.fomoScore * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>FUD</span>
                  <span className="text-red-400">{(gauge.fudScore * 100).toFixed(1)}%</span>
                </div>
                <div className="h-2 bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-red-500 transition-all duration-300"
                    style={{ width: `${gauge.fudScore * 100}%` }}
                  />
                </div>
              </div>
              <div className="pt-2 border-t border-gray-700 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Net Sentiment</span>
                  <span
                    className={
                      gauge.netSentiment > 0.3
                        ? 'text-green-400'
                        : gauge.netSentiment < -0.3
                        ? 'text-red-400'
                        : 'text-gray-400'
                    }
                  >
                    {gauge.netSentiment > 0 ? '+' : ''}
                    {(gauge.netSentiment * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="flex justify-between mt-1">
                  <span className="text-gray-400">Confidence</span>
                  <span>{(gauge.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function MomentumGrid({
  momentum,
  onSelectToken,
}: {
  momentum: any[];
  onSelectToken: (token: string) => void;
}) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Token Momentum</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {momentum.map((item) => (
          <motion.div
            key={item.tokenAddress}
            whileHover={{ scale: 1.02 }}
            className="bg-gray-800 border border-gray-700 rounded-lg p-4 cursor-pointer"
            onClick={() => onSelectToken(item.tokenAddress)}
          >
            <div className="font-bold text-lg mb-2">{item.tokenSymbol}</div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Momentum</span>
                <span className="font-semibold">{(item.momentumScore * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Sentiment</span>
                <span>{(item.sentimentScore * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Volume</span>
                <span>{(item.volumeScore * 100).toFixed(0)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Whale Activity</span>
                <span>{(item.whaleScore * 100).toFixed(0)}%</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

function TrendSection({ trends }: { trends: any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <TrendingUp className="w-6 h-6" />
        Trending Tokens
      </h2>
      <div className="bg-gray-800 border border-gray-700 rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-900">
            <tr>
              <th className="px-4 py-3 text-left">Rank</th>
              <th className="px-4 py-3 text-left">Token</th>
              <th className="px-4 py-3 text-right">Mentions</th>
              <th className="px-4 py-3 text-right">Velocity</th>
              <th className="px-4 py-3 text-right">Change</th>
            </tr>
          </thead>
          <tbody>
            {trends.map((trend, idx) => (
              <tr key={trend.tokenAddress} className="border-t border-gray-700">
                <td className="px-4 py-3">#{idx + 1}</td>
                <td className="px-4 py-3 font-semibold">{trend.tokenSymbol}</td>
                <td className="px-4 py-3 text-right">{trend.mentionCount}</td>
                <td className="px-4 py-3 text-right">{trend.velocity.toFixed(2)}/min</td>
                <td className="px-4 py-3 text-right">
                  <span
                    className={`flex items-center justify-end gap-1 ${
                      trend.rankChange > 0
                        ? 'text-green-400'
                        : trend.rankChange < 0
                        ? 'text-red-400'
                        : 'text-gray-400'
                    }`}
                  >
                    {trend.rankChange > 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : trend.rankChange < 0 ? (
                      <TrendingDown className="w-4 h-4" />
                    ) : null}
                    {trend.rankChange !== 0 && Math.abs(trend.rankChange)}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function WhaleSection({
  movements,
  insights,
  followEvents,
}: {
  movements: WhaleMovement[];
  insights: WhaleBehaviorInsight[];
  followEvents: any[];
}) {
  const [activeTab, setActiveTab] = useState<'movements' | 'insights' | 'following'>('movements');

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Wallet className="w-6 h-6" />
        Whale Activity
      </h2>
      <div className="bg-gray-800 border border-gray-700 rounded-lg">
        <div className="flex border-b border-gray-700">
          {['movements', 'insights', 'following'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
              className={`px-6 py-3 font-semibold capitalize ${
                activeTab === tab
                  ? 'text-blue-400 border-b-2 border-blue-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
        <div className="p-4">
          {activeTab === 'movements' && (
            <div className="space-y-3">
              {movements.map((movement) => (
                <div key={movement.id} className="bg-gray-900 rounded p-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-semibold">{movement.tokenSymbol}</div>
                      <div className="text-sm text-gray-400">
                        {movement.movementType.replace('_', ' ').toUpperCase()}
                      </div>
                      <div className="text-xs text-gray-500 mt-1">
                        {format(new Date(movement.timestamp * 1000), 'PPpp')}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">${movement.valueUsd.toLocaleString()}</div>
                      <div className="text-sm text-gray-400">{movement.amount.toLocaleString()}</div>
                      <div className="text-xs text-blue-400 mt-1">
                        Impact: {(movement.impactScore * 100).toFixed(0)}%
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'insights' && (
            <div className="space-y-3">
              {insights.map((insight, idx) => (
                <div key={idx} className="bg-gray-900 rounded p-3">
                  <div className="font-semibold">{insight.title}</div>
                  <div className="text-sm text-gray-400 mt-1">{insight.description}</div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-gray-500">
                      Confidence: {(insight.confidence * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(insight.timestamp * 1000), 'PPp')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
          {activeTab === 'following' && (
            <div className="space-y-3">
              {followEvents.map((event, idx) => (
                <div key={idx} className="bg-gray-900 rounded p-3">
                  <div className="font-semibold">{event.title}</div>
                  <div className="text-sm text-gray-400 mt-1">{event.description}</div>
                  <div className="flex justify-between items-center mt-2">
                    <div className="text-xs text-blue-400">
                      Impact: {(event.impact * 100).toFixed(0)}%
                    </div>
                    <div className="text-xs text-gray-500">
                      {format(new Date(event.timestamp * 1000), 'PPp')}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function MentionsSection({ mentions }: { mentions: SocialMention[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <MessageSquare className="w-6 h-6" />
        Recent Mentions
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {mentions.map((mention) => (
          <div key={mention.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="flex justify-between items-start mb-2">
              <div>
                <span className="font-semibold">{mention.author}</span>
                <span className="text-xs text-gray-500 ml-2 capitalize">{mention.platform}</span>
              </div>
              <span
                className={`text-xs px-2 py-1 rounded ${
                  mention.sentimentLabel === 'positive'
                    ? 'bg-green-900 text-green-200'
                    : mention.sentimentLabel === 'negative'
                    ? 'bg-red-900 text-red-200'
                    : 'bg-gray-700 text-gray-300'
                }`}
              >
                {mention.sentimentLabel}
              </span>
            </div>
            <p className="text-sm text-gray-300 mb-2">{mention.content}</p>
            <div className="flex justify-between text-xs text-gray-500">
              <div className="flex gap-3">
                <span>❤️ {mention.engagement.likes}</span>
                <span>🔄 {mention.engagement.retweets}</span>
                <span>💬 {mention.engagement.replies}</span>
              </div>
              <span>{format(new Date(mention.timestamp * 1000), 'PPp')}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function InfluencersSection({ influencers }: { influencers: any[] }) {
  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
        <Users className="w-6 h-6" />
        Tracked Influencers
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {influencers.map((influencer) => (
          <div key={influencer.id} className="bg-gray-800 border border-gray-700 rounded-lg p-4">
            <div className="font-semibold flex items-center gap-2">
              {influencer.name}
              {influencer.verified && <span className="text-blue-400">✓</span>}
            </div>
            <div className="text-sm text-gray-400">{influencer.handle}</div>
            <div className="text-xs text-gray-500 mt-2">
              {influencer.followerCount.toLocaleString()} followers
            </div>
            <div className="mt-2">
              <div className="text-xs text-gray-400">Influence Score</div>
              <div className="h-1.5 bg-gray-700 rounded-full overflow-hidden mt-1">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${influencer.influenceScore * 100}%` }}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default SocialMomentum;
