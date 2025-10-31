import { motion } from 'framer-motion';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';
import type { FeatureScore } from './LaunchPredictorPanel';

interface FeatureImportanceProps {
  features: FeatureScore[];
}

export function FeatureImportance({ features }: FeatureImportanceProps) {
  const sortedFeatures = [...features].sort((a, b) => b.importance - a.importance).slice(0, 8);

  const getImpactIcon = (impact: string) => {
    switch (impact) {
      case 'Positive':
        return <TrendingUp className="w-4 h-4 text-emerald-400" />;
      case 'Negative':
        return <TrendingDown className="w-4 h-4 text-red-400" />;
      default:
        return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const getImpactColor = (impact: string) => {
    switch (impact) {
      case 'Positive':
        return 'emerald';
      case 'Negative':
        return 'red';
      default:
        return 'slate';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: 0.15 }}
      className="bg-slate-900/60 border border-purple-500/20 rounded-3xl p-6"
    >
      <div className="flex items-center gap-2 mb-6">
        <BarChart3 className="w-6 h-6 text-purple-400" />
        <h3 className="text-xl font-semibold">Feature Importance</h3>
      </div>

      <div className="space-y-4">
        {sortedFeatures.map((feature, idx) => {
          const impactColor = getImpactColor(feature.impact);
          const barWidth = (feature.importance * 100).toFixed(1);

          return (
            <motion.div
              key={feature.featureName}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 * idx }}
              className="group"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  {getImpactIcon(feature.impact)}
                  <span className="text-sm font-medium text-slate-200">
                    {feature.featureName}
                  </span>
                </div>
                <span className="text-xs text-slate-400">
                  {(feature.importance * 100).toFixed(1)}%
                </span>
              </div>

              <div className="relative h-6 bg-slate-800/60 rounded-full overflow-hidden border border-slate-700/50">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${barWidth}%` }}
                  transition={{ duration: 0.8, delay: 0.1 * idx }}
                  className={`h-full bg-gradient-to-r from-${impactColor}-500/60 to-${impactColor}-600/80 flex items-center justify-end pr-3`}
                >
                  <span className="text-xs font-medium text-white opacity-90">
                    {feature.value.toFixed(2)}
                  </span>
                </motion.div>
              </div>

              <p className="text-xs text-slate-500 mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                {feature.description}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div className="mt-6 p-4 bg-slate-800/40 border border-purple-500/10 rounded-2xl">
        <p className="text-xs text-slate-400">
          Feature importance reflects each attribute's weighted contribution to the final success probability. 
          Positive features increase the score, while negative features reduce it. Hover over bars to see detailed descriptions.
        </p>
      </div>
    </motion.div>
  );
}
