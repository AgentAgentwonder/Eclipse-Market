import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Users,
  Activity,
  Search,
  AlertCircle,
  DollarSign,
  MessageSquare,
  Eye,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { fadeInStaggerVariants } from '../../utils/animations';
import SentimentPanel from '../../components/social/SentimentPanel';
import FomoFudGauges from '../../components/social/FomoFudGauges';
import InfluencerTracker from '../../components/social/InfluencerTracker';
import WhaleActivityFeed from '../../components/social/WhaleActivityFeed';
import TrendingTokens from '../../components/social/TrendingTokens';
import SocialSearch from '../../components/social/SocialSearch';
import CommunityAnalytics from '../../components/social/CommunityAnalytics';

type TabType = 'overview' | 'trending' | 'influencers' | 'whales' | 'search' | 'community';

export default function SocialDashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [selectedToken, setSelectedToken] = useState('So11111111111111111111111111111111111111112'); // SOL
  const [marketSentiment, setMarketSentiment] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMarketSentiment();
  }, [selectedToken]);

  const loadMarketSentiment = async () => {
    try {
      setLoading(true);
      const result = await invoke('get_social_sentiment', { tokenAddress: selectedToken });
      setMarketSentiment(result);
    } catch (error) {
      console.error('Failed to load market sentiment:', error);
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: Activity },
    { id: 'trending', label: 'Trending', icon: TrendingUp },
    { id: 'influencers', label: 'Influencers', icon: Users },
    { id: 'whales', label: 'Whales', icon: DollarSign },
    { id: 'search', label: 'Search', icon: Search },
    { id: 'community', label: 'Community', icon: MessageSquare },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/20 to-slate-950 text-white p-6">
      <motion.div
        variants={fadeInStaggerVariants}
        initial="initial"
        animate="animate"
        className="max-w-7xl mx-auto space-y-6"
      >
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
              Social Intelligence Hub
            </h1>
            <p className="text-gray-400 mt-2">
              Track sentiment, influencers, whales, and community behavior across all platforms
            </p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={loadMarketSentiment}
            className="px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all flex items-center gap-2"
          >
            <Eye className="w-4 h-4" />
            Refresh Data
          </motion.button>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <motion.button
                key={tab.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActiveTab(tab.id as TabType)}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 whitespace-nowrap transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white'
                    : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </motion.button>
            );
          })}
        </div>

        {/* Content */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
          </div>
        )}

        {!loading && (
          <>
            {activeTab === 'overview' && marketSentiment && (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <SentimentPanel tokenAddress={selectedToken} data={marketSentiment.sentiment} />
                  <WhaleActivityFeed tokenAddress={selectedToken} />
                </div>
                <div className="space-y-6">
                  <FomoFudGauges tokenAddress={selectedToken} data={marketSentiment.sentiment.fomo_fud} />
                  <TrendingTokens />
                </div>
              </div>
            )}

            {activeTab === 'trending' && (
              <TrendingTokens fullWidth />
            )}

            {activeTab === 'influencers' && (
              <InfluencerTracker tokenAddress={selectedToken} />
            )}

            {activeTab === 'whales' && (
              <WhaleActivityFeed tokenAddress={selectedToken} fullWidth />
            )}

            {activeTab === 'search' && (
              <SocialSearch />
            )}

            {activeTab === 'community' && marketSentiment && (
              <CommunityAnalytics tokenAddress={selectedToken} data={marketSentiment.community} />
            )}
          </>
        )}

        {/* Alert Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-gradient-to-r from-blue-500/10 to-purple-600/10 border border-blue-500/20 rounded-lg p-4"
        >
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h3 className="font-semibold text-blue-400">Social Intelligence Alpha</h3>
              <p className="text-sm text-gray-400 mt-1">
                This hub aggregates real-time data from Twitter, Reddit, and on-chain sources to provide
                comprehensive social sentiment analysis. Use it to identify trends early and get ahead of the market.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
