import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Wallet, TrendingUp, Heart, ExternalLink, Clock } from 'lucide-react';
import { formatDistance } from 'date-fns';

interface WhaleFeedEntry {
  id: string;
  wallet_address: string;
  wallet_label: string | null;
  activity_type: string;
  token: string | null;
  sentiment_score: number | null;
  correlation_score: number | null;
  social_post: any | null;
  onchain_activity: any | null;
  timestamp: string;
}

interface FollowedWallet {
  id: string;
  wallet_address: string;
  label: string | null;
  cluster_id: string | null;
  priority: number;
  followed_at: string;
}

export function FollowedWalletFeed() {
  const [feed, setFeed] = useState<WhaleFeedEntry[]>([]);
  const [followedWallets, setFollowedWallets] = useState<FollowedWallet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletLabel, setNewWalletLabel] = useState('');

  const loadFeed = async () => {
    try {
      setLoading(true);
      const feedData = await invoke<WhaleFeedEntry[]>('social_get_whale_feed', {
        limit: 50,
      });
      setFeed(feedData);
      setError(null);
    } catch (err) {
      console.error('Failed to load whale feed:', err);
      setError(err as string);
    } finally {
      setLoading(false);
    }
  };

  const loadFollowedWallets = async () => {
    try {
      const wallets = await invoke<FollowedWallet[]>('social_list_followed_wallets');
      setFollowedWallets(wallets);
    } catch (err) {
      console.error('Failed to load followed wallets:', err);
    }
  };

  const followWallet = async () => {
    if (!newWalletAddress.trim()) {
      return;
    }

    try {
      await invoke('social_follow_wallet', {
        walletAddress: newWalletAddress,
        label: newWalletLabel || null,
        clusterId: null,
        priority: 0,
      });
      setNewWalletAddress('');
      setNewWalletLabel('');
      await loadFeed();
    } catch (err) {
      console.error('Failed to follow wallet:', err);
      setError(err as string);
    }
  };

  const unfollowWallet = async (address: string) => {
    try {
      await invoke('social_unfollow_wallet', {
        walletAddress: address,
      });
      await loadFeed();
    } catch (err) {
      console.error('Failed to unfollow wallet:', err);
      setError(err as string);
    }
  };

  useEffect(() => {
    loadFeed();
    loadFollowedWallets();

    const interval = setInterval(() => {
      loadFeed();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const formatTimestamp = (timestamp: string) => {
    try {
      const date = new Date(timestamp);
      return formatDistance(date, new Date(), { addSuffix: true });
    } catch {
      return 'Unknown time';
    }
  };

  const getSentimentColor = (score: number | null) => {
    if (score === null) return 'text-gray-400';
    if (score > 0.3) return 'text-green-400';
    if (score < -0.3) return 'text-red-400';
    return 'text-yellow-400';
  };

  const getSentimentLabel = (score: number | null) => {
    if (score === null) return 'Neutral';
    if (score > 0.3) return 'Bullish';
    if (score < -0.3) return 'Bearish';
    return 'Neutral';
  };

  const shortenAddress = (address: string) => {
    if (address.length <= 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Wallet className="w-6 h-6" />
            Followed Whale Wallets
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Track social mentions and on-chain activity of your followed wallets
          </p>
        </div>
      </div>

      {/* Add Wallet Form */}
      <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
        <h3 className="text-sm font-semibold mb-3">Follow a Wallet</h3>
        <div className="flex gap-2">
          <input
            type="text"
            value={newWalletAddress}
            onChange={(e) => setNewWalletAddress(e.target.value)}
            placeholder="Wallet address..."
            className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
          />
          <input
            type="text"
            value={newWalletLabel}
            onChange={(e) => setNewWalletLabel(e.target.value)}
            placeholder="Label (optional)..."
            className="w-40 px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg focus:outline-none focus:border-blue-500 text-sm"
          />
          <button
            onClick={followWallet}
            disabled={!newWalletAddress.trim()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg text-sm font-semibold flex items-center gap-2 transition-colors"
          >
            <Heart className="w-4 h-4" />
            Follow
          </button>
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-900/20 border border-red-600 rounded-lg p-3">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {/* Feed */}
      <div className="bg-gray-800 rounded-lg border border-gray-700">
        <div className="p-4 border-b border-gray-700">
          <h3 className="font-semibold">Activity Feed</h3>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
            <p className="text-sm text-gray-400 mt-2">Loading feed...</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="p-8 text-center">
            <Wallet className="w-12 h-12 text-gray-600 mx-auto mb-3" />
            <p className="text-gray-400">No activity yet</p>
            <p className="text-sm text-gray-500 mt-1">
              Follow wallets to see their activity here
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {feed.map((entry) => (
              <div
                key={entry.id}
                className="p-4 hover:bg-gray-700/50 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className={`p-2 rounded-lg ${
                    entry.activity_type === 'social' ? 'bg-purple-900/30' : 'bg-blue-900/30'
                  }`}>
                    {entry.activity_type === 'social' ? (
                      <TrendingUp className="w-5 h-5 text-purple-400" />
                    ) : (
                      <Wallet className="w-5 h-5 text-blue-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="font-mono text-sm text-gray-300">
                          {shortenAddress(entry.wallet_address)}
                        </span>
                        {entry.wallet_label && (
                          <span className="text-sm text-blue-400 font-semibold">
                            ({entry.wallet_label})
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatTimestamp(entry.timestamp)}
                      </div>
                    </div>

                    <div className="mt-1 text-sm text-gray-400">
                      {entry.activity_type === 'social' ? (
                        <div>
                          Social mention detected
                          {entry.token && (
                            <span className="text-gray-300"> about {entry.token}</span>
                          )}
                        </div>
                      ) : (
                        <div>On-chain activity</div>
                      )}
                    </div>

                    {entry.sentiment_score !== null && (
                      <div className="mt-2 flex items-center gap-2">
                        <span className="text-xs text-gray-500">Sentiment:</span>
                        <span className={`text-xs font-semibold ${getSentimentColor(entry.sentiment_score)}`}>
                          {getSentimentLabel(entry.sentiment_score)}
                        </span>
                        <span className="text-xs text-gray-500">
                          ({entry.sentiment_score.toFixed(2)})
                        </span>
                      </div>
                    )}

                    {entry.correlation_score !== null && entry.correlation_score > 0 && (
                      <div className="mt-1 px-2 py-1 bg-green-900/20 border border-green-700 rounded text-xs inline-block">
                        <span className="text-green-400 font-semibold">
                          High Correlation: {entry.correlation_score.toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>

                  <button
                    onClick={() => unfollowWallet(entry.wallet_address)}
                    className="p-2 hover:bg-gray-600 rounded-lg transition-colors"
                    title="Unfollow wallet"
                  >
                    <Heart className="w-4 h-4 fill-red-500 text-red-500" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
