import React, { useEffect, useMemo, useRef, useState } from 'react';
import { CandleData, ChartPanelConfig } from '../../types/indicators';
import { createChart, CrosshairMode, IChartApi, ISeriesApi } from 'lightweight-charts';
import { VolumeProfile } from './VolumeProfile';
import { OrderBookDepth } from './OrderBookDepth';
import { useRealtimeChart } from '../../hooks/useRealtimeChart';
import { calculateVolumeProfile, calculateOrderFlowColor } from '../../utils/volumeProfile';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings2, BarChart3, Layers } from 'lucide-react';

interface ChartPanelProps {
  panel: ChartPanelConfig;
  updatePanel: (updates: Partial<ChartPanelConfig>) => void;
  syncCrosshair: boolean;
  globalCrosshair: { x: number; y: number; timestamp: number } | null;
  onCrosshairMove?: (position: { x: number; y: number; timestamp: number } | null) => void;
}

type SeriesRef = {
  candleSeries: ISeriesApi<'Candlestick'>;
  indicatorSeries: Record<string, ISeriesApi<'Line'>>;
};

export const ChartPanel: React.FC<ChartPanelProps> = ({
  panel,
  updatePanel,
  syncCrosshair,
  globalCrosshair,
  onCrosshairMove,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef = useRef<IChartApi>();
  const seriesRef = useRef<SeriesRef | null>(null);
  const [showSettings, setShowSettings] = useState(false);

  const { priceData } = useRealtimeChart({
    symbol: panel.symbol,
    intervalMs: 5000,
    maxDataPoints: 500,
  });

  const candles: CandleData[] = useMemo(() => {
    if (priceData.length === 0) return [];

    return priceData.map((point, index) => {
      const prev = priceData[index - 1] ?? point;
      const high = Math.max(point.price, prev.price);
      const low = Math.min(point.price, prev.price);
      const candle: CandleData = {
        timestamp: point.timestamp,
        open: prev.price,
        high,
        low,
        close: point.price,
        volume: point.volume,
        buyVolume: point.volume * (point.price >= prev.price ? 0.7 : 0.3),
        sellVolume: point.volume * (point.price < prev.price ? 0.7 : 0.3),
      };
      return candle;
    });
  }, [priceData]);

  const paddingLeft = panel.showVolumeProfile ? 180 : 0;
  const paddingBottom = panel.showOrderBook ? 220 : 0;

  // Setup chart
  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#e2e8f0',
      },
      grid: {
        vertLines: { color: 'rgba(148, 163, 184, 0.1)' },
        horzLines: { color: 'rgba(148, 163, 184, 0.1)' },
      },
      crosshair: {
        mode: CrosshairMode.Normal,
      },
      rightPriceScale: {
        borderColor: 'rgba(148, 163, 184, 0.2)',
      },
      timeScale: {
        borderColor: 'rgba(148, 163, 184, 0.2)',
        timeVisible: true,
      },
    });

    const candleSeries = chart.addCandlestickSeries({
      upColor: '#22c55e',
      downColor: '#ef4444',
      borderVisible: false,
      wickUpColor: '#22c55e',
      wickDownColor: '#ef4444',
    });

    seriesRef.current = {
      candleSeries,
      indicatorSeries: {},
    };

    chartRef.current = chart;

    const handleResize = () => {
      if (!containerRef.current) return;
      chart.applyOptions({
        width: containerRef.current.clientWidth,
        height: containerRef.current.clientHeight,
      });
    };

    handleResize();
    const resizeObserver = new ResizeObserver(handleResize);
    resizeObserver.observe(containerRef.current);

    const crosshairMove = ({ time, point }: any) => {
      if (!onCrosshairMove) return;
      if (!time || !point) {
        onCrosshairMove(null);
        return;
      }
      const timestamp = Number(time) * 1000;
      onCrosshairMove({ x: point.x, y: point.y, timestamp });
    };

    if (onCrosshairMove) {
      chart.subscribeCrosshairMove(crosshairMove);
    }

    return () => {
      if (onCrosshairMove) {
        chart.unsubscribeCrosshairMove(crosshairMove);
      }
      resizeObserver.disconnect();
      chart.remove();
    };
  }, [onCrosshairMove]);

  // Update candles when data changes
  useEffect(() => {
    if (!seriesRef.current || candles.length === 0) return;
    const { candleSeries } = seriesRef.current;

    const volumeProfile = calculateVolumeProfile(candles, 24);
    const updatedCandles = candles.map(candle => ({
      time: Math.floor(candle.timestamp / 1000),
      open: candle.open,
      high: candle.high,
      low: candle.low,
      close: candle.close,
      color: calculateOrderFlowColor(candle, volumeProfile),
      borderColor: calculateOrderFlowColor(candle, volumeProfile),
      wickColor: calculateOrderFlowColor(candle, volumeProfile),
    }));

    candleSeries.setData(updatedCandles);
  }, [candles]);

  // Sync crosshair
  useEffect(() => {
    if (!syncCrosshair || !chartRef.current || !globalCrosshair) return;
    const timeScale = chartRef.current.timeScale();
    timeScale.setVisibleRange({
      from: globalCrosshair.timestamp / 1000 - 50,
      to: globalCrosshair.timestamp / 1000 + 50,
    });
  }, [syncCrosshair, globalCrosshair]);

  return (
    <div className="relative bg-slate-800/40 border border-slate-700/50 rounded-xl overflow-hidden">
      <div 
        className="absolute inset-0" 
        ref={containerRef}
        style={{ 
          left: paddingLeft, 
          bottom: paddingBottom 
        }}
      />

      {/* Overlay gadgets */}
      <div className="absolute top-2 left-2 flex gap-2 z-10">
        <button
          onClick={() => setShowSettings(!showSettings)}
          className="p-2 bg-slate-900/60 rounded-lg border border-slate-700/60 hover:border-purple-500/50 transition-colors"
        >
          <Settings2 className="w-4 h-4" />
        </button>
      </div>

      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute top-12 left-2 bg-slate-900/90 border border-slate-700 rounded-lg shadow-xl backdrop-blur-sm p-4 w-64 space-y-3 text-sm"
          >
            <div>
              <label className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Volume Profile</span>
                <input
                  type="checkbox"
                  checked={panel.showVolumeProfile}
                  onChange={e => updatePanel({ showVolumeProfile: e.target.checked })}
                  className="accent-purple-500"
                />
              </label>
            </div>
            <div>
              <label className="flex items-center justify-between text-slate-300">
                <span className="flex items-center gap-2"><Layers className="w-4 h-4" /> Order Book</span>
                <input
                  type="checkbox"
                  checked={panel.showOrderBook}
                  onChange={e => updatePanel({ showOrderBook: e.target.checked })}
                  className="accent-purple-500"
                />
              </label>
            </div>
            <div>
              <span className="text-xs text-slate-400">Symbol</span>
              <input
                type="text"
                value={panel.symbol}
                onChange={e => updatePanel({ symbol: e.target.value })}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
              />
            </div>
            <div>
              <span className="text-xs text-slate-400">Timeframe</span>
              <select
                value={panel.timeframe}
                onChange={e => updatePanel({ timeframe: e.target.value })}
                className="mt-1 w-full bg-slate-900 border border-slate-700 rounded px-2 py-1 text-xs"
              >
                <option value="1m">1m</option>
                <option value="5m">5m</option>
                <option value="15m">15m</option>
                <option value="1h">1h</option>
                <option value="4h">4h</option>
              </select>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Volume profile */}
      {panel.showVolumeProfile && (
        <div className="absolute top-0 left-0 h-full w-48 border-r border-slate-800/60">
          <VolumeProfile candles={candles} width={180} height={containerRef.current?.clientHeight ?? 300} />
        </div>
      )}

      {/* Order book depth */}
      {panel.showOrderBook && (
        <div className="absolute bottom-0 left-0 right-0">
          <OrderBookDepth
            bids={candles.slice(-20).map(c => ({ price: c.close * 0.999, amount: c.volume }))}
            asks={candles.slice(-20).map(c => ({ price: c.close * 1.001, amount: c.volume }))}
            onQuickTrade={side => console.log('Quick trade', side)}
          />
        </div>
      )}
    </div>
  );
};
