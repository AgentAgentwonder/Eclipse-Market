import { useEffect, useMemo, useState } from 'react'
import { Search, TrendingUp, Zap, BarChart3, X, Loader2 } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import TrendingCoins, { TrendingCoinData } from './Coins/TrendingCoins'
import PriceChart from '../components/PriceChart'

interface PricePoint {
  timestamp: number
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export default function Coins() {
  const [activeTab, setActiveTab] = useState('trending')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCoin, setSelectedCoin] = useState<TrendingCoinData | null>(null)
  const [priceHistory, setPriceHistory] = useState<PricePoint[]>([])
  const [historyLoading, setHistoryLoading] = useState(false)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [timeframe, setTimeframe] = useState<'1D' | '1W' | '1M'>('1D')
  const apiKey = useMemo(() => (typeof window !== 'undefined' ? localStorage.getItem('birdeye_api_key') : null), [])

  useEffect(() => {
    if (!selectedCoin) return

    const fetchHistory = async () => {
      try {
        setHistoryLoading(true)
        setHistoryError(null)
        const params: Record<string, unknown> = {
          address: selectedCoin.address,
          timeframe,
        }
        if (apiKey) {
          params.apiKey = apiKey
        }

        const data = await invoke<PricePoint[]>('get_price_history', params)
        setPriceHistory(data)
      } catch (err) {
        console.error('Failed to fetch price history:', err)
        setHistoryError(String(err))
      } finally {
        setHistoryLoading(false)
      }
    }

    fetchHistory()
  }, [selectedCoin, timeframe, apiKey])

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

      {/* Tab Content */}
      {activeTab === 'trending' && <TrendingCoins searchQuery={searchQuery} onSelectCoin={setSelectedCoin} />}
      
      {activeTab === 'new' && (
        <div className="text-center py-12">
          <Zap className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400">New Coins feature coming soon...</p>
        </div>
      )}
      
      {activeTab === 'top' && (
        <div className="text-center py-12">
          <BarChart3 className="w-16 h-16 mx-auto mb-4 text-gray-400" />
          <p className="text-gray-400">Top Coins feature coming soon...</p>
        </div>
      )}

      {/* Chart Modal */}
      {selectedCoin && (
        <div
          className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setSelectedCoin(null)}
        >
          <div
            className="bg-slate-900 rounded-2xl border border-purple-500/20 max-w-4xl w-full max-h-[90vh] overflow-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b border-purple-500/20 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-bold">{selectedCoin.symbol}</h3>
                <p className="text-gray-400">{selectedCoin.name}</p>
              </div>
              <button
                onClick={() => setSelectedCoin(null)}
                className="p-2 hover:bg-slate-800 rounded-lg transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6">
              <div className="flex items-center gap-4 mb-6">
                {(['1D', '1W', '1M'] as const).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-4 py-2 rounded-lg transition-all ${
                      timeframe === tf
                        ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                        : 'bg-slate-800/50 text-gray-400 hover:bg-slate-800'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>

              {historyLoading ? (
                <div className="flex items-center justify-center h-64">
                  <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
                </div>
              ) : historyError ? (
                <div className="text-center text-red-400 py-12">{historyError}</div>
              ) : priceHistory.length > 0 ? (
                <PriceChart data={priceHistory} symbol={selectedCoin.symbol} />
              ) : (
                <div className="text-center text-gray-400 py-12">No data available</div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
