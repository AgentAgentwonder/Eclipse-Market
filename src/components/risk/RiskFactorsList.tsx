import { TrendingDown, TrendingUp, AlertTriangle, ShieldCheck } from 'lucide-react';
import type { RiskFactor } from '../../types/risk';

interface RiskFactorsListProps {
  factors: RiskFactor[];
}

export function RiskFactorsList({ factors }: RiskFactorsListProps) {
  if (!factors.length) {
    return (
      <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-4 text-sm text-gray-400">
        No significant risk contributors were identified for this token in the latest analysis.
      </div>
    );
  }

  const getSeverityClasses = (severity: RiskFactor['severity']) => {
    switch (severity) {
      case 'High':
        return 'border-red-500/30 bg-red-500/10 text-red-300';
      case 'Medium':
        return 'border-yellow-500/30 bg-yellow-500/10 text-yellow-200';
      default:
        return 'border-slate-700 bg-slate-800/60 text-slate-200';
    }
  };

  const getSeverityIcon = (severity: RiskFactor['severity']) => {
    switch (severity) {
      case 'High':
        return <AlertTriangle className="h-4 w-4" />;
      case 'Medium':
        return <TrendingUp className="h-4 w-4" />;
      default:
        return <ShieldCheck className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-3">
      {factors.map(factor => (
        <div
          key={factor.factorName}
          className={`rounded-xl border p-4 transition-all hover:border-purple-500/40 ${getSeverityClasses(factor.severity)}`}
        >
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wide">
                <span className="flex items-center gap-2 rounded-full bg-black/20 px-2 py-1 text-xs">
                  {getSeverityIcon(factor.severity)}
                  <span>{factor.severity} Impact</span>
                </span>
                <span className="text-xs font-medium text-white/60">{factor.factorName.replace(/_/g, ' ')}</span>
              </div>
              <p className="text-sm text-white/80">{factor.description}</p>
            </div>
            <div className="text-right">
              <p className="text-xs uppercase text-white/50">Impact Score</p>
              <p className="text-lg font-bold text-white/80">{factor.impact.toFixed(1)}</p>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
