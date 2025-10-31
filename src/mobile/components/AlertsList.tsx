import React from 'react';

interface AlertsListProps {
  alerts: Array<{
    alert_id: string;
    symbol: string;
    condition: string;
    value: number;
    triggered: boolean;
    timestamp: number;
  }>;
}

export const AlertsList: React.FC<AlertsListProps> = ({ alerts }) => {
  return (
    <div className="bg-gray-800 rounded-2xl p-4 shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg font-semibold">Alerts</h2>
        <span className="text-xs text-gray-400">{alerts.length} active</span>
      </div>

      <div className="space-y-3">
        {alerts.map((alert) => {
          const conditionLabel = alert.condition === 'above' ? 'Above' : 'Below';
          const triggerTime = new Date(alert.timestamp * 1000).toLocaleTimeString();

          return (
            <div
              key={alert.alert_id}
              className="bg-gray-900/40 rounded-xl px-4 py-3 flex items-center justify-between"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-sm font-semibold">{alert.symbol}</span>
                  <span className="text-xs text-gray-400">{conditionLabel}</span>
                </div>
                <div className="text-xs text-gray-500 mt-1">{triggerTime}</div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold">${alert.value.toLocaleString()}</div>
                <div className={`text-xs font-medium ${alert.triggered ? 'text-emerald-400' : 'text-gray-400'}`}>
                  {alert.triggered ? 'Triggered' : 'Watching'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
