import { TrendingUp, PieChart, ShieldCheck, AlertOctagon } from 'lucide-react';
import { motion } from 'framer-motion';
import {
  DiversificationMetrics,
  SharpeMetrics,
  FactorAnalysis,
} from '../../types/portfolio';

interface RiskDiversificationSummaryProps {
  diversification: DiversificationMetrics;
  sharpe: SharpeMetrics;
  factors: FactorAnalysis;
}

const STAT_CARD_VARIANTS = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
};

export function RiskDiversificationSummary({
  diversification,
  sharpe,
  factors,
}: RiskDiversificationSummaryProps) {
  const getSharpeStatus = (value: number) => {
    if (value >= 1.5) return { label: 'Excellent', color: 'text-green-400' };
    if (value >= 1.0) return { label: 'Good', color: 'text-emerald-400' };
    if (value >= 0.5) return { label: 'Fair', color: 'text-yellow-400' };
    if (value >= 0.0) return { label: 'Caution', color: 'text-orange-400' };
    return { label: 'Negative', color: 'text-red-400' };
  };

  const sharpeStatus = getSharpeStatus(sharpe.sharpeRatio);

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <motion.div
        variants={STAT_CARD_VARIANTS}
        initial="initial"
        animate="animate"
        className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700"
      >
        <div className="flex items-center gap-2 mb-3">
          <PieChart className="w-5 h-5 text-purple-400" />
          <h3 className="text-lg font-semibold">Diversification Score</h3>
        </div>
        <p className="text-4xl font-bold text-purple-300">
          {diversification.score.toFixed(1)}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          Effective N: {diversification.effectiveN.toFixed(2)} • Avg Corr:{' '}
          {diversification.avgCorrelation.toFixed(2)}
        </p>
        <div className="mt-4 flex items-center gap-2 text-sm text-gray-300">
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
          <span>
            Concentration Index: {(diversification.concentrationRisk * 100).toFixed(1)}
          </span>
        </div>
      </motion.div>

      <motion.div
        variants={STAT_CARD_VARIANTS}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.1 }}
        className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700"
      >
        <div className="flex items-center gap-2 mb-3">
          <TrendingUp className="w-5 h-5 text-green-400" />
          <h3 className="text-lg font-semibold">Sharpe Ratio</h3>
        </div>
        <p className={`text-4xl font-bold ${sharpeStatus.color}`}>
          {sharpe.sharpeRatio.toFixed(2)}
        </p>
        <p className="text-sm text-gray-400 mt-2">
          {sharpeStatus.label} risk-adjusted performance
        </p>
        <div className="mt-4 space-y-2 text-sm text-gray-300">
          <div className="flex justify-between">
            <span>Annualized Return</span>
            <span>{(sharpe.annualizedReturn * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between">
            <span>Annualized Volatility</span>
            <span>{(sharpe.annualizedVolatility * 100).toFixed(2)}%</span>
          </div>
          <div className="flex justify-between text-gray-400">
            <span>Risk-free Rate</span>
            <span>{(sharpe.riskFreeRate * 100).toFixed(2)}%</span>
          </div>
        </div>
      </motion.div>

      <motion.div
        variants={STAT_CARD_VARIANTS}
        initial="initial"
        animate="animate"
        transition={{ delay: 0.2 }}
        className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700"
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertOctagon className="w-5 h-5 text-orange-400" />
          <h3 className="text-lg font-semibold">Factor Exposure</h3>
        </div>
        <div className="space-y-3">
          {factors.factors.map((factor, index) => (
            <div key={factor.name} className="space-y-1">
              <div className="flex items-center justify-between text-sm text-gray-300">
                <span>{factor.name}</span>
                <span>
                  β {factor.beta.toFixed(2)} • Exposure {factor.exposure.toFixed(2)}
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-700/70 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(Math.abs(factor.beta) * 100, 100)}%` }}
                    transition={{ delay: index * 0.05 }}
                    className="h-full bg-purple-400"
                  ></motion.div>
                </div>
                <span className="text-xs text-gray-400 w-12 text-right">
                  {factor.beta >= 0 ? '+' : ''}
                  {factor.beta.toFixed(2)}
                </span>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-4 text-sm text-gray-400 space-y-1">
          <div>Market Beta: {factors.marketBeta.toFixed(2)}</div>
          <div>Systematic Risk: {(factors.systematicRisk * 100).toFixed(2)}%</div>
          <div>Specific Risk: {(factors.specificRisk * 100).toFixed(2)}%</div>
        </div>
      </motion.div>
    </div>
  );
}
