import { motion } from 'framer-motion'
import { Users, TrendingUp, Target } from 'lucide-react'

export default function Insiders() {
  const insiders = [
    { id: 1, wallet: '7xKXt...9mQ2', winRate: 87, trades: 234, profit: 145.2, status: 'active' },
    { id: 2, wallet: 'BnZ4k...3pR1', winRate: 82, trades: 189, profit: 98.7, status: 'active' },
    { id: 3, wallet: '4mKp9...7wL5', winRate: 76, trades: 156, profit: 67.3, status: 'watching' },
    { id: 4, wallet: 'Qr8Lm...4nX9', winRate: 71, trades: 142, profit: 54.8, status: 'watching' },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Insider Tracking</h1>
          <p className="text-gray-400">Monitor and copy trade top performing wallets</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="px-4 py-2 rounded-xl bg-green-500/20 text-green-400 border border-green-500/30">
            <Users className="w-4 h-4 inline mr-2" />
            {insiders.filter(i => i.status === 'active').length} Active
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Average Win Rate', value: '79%', icon: Target, color: 'from-green-500 to-emerald-500' },
          { label: 'Total Profit', value: '+366.0 SOL', icon: TrendingUp, color: 'from-purple-500 to-pink-500' },
          { label: 'Active Traders', value: '2', icon: Users, color: 'from-blue-500 to-cyan-500' },
        ].map((stat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="text-sm text-gray-400">{stat.label}</div>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg`}>
                <stat.icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="text-3xl font-bold">{stat.value}</div>
          </motion.div>
        ))}
      </div>

      {/* Insiders List */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 shadow-xl">
        <div className="p-6 border-b border-purple-500/20">
          <h3 className="text-xl font-semibold">Top Performing Wallets</h3>
        </div>
        <div className="p-6 space-y-3">
          {insiders.map((insider, idx) => (
            <motion.div
              key={insider.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.1 }}
              whileHover={{ scale: 1.02 }}
              className="flex items-center gap-4 p-4 rounded-xl bg-slate-700/30 hover:bg-slate-700/50 transition-all cursor-pointer"
            >
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold shadow-lg">
                #{idx + 1}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="font-mono font-semibold">{insider.wallet}</div>
                  <div className={`px-2 py-0.5 rounded text-xs ${
                    insider.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-blue-500/20 text-blue-400'
                  }`}>
                    {insider.status}
                  </div>
                </div>
                <div className="text-sm text-gray-400">
                  {insider.trades} trades • +{insider.profit} SOL
                </div>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-green-400">{insider.winRate}%</div>
                <div className="text-xs text-gray-400">Win Rate</div>
              </div>
              <button className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-medium transition-all">
                Copy Trade
              </button>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  )
}
