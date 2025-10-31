import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Rocket,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  Search,
  Plus,
  Star,
  Clock,
  ChevronDown,
  ChevronUp,
  Sparkles,
  CheckCircle2,
  XCircle,
  Info,
} from 'lucide-react';
import { ScoreCard } from './ScoreCard';
import { FeatureImportance } from './FeatureImportance';
import { WatchlistIntegration } from './WatchlistIntegration';
import { EarlyWarnings } from './EarlyWarnings';

export interface LaunchPrediction {
  tokenAddress: string;
  successProbability: number;
  riskLevel: string;
  confidence: number;
  predictedPeakTimeframe?: string;
  featureScores: FeatureScore[];
  earlyWarnings: EarlyWarning[];
  timestamp: string;
}

export interface FeatureScore {
  featureName: string;
  value: number;
  importance: number;
  impact: string;
  description: string;
}

export interface EarlyWarning {
  warningType: string;
  severity: string;
  message: string;
  detectedAt: string;
}

export interface TokenFeatures {
  tokenAddress: string;
  developerReputation: number;
  developerLaunchCount: number;
  developerSuccessRate: number;
  developerCategory: string;
  contractComplexity: number;
  proxyPatternDetected: boolean;
  upgradeableContract: boolean;
  liquidityUsd: number;
  liquidityRatio: number;
  liquidityChange24h: number;
  initialMarketCap: number;
  marketingHype: number;
  marketingSpendUsd: number;
  socialFollowersGrowth: number;
  communityEngagement: number;
  influencerSentiment: number;
  securityAuditScore?: number;
  dexDepthScore: number;
  watchlistInterest: number;
  retentionScore: number;
  launchTimestamp: string;
  actualOutcome?: number;
}

interface LaunchPredictorPanelProps {
  initialTokenAddress?: string;
}

export function LaunchPredictorPanel({ initialTokenAddress }: LaunchPredictorPanelProps) {
  const [tokenAddress, setTokenAddress] = useState(initialTokenAddress || '');
  const [prediction, setPrediction] = useState<LaunchPrediction | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>('overview');
  const [history, setHistory] = useState<LaunchPrediction[]>([]);
  const [showHistory, setShowHistory] = useState(false);

  useEffect(() => {
    if (initialTokenAddress) {
      analyzeLaunch(initialTokenAddress);
    }
  }, [initialTokenAddress]);

  const analyzeLaunch = async (address: string) => {
    if (!address) {
      setError('Please enter a token address');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const features = await invoke<TokenFeatures>('extract_token_features', {
        tokenAddress: address,
      });

      const result = await invoke<LaunchPrediction>('predict_launch_success', {
        request: {
          tokenAddress: address,
          features,
        },
      });

      setPrediction(result);
      loadHistory(address);
    } catch (err) {
      setError(String(err));
      console.error('Failed to analyze launch:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadHistory = async (address: string) => {
    try {
      const result = await invoke<{ tokenAddress: string; predictions: LaunchPrediction[] }>(
        'get_launch_prediction_history',
        {
          tokenAddress: address,
          days: 30,
        }
      );
      setHistory(result.predictions);
    } catch (err) {
      console.error('Failed to load history:', err);
    }
  };

  const handleAnalyze = () => {
    analyzeLaunch(tokenAddress);
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const getRiskColor = (riskLevel: string) => {
    switch (riskLevel) {
      case 'Low':
        return 'emerald';
      case 'Medium':
        return 'amber';
      case 'High':
        return 'orange';
      case 'Critical':
        return 'red';
      default:
        return 'gray';
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'emerald';
    if (confidence >= 0.6) return 'amber';
    return 'orange';
  };

  return (
    <div className="w-full h-full overflow-auto p-6 space-y-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-br from-slate-900/95 to-purple-900/30 border border-purple-500/30 rounded-3xl p-8"
      >
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-purple-500/20 rounded-2xl">
            <Rocket className="w-8 h-8 text-purple-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 text-transparent bg-clip-text">
              Launch Predictor AI
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              Advanced ML pipeline for new token success prediction
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Enter token address..."
              value={tokenAddress}
              onChange={e => setTokenAddress(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleAnalyze()}
              className="w-full px-4 py-3 bg-slate-800/60 border border-purple-500/20 rounded-2xl text-white placeholder-slate-500 focus:outline-none focus:border-purple-500/40"
            />
          </div>
          <button
            onClick={handleAnalyze}
            disabled={loading || !tokenAddress}
            className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:from-gray-600 disabled:to-gray-700 text-white rounded-2xl font-medium transition-all duration-200 flex items-center gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                Analyzing...
              </>
            ) : (
              <>
                <Search className="w-5 h-5" />
                Analyze
              </>
            )}
          </button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl flex items-center gap-2 text-red-400"
          >
            <XCircle className="w-5 h-5" />
            <span>{error}</span>
          </motion.div>
        )}
      </motion.div>

      <AnimatePresence>
        {prediction && (
          <>
            <ScoreCard
              prediction={prediction}
              getRiskColor={getRiskColor}
              getConfidenceColor={getConfidenceColor}
            />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="grid grid-cols-1 lg:grid-cols-2 gap-6"
            >
              <FeatureImportance features={prediction.featureScores} />
              <EarlyWarnings warnings={prediction.earlyWarnings} getRiskColor={getRiskColor} />
            </motion.div>

            <WatchlistIntegration tokenAddress={prediction.tokenAddress} prediction={prediction} />

            {history.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-slate-900/60 border border-purple-500/20 rounded-3xl p-6"
              >
                <button
                  onClick={() => setShowHistory(!showHistory)}
                  className="w-full flex items-center justify-between text-left"
                >
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <h3 className="text-xl font-semibold">Prediction History</h3>
                    <span className="text-sm text-slate-400">({history.length} entries)</span>
                  </div>
                  {showHistory ? (
                    <ChevronUp className="w-5 h-5 text-slate-400" />
                  ) : (
                    <ChevronDown className="w-5 h-5 text-slate-400" />
                  )}
                </button>

                <AnimatePresence>
                  {showHistory && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="mt-4 space-y-2 overflow-hidden"
                    >
                      {history.map((pred, idx) => (
                        <div
                          key={idx}
                          className="p-4 bg-slate-800/40 border border-purple-500/10 rounded-2xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-4">
                            <div
                              className={`text-2xl font-bold text-${getRiskColor(pred.riskLevel)}-400`}
                            >
                              {pred.successProbability.toFixed(1)}%
                            </div>
                            <div>
                              <div className="text-sm font-medium">
                                Risk Level: {pred.riskLevel}
                              </div>
                              <div className="text-xs text-slate-400">
                                {new Date(pred.timestamp).toLocaleString()}
                              </div>
                            </div>
                          </div>
                          <div className="text-sm text-slate-400">
                            {pred.earlyWarnings.length} warnings
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )}
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
