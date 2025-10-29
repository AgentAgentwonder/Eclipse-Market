import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  Area,
  AreaChart,
  Bar,
  ComposedChart,
} from 'recharts';
import { TrendingUp, TrendingDown, PenTool, LineChart as LineChartIcon } from 'lucide-react';
import { useIndicatorStore } from '../../store/indicatorStore';
import { useDrawingStore } from '../../store/drawingStore';
import IndicatorPanel from './IndicatorPanel';
import DrawingToolbar from './DrawingToolbar';
import {
  calculateSMA,
  calculateEMA,
  calculateRSI,
  calculateMACD,
  calculateBollingerBands,
  calculateStochastic,
  generateSignals,
} from '../../utils/indicators';
import type { PriceData } from '../../utils/indicators';

interface AdvancedTradingChartProps {
  symbol: string;
  data: PriceData[];
  height?: number;
}

const AdvancedTradingChart: React.FC<AdvancedTradingChartProps> = ({ symbol, data, height = 600 }) => {
  const { indicators } = useIndicatorStore();
  const { drawings, loadDrawings, activeTool } = useDrawingStore();
  const [showIndicators, setShowIndicators] = useState(false);
  const [showDrawings, setShowDrawings] = useState(false);

  useEffect(() => {
    loadDrawings(symbol);
  }, [symbol, loadDrawings]);

  const chartData = useMemo(() => {
    if (!data || data.length === 0) return [];

    const closePrices = data.map(d => d.close);
    const baseData = data.map((point, index) => ({
      timestamp: point.timestamp,
      time: new Date(point.timestamp).toLocaleTimeString(),
      open: point.open,
      high: point.high,
      low: point.low,
      close: point.close,
      volume: point.volume,
    }));

    // Calculate indicators
    const enabledIndicators = indicators.filter(ind => ind.enabled);

    enabledIndicators.forEach(indicator => {
      if (indicator.type === 'SMA') {
        const period = Number(indicator.params.period || 20);
        const smaValues = calculateSMA(closePrices, period);
        smaValues.forEach((value, idx) => {
          if (baseData[idx]) {
            baseData[idx][`SMA_${indicator.id}`] = value;
          }
        });
      } else if (indicator.type === 'EMA') {
        const period = Number(indicator.params.period || 20);
        const emaValues = calculateEMA(closePrices, period);
        emaValues.forEach((value, idx) => {
          if (baseData[idx]) {
            baseData[idx][`EMA_${indicator.id}`] = value;
          }
        });
      } else if (indicator.type === 'RSI') {
        const period = Number(indicator.params.period || 14);
        const rsiValues = calculateRSI(closePrices, period);
        rsiValues.forEach((value, idx) => {
          if (baseData[idx]) {
            baseData[idx][`RSI_${indicator.id}`] = value;
          }
        });
      } else if (indicator.type === 'MACD') {
        const fastPeriod = Number(indicator.params.fastPeriod || 12);
        const slowPeriod = Number(indicator.params.slowPeriod || 26);
        const signalPeriod = Number(indicator.params.signalPeriod || 9);
        const macd = calculateMACD(closePrices, fastPeriod, slowPeriod, signalPeriod);
        macd.macd.forEach((value, idx) => {
          if (baseData[idx]) {
            baseData[idx][`MACD_${indicator.id}`] = value;
          }
        });
        macd.signal.forEach((value, idx) => {
          if (baseData[idx]) {
            baseData[idx][`MACDSignal_${indicator.id}`] = value;
          }
        });
        macd.histogram.forEach((value, idx) => {
          if (baseData[idx]) {
            baseData[idx][`MACDHistogram_${indicator.id}`] = value;
          }
        });
      } else if (indicator.type === 'BollingerBands') {
        const period = Number(indicator.params.period || 20);
        const stdDev = Number(indicator.params.stdDev || 2);
        const bb = calculateBollingerBands(closePrices, period, stdDev);
        bb.upper.forEach((value, idx) => {
          if (baseData[idx]) {
            baseData[idx][`BB_upper_${indicator.id}`] = value;
          }
        });
        bb.middle.forEach((value, idx) => {
          if (baseData[idx]) {
            baseData[idx][`BB_middle_${indicator.id}`] = value;
          }
        });
        bb.lower.forEach((value, idx) => {
          if (baseData[idx]) {
            baseData[idx][`BB_lower_${indicator.id}`] = value;
          }
        });
      }
    });

    return baseData;
  }, [data, indicators]);

  const overlayIndicators = indicators.filter(ind => ind.enabled && ind.panel === 'overlay');
  const separateIndicators = indicators.filter(ind => ind.enabled && ind.panel === 'separate');

  const currentPrice = data.length > 0 ? data[data.length - 1].close : 0;
  const priceChange =
    data.length > 1 ? ((data[data.length - 1].close - data[0].close) / data[0].close) * 100 : 0;
  const isPositive = priceChange >= 0;

  return (
    <div className="flex h-full">
      <AnimatePresence>
        {showIndicators && <IndicatorPanel onClose={() => setShowIndicators(false)} />}
      </AnimatePresence>

      <div className="flex-1 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold">{symbol}</h3>
                <div
                  className={`flex items-center gap-1 px-3 py-1 rounded-lg ${
                    isPositive ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                  }`}
                >
                  {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="font-semibold">
                    {isPositive ? '+' : ''}
                    {priceChange.toFixed(2)}%
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-3xl font-bold">${currentPrice.toFixed(6)}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowIndicators(!showIndicators)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  showIndicators ? 'bg-purple-500/40' : 'hover:bg-purple-500/20'
                }`}
              >
                <LineChartIcon className="w-4 h-4" />
                <span>Indicators</span>
              </button>
              <button
                onClick={() => setShowDrawings(!showDrawings)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-colors ${
                  showDrawings ? 'bg-purple-500/40' : 'hover:bg-purple-500/20'
                }`}
              >
                <PenTool className="w-4 h-4" />
                <span>Draw</span>
              </button>
            </div>
          </div>

          {/* Main Chart */}
          <div className="relative">
            <ResponsiveContainer width="100%" height={height}>
              <ComposedChart data={chartData}>
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
                  formatter={(value: any) => {
                    if (typeof value === 'number') {
                      return `$${value.toFixed(6)}`;
                    }
                    return value;
                  }}
                />

                {/* Main price line */}
                <Area
                  type="monotone"
                  dataKey="close"
                  stroke="#a855f7"
                  strokeWidth={2}
                  fill="url(#colorPrice)"
                  isAnimationActive={false}
                />

                {/* Overlay indicators */}
                {overlayIndicators.map(indicator => {
                  if (indicator.type === 'SMA' || indicator.type === 'EMA') {
                    return (
                      <Line
                        key={indicator.id}
                        type="monotone"
                        dataKey={`${indicator.type}_${indicator.id}`}
                        stroke={indicator.color}
                        strokeWidth={indicator.lineWidth}
                        dot={false}
                        isAnimationActive={false}
                        strokeDasharray={indicator.style === 'dashed' ? '5 5' : undefined}
                      />
                    );
                  } else if (indicator.type === 'BollingerBands') {
                    return (
                      <React.Fragment key={indicator.id}>
                        <Line
                          type="monotone"
                          dataKey={`BB_upper_${indicator.id}`}
                          stroke={indicator.color}
                          strokeWidth={1}
                          dot={false}
                          isAnimationActive={false}
                          strokeDasharray="3 3"
                        />
                        <Line
                          type="monotone"
                          dataKey={`BB_middle_${indicator.id}`}
                          stroke={indicator.color}
                          strokeWidth={1}
                          dot={false}
                          isAnimationActive={false}
                        />
                        <Line
                          type="monotone"
                          dataKey={`BB_lower_${indicator.id}`}
                          stroke={indicator.color}
                          strokeWidth={1}
                          dot={false}
                          isAnimationActive={false}
                          strokeDasharray="3 3"
                        />
                      </React.Fragment>
                    );
                  }
                  return null;
                })}
              </ComposedChart>
            </ResponsiveContainer>

            {/* Drawing overlay */}
            {showDrawings && (
              <svg
                className="absolute inset-0 pointer-events-none"
                style={{ width: '100%', height: '100%' }}
              >
                {drawings
                  .filter(d => d.symbol === symbol && !d.hidden)
                  .map(drawing => {
                    if (drawing.tool === 'trendline' && drawing.points.length >= 2) {
                      return (
                        <line
                          key={drawing.id}
                          x1={drawing.points[0].x}
                          y1={drawing.points[0].y}
                          x2={drawing.points[1].x}
                          y2={drawing.points[1].y}
                          stroke={drawing.style.strokeColor}
                          strokeWidth={drawing.style.strokeWidth}
                          opacity={drawing.style.opacity}
                        />
                      );
                    } else if (drawing.tool === 'horizontal' && drawing.points.length >= 1) {
                      return (
                        <line
                          key={drawing.id}
                          x1={0}
                          y1={drawing.points[0].y}
                          x2="100%"
                          y2={drawing.points[0].y}
                          stroke={drawing.style.strokeColor}
                          strokeWidth={drawing.style.strokeWidth}
                          opacity={drawing.style.opacity}
                        />
                      );
                    }
                    return null;
                  })}
              </svg>
            )}
          </div>

          {/* Separate indicator panels */}
          {separateIndicators.length > 0 && (
            <div className="mt-4 space-y-4">
              {separateIndicators.map(indicator => (
                <div key={indicator.id} className="h-32">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.3} />
                      <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '10px' }} />
                      <YAxis stroke="#94a3b8" style={{ fontSize: '10px' }} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1e293b',
                          border: '1px solid #a855f7',
                          borderRadius: '8px',
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey={`${indicator.type}_${indicator.id}`}
                        stroke={indicator.color}
                        strokeWidth={indicator.lineWidth}
                        dot={false}
                        isAnimationActive={false}
                      />
                      {indicator.type === 'RSI' && (
                        <>
                          <ReferenceLine y={30} stroke="#10b981" strokeDasharray="3 3" />
                          <ReferenceLine y={70} stroke="#ef4444" strokeDasharray="3 3" />
                        </>
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Drawing toolbar */}
        <AnimatePresence>
          {showDrawings && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mt-4 flex justify-center"
            >
              <DrawingToolbar />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default AdvancedTradingChart;
