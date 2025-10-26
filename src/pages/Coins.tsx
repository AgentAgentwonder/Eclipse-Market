import { useState } from 'react'
import { motion } from 'framer-motion'
import { Search, TrendingUp, Zap, BarChart3 } from 'lucide-react'

interface Coin {
  address: string
  symbol: string
  name: string
  price: number
  price_change_24h: number
  market_cap: number
  volume_24h: number
}

export default function Coins() {
  const [activeTab, setActiveTab] = useState('trending')
  const [searchQuery, setSearchQuery] = useState('')

  const mockCoins: Coin[] = [
    { address: '1', symbol: 'BONK', name: 'Bonk', price: 0.000023, price_change_24h: 15.4, market_cap: 1500000, volume_24h: 45000 },
    { address: '2', symbol: 'JUP', name: 'Jupiter', price: 1.23, price_change_24h: 8.7, market_cap: 5000000, volume_24h: 120000 },
    { address: '3', symbol: 'WIF', name: 'dogwifhat', price: 2.45, price_change_24h: -3.2, market_cap: 3200000, volume_24h: 89000 },
    { address: '4', symbol: 'PYTH', name: 'Pyth Network', price: 0.87, price_change_24h: 12.1, market_cap: 2800000, volume_24h: 67000 },
    { address: '5', symbol: 'JTO', name: 'Jito', price: 3.21, price_change_24h: 5.6, market_cap: 4100000, volume_24h: 95000 },
    { address: '6', symbol: 'ORCA', name: 'Orca', price: 4.56, price_change_24h: -2.1, market_cap: 3600000, volume_24h: 78000 },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Coins Market</h1>
          <p className="text-gray-400">Real-time cryptocurrency tracking and analysis</p>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search coins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 w-80 rounded-xl bg-slate-800/50 border border-purple-500/30 outline-none focus:border-purple-500 transition-all"
          />
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4">
        {[
          { id: 'trending', label: 'Trending', icon: TrendingUp },
          { id: 'new', label: 'New Coins', icon: Zap },
          { id: 'top', label: 'Top Coins', icon: BarChart3 },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-2 rounded-xl font-medium transition-all flex items-center gap-2 ${
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

      {/* Coins Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {mockCoins.map((coin, idx) => (
          <motion.div
            key={coin.address}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            whileHover={{ scale: 1.02 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl hover:shadow-purple-500/20 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <div className="text-2xl font-bold">{coin.symbol}</div>
                <div className="text-sm text-gray-400">{coin.name}</div>
              </div>
              <div className={`px-3 py-1 rounded-lg text-sm font-semibold ${
                coin.price_change_24h > 0 ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
              }`}>
                {coin.price_change_24h > 0 ? '+' : ''}{coin.price_change_24h.toFixed(2)}%
              </div>
            </div>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Price</span>
                <span className="font-bold">${coin.price.toFixed(6)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Market Cap</span>
                <span className="font-bold">${(coin.market_cap / 1_000_000).toFixed(1)}M</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Volume 24h</span>
                <span className="font-bold">${(coin.volume_24h / 1_000).toFixed(1)}K</span>
              </div>
            </div>

            <button className="w-full mt-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-medium transition-all">
              View Chart
            </button>
          </motion.div>
        ))}
      </div>
    </div>
  )
}
