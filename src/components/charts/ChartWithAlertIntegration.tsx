import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceDot,
  ReferenceArea,
} from 'recharts';
import { motion } from 'framer-motion';
import { X, Zap, ExternalLink } from 'lucide-react';

interface ChartPoint {
  timestamp: number;
  price: number;
  volume?: number;
}

interface ChartWithAlertIntegrationProps {
  symbol: string;
  data: ChartPoint[];
  focusTimestamp?: string;
  onClose?: () => void;
  onQuickTrade?: (symbol: string) => void;
}

const ChartWithAlertIntegration: React.FC<ChartWithAlertIntegrationProps> = ({
  symbol,
  data,
  focusTimestamp,
  onClose,
  onQuickTrade,
}) => {
  const [highlightTimestamp, setHighlightTimestamp] = useState<number | null>(null);

  useEffect(() => {
    if (focusTimestamp) {
      const timestamp = new Date(focusTimestamp).getTime();
      setHighlightTimestamp(timestamp);
    }
  }, [focusTimestamp]);

  const chartData = useMemo(() => {
    return data.map(point => ({
      time: new Date(point.timestamp).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
      timestamp: point.timestamp,
      price: point.price,
      volume: point.volume,
    }));
  }, [data]);

  const highlightedPoint = useMemo(() => {
    if (!highlightTimestamp) return null;
    return chartData.find(point => Math.abs(point.timestamp - highlightTimestamp) < 60000);
  }, [chartData, highlightTimestamp]);

  const focusRange = useMemo(() => {
    if (!highlightTimestamp) return null;
    const buffer = 5 * 60 * 1000;
    return {
      start: highlightTimestamp - buffer,
      end: highlightTimestamp + buffer,
    };
  }, [highlightTimestamp]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className="fixed inset-4 z-50 bg-slate-900/95 backdrop-blur-xl rounded-3xl border border-purple-500/30 shadow-2xl overflow-hidden flex flex-col"
    >
      <div className="flex items-center justify-between px-6 py-4 border-b border-purple-500/20">
        <div>
          <h2 className="text-2xl font-bold">{symbol} Chart</h2>
          {highlightedPoint && (
            <p className="text-sm text-slate-400">
              Alert triggered at {new Date(highlightedPoint.timestamp).toLocaleString()}
            </p>
          )}
        </div>
        <div className="flex items-center gap-2">
          {onQuickTrade && (
            <button
              onClick={() => onQuickTrade(symbol)}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 hover:bg-green-600 rounded-xl font-semibold transition"
            >
              <Zap className="w-4 h-4" />
              Quick Trade
            </button>
          )}
          <a
            href={`https://birdeye.so/token/${symbol}`}
            target="_blank"
            rel="noopener noreferrer"
            className="p-2 hover:bg-purple-500/20 rounded-xl transition"
            title="View on Birdeye"
          >
            <ExternalLink className="w-5 h-5" />
          </a>
          {onClose && (
            <button
              onClick={onClose}
              className="p-2 hover:bg-purple-500/20 rounded-xl transition"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 p-6 overflow-auto">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <defs>
              <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#a855f7" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
            <XAxis
              dataKey="time"
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              interval="preserveStartEnd"
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              domain={['auto', 'auto']}
              tickFormatter={value => `$${value.toFixed(6)}`}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: '#1e293b',
                border: '1px solid #a855f7',
                borderRadius: '8px',
                color: '#fff',
              }}
              formatter={(value: any) => [`$${value.toFixed(6)}`, 'Price']}
            />

            {focusRange && (
              <ReferenceArea
                x1={chartData.find(d => d.timestamp >= focusRange.start)?.time}
                x2={chartData.find(d => d.timestamp >= focusRange.end)?.time}
                fill="#a855f7"
                fillOpacity={0.1}
                stroke="#a855f7"
                strokeOpacity={0.3}
              />
            )}

            {highlightedPoint && (
              <ReferenceDot
                x={highlightedPoint.time}
                y={highlightedPoint.price}
                r={8}
                fill="#f59e0b"
                stroke="#fff"
                strokeWidth={2}
                label={{
                  value: 'Alert',
                  position: 'top',
                  fill: '#f59e0b',
                  fontSize: 12,
                  fontWeight: 'bold',
                }}
              />
            )}

            <Line
              type="monotone"
              dataKey="price"
              stroke="#a855f7"
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>

        {highlightedPoint && (
          <div className="mt-6 p-4 bg-slate-800/60 rounded-xl">
            <h3 className="text-lg font-semibold mb-2">Alert Details</h3>
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-slate-400">Price at Alert</p>
                <p className="text-white font-semibold">${highlightedPoint.price.toFixed(6)}</p>
              </div>
              <div>
                <p className="text-slate-400">Time</p>
                <p className="text-white font-semibold">
                  {new Date(highlightedPoint.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
};

export default ChartWithAlertIntegration;
