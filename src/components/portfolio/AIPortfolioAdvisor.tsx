import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles,
  TrendingUp,
  TrendingDown,
  Info,
  Check,
  BarChart3,
  Target,
  AlertCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  UserRiskProfile,
  PortfolioRecommendation,
  Position,
  PortfolioMetrics,
  PerformanceComparison,
} from '../../types/portfolio';

interface AIPortfolioAdvisorProps {
  positions: Position[];
  metrics: PortfolioMetrics;
}

export function AIPortfolioAdvisor({ positions, metrics }: AIPortfolioAdvisorProps) {
  const [loading, setLoading] = useState(false);
  const [recommendation, setRecommendation] = useState<PortfolioRecommendation | null>(null);
  const [riskProfile, setRiskProfile] = useState<UserRiskProfile>({
    profile: 'moderate',
    investmentHorizon: 'medium',
    goals: ['Growth', 'Diversification'],
    constraints: [],
    riskTolerance: 0.7,
  });
  const [constraintInput, setConstraintInput] = useState('');
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [expandedAllocation, setExpandedAllocation] = useState<string | null>(null);
  const [performanceData, setPerformanceData] = useState<PerformanceComparison[]>([]);
  const [historyVisible, setHistoryVisible] = useState(false);

  const goalOptions = ['Growth', 'Income', 'Capital Preservation', 'Tax Efficiency', 'Diversification'];

  useEffect(() => {
    loadRecommendations();
    loadPerformanceHistory();
  }, []);

  useEffect(() => {
    setRiskProfile(prev => ({
      ...prev,
      constraints: constraintInput
        .split('\n')
        .map(value => value.trim())
        .filter(Boolean),
    }));
  }, [constraintInput]);

  const toggleGoal = (goal: string) => {
    setRiskProfile(prev => {
      const hasGoal = prev.goals.includes(goal);
      const goals = hasGoal ? prev.goals.filter(g => g !== goal) : [...prev.goals, goal];
      return { ...prev, goals };
    });
  };

  const loadRecommendations = async () => {
    try {
      const recommendations = await invoke<PortfolioRecommendation[]>(
        'get_portfolio_recommendations',
        { limit: 1 }
      );
      if (recommendations.length > 0) {
        setRecommendation(recommendations[0]);
      }
    } catch (error) {
      console.error('Failed to load recommendations:', error);
    }
  };

  const loadPerformanceHistory = async () => {
    try {
      const history = await invoke<PerformanceComparison[]>('get_performance_history', {
        recommendationId: null,
        limit: 10,
      });
      setPerformanceData(history);
    } catch (error) {
      console.error('Failed to load performance history:', error);
    }
  };

  const generateRecommendation = async () => {
    setLoading(true);
    try {
      const newRecommendation = await invoke<PortfolioRecommendation>(
        'generate_portfolio_recommendation',
        {
          positions,
          riskProfile,
          totalValue: metrics.totalValue,
        }
      );
      setRecommendation(newRecommendation);
    } catch (error) {
      console.error('Failed to generate recommendation:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyRecommendation = async () => {
    if (!recommendation) return;

    try {
      await invoke('apply_portfolio_recommendation', {
        recommendationId: recommendation.id,
      });
      setShowConfirmation(false);
      setRecommendation({ ...recommendation, status: 'applied' });
    } catch (error) {
      console.error('Failed to apply recommendation:', error);
    }
  };

  const getActionColor = (action: string) => {
    switch (action) {
      case 'buy':
        return 'text-green-400 bg-green-400/10';
      case 'sell':
        return 'text-red-400 bg-red-400/10';
      default:
        return 'text-gray-400 bg-gray-400/10';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-br from-purple-500/20 to-pink-500/20">
            <Sparkles className="w-6 h-6 text-purple-400" />
          </div>
          <div>
            <h2 className="text-2xl font-bold">AI Portfolio Advisor</h2>
            <p className="text-sm text-gray-400">
              Personalized recommendations based on your risk profile
            </p>
          </div>
        </div>
        <button
          onClick={generateRecommendation}
          disabled={loading}
          className="px-6 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 rounded-lg font-medium transition-all shadow-lg shadow-purple-500/30 disabled:opacity-50"
        >
          {loading ? 'Generating...' : 'Get Recommendation'}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">Risk Profile</label>
          <select
            value={riskProfile.profile}
            onChange={e =>
              setRiskProfile({ ...riskProfile, profile: e.target.value as any })
            }
            className="w-full bg-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="conservative">Conservative</option>
            <option value="moderate">Moderate</option>
            <option value="aggressive">Aggressive</option>
          </select>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Investment Horizon
          </label>
          <select
            value={riskProfile.investmentHorizon}
            onChange={e =>
              setRiskProfile({ ...riskProfile, investmentHorizon: e.target.value as any })
            }
            className="w-full bg-gray-700 rounded-lg px-3 py-2 outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="short">Short Term (&lt;1 year)</option>
            <option value="medium">Medium Term (1-3 years)</option>
            <option value="long">Long Term (3+ years)</option>
          </select>
        </div>

        <div className="bg-gray-800 rounded-xl p-4 border border-gray-700">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Risk Tolerance
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={riskProfile.riskTolerance}
            onChange={e =>
              setRiskProfile({ ...riskProfile, riskTolerance: parseFloat(e.target.value) })
            }
            className="w-full"
          />
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>Low</span>
            <span>{(riskProfile.riskTolerance * 100).toFixed(0)}%</span>
            <span>High</span>
          </div>
        </div>
      </div>

      {recommendation && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-xl p-6 border border-gray-700 space-y-6"
        >
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-semibold mb-2">Current Recommendation</h3>
              <p className="text-sm text-gray-400">
                Generated on {new Date(recommendation.timestamp).toLocaleString()}
              </p>
            </div>
            {recommendation.status === 'pending' && (
              <button
                onClick={() => setShowConfirmation(true)}
                className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
              >
                Follow Recommendation
              </button>
            )}
            {recommendation.status === 'applied' && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-lg">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">Applied</span>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Target className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-medium text-gray-300">Expected Return</h4>
              </div>
              <p className="text-2xl font-bold text-green-400">
                {recommendation.expectedReturn.toFixed(2)}%
              </p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-4 h-4 text-orange-400" />
                <h4 className="text-sm font-medium text-gray-300">Expected Risk</h4>
              </div>
              <p className="text-2xl font-bold text-orange-400">
                {recommendation.expectedRisk.toFixed(2)}%
              </p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <BarChart3 className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-medium text-gray-300">Sharpe Ratio</h4>
              </div>
              <p className="text-2xl font-bold text-blue-400">
                {recommendation.sharpeRatio.toFixed(2)}
              </p>
            </div>

            <div className="bg-gray-700/50 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <Info className="w-4 h-4 text-cyan-400" />
                <h4 className="text-sm font-medium text-gray-300">Diversification</h4>
              </div>
              <p className="text-2xl font-bold text-cyan-400">
                {recommendation.diversificationScore.toFixed(0)}/100
              </p>
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Allocation Changes</h4>
            <div className="space-y-2">
              {recommendation.allocations.map(allocation => (
                <div
                  key={allocation.symbol}
                  className="bg-gray-700/30 rounded-lg p-4 hover:bg-gray-700/50 transition-colors"
                >
                  <div
                    className="flex items-center justify-between cursor-pointer"
                    onClick={() =>
                      setExpandedAllocation(
                        expandedAllocation === allocation.symbol ? null : allocation.symbol
                      )
                    }
                  >
                    <div className="flex items-center gap-4">
                      <span className="font-semibold">{allocation.symbol}</span>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getActionColor(allocation.action)}`}
                      >
                        {allocation.action.toUpperCase()}
                      </span>
                      {allocation.action !== 'hold' && (
                        <div className="flex items-center gap-1 text-sm text-gray-400">
                          {allocation.action === 'buy' ? (
                            <TrendingUp className="w-4 h-4" />
                          ) : (
                            <TrendingDown className="w-4 h-4" />
                          )}
                          <span>
                            {allocation.currentPercent.toFixed(1)}% →{' '}
                            {allocation.targetPercent.toFixed(1)}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">
                        $
                        {allocation.estimatedValue.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      {expandedAllocation === allocation.symbol ? (
                        <ChevronUp className="w-5 h-5 text-gray-400" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-gray-400" />
                      )}
                    </div>
                  </div>

                  <AnimatePresence>
                    {expandedAllocation === allocation.symbol && (
                      <motion.div
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="mt-4 pt-4 border-t border-gray-600"
                      >
                        <p className="text-sm text-gray-300">{allocation.reasoning}</p>
                        {allocation.action !== 'hold' && (
                          <div className="mt-2 text-sm text-gray-400">
                            Amount to {allocation.action}: ${allocation.amount.toFixed(2)}
                          </div>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-lg font-semibold mb-4">Key Factors</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {recommendation.factors.map((factor, index) => (
                <div key={index} className="bg-gray-700/30 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{factor.name}</span>
                    <span className="text-sm text-purple-400">
                      Impact: {factor.impact.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-sm text-gray-400">{factor.description}</p>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {performanceData.length > 0 && (
        <div className="bg-gray-800 rounded-xl p-6 border border-gray-700">
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={() => setHistoryVisible(!historyVisible)}
          >
            <h3 className="text-xl font-semibold">Performance History</h3>
            {historyVisible ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <AnimatePresence>
            {historyVisible && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 space-y-2"
              >
                {performanceData.map((perf, index) => (
                  <div key={index} className="bg-gray-700/30 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-sm text-gray-400">
                          {new Date(perf.timestamp).toLocaleDateString()}
                        </span>
                        <div className="flex items-center gap-4 mt-1">
                          <span className="text-sm">
                            Actual: <span className="font-bold">{perf.actualReturn.toFixed(2)}%</span>
                          </span>
                          <span className="text-sm">
                            Baseline: {perf.baselineReturn.toFixed(2)}%
                          </span>
                        </div>
                      </div>
                      <div
                        className={`text-lg font-bold ${perf.outperformance >= 0 ? 'text-green-400' : 'text-red-400'}`}
                      >
                        {perf.outperformance >= 0 ? '+' : ''}
                        {perf.outperformance.toFixed(2)}%
                      </div>
                    </div>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      <AnimatePresence>
        {showConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={() => setShowConfirmation(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-gray-800 rounded-xl p-6 max-w-md border border-gray-700"
              onClick={e => e.stopPropagation()}
            >
              <h3 className="text-xl font-semibold mb-4">Confirm Recommendation</h3>
              <p className="text-gray-300 mb-6">
                Are you sure you want to apply this recommendation? This will update your
                portfolio allocation settings.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={applyRecommendation}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  Apply
                </button>
                <button
                  onClick={() => setShowConfirmation(false)}
                  className="flex-1 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
