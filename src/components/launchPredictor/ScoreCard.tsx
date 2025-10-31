import { motion } from 'framer-motion';
import { TrendingUp, Sparkles, ShieldCheck, Activity } from 'lucide-react';
import type { LaunchPrediction } from './LaunchPredictorPanel';
import { getColorStyle } from './colorStyles';

interface ScoreCardProps {
  prediction: LaunchPrediction;
  getRiskColor: (riskLevel: string) => string;
  getConfidenceColor: (confidence: number) => string;
}

export function ScoreCard({ prediction, getRiskColor, getConfidenceColor }: ScoreCardProps) {
  const riskColorKey = getRiskColor(prediction.riskLevel);
  const confidenceColorKey = getConfidenceColor(prediction.confidence);
  const riskStyle = getColorStyle(riskColorKey);
  const confidenceStyle = getColorStyle(confidenceColorKey);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-900/70 border border-purple-500/30 rounded-3xl p-6"
    >
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1 flex flex-col justify-between">
          <div>
            <span className="text-xs uppercase text-slate-400">Predicted Success Probability</span>
            <div className="mt-4 relative">
              <div className="h-40 w-40 mx-auto rounded-full bg-slate-800/60 border border-purple-500/30 flex items-center justify-center shadow-[0_0_60px_rgba(168,85,247,0.35)]">
                <div className="text-center">
                  <div className={`${riskStyle.text} text-4xl font-bold`}>
                    {prediction.successProbability.toFixed(1)}%
                  </div>
                  <div className="text-xs text-slate-400 mt-1">Scaled 0-100</div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 flex items-center gap-3">
            <div className={`${riskStyle.chipBg} ${riskStyle.chipText} px-3 py-1 rounded-full text-xs font-medium`}>
              {prediction.riskLevel} Risk
            </div>
            <div className={`${confidenceStyle.chipBg} ${confidenceStyle.chipText} px-3 py-1 rounded-full text-xs font-medium`}>
              {(prediction.confidence * 100).toFixed(0)}% Confidence
            </div>
          </div>
          </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <motion.div
            whileHover={{ y: -4 }}
            className="p-4 rounded-2xl bg-slate-800/60 border border-purple-500/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Peak Interest Window</span>
              <Sparkles className="w-5 h-5 text-purple-300" />
            </div>
            <div className="text-lg font-semibold text-white">
              {prediction.predictedPeakTimeframe ?? 'Monitor in real-time'}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Estimated based on marketing momentum, watchlist velocity, and liquidity ramps.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="p-4 rounded-2xl bg-slate-800/60 border border-emerald-500/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Primary Catalysts</span>
              <TrendingUp className="w-5 h-5 text-emerald-300" />
            </div>
            <ul className="text-sm text-slate-300 space-y-1">
              {prediction.featureScores.slice(0, 3).map(score => (
                <li key={score.featureName} className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-400" />
                  <span>{score.featureName}</span>
                </li>
              ))}
            </ul>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="p-4 rounded-2xl bg-slate-800/60 border border-sky-500/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Early Warning Count</span>
              <Activity className="w-5 h-5 text-sky-300" />
            </div>
            <div className="text-lg font-semibold text-white">
              {prediction.earlyWarnings.length}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Triggered when liquidity depth, developer trust, or sentiment deviates outside safe bounds.
            </p>
          </motion.div>

          <motion.div
            whileHover={{ y: -4 }}
            className="p-4 rounded-2xl bg-slate-800/60 border border-indigo-500/20"
          >
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-slate-400">Model Certainty</span>
              <ShieldCheck className="w-5 h-5 text-indigo-300" />
            </div>
            <div className="text-lg font-semibold text-white">
              {(prediction.confidence * 100).toFixed(1)}%
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Weighted from developer reputation stability, audit depth, and recurrent launch outcomes.
            </p>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}
