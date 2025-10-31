import { FC } from 'react';
import { WeeklyReport } from '../../types/journal';
import { BarChart3, TrendingUp, Brain, AlertTriangle } from 'lucide-react';

interface Props {
  report: WeeklyReport;
}

export const WeeklyReportView: FC<Props> = ({ report }) => {
  const startDate = new Date(report.week_start * 1000);
  const endDate = new Date(report.week_end * 1000);

  return (
    <div className="border border-gray-800 bg-gray-900/80 rounded-xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-white">Weekly Report</h3>
          <p className="text-gray-400 text-sm">
            {startDate.toLocaleDateString()} - {endDate.toLocaleDateString()}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-400" />
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Entries</div>
          <div className="text-2xl font-bold text-white">{report.total_entries}</div>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Win Rate</div>
          <div className="text-2xl font-bold text-emerald-400">{report.win_rate.toFixed(1)}%</div>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Total P&L</div>
          <div className={`text-2xl font-bold ${report.total_pnl >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
            {report.total_pnl >= 0 ? '+' : ''}
            {report.total_pnl.toFixed(2)}
          </div>
        </div>
        <div className="bg-gray-900/60 border border-gray-800 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-1">Discipline</div>
          <div className="text-2xl font-bold text-blue-400">
            {(report.discipline_metrics.average_discipline_score * 100).toFixed(0)}%
          </div>
        </div>
      </div>

      {report.pattern_insights.length > 0 && (
        <div className="border border-amber-500/30 bg-amber-500/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-5 h-5 text-amber-400" />
            <h4 className="font-medium text-amber-300">Pattern Insights</h4>
          </div>
          <div className="space-y-2">
            {report.pattern_insights.map((insight, i) => (
              <div key={i} className="text-sm">
                <div className="font-medium text-amber-200">{insight.pattern_type}</div>
                <div className="text-amber-300/80">{insight.description}</div>
                <div className="text-amber-400/70 italic mt-1">→ {insight.recommendation}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {report.recommendations.length > 0 && (
        <div className="border border-blue-500/30 bg-blue-500/5 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-3">
            <Brain className="w-5 h-5 text-blue-400" />
            <h4 className="font-medium text-blue-300">Recommendations</h4>
          </div>
          <ul className="space-y-1 text-sm text-blue-200">
            {report.recommendations.map((rec, i) => (
              <li key={i}>• {rec}</li>
            ))}
          </ul>
        </div>
      )}

      {report.strategy_performance.length > 0 && (
        <div>
          <h4 className="font-medium text-white mb-3 flex items-center gap-2">
            <TrendingUp className="w-4 h-4" /> Strategy Performance
          </h4>
          <div className="space-y-2">
            {report.strategy_performance.map((strategy, i) => (
              <div key={i} className="flex items-center justify-between bg-gray-900/60 border border-gray-800 rounded-lg p-3">
                <div>
                  <div className="font-medium text-gray-200">{strategy.strategy_tag}</div>
                  <div className="text-sm text-gray-400">{strategy.trades_count} trades</div>
                </div>
                <div className="text-right">
                  <div className="text-emerald-400 font-semibold">{strategy.win_rate.toFixed(1)}%</div>
                  <div className="text-sm text-gray-400">Avg P&L: {strategy.average_pnl.toFixed(2)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
