import { useState } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BarChart3, Calendar, DollarSign } from 'lucide-react';
import { TrendingStocks } from './Stocks/TrendingStocks';
import { TopMovers } from './Stocks/TopMovers';
import { NewIPOs } from './Stocks/NewIPOs';
import { EarningsCalendar } from './Stocks/EarningsCalendar';
import { StockNewsFeed } from './Stocks/StockNewsFeed';
import { InstitutionalHoldings } from './Stocks/InstitutionalHoldings';
import { InsiderActivity } from './Stocks/InsiderActivity';

const tabs = [
  { id: 'trending', label: 'Trending', icon: TrendingUp },
  { id: 'movers', label: 'Top Movers', icon: BarChart3 },
  { id: 'ipos', label: 'IPOs', icon: DollarSign },
  { id: 'earnings', label: 'Earnings', icon: Calendar },
];

const tabMeta = {
  trending: {
    title: 'Stock Discovery',
    subtitle: 'Real-time stock tracking with unusual volume detection',
  },
  movers: {
    title: 'Top Stock Movers',
    subtitle: 'Biggest gainers and losers with technical indicators',
  },
  ipos: {
    title: 'New IPOs',
    subtitle: 'Recent and upcoming public offerings',
  },
  earnings: {
    title: 'Earnings Calendar',
    subtitle: 'Upcoming earnings events with historical reactions and alerts',
  },
};

export default function Stocks() {
  const [activeTab, setActiveTab] = useState('trending');
  const [selectedSymbol, setSelectedSymbol] = useState<string | undefined>();

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {tabMeta[activeTab as keyof typeof tabMeta].title}
          </h1>
          <p className="text-gray-400">{tabMeta[activeTab as keyof typeof tabMeta].subtitle}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 overflow-x-auto">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
              activeTab === tab.id
                ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                : 'hover:bg-slate-700/30 text-gray-400'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.2 }}
      >
        {activeTab === 'trending' && (
          <div className="grid gap-6 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <TrendingStocks selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol} />
            </div>
            <div className="space-y-6">
              <StockNewsFeed symbol={selectedSymbol} />
              <InstitutionalHoldings symbol={selectedSymbol} />
              <InsiderActivity symbol={selectedSymbol} />
            </div>
          </div>
        )}
        {activeTab === 'movers' && (
          <TopMovers selectedSymbol={selectedSymbol} onSelect={setSelectedSymbol} />
        )}
        {activeTab === 'ipos' && <NewIPOs />}
        {activeTab === 'earnings' && <EarningsCalendar />}
      </motion.div>
    </div>
  );
}
