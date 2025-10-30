import { AlertTriangle } from 'lucide-react';
import { RiskMetrics } from '../../types/defi';

interface RiskWarningProps {
  metrics: RiskMetrics[];
}

export function RiskWarning({ metrics }: RiskWarningProps) {
  return (
    <div className="bg-red-900/20 border border-red-500 rounded-xl p-4">
      <div className="flex items-start gap-3">
        <AlertTriangle className="w-6 h-6 text-red-400 mt-1" />
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-red-400 mb-2">Risk Alert</h3>
          <p className="text-sm text-red-300 mb-3">
            {metrics.length} position{metrics.length > 1 ? 's' : ''} require immediate attention
          </p>
          <div className="space-y-2">
            {metrics.map(metric => (
              <div key={metric.positionId} className="bg-red-900/30 rounded-lg p-3">
                <div className="flex items-center justify-between mb-1">
                  <span className="font-medium text-sm">{metric.positionId}</span>
                  <span className={`text-xs px-2 py-1 rounded ${
                    metric.riskLevel === 'critical' ? 'bg-red-600' : 'bg-orange-600'
                  }`}>
                    {metric.riskLevel.toUpperCase()}
                  </span>
                </div>
                {metric.healthFactor && (
                  <p className="text-xs text-gray-300">
                    Health Factor: {metric.healthFactor.toFixed(2)}
                  </p>
                )}
                {metric.warnings.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {metric.warnings.map((warning, idx) => (
                      <li key={idx} className="text-xs text-red-300">
                        • {warning}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
