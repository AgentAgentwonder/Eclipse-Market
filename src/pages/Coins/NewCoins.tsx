import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import { Zap, AlertTriangle, Shield, Eye, Clock, Users, Droplet, RefreshCw } from 'lucide-react';
import { QuickTradeButton } from '../../components/trading/QuickTradeButton';
import { formatCurrencyAbbrev, formatTimeAgo } from './utils';

interface NewCoin {
  address: string;
  symbol: string;
  name: string;
  creation_time: number;
  liquidity: number;
  initial_supply: number;
  holder_count: number;
  safety_score: number;
  spam_filtered: boolean;
  deployment_tx: string;
  creator_address: string;
  metadata_uri: string | null;
}

interface SafetyAnalysis {
  is_safe: boolean;
  score: number;
  reasons: string[];
  warnings: string[];
}

interface NewCoinsProps {
  apiKey?: string;
  walletAddress?: string;
  onAddToWatchlist?: (address: string) => void;
  onNavigateToDetails?: (address: string) => void;
  watchlist?: Set<string>;
}

export function NewCoins({
  apiKey,
  walletAddress,
  onAddToWatchlist,
  onNavigateToDetails,
  watchlist = new Set(),
}: NewCoinsProps) {
  const [coins, setCoins] = useState<NewCoin[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCoin, setSelectedCoin] = useState<string | null>(null);
  const [safetyAnalysis, setSafetyAnalysis] = useState<SafetyAnalysis | null>(null);
  const [showSafetyModal, setShowSafetyModal] = useState(false);

  const fetchNewCoins = async () => {
    try {
      const result = await invoke<NewCoin[]>('get_new_coins');
      setCoins(result.filter((c) => !c.spam_filtered));
    } catch (error) {
      console.error('Failed to fetch new coins:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSafetyScore = async (address: string) => {
    try {
      const result = await invoke<SafetyAnalysis>('get_coin_safety_score', {
        address,
      });
      setSafetyAnalysis(result);
      setSelectedCoin(address);
      setShowSafetyModal(true);
    } catch (error) {
      console.error('Failed to fetch safety score:', error);
    }
  };

  useEffect(() => {
    fetchNewCoins();

    const interval = setInterval(() => {
      fetchNewCoins();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const getSafetyColor = (score: number) => {
    if (score >= 75) return 'text-green-400';
    if (score >= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getSafetyBg = (score: number) => {
    if (score >= 75) return 'bg-green-500/20';
    if (score >= 50) return 'bg-yellow-500/20';
    return 'bg-red-500/20';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            New Coin Alerts
          </h2>
          <p className="text-sm text-gray-400">
            Recently deployed tokens on Solana (auto-refresh 30s)
          </p>
        </div>
        <button
          onClick={() => {
            setLoading(true);
            fetchNewCoins();
          }}
          className="p-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {coins.length === 0 ? (
        <div className="bg-slate-800/30 rounded-2xl p-12 text-center">
          <Zap className="w-12 h-12 mx-auto text-gray-600 mb-4" />
          <p className="text-gray-400">No new coins detected yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {coins.map((coin, idx) => (
            <motion.div
              key={coin.address}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.03 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-xl p-4 border border-purple-500/20 hover:border-purple-500/40 transition-all"
            >
              <div className="flex items-start gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div>
                      <div className="text-lg font-bold">{coin.symbol}</div>
                      <div className="text-xs text-gray-400">{coin.name}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatTimeAgo(coin.creation_time)}
                    </div>
                    <button
                      onClick={() => fetchSafetyScore(coin.address)}
                      className={`px-2 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 ${getSafetyBg(
                        coin.safety_score
                      )} ${getSafetyColor(coin.safety_score)}`}
                    >
                      <Shield className="w-3 h-3" />
                      Safety: {coin.safety_score.toFixed(0)}
                    </button>
                  </div>

                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-blue-400" />
                      <div>
                        <div className="text-xs text-gray-400">Liquidity</div>
                        <div className="font-semibold">${formatCurrencyAbbrev(coin.liquidity, 1)}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-purple-400" />
                      <div>
                        <div className="text-xs text-gray-400">Holders</div>
                        <div className="font-semibold">{coin.holder_count}</div>
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-gray-400">Supply</div>
                      <div className="font-semibold">{formatCurrencyAbbrev(coin.initial_supply, 1)}</div>
                    </div>
                  </div>

                  {coin.safety_score < 50 && (
                    <div className="mt-2 flex items-center gap-2 text-xs text-yellow-400 bg-yellow-500/10 px-3 py-1.5 rounded">
                      <AlertTriangle className="w-3 h-3" />
                      High risk - exercise caution
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  {walletAddress && (
                    <QuickTradeButton
                      fromToken={{
                        symbol: 'SOL',
                        mint: 'So11111111111111111111111111111111111111112',
                        decimals: 9,
                      }}
                      toToken={{
                        symbol: coin.symbol,
                        mint: coin.address,
                        decimals: 9,
                      }}
                      side="buy"
                      walletAddress={walletAddress}
                      className="text-sm whitespace-nowrap"
                    />
                  )}
                  {onAddToWatchlist && (
                    <button
                      onClick={() => onAddToWatchlist(coin.address)}
                      className={`px-3 py-2 rounded-lg transition-colors ${watchlist.has(coin.address) ? 'bg-purple-500/30 text-purple-200 border border-purple-500/50' : 'bg-slate-700/50 hover:bg-slate-700'}`}
                      title={watchlist.has(coin.address) ? 'Remove from Watchlist' : 'Add to Watchlist'}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  )}
                  {onNavigateToDetails && (
                    <button
                      onClick={() => onNavigateToDetails(coin.address)}
                      className="px-3 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-medium transition-all whitespace-nowrap"
                    >
                      Details
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {showSafetyModal && safetyAnalysis && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-2xl p-6 max-w-md w-full mx-4 border border-purple-500/20"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <Shield className={getSafetyColor(safetyAnalysis.score)} />
                Safety Analysis
              </h3>
              <button
                onClick={() => setShowSafetyModal(false)}
                className="text-gray-400 hover:text-white"
              >
                ×
              </button>
            </div>

            <div className="space-y-4">
              <div className="text-center py-4">
                <div
                  className={`text-5xl font-bold mb-2 ${getSafetyColor(
                    safetyAnalysis.score
                  )}`}
                >
                  {safetyAnalysis.score.toFixed(0)}
                </div>
                <div className="text-sm text-gray-400">
                  {safetyAnalysis.is_safe ? 'Relatively Safe' : 'High Risk'}
                </div>
              </div>

              {safetyAnalysis.reasons.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-green-400 mb-2">
                    ✓ Positive Factors
                  </div>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {safetyAnalysis.reasons.map((reason, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-green-400">•</span>
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {safetyAnalysis.warnings.length > 0 && (
                <div>
                  <div className="text-sm font-semibold text-yellow-400 mb-2 flex items-center gap-1">
                    <AlertTriangle className="w-4 h-4" />
                    Warnings
                  </div>
                  <ul className="space-y-1 text-sm text-gray-300">
                    {safetyAnalysis.warnings.map((warning, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <span className="text-yellow-400">•</span>
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <button
                onClick={() => setShowSafetyModal(false)}
                className="w-full py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-medium transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
