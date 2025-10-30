import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Search, 
  Filter,
  BarChart2,
  PieChart,
  Target,
  Clock,
  DollarSign,
  Award,
  Plus,
} from 'lucide-react';

interface PredictionMarket {
  id: string;
  source: string;
  title: string;
  description: string;
  category: string;
  outcomes: string[];
  outcomePrices: number[];
  volume24h: number;
  totalVolume: number;
  liquidity: number;
  createdAt?: number;
  endDate?: number;
  resolved: boolean;
  winningOutcome?: number;
  tags: string[];
  imageUrl?: string;
}

interface PortfolioComparison {
  userId: string;
  totalPredictions: number;
  correctPredictions: number;
  accuracyRate: number;
  avgBrierScore: number;
  avgConfidence: number;
  marketAccuracyRate: number;
  percentileRank: number;
  bestCategory?: string;
  worstCategory?: string;
  recentPerformance: number[];
}

interface ConsensusData {
  marketId: string;
  outcomes: string[];
  polymarketOdds?: number[];
  driftOdds?: number[];
  aggregatedOdds: number[];
  volumeWeightedOdds: number[];
  variance: number;
  agreementScore: number;
  timestamp: number;
}

export default function PredictionMarkets() {
  const [markets, setMarkets] = useState<PredictionMarket[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMarket, setSelectedMarket] = useState<PredictionMarket | null>(null);
  const [consensus, setConsensus] = useState<ConsensusData | null>(null);
  const [portfolioStats, setPortfolioStats] = useState<PortfolioComparison | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadMarkets();
    loadPortfolioStats();
  }, []);

  const loadMarkets = async () => {
    try {
      setLoading(true);
      const data = await invoke<PredictionMarket[]>('get_prediction_markets', { useMock: true });
      setMarkets(data);
    } catch (error) {
      console.error('Failed to load prediction markets:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPortfolioStats = async () => {
    try {
      const data = await invoke<PortfolioComparison>('get_portfolio_comparison', {
        userId: 'user_123',
      });
      setPortfolioStats(data);
    } catch (error) {
      console.error('Failed to load portfolio stats:', error);
    }
  };

  const loadConsensus = async (marketId: string) => {
    try {
      const data = await invoke<ConsensusData>('get_consensus_data', {
        marketId,
        useMock: true,
      });
      setConsensus(data);
    } catch (error) {
      console.error('Failed to load consensus data:', error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      loadMarkets();
      return;
    }

    try {
      const data = await invoke<PredictionMarket[]>('search_prediction_markets', {
        query: searchQuery,
        useMock: true,
      });
      setMarkets(data);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const categories = ['all', ...Array.from(new Set(markets.map(m => m.category)))];

  const filteredMarkets = selectedCategory === 'all'
    ? markets
    : markets.filter(m => m.category === selectedCategory);

  const formatPercentage = (value: number) => `${(value * 100).toFixed(1)}%`;
  const formatVolume = (value: number) => `$${(value / 1000).toFixed(1)}K`;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">Prediction Markets</h1>
            <p className="text-purple-200">Track and compare predictions across Polymarket and Drift</p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg text-white font-semibold hover:from-purple-600 hover:to-pink-600 transition flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create Prediction
          </button>
        </div>

        {/* Portfolio Stats */}
        {portfolioStats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <motion.div
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Target className="w-6 h-6 text-green-400" />
                <h3 className="text-white font-semibold">Accuracy Rate</h3>
              </div>
              <p className="text-3xl font-bold text-white">{formatPercentage(portfolioStats.accuracyRate)}</p>
              <p className="text-sm text-purple-200 mt-1">
                vs {formatPercentage(portfolioStats.marketAccuracyRate)} market avg
              </p>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <BarChart2 className="w-6 h-6 text-blue-400" />
                <h3 className="text-white font-semibold">Total Predictions</h3>
              </div>
              <p className="text-3xl font-bold text-white">{portfolioStats.totalPredictions}</p>
              <p className="text-sm text-purple-200 mt-1">
                {portfolioStats.correctPredictions} correct
              </p>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <Award className="w-6 h-6 text-yellow-400" />
                <h3 className="text-white font-semibold">Percentile Rank</h3>
              </div>
              <p className="text-3xl font-bold text-white">
                {formatPercentage(portfolioStats.percentileRank)}
              </p>
              <p className="text-sm text-purple-200 mt-1">vs community</p>
            </motion.div>

            <motion.div
              className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20"
              whileHover={{ scale: 1.02 }}
            >
              <div className="flex items-center gap-3 mb-2">
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <h3 className="text-white font-semibold">Best Category</h3>
              </div>
              <p className="text-2xl font-bold text-white">{portfolioStats.bestCategory || 'N/A'}</p>
              <p className="text-sm text-purple-200 mt-1">strongest area</p>
            </motion.div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search prediction markets..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full pl-10 pr-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
            </div>
            <button
              onClick={handleSearch}
              className="px-6 py-3 bg-purple-500 hover:bg-purple-600 rounded-lg text-white font-semibold transition"
            >
              Search
            </button>
          </div>

          <div className="flex gap-2 mt-4 flex-wrap">
            {categories.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(category)}
                className={`px-4 py-2 rounded-lg font-medium transition ${
                  selectedCategory === category
                    ? 'bg-purple-500 text-white'
                    : 'bg-white/10 text-purple-200 hover:bg-white/20'
                }`}
              >
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Markets Grid */}
        {loading ? (
          <div className="text-center py-12">
            <div className="inline-block w-12 h-12 border-4 border-purple-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white mt-4">Loading markets...</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMarkets.map((market) => (
              <motion.div
                key={market.id}
                className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20 hover:border-purple-400 transition cursor-pointer"
                whileHover={{ y: -5 }}
                onClick={() => {
                  setSelectedMarket(market);
                  loadConsensus(market.id);
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <span className="px-3 py-1 bg-purple-500/30 rounded-full text-purple-200 text-xs font-semibold">
                    {market.source}
                  </span>
                  <span className="px-3 py-1 bg-blue-500/30 rounded-full text-blue-200 text-xs font-semibold">
                    {market.category}
                  </span>
                </div>

                <h3 className="text-white font-bold text-lg mb-2 line-clamp-2">{market.title}</h3>
                <p className="text-purple-200 text-sm mb-4 line-clamp-2">{market.description}</p>

                <div className="space-y-2 mb-4">
                  {market.outcomes.map((outcome, idx) => (
                    <div key={idx} className="flex items-center justify-between">
                      <span className="text-white text-sm">{outcome}</span>
                      <span className="text-green-400 font-bold">
                        {formatPercentage(market.outcomePrices[idx] || 0)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="flex items-center justify-between text-sm text-purple-200 pt-4 border-t border-white/10">
                  <div className="flex items-center gap-1">
                    <DollarSign className="w-4 h-4" />
                    {formatVolume(market.volume24h)}
                  </div>
                  {market.endDate && (
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      {new Date(market.endDate * 1000).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Market Detail Modal */}
        {selectedMarket && (
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-white/20"
            >
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-white">{selectedMarket.title}</h2>
                <button
                  onClick={() => {
                    setSelectedMarket(null);
                    setConsensus(null);
                  }}
                  className="text-white/60 hover:text-white text-2xl"
                >
                  ×
                </button>
              </div>

              <p className="text-purple-200 mb-6">{selectedMarket.description}</p>

              {consensus && (
                <div className="bg-white/10 rounded-xl p-6 mb-6">
                  <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                    <PieChart className="w-5 h-5" />
                    Market Consensus
                  </h3>
                  <div className="space-y-3">
                    {consensus.outcomes.map((outcome, idx) => (
                      <div key={idx}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-white">{outcome}</span>
                          <span className="text-green-400 font-bold">
                            {formatPercentage(consensus.aggregatedOdds[idx] || 0)}
                          </span>
                        </div>
                        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                            style={{ width: `${(consensus.aggregatedOdds[idx] || 0) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4 pt-4 border-t border-white/10 flex justify-between text-sm">
                    <span className="text-purple-200">Agreement Score</span>
                    <span className="text-white font-bold">
                      {formatPercentage(consensus.agreementScore)}
                    </span>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-purple-200 text-sm mb-1">24h Volume</p>
                  <p className="text-white font-bold text-xl">{formatVolume(selectedMarket.volume24h)}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                  <p className="text-purple-200 text-sm mb-1">Liquidity</p>
                  <p className="text-white font-bold text-xl">{formatVolume(selectedMarket.liquidity)}</p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
}
