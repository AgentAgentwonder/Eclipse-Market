import { motion } from 'framer-motion';
import { Activity } from 'lucide-react';
import { CorrelationMatrix } from '../../types/portfolio';

interface CorrelationHeatmapProps {
  correlation: CorrelationMatrix;
}

export function CorrelationHeatmap({ correlation }: CorrelationHeatmapProps) {
  const getColorForValue = (value: number): string => {
    if (value >= 0.7) return '#dc2626'; // Strong positive - red
    if (value >= 0.4) return '#f97316'; // Moderate positive - orange
    if (value >= 0.1) return '#fbbf24'; // Weak positive - yellow
    if (value >= -0.1) return '#94a3b8'; // Near zero - gray
    if (value >= -0.4) return '#60a5fa'; // Weak negative - light blue
    if (value >= -0.7) return '#3b82f6'; // Moderate negative - blue
    return '#1d4ed8'; // Strong negative - dark blue
  };

  const getTextColorForValue = (value: number): string => {
    const absValue = Math.abs(value);
    return absValue > 0.4 ? '#ffffff' : '#1f2937';
  };

  return (
    <div className="bg-gray-800 rounded-xl p-6 shadow-lg border border-gray-700">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-purple-400" />
        <h2 className="text-xl font-semibold">Correlation Matrix</h2>
      </div>

      <div className="overflow-x-auto">
        <div className="inline-block min-w-full">
          <table className="border-collapse">
            <thead>
              <tr>
                <th className="p-2 text-left text-sm font-medium text-gray-400"></th>
                {correlation.symbols.map(symbol => (
                  <th
                    key={symbol}
                    className="p-2 text-center text-sm font-medium text-gray-400 min-w-[60px]"
                  >
                    {symbol}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {correlation.symbols.map((rowSymbol, i) => (
                <tr key={rowSymbol}>
                  <td className="p-2 text-sm font-medium text-gray-400 text-left">
                    {rowSymbol}
                  </td>
                  {correlation.matrix[i].map((value, j) => (
                    <motion.td
                      key={`${rowSymbol}-${correlation.symbols[j]}`}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: (i * correlation.symbols.length + j) * 0.01 }}
                      className="p-2"
                    >
                      <div
                        className="w-14 h-14 rounded flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: getColorForValue(value),
                          color: getTextColorForValue(value),
                        }}
                        title={`${rowSymbol} vs ${correlation.symbols[j]}: ${value.toFixed(3)}`}
                      >
                        {value.toFixed(2)}
                      </div>
                    </motion.td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#dc2626' }}></div>
            <span>Strong Positive</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#94a3b8' }}></div>
            <span>Neutral</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 rounded" style={{ backgroundColor: '#1d4ed8' }}></div>
            <span>Strong Negative</span>
          </div>
        </div>
        <div>
          Updated: {new Date(correlation.calculatedAt).toLocaleString()}
        </div>
      </div>
    </div>
  );
}
