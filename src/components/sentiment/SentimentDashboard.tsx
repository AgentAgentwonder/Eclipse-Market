import { useEffect, useState } from 'react';
import { useSentimentStore } from '../../store/sentimentStore';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { TrendingUp, TrendingDown, Minus, AlertCircle, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

interface Props {
  tokenAddress: string;
}

export function SentimentDashboard({ tokenAddress }: Props) {
  const {
    sentiments,
    alerts,
    loading,
    fetchTokenSentiment,
    fetchAlerts,
    fetchSocialMentions,
    dismissAlert,
  } = useSentimentStore();

  const [showPosts, setShowPosts] = useState(false);
  const sentiment = sentiments[tokenAddress];

  useEffect(() => {
    fetchTokenSentiment(tokenAddress);
    fetchAlerts(tokenAddress);
  }, [tokenAddress, fetchTokenSentiment, fetchAlerts]);

  const handleRefresh = async () => {
    await fetchSocialMentions(tokenAddress);
    await fetchAlerts(tokenAddress);
  };

  const getSentimentIcon = (label: string) => {
    switch (label) {
      case 'positive':
        return <TrendingUp className="w-5 h-5 text-green-400" />;
      case 'negative':
        return <TrendingDown className="w-5 h-5 text-red-400" />;
      default:
        return <Minus className="w-5 h-5 text-gray-400" />;
    }
  };

  const getSentimentColor = (score: number) => {
    if (score > 0.2) return 'text-green-400';
    if (score < -0.2) return 'text-red-400';
    return 'text-gray-400';
  };

  if (loading && !sentiment) {
    return <div className="p-6 text-gray-400">Loading sentiment data...</div>;
  }

  if (!sentiment) {
    return (
      <div className="p-6 space-y-4">
        <div className="text-gray-400">No sentiment data available</div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Fetch Social Mentions
        </button>
      </div>
    );
  }

  const chartData = sentiment.trend.map((point) => ({
    timestamp: format(new Date(point.timestamp * 1000), 'MMM dd HH:mm'),
    score: point.score,
    mentions: point.mentions,
  }));

  const activeAlerts = alerts.filter((a) => a.is_active);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Sentiment Analysis</h2>
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Active Alerts */}
      {activeAlerts.length > 0 && (
        <div className="space-y-2">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-yellow-500" />
            Active Alerts ({activeAlerts.length})
          </h3>
          <div className="space-y-2">
            {activeAlerts.map((alert) => (
              <div
                key={alert.id}
                className="bg-yellow-900/20 border border-yellow-600 rounded-lg p-4 flex justify-between items-start"
              >
                <div>
                  <div className="font-semibold">{alert.alert_type}</div>
                  <div className="text-sm text-gray-400">{alert.message}</div>
                  <div className="text-xs text-gray-500 mt-1">
                    {format(new Date(alert.timestamp * 1000), 'PPpp')}
                  </div>
                </div>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded text-sm"
                >
                  Dismiss
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Current Sentiment */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-gray-400">Current Score</span>
            {getSentimentIcon(sentiment.label)}
          </div>
          <div className={`text-3xl font-bold ${getSentimentColor(sentiment.current_score)}`}>
            {sentiment.current_score > 0 ? '+' : ''}
            {sentiment.current_score.toFixed(2)}
          </div>
          <div className="text-sm text-gray-500 mt-1 capitalize">{sentiment.label}</div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-gray-400 mb-2">Confidence</div>
          <div className="text-3xl font-bold">{(sentiment.confidence * 100).toFixed(0)}%</div>
          <div className="w-full bg-gray-700 rounded-full h-2 mt-2">
            <div
              className="bg-blue-500 h-2 rounded-full"
              style={{ width: `${sentiment.confidence * 100}%` }}
            />
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg p-6">
          <div className="text-gray-400 mb-2">Total Mentions</div>
          <div className="text-3xl font-bold">{sentiment.total_mentions.toLocaleString()}</div>
          <div className="text-sm text-gray-500 mt-1">
            Last updated: {format(new Date(sentiment.last_updated * 1000), 'PPp')}
          </div>
        </div>
      </div>

      {/* Sentiment Distribution */}
      <div className="bg-gray-800 rounded-lg p-6">
        <h3 className="text-lg font-semibold mb-4">Sentiment Distribution</h3>
        <div className="space-y-3">
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-green-400">Positive</span>
              <span>{sentiment.positive_count} ({((sentiment.positive_count / sentiment.total_mentions) * 100).toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-green-500 h-2 rounded-full"
                style={{ width: `${(sentiment.positive_count / sentiment.total_mentions) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-gray-400">Neutral</span>
              <span>{sentiment.neutral_count} ({((sentiment.neutral_count / sentiment.total_mentions) * 100).toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-gray-500 h-2 rounded-full"
                style={{ width: `${(sentiment.neutral_count / sentiment.total_mentions) * 100}%` }}
              />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-1">
              <span className="text-red-400">Negative</span>
              <span>{sentiment.negative_count} ({((sentiment.negative_count / sentiment.total_mentions) * 100).toFixed(1)}%)</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2">
              <div
                className="bg-red-500 h-2 rounded-full"
                style={{ width: `${(sentiment.negative_count / sentiment.total_mentions) * 100}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Sentiment Trend Chart */}
      {chartData.length > 0 && (
        <div className="bg-gray-800 rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Sentiment Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="timestamp" stroke="#9CA3AF" />
              <YAxis stroke="#9CA3AF" domain={[-1, 1]} />
              <Tooltip
                contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                labelStyle={{ color: '#9CA3AF' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="score"
                stroke="#3B82F6"
                strokeWidth={2}
                dot={{ r: 4 }}
                name="Sentiment Score"
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Sample Posts */}
      <div className="bg-gray-800 rounded-lg p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Sample Posts ({sentiment.sample_posts.length})</h3>
          <button
            onClick={() => setShowPosts(!showPosts)}
            className="text-sm text-blue-400 hover:text-blue-300"
          >
            {showPosts ? 'Hide' : 'Show'}
          </button>
        </div>
        {showPosts && (
          <div className="space-y-4">
            {sentiment.sample_posts.map((post) => (
              <div key={post.id} className="bg-gray-700 rounded-lg p-4">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{post.author}</span>
                    <span className="text-xs text-gray-400 uppercase">{post.source}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getSentimentIcon(post.sentiment.label)}
                    <span className={`text-sm ${getSentimentColor(post.sentiment.score)}`}>
                      {post.sentiment.score > 0 ? '+' : ''}
                      {post.sentiment.score.toFixed(2)}
                    </span>
                  </div>
                </div>
                <p className="text-sm mb-2">{post.text}</p>
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{format(new Date(post.timestamp * 1000), 'PPp')}</span>
                  <span>{post.engagement} engagements</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
