import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import {
  Waves,
  ArrowUpRight,
  Flame,
  Activity,
  BarChart3,
  Sparkles,
  Users,
  Info,
} from 'lucide-react';

interface WhaleInsight {
  wallet_address: string;
  wallet_label: string | null;
  cluster_name: string | null;
  tokens: string[];
  social_activity_score: number;
  onchain_activity_score: number;
  correlation_score: number;
  follower_impact: number;
  recent_actions: string[];
  sentiment_trend: string;
  updated_at: string;
}

interface WhaleCluster {
  id: string;
  cluster_name: string;
  wallet_addresses: string;
  shared_tokens: string;
  cluster_score: number;
  member_count: number;
  created_at: string;
  updated_at: string;
}

export function WhaleInsightsPanel() {
  const [clusters, setClusters] = useState<WhaleCluster[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [insights, setInsights] = useState<WhaleInsight | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadClusters = async () => {
    try {
      setLoading(true);
      const clusterData = await invoke<WhaleCluster[]>('social_get_whale_clusters');
      setClusters(clusterData);
      if (clusterData.length > 0) {
        const firstCluster = clusterData[0];
        const wallets = JSON.parse(firstCluster.wallet_addresses) as string[];
        if (wallets.length > 0) {
          setSelectedWallet(wallets[0]);
        }
      }
      setError(null);
    } catch (err) {
      console.error('Failed to load whale clusters:', err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const loadInsights = async (walletAddress: string) => {
    try {
      setLoading(true);
      const data = await invoke<WhaleInsight>('social_get_whale_insights', {
        walletAddress,
      });
      setInsights(data);
      setError(null);
    } catch (err) {
      console.error('Failed to load whale insights:', err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClusters();
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      loadInsights(selectedWallet);
    }
  }, [selectedWallet]);

  const getTrendColor = (trend: string) => {
    switch (trend.toLowerCase()) {
      case 'bullish':
        return 'text-green-400';
      case 'bearish':
        return 'text-red-400';
      default:
        return 'text-yellow-400';
    }
  };

  const parseTokens = (tokensJson: string) => {
    try {
      const tokens = JSON.parse(tokensJson) as string[];
      return tokens.slice(0, 5);
    } catch {
      return [];
    }
  };

  const shortenAddress = (address: string) => {
    if (!address) return '';
    return `${address.slice(0, 4)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Waves className="w-6 h-6 text-blue-400" />
            Whale Behavioral Insights
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Discover whale clusters, correlated social chatter, and high-impact wallet behavior
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Cluster List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex items-center justify-between">
            <h3 className="font-semibold">Whale Clusters</h3>
            <span className="text-xs text-gray-500">{clusters.length} groups</span>
          </div>
          <div className="max-h-[400px] overflow-y-auto">
            {clusters.length === 0 ? (
              <div className="p-6 text-center text-gray-400 text-sm">
                {loading ? 'Loading clusters...' : 'No clusters identified yet'}
              </div>
            ) : (
              clusters.map((cluster) => {
                const wallets = parseTokens(cluster.wallet_addresses);
                return (
                  <div
                    key={cluster.id}
                    className="p-4 border-b border-gray-700 last:border-b-0"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-200">
                          {cluster.cluster_name}
                        </h4>
                        <p className="text-xs text-gray-500 mt-1">
                          {cluster.member_count} wallets · Score {cluster.cluster_score.toFixed(2)}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-blue-400" />
                      </div>
                    </div>

                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-400 uppercase tracking-wide">
                        Cluster Members
                      </p>
                      <div className="flex flex-wrap gap-2 text-xs">
                        {wallets.map((wallet) => (
                          <button
                            key={wallet}
                            onClick={() => setSelectedWallet(wallet)}
                            className={`px-2 py-1 rounded-lg border text-xs font-mono transition-colors ${
                              selectedWallet === wallet
                                ? 'bg-blue-900/30 border-blue-500 text-blue-300'
                                : 'bg-gray-900/30 border-gray-700 text-gray-400 hover:border-blue-500 hover:text-blue-300'
                            }`}
                          >
                            {shortenAddress(wallet)}
                          </button>
                        ))}
                      </div>

                      <div className="text-xs text-gray-500">
                        Shared tokens: {parseTokens(cluster.shared_tokens).join(', ') || 'Unknown'}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Insights */}
        <div className="lg:col-span-2 bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-4 border-b border-gray-700 flex items-center gap-3">
            <h3 className="font-semibold">Wallet Insights</h3>
            {selectedWallet && (
              <span className="text-xs font-mono text-gray-500">
                {shortenAddress(selectedWallet)}
              </span>
            )}
          </div>

          {loading && !insights ? (
            <div className="p-10 text-center text-gray-400 text-sm">
              Analyzing whale behavior...
            </div>
          ) : insights ? (
            <div className="p-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricCard
                  icon={<Flame className="w-5 h-5" />}
                  title="Social Activity"
                  value={insights.social_activity_score.toFixed(0)}
                  description="Social mentions linked to this wallet"
                />
                <MetricCard
                  icon={<Activity className="w-5 h-5" />}
                  title="On-chain Momentum"
                  value={insights.onchain_activity_score.toFixed(0)}
                  description="Correlated on-chain actions"
                />
                <MetricCard
                  icon={<BarChart3 className="w-5 h-5" />}
                  title="Correlation Score"
                  value={insights.correlation_score.toFixed(2)}
                  description="Strength of social-to-onchain signal"
                  highlight={insights.correlation_score >= 2 || insights.correlation_score <= -2}
                />
                <MetricCard
                  icon={<Sparkles className="w-5 h-5" />}
                  title="Influence Index"
                  value={insights.follower_impact.toFixed(2)}
                  description="Composite influence and reach"
                />
              </div>

              <div className="bg-gray-900/40 rounded-lg border border-gray-700 p-4">
                <h4 className="font-semibold text-sm text-gray-200 flex items-center gap-2">
                  <ArrowUpRight className="w-4 h-4 text-green-400" />
                  Behavior Snapshot
                </h4>
                <div className="mt-3 text-sm text-gray-300 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs uppercase">Cluster:</span>
                    <span className="text-gray-200 text-sm">
                      {insights.cluster_name || 'Independent'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500 text-xs uppercase">Sentiment Trend:</span>
                    <span className={`text-sm font-semibold ${getTrendColor(insights.sentiment_trend)}`}>
                      {insights.sentiment_trend}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <span className="text-gray-500 text-xs uppercase">Tokens:</span>
                    {insights.tokens.length === 0 ? (
                      <span className="text-gray-400 text-sm">Insufficient data</span>
                    ) : (
                      insights.tokens.map((token) => (
                        <span
                          key={token}
                          className="px-2 py-1 bg-blue-900/30 border border-blue-700 text-blue-300 rounded-full text-xs"
                        >
                          {token}
                        </span>
                      ))
                    )}
                  </div>
                  <div className="text-sm text-gray-400">
                    Recent actions:
                    <ul className="list-disc list-inside mt-1 space-y-1">
                      {insights.recent_actions.slice(0, 4).map((action, index) => (
                        <li key={`${action}-${index}`}>{action}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>

              <div className="bg-blue-900/10 border border-blue-700 rounded-lg p-4 flex gap-3">
                <Info className="w-5 h-5 text-blue-400 mt-1" />
                <div className="text-sm text-gray-300">
                  <p className="font-semibold text-blue-300">Interpretation Guide</p>
                  <p className="mt-2">
                    High correlation scores (≥ 2.0) signal reliable early warning indicators when this wallet or
                    its cluster begins talking about a token prior to on-chain activity. Monitor social activity spikes
                    alongside positive sentiment trends to anticipate potential whale moves.
                  </p>
                  <p className="mt-2 text-xs text-gray-500">
                    Last updated: {new Date(insights.updated_at).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="p-10 text-center text-gray-400 text-sm">
              Select a whale wallet to view insights
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string;
  description: string;
  highlight?: boolean;
}

function MetricCard({ icon, title, value, description, highlight }: MetricCardProps) {
  return (
    <div
      className={`rounded-lg border p-4 bg-gray-900/40 ${
        highlight ? 'border-green-600/70' : 'border-gray-700'
      }`}
    >
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg ${highlight ? 'bg-green-900/30' : 'bg-blue-900/20'}`}>
          {icon}
        </div>
        <div>
          <h4 className="font-semibold text-gray-200 text-sm">{title}</h4>
          <div className={`text-2xl font-bold ${highlight ? 'text-green-300' : 'text-blue-300'}`}>
            {value}
          </div>
          <p className="text-xs text-gray-500 mt-1">{description}</p>
        </div>
      </div>
    </div>
  );
}
