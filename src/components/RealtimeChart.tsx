import React, { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Area,
  AreaChart,
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { TrendingUp, TrendingDown, Pause, Play, Trash2, Settings, Zap } from 'lucide-react';
import { useRealtimeChart } from '../hooks/useRealtimeChart';
import { useChartSettings } from '../hooks/useChartSettings';

interface RealtimeChartProps {
  symbol: string;
  title?: string;
  height?: number;
  showControls?: boolean;
  intervalMs?: number;
}

const RealtimeChart = React.memo(
  ({ symbol, title, height = 400, showControls = true, intervalMs = 1000 }: RealtimeChartProps) => {
    const [showSettings, setShowSettings] = useState(false);
    const { settings, updateSettings } = useChartSettings();

    const effectiveInterval = settings.intervalMs ?? intervalMs;
    const effectiveMaxPoints = settings.maxDataPoints ?? 1000;
    const streamingEnabled = settings.enabled ?? true;

    const { priceData, isStreaming, lastUpdate, error, clearData } = useRealtimeChart({
      symbol,
      intervalMs: effectiveInterval,
      maxDataPoints: effectiveMaxPoints,
      enabled: streamingEnabled,
    });

    // Format data for Recharts
    const chartData = useMemo(() => {
      return priceData.map(point => ({
        time: new Date(point.timestamp).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }),
        price: point.price,
        volume: point.volume,
      }));
    }, [priceData]);

    const currentPrice = priceData.length > 0 ? priceData[priceData.length - 1].price : 0;
    const priceChange = priceData.length > 0 ? priceData[priceData.length - 1].change_24h : 0;
    const isPositive = priceChange >= 0;

    // Streaming diagnostics
    const timeSinceUpdate = lastUpdate ? Date.now() - lastUpdate : null;
    const stalenessThreshold = Math.max(effectiveInterval * 2, 5000);
    const isStale =
      streamingEnabled && timeSinceUpdate !== null && timeSinceUpdate > stalenessThreshold;

    const lastUpdateLabel = useMemo(() => {
      if (!lastUpdate) return '—';
      return new Date(lastUpdate).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });
    }, [lastUpdate]);

    const approxBandwidth = useMemo(() => {
      if (!streamingEnabled || effectiveInterval <= 0) {
        return '0.00';
      }
      const updatesPerSecond = 1000 / effectiveInterval;
      const kbPerSecond = updatesPerSecond * 1; // ~1KB per update
      return kbPerSecond.toFixed(2);
    }, [streamingEnabled, effectiveInterval]);

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-2xl font-bold">{title || symbol}</h3>

              {/* LIVE Indicator */}
              <AnimatePresence>
                {isStreaming && !isStale && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    className="flex items-center gap-2 px-3 py-1 bg-green-500/20 text-green-400 rounded-lg"
                  >
                    <motion.div
                      animate={{ opacity: [1, 0.3, 1] }}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Zap className="w-4 h-4" />
                    </motion.div>
                    <span className="text-sm font-semibold">LIVE</span>
                  </motion.div>
                )}
                {!isStreaming && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="px-3 py-1 bg-gray-500/20 text-gray-400 rounded-lg"
                  >
                    <span className="text-sm font-semibold">PAUSED</span>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-3 mt-2">
              <span className="text-3xl font-bold">${currentPrice.toFixed(6)}</span>
              <div
                className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                  isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                }`}
              >
                {isPositive ? (
                  <TrendingUp className="w-4 h-4" />
                ) : (
                  <TrendingDown className="w-4 h-4" />
                )}
                <span className="font-semibold">
                  {isPositive ? '+' : ''}
                  {priceChange.toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Data points info */}
            <div className="text-sm text-gray-400 mt-1">
              {priceData.length} data points • Updates every {effectiveInterval / 1000}s
            </div>
          </div>

          {/* Controls */}
          {showControls && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateSettings({ enabled: !isStreaming })}
                className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
                title={isStreaming ? 'Pause streaming' : 'Resume streaming'}
              >
                {isStreaming ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
              </button>

              <button
                onClick={clearData}
                className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
                title="Clear data"
              >
                <Trash2 className="w-5 h-5" />
              </button>

              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 hover:bg-purple-500/20 rounded-lg transition-colors"
                title="Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          )}
        </div>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-4 p-4 bg-slate-700/50 rounded-lg"
            >
              <h4 className="text-sm font-semibold mb-3">Chart Settings</h4>

              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-400 block mb-1">Update Frequency</label>
                  <select
                    value={settings.intervalMs}
                    onChange={e => updateSettings({ intervalMs: Number(e.target.value) })}
                    className="w-full bg-slate-800 border border-purple-500/20 rounded-lg px-3 py-2 text-sm"
                  >
                    <option value={1000}>1 second</option>
                    <option value={5000}>5 seconds</option>
                    <option value={10000}>10 seconds</option>
                    <option value={30000}>30 seconds</option>
                  </select>
                </div>

                <div>
                  <label className="text-sm text-gray-400 block mb-1">Max Data Points</label>
                  <input
                    type="number"
                    value={settings.maxDataPoints}
                    onChange={e => updateSettings({ maxDataPoints: Number(e.target.value) })}
                    min={100}
                    max={5000}
                    step={100}
                    className="w-full bg-slate-800 border border-purple-500/20 rounded-lg px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Memory usage: ~{Math.round((settings.maxDataPoints * 64) / 1024)}KB
                  </p>
                </div>

                <div className="pt-2 border-t border-slate-600/30">
                  <div className="flex justify-between text-xs text-gray-500">
                    <span>Last update:</span>
                    <span>{lastUpdateLabel}</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>Bandwidth:</span>
                    <span>~{approxBandwidth} KB/s</span>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error Display */}
        {error && (
          <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
            Error: {error}
          </div>
        )}

        {/* Chart */}
        <ResponsiveContainer width="100%" height={height}>
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`colorPrice-${symbol}`} x1="0" y1="0" x2="0" y2="1">
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
              minTickGap={50}
            />
            <YAxis
              stroke="#94a3b8"
              style={{ fontSize: '12px' }}
              domain={['auto', 'auto']}
              tickFormatter={value => value.toFixed(6)}
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
            <Area
              type="monotone"
              dataKey="price"
              stroke="#a855f7"
              strokeWidth={2}
              fill={`url(#colorPrice-${symbol})`}
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </motion.div>
    );
  }
);

RealtimeChart.displayName = 'RealtimeChart';

export default RealtimeChart;
