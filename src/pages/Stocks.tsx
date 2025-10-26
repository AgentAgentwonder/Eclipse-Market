import { motion } from 'framer-motion'
import { TrendingUp, BarChart3 } from 'lucide-react'

export default function Stocks() {
  return (
    <div className="space-y-6">
      <div className="text-center py-20">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <BarChart3 className="w-24 h-24 mx-auto mb-6 text-purple-400 opacity-50" />
          <h2 className="text-3xl font-bold mb-4">Stock Trading Coming Soon</h2>
          <p className="text-gray-400 text-lg mb-8">
            We're integrating real-time stock market data and trading capabilities
          </p>
          <div className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-purple-500/20 border border-purple-500/30 text-purple-300">
            <TrendingUp className="w-5 h-5" />
            <span>Expected Launch: Q2 2025</span>
          </div>
        </motion.div>
      </div>
    </div>
  )
}
