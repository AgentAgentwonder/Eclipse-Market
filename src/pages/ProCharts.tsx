import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart3, Layout, Layers, TrendingUp } from 'lucide-react';
import { MultiChartLayout } from '../components/charts/MultiChartLayout';
import { CustomIndicatorBuilder } from '../components/charts/CustomIndicatorBuilder';
import { OrderBookDepth } from '../components/charts/OrderBookDepth';
import { VolumeProfile } from '../components/charts/VolumeProfile';
import { useOrderBook } from '../hooks/useOrderBook';
import { useRealtimeChart } from '../hooks/useRealtimeChart';
import { CandleData } from '../types/indicators';

type TabType = 'charts' | 'indicators' | 'volume' | 'orderbook';

export default function ProCharts() {
  const [activeTab, setActiveTab] = useState<TabType>('charts');
  const { bids, asks } = useOrderBook();
  const { priceData } = useRealtimeChart({
    symbol: 'SOL/USDC',
    intervalMs: 5000,
  });

  const candles: CandleData[] = React.useMemo(() => {
    if (priceData.length === 0) return [];
    return priceData.map((point, index) => {
      const prev = priceData[index - 1] ?? point;
      return {
        timestamp: point.timestamp,
        open: prev.price,
        high: Math.max(point.price, prev.price),
        low: Math.min(point.price, prev.price),
        close: point.price,
        volume: point.volume,
        buyVolume: point.volume * (point.price >= prev.price ? 0.7 : 0.3),
        sellVolume: point.volume * (point.price < prev.price ? 0.7 : 0.3),
      };
    });
  }, [priceData]);

  const tabs = [
    { id: 'charts' as TabType, label: 'Multi-Chart', icon: Layout },
    { id: 'indicators' as TabType, label: 'Custom Indicators', icon: TrendingUp },
    { id: 'volume' as TabType, label: 'Volume Profile', icon: BarChart3 },
    { id: 'orderbook' as TabType, label: 'Order Book Depth', icon: Layers },
  ];

  return (
    <div className="min-h-screen">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">
          Pro Chart Analytics
        </h1>
        <p className="text-slate-400">
          Advanced charting, volume analysis, order book depth, and custom indicator builder
        </p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b border-slate-700/50 pb-2">
        {tabs.map(tab => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-t-lg transition-all ${
                activeTab === tab.id
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-800/50 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span className="font-medium">{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'charts' && (
          <div className="h-[calc(100vh-240px)]">
            <MultiChartLayout />
          </div>
        )}

        {activeTab === 'indicators' && (
          <div className="max-w-7xl">
            <CustomIndicatorBuilder candles={candles} />
          </div>
        )}

        {activeTab === 'volume' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
              <h2 className="text-xl font-bold mb-4">Volume Profile Analysis</h2>
              <div className="flex justify-center">
                <VolumeProfile
                  candles={candles}
                  width={600}
                  height={500}
                  showPOC={true}
                  showValueArea={true}
                  showVWAP={true}
                  numLevels={50}
                />
              </div>
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">About Volume Profile</h3>
              <div className="space-y-4 text-sm text-slate-300">
                <div>
                  <div className="font-semibold text-yellow-400 mb-1">POC (Point of Control)</div>
                  <p className="text-slate-400">
                    The price level with the highest traded volume. Often acts as support or
                    resistance.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-purple-400 mb-1">Value Area</div>
                  <p className="text-slate-400">
                    The price range containing 70% of the total traded volume. Represents fair
                    value.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-blue-400 mb-1">VWAP Bands</div>
                  <p className="text-slate-400">
                    Volume-weighted average price with standard deviation bands. Used to identify
                    overbought/oversold conditions.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-green-400 mb-1">Volume Delta</div>
                  <p className="text-slate-400">
                    Difference between buy and sell volume at each price level. Shows buying or
                    selling pressure.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'orderbook' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <OrderBookDepth
                bids={bids}
                asks={asks}
                height={600}
                onQuickTrade={side => console.log('Quick trade:', side)}
              />
            </div>
            <div className="bg-slate-800/40 border border-slate-700/50 rounded-xl p-6">
              <h3 className="text-lg font-semibold mb-4">Order Book Metrics</h3>
              <div className="space-y-4 text-sm text-slate-300">
                <div>
                  <div className="font-semibold text-purple-400 mb-1">Spread</div>
                  <p className="text-slate-400">
                    Difference between best ask and best bid. Lower spreads indicate better
                    liquidity.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-blue-400 mb-1">Imbalance Ratio</div>
                  <p className="text-slate-400">
                    Ratio of total bid volume to total ask volume. Values &gt; 1 indicate buying
                    pressure, &lt; 1 indicate selling pressure.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-green-400 mb-1">Depth Visualization</div>
                  <p className="text-slate-400">
                    Horizontal bars show cumulative volume at each price level. Larger bars
                    indicate stronger support/resistance.
                  </p>
                </div>
                <div>
                  <div className="font-semibold text-yellow-400 mb-1">Quick Trade</div>
                  <p className="text-slate-400">
                    AI-powered recommendation based on order book imbalance and spread analysis.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
