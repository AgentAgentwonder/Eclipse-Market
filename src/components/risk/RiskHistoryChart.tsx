import { useMemo } from 'react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import type { RiskHistory } from '../../types/risk';

interface RiskHistoryChartProps {
  history: RiskHistory;
}

export function RiskHistoryChart({ history }: RiskHistoryChartProps) {
  const chartData = useMemo(() => {
    return history.history.map(point => ({
      timestamp: new Date(point.timestamp).toLocaleDateString(),
      score: point.score,
      riskLevel: point.riskLevel,
    }));
  }, [history]);

  if (!chartData.length) {
    return (
      <div className="flex h-64 items-center justify-center rounded-xl border border-slate-700 bg-slate-900/50 text-sm text-gray-400">
        No historical risk data available yet. Risk scores will appear here as they are calculated over time.
      </div>
    );
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (!active || !payload || !payload.length) return null;

    const data = payload[0].payload;
    const getLevelColor = (level: string) => {
      switch (level) {
        case 'Low':
          return 'text-green-400';
        case 'Medium':
          return 'text-yellow-400';
        case 'High':
          return 'text-orange-400';
        case 'Critical':
          return 'text-red-400';
        default:
          return 'text-gray-400';
      }
    };

    return (
      <div className="rounded-lg border border-purple-500/30 bg-slate-900/95 p-3 shadow-lg backdrop-blur-sm">
        <p className="mb-1 text-xs text-gray-400">{data.timestamp}</p>
        <p className={`text-lg font-bold ${getLevelColor(data.riskLevel)}`}>
          {data.riskLevel} Risk
        </p>
        <p className="text-sm text-gray-300">Score: {data.score.toFixed(1)}</p>
      </div>
    );
  };

  const getLineColor = (level: string) => {
    switch (level) {
      case 'Low':
        return '#10b981';
      case 'Medium':
        return '#eab308';
      case 'High':
        return '#f97316';
      case 'Critical':
        return '#ef4444';
      default:
        return '#9333ea';
    }
  };

  const latestLevel = chartData[chartData.length - 1]?.riskLevel || 'Medium';
  const lineColor = getLineColor(latestLevel);

  return (
    <div className="rounded-xl border border-purple-500/20 bg-slate-800/50 p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold">Risk Score History</h3>
        <p className="text-sm text-gray-400">
          Track how the risk assessment has changed over the past {history.history.length} data points
        </p>
      </div>

      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData} margin={{ top: 5, right: 30, left: 10, bottom: 5 }}>
          <defs>
            <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={lineColor} stopOpacity={0.3} />
              <stop offset="95%" stopColor={lineColor} stopOpacity={0} />
            </linearGradient>
          </defs>
          <XAxis
            dataKey="timestamp"
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tickLine={false}
          />
          <YAxis
            domain={[0, 100]}
            stroke="#9ca3af"
            style={{ fontSize: '12px' }}
            tickLine={false}
          />
          <Tooltip content={<CustomTooltip />} />
          
          {/* Risk level zones */}
          <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" opacity={0.3} />
          <ReferenceLine y={60} stroke="#eab308" strokeDasharray="3 3" opacity={0.3} />
          <ReferenceLine y={80} stroke="#f97316" strokeDasharray="3 3" opacity={0.3} />
          
          <Line
            type="monotone"
            dataKey="score"
            stroke={lineColor}
            strokeWidth={3}
            fill="url(#colorScore)"
            dot={{ fill: lineColor, strokeWidth: 2, r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>

      {/* Legend */}
      <div className="mt-4 flex flex-wrap items-center gap-4 text-xs">
        <div className="flex items-center gap-2">
          <div className="h-2 w-8 rounded bg-green-500" />
          <span className="text-gray-400">Low (0-30)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-8 rounded bg-yellow-500" />
          <span className="text-gray-400">Medium (30-60)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-8 rounded bg-orange-500" />
          <span className="text-gray-400">High (60-80)</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="h-2 w-8 rounded bg-red-500" />
          <span className="text-gray-400">Critical (80-100)</span>
        </div>
      </div>
    </div>
  );
}
