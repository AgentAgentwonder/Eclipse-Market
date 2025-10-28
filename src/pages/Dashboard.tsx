import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, Users, Target, Activity, Bell, RefreshCw, PlayCircle, Database, Zap, Shield } from 'lucide-react'
import { usePriceStream } from '../hooks/usePriceStream'
import WatchlistWidget from '../components/portfolio/WatchlistWidget'
import WatchlistManager from '../components/portfolio/WatchlistManager'
import AlertsManager from '../components/alerts/AlertsManager'

interface Alert {
  id: string
  title: string
  message: string
  priority: string
  created_at: string
}

interface CoinData {
  symbol: string
  name: string
  price: number
  change: number
  rank: number
}

export default function Dashboard() {
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [watchlistManagerOpen, setWatchlistManagerOpen] = useState(false)
  const [alertsManagerOpen, setAlertsManagerOpen] = useState(false)
  const [prefilledSymbol, setPrefilledSymbol] = useState<string | undefined>(undefined)
  const [prefilledMint, setPrefilledMint] = useState<string | undefined>(undefined)

  const symbols = useMemo(() => ['SOL', 'BONK', 'JUP', 'WIF', 'PYTH', 'JTO'], [])
  const { prices, loading } = usePriceStream(symbols)

  useEffect(() => {
    const prevPrices = new Map<string, number>()

    symbols.forEach((symbol) => {
      const current = prices[symbol]?.price
      if (!current) return

      const previous = prevPrices.get(symbol)
      if (previous) {
        const change = ((current - previous) / previous) * 100
        if (Math.abs(change) >= 5) {
          const newAlert: Alert = {
            id: `${symbol}-${Date.now()}`,
            title: change > 0 ? 'Price Surge Detected' : 'Price Drop Detected',
            message: `${symbol} moved ${change.toFixed(2)}% in the last update`,
            priority: Math.abs(change) > 10 ? 'high' : 'normal',
            created_at: new Date().toISOString(),
          }

          setAlerts((prev) => {
            const updated = [newAlert, ...prev]
            return updated.slice(0, 10)
          })
        }
      }

      prevPrices.set(symbol, current)
    })
  }, [prices, symbols])

  const stats = [
    { label: 'Portfolio Value', value: '12.34 SOL', change: '+3.4%', icon: TrendingUp, color: 'from-green-500 to-emerald-500' },
    { label: 'Active Insiders', value: '12', change: '+2 today', icon: Users, color: 'from-purple-500 to-pink-500' },
    { label: 'Win Rate', value: '87%', change: 'Last 24h', icon: Target, color: 'from-blue-500 to-cyan-500' },
    { label: 'API Response', value: '45ms', change: 'Healthy', icon: Activity, color: 'from-orange-500 to-red-500' },
  ]

  const trendingCoins: CoinData[] = useMemo(() => {
    const coinNames: Record<string, string> = {
      SOL: 'Solana',
      BONK: 'Bonk',
      JUP: 'Jupiter',
      WIF: 'dogwifhat',
      PYTH: 'Pyth Network',
      JTO: 'Jito',
    }

    const fallback: CoinData[] = [
      { symbol: 'BONK', name: 'Bonk', price: 0.000023, change: 15.4, rank: 1 },
      { symbol: 'JUP', name: 'Jupiter', price: 1.23, change: 8.7, rank: 2 },
      { symbol: 'WIF', name: 'dogwifhat', price: 2.45, change: -3.2, rank: 3 },
      { symbol: 'PYTH', name: 'Pyth Network', price: 0.87, change: 12.1, rank: 4 },
      { symbol: 'JTO', name: 'Jito', price: 3.21, change: 5.6, rank: 5 },
    ]

    if (loading || Object.keys(prices).length === 0) {
      return fallback
    }

    return symbols
      .map((symbol, index) => ({
        symbol,
        name: coinNames[symbol] || symbol,
        price: prices[symbol]?.price ?? 0,
        change: prices[symbol]?.change ?? 0,
        rank: index + 1,
      }))
      .filter((coin) => coin.symbol !== 'SOL')
      .slice(0, 5)
  }, [prices, loading, symbols])

  const openWatchlistManager = () => {
    setWatchlistManagerOpen(true)
  }

  const openAlertsManager = () => {
    setPrefilledSymbol(undefined)
    setPrefilledMint(undefined)
    setAlertsManagerOpen(true)
  }

  const handleCreateAlertFromWatchlist = (symbol: string, mint: string) => {
    setPrefilledSymbol(symbol)
    setPrefilledMint(mint)
    setAlertsManagerOpen(true)
  }

  return (
    <>
      <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            whileHover={{ y: -4 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl hover:shadow-purple-500/20 transition-all cursor-pointer"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-sm text-gray-400">{stat.label}</div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold mb-2">{stat.value}</div>
            <div className="text-sm text-green-400">{stat.change}</div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trending Coins */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-xl"
          >
            <div className="p-6 border-b border-purple-500/20 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-semibold">Trending Coins</h3>
                <p className="text-sm text-gray-400 mt-1">Real-time market data</p>
              </div>
              <button className="p-2 hover:bg-slate-700/50 rounded-lg transition-all">
                <RefreshCw className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-3">
              {trendingCoins.map((coin, idx) => (
                <motion.div
                  key={coin.symbol}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + idx * 0.05 }}
                  whileHover={{ scale: 1.02 }}
                  className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-all cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold shadow-lg">
                    #{coin.rank}
                  </div>
                  <div className="flex-1">
                    <div className="font-semibold">{coin.symbol}</div>
                    <div className="text-sm text-gray-400">{coin.name}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold">${coin.price.toFixed(6)}</div>
                    <div className={`text-sm ${coin.change > 0 ? 'text-green-400' : 'text-red-400'}`}>
                      {coin.change > 0 ? '+' : ''}{coin.change.toFixed(2)}%
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* System Diagnostics */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl"
          >
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Activity className="w-5 h-5 text-purple-400" />
              System Diagnostics
            </h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'Database', value: 'Connected', icon: Database, color: 'green' },
                { label: 'RPC Status', value: 'Healthy', icon: Zap, color: 'green' },
                { label: 'Workers', value: '4 Active', icon: Activity, color: 'blue' },
                { label: 'Security', value: 'Encrypted', icon: Shield, color: 'purple' },
              ].map((item, idx) => (
                <div key={idx} className="p-4 rounded-xl bg-slate-700/30">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-gray-400">{item.label}</span>
                    <item.icon className={`w-4 h-4 text-${item.color}-400`} />
                  </div>
                  <div className={`text-lg font-bold text-${item.color}-400`}>{item.value}</div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Alerts Sidebar */}
        <aside className="space-y-6">
          <WatchlistWidget
            onOpenManager={openWatchlistManager}
            onCreateWatchlist={openWatchlistManager}
            onOpenAlerts={openAlertsManager}
          />

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-xl"
          >
            <div className="p-6 border-b border-purple-500/20">
              <h3 className="text-lg font-semibold flex items-center gap-2">
                <Bell className="w-5 h-5 text-yellow-400" />
                Live Alerts ({alerts.length})
              </h3>
            </div>
            <div className="max-h-[600px] overflow-y-auto">
              {alerts.map(alert => (
                <motion.div
                  key={alert.id}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className={`p-4 border-b border-purple-500/10 hover:bg-slate-700/30 transition-all ${
                    alert.priority === 'high' ? 'bg-red-500/5' : ''
                  }`}
                >
                  <div className="font-medium text-sm mb-1">{alert.title}</div>
                  <div className="text-xs text-gray-400">{alert.message}</div>
                  <div className="text-xs text-gray-500 mt-1">Just now</div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl"
          >
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <button className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 font-medium transition-all shadow-lg shadow-purple-500/30 flex items-center justify-center gap-2">
                <PlayCircle className="w-4 h-4" />
                Start Trading
              </button>
              <button className="w-full py-3 px-4 rounded-xl border-2 border-purple-500/30 hover:border-purple-500/50 hover:bg-purple-500/10 transition-all">
                View Analytics
              </button>
            </div>
          </motion.div>
        </aside>
      </div>
    </div>

    <WatchlistManager
      isOpen={watchlistManagerOpen}
      onClose={() => setWatchlistManagerOpen(false)}
      onCreateAlert={handleCreateAlertFromWatchlist}
    />

    <AlertsManager
      isOpen={alertsManagerOpen}
      onClose={() => {
        setAlertsManagerOpen(false)
        setPrefilledSymbol(undefined)
        setPrefilledMint(undefined)
      }}
      prefilledSymbol={prefilledSymbol}
      prefilledMint={prefilledMint}
    />
    </>
  )
}
