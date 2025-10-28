import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  RefreshCw,
  TrendingUp,
  TrendingDown,
  ChevronUp,
  ChevronDown,
  DollarSign,
  BarChart3,
  ShoppingCart,
  X,
} from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import { QuickTradeButton } from '../../components/trading/QuickTradeButton'
import { useWallet } from '../../hooks/useWallet'

interface TopCoin {
  rank: number
  address: string
  symbol: string
  name: string
  logoUri: string | null
  price: number
  marketCap: number
  volume24h: number
  priceChange24h: number
  priceChange7d: number
  sparkline: number[]
  marketCapCategory: string
}

type SortColumn = 'rank' | 'symbol' | 'price' | 'marketCap' | 'volume24h' | 'priceChange24h' | 'priceChange7d'
type SortDirection = 'asc' | 'desc'

const SOL_MINT = 'So11111111111111111111111111111111111111112'

export default function TopCoins() {
  const wallet = useWallet()
  const [coins, setCoins] = useState<TopCoin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortColumn, setSortColumn] = useState<SortColumn>('rank')
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc')
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [selectedCoinForTrade, setSelectedCoinForTrade] = useState<TopCoin | null>(null)
  const observerTarget = useRef<HTMLDivElement>(null)

  const fetchCoins = useCallback(async (offset = 0, limit = 50) => {
    if (offset === 0) {
      setLoading(true)
    } else {
      setLoadingMore(true)
    }
    
    try {
      const result = await invoke<TopCoin[]>('get_top_coins', {
        limit,
        offset,
        apiKey: null,
      })
      
      if (offset === 0) {
        setCoins(result)
      } else {
        setCoins((prev) => [...prev, ...result])
      }
      
      if (result.length < limit || coins.length + result.length >= 100) {
        setHasMore(false)
      }
    } catch (error) {
      console.error('Failed to fetch top coins:', error)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [coins.length])

  const refreshCoins = useCallback(async () => {
    try {
      await invoke('refresh_top_coins')
      setHasMore(true)
      await fetchCoins(0, 50)
    } catch (error) {
      console.error('Failed to refresh top coins:', error)
    }
  }, [fetchCoins])

  useEffect(() => {
    void fetchCoins(0, 50)
  }, [])

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          void fetchCoins(coins.length, 50)
        }
      },
      { threshold: 0.1 }
    )

    const currentTarget = observerTarget.current
    if (currentTarget) {
      observer.observe(currentTarget)
    }

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget)
      }
    }
  }, [coins.length, hasMore, loadingMore, loading, fetchCoins])

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection(column === 'rank' ? 'asc' : 'desc')
    }
  }

  const sortedAndFilteredCoins = useMemo(() => {
    let result = [...coins]

    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      result = result.filter(
        (coin) =>
          coin.symbol.toLowerCase().includes(query) ||
          coin.name.toLowerCase().includes(query)
      )
    }

    result.sort((a, b) => {
      let aVal: number | string = a[sortColumn]
      let bVal: number | string = b[sortColumn]

      if (typeof aVal === 'string') aVal = aVal.toLowerCase()
      if (typeof bVal === 'string') bVal = bVal.toLowerCase()

      if (aVal < bVal) return sortDirection === 'asc' ? -1 : 1
      if (aVal > bVal) return sortDirection === 'asc' ? 1 : -1
      return 0
    })

    return result
  }, [coins, searchQuery, sortColumn, sortDirection])

  const formatPrice = (price: number) => {
    if (price >= 1000) return `$${price.toLocaleString(undefined, { maximumFractionDigits: 2 })}`
    if (price >= 1) return `$${price.toFixed(2)}`
    if (price >= 0.01) return `$${price.toFixed(4)}`
    return `$${price.toFixed(6)}`
  }

  const formatMarketCap = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }

  const formatVolume = (value: number) => {
    if (value >= 1_000_000_000) return `$${(value / 1_000_000_000).toFixed(2)}B`
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case 'blue-chip':
        return { icon: '💎', text: 'Blue Chip', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' }
      case 'mid-cap':
        return { icon: '⭐', text: 'Mid Cap', color: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30' }
      case 'small-cap':
        return { icon: '🔹', text: 'Small Cap', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' }
      default:
        return { icon: '🔹', text: 'Small Cap', color: 'bg-gray-500/20 text-gray-400 border-gray-500/30' }
    }
  }

  const SortIcon = ({ column }: { column: SortColumn }) => {
    if (sortColumn !== column) return null
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-4 h-4 inline ml-1" />
    ) : (
      <ChevronDown className="w-4 h-4 inline ml-1" />
    )
  }

  const Sparkline = ({ data, change }: { data: number[]; change: number }) => {
    if (!data || data.length === 0) return null

    const min = Math.min(...data)
    const max = Math.max(...data)
    const range = max - min || 1

    const points = data
      .map((value, idx) => {
        const x = (idx / (data.length - 1)) * 100
        const y = 100 - ((value - min) / range) * 100
        return `${x},${y}`
      })
      .join(' ')

    const color = change >= 0 ? '#10b981' : '#ef4444'

    return (
      <svg width="100" height="40" className="inline-block">
        <polyline
          points={points}
          fill="none"
          stroke={color}
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Top Coins by Market Cap</h1>
          <p className="text-gray-400">Top 100 Solana tokens sorted by market capitalization</p>
        </div>
        <button
          onClick={() => void refreshCoins()}
          disabled={loading}
          className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 font-medium transition-all flex items-center gap-2 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search coins..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-700/50 border border-purple-500/30 outline-none focus:border-purple-500 transition-all"
          />
        </div>
      </div>

      {loading && coins.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : sortedAndFilteredCoins.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No coins found matching your search
        </div>
      ) : (
        <>
          <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-700/50 border-b border-purple-500/20 sticky top-0 z-10">
                  <tr>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('rank')}
                    >
                      Rank <SortIcon column="rank" />
                    </th>
                    <th
                      className="px-6 py-4 text-left text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('symbol')}
                    >
                      Token <SortIcon column="symbol" />
                    </th>
                    <th
                      className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('price')}
                    >
                      Price <SortIcon column="price" />
                    </th>
                    <th
                      className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('marketCap')}
                    >
                      Market Cap <SortIcon column="marketCap" />
                    </th>
                    <th
                      className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('volume24h')}
                    >
                      24h Volume <SortIcon column="volume24h" />
                    </th>
                    <th
                      className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('priceChange24h')}
                    >
                      24h Change <SortIcon column="priceChange24h" />
                    </th>
                    <th
                      className="px-6 py-4 text-right text-sm font-semibold text-gray-300 cursor-pointer hover:text-white"
                      onClick={() => handleSort('priceChange7d')}
                    >
                      7d Change <SortIcon column="priceChange7d" />
                    </th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-gray-300">
                      Chart
                    </th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-purple-500/10">
                  {sortedAndFilteredCoins.map((coin, idx) => {
                    const badge = getCategoryBadge(coin.marketCapCategory)

                    return (
                      <motion.tr
                        key={coin.address}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.02 }}
                        className="hover:bg-slate-700/30 transition-all"
                      >
                        <td className="px-6 py-4">
                          <span className="font-bold text-gray-300">#{coin.rank}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            {coin.logoUri ? (
                              <img
                                src={coin.logoUri}
                                alt={coin.symbol}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-xs">
                                {coin.symbol.substring(0, 2)}
                              </div>
                            )}
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{coin.symbol}</span>
                                <span
                                  className={`px-2 py-0.5 text-xs rounded-full border ${badge.color} flex items-center gap-1`}
                                >
                                  <span>{badge.icon}</span>
                                  <span className="hidden md:inline">{badge.text}</span>
                                </span>
                              </div>
                              <div className="text-sm text-gray-400">{coin.name}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <DollarSign className="w-4 h-4 text-gray-400" />
                            <span className="font-medium">{formatPrice(coin.price)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <span className="font-medium">{formatMarketCap(coin.marketCap)}</span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <BarChart3 className="w-4 h-4 text-gray-400" />
                            <span className="text-sm">{formatVolume(coin.volume24h)}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div
                            className={`inline-flex items-center gap-1 ${
                              coin.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {coin.priceChange24h >= 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="font-medium">
                              {coin.priceChange24h >= 0 ? '+' : ''}
                              {coin.priceChange24h.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div
                            className={`inline-flex items-center gap-1 ${
                              coin.priceChange7d >= 0 ? 'text-green-400' : 'text-red-400'
                            }`}
                          >
                            {coin.priceChange7d >= 0 ? (
                              <TrendingUp className="w-4 h-4" />
                            ) : (
                              <TrendingDown className="w-4 h-4" />
                            )}
                            <span className="font-medium">
                              {coin.priceChange7d >= 0 ? '+' : ''}
                              {coin.priceChange7d.toFixed(2)}%
                            </span>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <Sparkline data={coin.sparkline} change={coin.priceChange24h} />
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              setSelectedCoinForTrade(coin)
                            }}
                            className="px-3 py-1.5 rounded-lg bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 text-green-400 text-sm font-medium transition-all flex items-center gap-1"
                          >
                            <ShoppingCart className="w-4 h-4" />
                            Buy
                          </button>
                        </td>
                      </motion.tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          <div ref={observerTarget} className="h-20 flex items-center justify-center">
            {loadingMore && (
              <div className="flex items-center gap-2 text-gray-400">
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>Loading more coins...</span>
              </div>
            )}
            {!hasMore && sortedAndFilteredCoins.length > 0 && (
              <div className="text-gray-400">No more coins to load</div>
            )}
          </div>
        </>
      )}

      {selectedCoinForTrade && (
        <AnimatePresence>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setSelectedCoinForTrade(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-slate-800 rounded-2xl border border-purple-500/20 max-w-md w-full p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold">Quick Buy {selectedCoinForTrade.symbol}</h2>
                <button
                  onClick={() => setSelectedCoinForTrade(null)}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4 mb-6">
                <div className="flex items-center gap-3 p-4 bg-slate-900/50 rounded-xl">
                  {selectedCoinForTrade.logoUri ? (
                    <img
                      src={selectedCoinForTrade.logoUri}
                      alt={selectedCoinForTrade.symbol}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold">
                      {selectedCoinForTrade.symbol.substring(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="font-bold text-lg">{selectedCoinForTrade.name}</div>
                    <div className="text-sm text-gray-400">{selectedCoinForTrade.symbol}</div>
                  </div>
                </div>

                <div className="space-y-2 p-4 bg-slate-900/50 rounded-xl">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Current Price</span>
                    <span className="font-medium">{formatPrice(selectedCoinForTrade.price)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">24h Change</span>
                    <span
                      className={
                        selectedCoinForTrade.priceChange24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }
                    >
                      {selectedCoinForTrade.priceChange24h >= 0 ? '+' : ''}
                      {selectedCoinForTrade.priceChange24h.toFixed(2)}%
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-400">Market Cap</span>
                    <span className="font-medium">
                      {formatMarketCap(selectedCoinForTrade.marketCap)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <QuickTradeButton
                  fromToken={{
                    symbol: 'SOL',
                    mint: SOL_MINT,
                    decimals: 9,
                  }}
                  toToken={{
                    symbol: selectedCoinForTrade.symbol,
                    mint: selectedCoinForTrade.address,
                    decimals: 9,
                  }}
                  side="buy"
                  walletAddress={wallet.wallet || undefined}
                  onComplete={() => {
                    setSelectedCoinForTrade(null)
                  }}
                  className="w-full justify-center"
                />

                {!wallet.connected && (
                  <p className="text-sm text-center text-gray-400">
                    Connect your wallet to start trading
                  </p>
                )}
              </div>
            </motion.div>
          </motion.div>
        </AnimatePresence>
      )}
    </div>
  )
}
