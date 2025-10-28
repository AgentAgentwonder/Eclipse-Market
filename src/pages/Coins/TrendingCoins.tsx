import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { motion } from 'framer-motion'
import { TrendingUp, TrendingDown, RefreshCw, Star, ArrowUpDown, PauseCircle, PlayCircle } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import Sparkline from '../../components/Sparkline'

export interface TrendingCoinData {
  address: string
  symbol: string
  name: string
  price: number
  price_change_24h: number
  volume_24h: number
  volume_change_24h: number
  market_cap: number
  market_cap_change_24h: number
  liquidity: number
  trend_score: number
  logo_uri: string | null
}

export interface CoinSentimentData {
  symbol: string
  score: number
  label: string
  mentions: number
  positive_ratio: number
}

type SortOption = 'trend_score' | 'price_change' | 'volume_change' | 'market_cap'

interface TrendingCoinsProps {
  searchQuery: string
  onSelectCoin?: (coin: TrendingCoinData) => void
}

const WATCHLIST_STORAGE_KEY = 'coin_watchlist'
const BIRDEYE_API_STORAGE_KEY = 'birdeye_api_key'

function formatSortLabel(option: SortOption) {
  switch (option) {
    case 'trend_score':
      return 'Trend score'
    case 'price_change':
      return 'Price change'
    case 'volume_change':
      return 'Volume change'
    case 'market_cap':
      return 'Market cap'
    default:
      return option
  }
}

function generateSparklineData(priceChange: number) {
  const dataPoints = 24
  const data: number[] = []
  const basePrice = 100

  for (let i = 0; i < dataPoints; i++) {
    const progress = i / (dataPoints - 1)
    const noise = (Math.random() - 0.5) * 5
    const trend = basePrice + (priceChange * progress) + noise
    data.push(Number(trend.toFixed(2)))
  }

  return data
}

export default function TrendingCoins({ searchQuery, onSelectCoin }: TrendingCoinsProps) {
  const [coins, setCoins] = useState<TrendingCoinData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null)
  const [sortBy, setSortBy] = useState<SortOption>('trend_score')
  const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true)
  const [isWindowActive, setIsWindowActive] = useState(true)
  const [watchlist, setWatchlist] = useState<Set<string>>(new Set())
  const [sentiment, setSentiment] = useState<Record<string, CoinSentimentData>>({})
  const [sparklineMap, setSparklineMap] = useState<Record<string, number[]>>({})
  const [apiKey, setApiKey] = useState<string | null>(null)
  const [showSortMenu, setShowSortMenu] = useState(false)

  const sortMenuRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const storedKey = localStorage.getItem(BIRDEYE_API_STORAGE_KEY)
    if (storedKey) {
      setApiKey(storedKey)
    }

    const storedWatchlist = localStorage.getItem(WATCHLIST_STORAGE_KEY)
    if (storedWatchlist) {
      try {
        const parsed = JSON.parse(storedWatchlist) as string[]
        setWatchlist(new Set(parsed))
      } catch (err) {
        console.error('Failed to parse watchlist from storage', err)
      }
    }
  }, [])

  useEffect(() => {
    if (typeof window === 'undefined') return
    localStorage.setItem(WATCHLIST_STORAGE_KEY, JSON.stringify(Array.from(watchlist)))
  }, [watchlist])

  const loadSentiment = useCallback(
    async (items: TrendingCoinData[]) => {
      if (items.length === 0) return

      const sentimentEntries = await Promise.all(
        items.map(async (coin) => {
          try {
            const params: Record<string, unknown> = { symbol: coin.symbol }
            if (apiKey) {
              params.apiKey = apiKey
            }

            const data = await invoke<CoinSentimentData>('get_coin_sentiment', params)
            return [coin.symbol, data] as const
          } catch (err) {
            console.error(`Failed to fetch sentiment for ${coin.symbol}:`, err)
            return null
          }
        })
      )

      const map: Record<string, CoinSentimentData> = {}
      sentimentEntries.forEach((entry) => {
        if (!entry) return
        const [symbol, data] = entry
        map[symbol] = data
      })

      setSentiment((prev) => ({ ...prev, ...map }))
    },
    [apiKey]
  )

  const fetchTrendingCoins = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)

      const params: Record<string, unknown> = { limit: 30 }
      if (apiKey) {
        params.apiKey = apiKey
      }

      const result = await invoke<TrendingCoinData[]>('get_trending_coins', params)
      setCoins(result)
      setLastUpdated(new Date())
      setSparklineMap(
        result.reduce<Record<string, number[]>>((acc, coin) => {
          acc[coin.address] = generateSparklineData(coin.price_change_24h)
          return acc
        }, {})
      )

      await loadSentiment(result.slice(0, 6))
    } catch (err) {
      console.error('Failed to fetch trending coins:', err)
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }, [apiKey, loadSentiment])

  const handleRefresh = useCallback(async () => {
    try {
      await invoke('refresh_trending')
    } catch (err) {
      console.error('Failed to clear trending cache:', err)
    }
    await fetchTrendingCoins()
  }, [fetchTrendingCoins])

  useEffect(() => {
    fetchTrendingCoins()
  }, [fetchTrendingCoins])

  useEffect(() => {
    if (!autoRefreshEnabled || !isWindowActive) return

    const interval = setInterval(() => {
      fetchTrendingCoins()
    }, 60_000)

    return () => clearInterval(interval)
  }, [autoRefreshEnabled, isWindowActive, fetchTrendingCoins])

  useEffect(() => {
    const handleVisibility = () => {
      setIsWindowActive(!document.hidden)
    }

    const handleFocus = () => setIsWindowActive(true)
    const handleBlur = () => setIsWindowActive(false)

    document.addEventListener('visibilitychange', handleVisibility)
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  }, [])

  useEffect(() => {
    if (!showSortMenu) return

    const handleClick = (event: MouseEvent) => {
      if (!sortMenuRef.current) return
      if (!sortMenuRef.current.contains(event.target as Node)) {
        setShowSortMenu(false)
      }
    }

    window.addEventListener('mousedown', handleClick)
    return () => window.removeEventListener('mousedown', handleClick)
  }, [showSortMenu])

  const toggleWatchlist = (address: string) => {
    setWatchlist((prev) => {
      const next = new Set(prev)
      if (next.has(address)) {
        next.delete(address)
      } else {
        next.add(address)
      }
      return next
    })
  }

  const filteredCoins = useMemo(() => {
    if (!searchQuery) return coins

    const lower = searchQuery.toLowerCase()
    return coins.filter(
      (coin) =>
        coin.symbol.toLowerCase().includes(lower) || coin.name.toLowerCase().includes(lower)
    )
  }, [coins, searchQuery])

  const sortedCoins = useMemo(() => {
    const sorted = [...filteredCoins]

    switch (sortBy) {
      case 'trend_score':
        return sorted.sort((a, b) => b.trend_score - a.trend_score)
      case 'price_change':
        return sorted.sort((a, b) => b.price_change_24h - a.price_change_24h)
      case 'volume_change':
        return sorted.sort((a, b) => b.volume_change_24h - a.volume_change_24h)
      case 'market_cap':
        return sorted.sort((a, b) => b.market_cap - a.market_cap)
      default:
        return sorted
    }
  }, [filteredCoins, sortBy])

  const getTimeSinceUpdate = () => {
    if (!lastUpdated) return '—'
    const seconds = Math.floor((Date.now() - lastUpdated.getTime()) / 1000)
    if (seconds < 60) return `${seconds}s ago`
    const minutes = Math.floor(seconds / 60)
    if (minutes < 60) return `${minutes}m ago`
    const hours = Math.floor(minutes / 60)
    return `${hours}h ago`
  }

  const formatNumber = (num: number) => {
    if (num >= 1_000_000_000) {
      return `$${(num / 1_000_000_000).toFixed(2)}B`
    }
    if (num >= 1_000_000) {
      return `$${(num / 1_000_000).toFixed(2)}M`
    }
    if (num >= 1_000) {
      return `$${(num / 1_000).toFixed(2)}K`
    }
    return `$${num.toFixed(2)}`
  }

  const formatPrice = (price: number) => {
    if (price < 0.01) {
      return `$${price.toFixed(6)}`
    }
    if (price < 1) {
      return `$${price.toFixed(4)}`
    }
    return `$${price.toFixed(2)}`
  }

  const getSentimentColor = (score: number) => {
    if (score > 0.3) return 'text-green-400'
    if (score < -0.3) return 'text-red-400'
    return 'text-gray-400'
  }

  const autoRefreshPaused = !autoRefreshEnabled || !isWindowActive

  if (error && coins.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <p className="text-red-400 mb-4">{error}</p>
          <button
            onClick={fetchTrendingCoins}
            className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg transition-all"
          >
            Try again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">Trending coins</h2>
          <div className="flex items-center gap-2 text-sm text-gray-400 mt-1">
            <span>Last updated: {getTimeSinceUpdate()}</span>
            {autoRefreshPaused ? (
              <span className="flex items-center gap-1 text-amber-400">
                <PauseCircle className="w-4 h-4" /> Paused
              </span>
            ) : (
              <span className="flex items-center gap-1 text-green-400">
                <PlayCircle className="w-4 h-4" /> Auto-refresh on
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-400">Auto-refresh</label>
            <button
              onClick={() => setAutoRefreshEnabled((prev) => !prev)}
              className={`w-12 h-6 rounded-full transition-all ${
                autoRefreshEnabled ? 'bg-purple-500' : 'bg-gray-600'
              }`}
            >
              <div
                className={`w-5 h-5 bg-white rounded-full transition-all ${
                  autoRefreshEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
          <button
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 rounded-lg transition-all disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <div ref={sortMenuRef} className="relative">
            <button
              onClick={(event) => {
                event.stopPropagation()
                setShowSortMenu((prev) => !prev)
              }}
              className="flex items-center gap-2 px-4 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-all"
            >
              <ArrowUpDown className="w-4 h-4" />
              Sort: {formatSortLabel(sortBy)}
            </button>
            {showSortMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-purple-500/20 rounded-lg shadow-xl z-20">
                {(['trend_score', 'price_change', 'volume_change', 'market_cap'] as SortOption[]).map((option) => (
                  <button
                    key={option}
                    onClick={() => {
                      setSortBy(option)
                      setShowSortMenu(false)
                    }}
                    className="w-full px-4 py-2 text-left hover:bg-purple-500/20 transition-all first:rounded-t-lg last:rounded-b-lg capitalize"
                  >
                    {formatSortLabel(option)}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {loading && coins.length === 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 9 }).map((_, i) => (
            <div
              key={i}
              className="bg-slate-800/50 rounded-2xl p-6 border border-purple-500/20 animate-pulse"
            >
              <div className="h-6 bg-slate-700 rounded mb-4" />
              <div className="h-8 bg-slate-700 rounded mb-2" />
              <div className="h-4 bg-slate-700 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedCoins.map((coin, idx) => (
            <motion.div
              key={coin.address}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.04 }}
              whileHover={{ scale: 1.02 }}
              className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 shadow-xl hover:shadow-purple-500/20 transition-all cursor-pointer"
              onClick={() => onSelectCoin?.(coin)}
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {coin.logo_uri ? (
                    <img
                      src={coin.logo_uri}
                      alt={coin.symbol}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center font-bold shadow-lg">
                      {coin.symbol.substring(0, 2)}
                    </div>
                  )}
                  <div>
                    <div className="text-xl font-bold">{coin.symbol}</div>
                    <div className="text-sm text-gray-400">{coin.name}</div>
                  </div>
                </div>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleWatchlist(coin.address)
                  }}
                  className="p-2 hover:bg-slate-700/50 rounded-lg transition-all"
                >
                  <Star
                    className={`w-5 h-5 ${
                      watchlist.has(coin.address)
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-400'
                    }`}
                  />
                </button>
              </div>

              <div className="mb-4">
                <div className="text-2xl font-bold mb-1">{formatPrice(coin.price)}</div>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-semibold ${
                      coin.price_change_24h >= 0
                        ? 'bg-green-500/20 text-green-400'
                        : 'bg-red-500/20 text-red-400'
                    }`}
                  >
                    {coin.price_change_24h >= 0 ? (
                      <TrendingUp className="w-4 h-4" />
                    ) : (
                      <TrendingDown className="w-4 h-4" />
                    )}
                    {coin.price_change_24h >= 0 ? '+' : ''}
                    {coin.price_change_24h.toFixed(2)}%
                  </div>
                  <span className="text-xs text-gray-400">24h</span>
                </div>
              </div>

              <div className="mb-4">
                <Sparkline
                  data={sparklineMap[coin.address] ?? generateSparklineData(coin.price_change_24h)}
                  color={coin.price_change_24h >= 0 ? '#4ade80' : '#f87171'}
                  width={250}
                  height={50}
                />
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-400">Volume 24h</span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{formatNumber(coin.volume_24h)}</span>
                    <span
                      className={`text-xs ${
                        coin.volume_change_24h >= 0 ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {coin.volume_change_24h >= 0 ? '+' : ''}
                      {coin.volume_change_24h.toFixed(1)}%
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Market cap</span>
                  <span className="font-bold">{formatNumber(coin.market_cap)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Liquidity</span>
                  <span className="font-bold">{formatNumber(coin.liquidity)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Trend score</span>
                  <div className="flex items-center gap-2">
                    <div className="w-20 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                        style={{ width: `${Math.min(coin.trend_score, 100)}%` }}
                      />
                    </div>
                    <span className="font-bold text-purple-400">
                      {coin.trend_score.toFixed(0)}
                    </span>
                  </div>
                </div>
              </div>

              {sentiment[coin.symbol] && (
                <div className="mb-4 p-3 bg-slate-700/30 rounded-lg">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-400">Sentiment</span>
                    <span className={`font-semibold ${getSentimentColor(sentiment[coin.symbol].score)}`}>
                      {sentiment[coin.symbol].label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-xs text-gray-400 mt-1">
                    <span>{sentiment[coin.symbol].mentions} mentions</span>
                    <span>{(sentiment[coin.symbol].positive_ratio * 100).toFixed(0)}% positive</span>
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    onSelectCoin?.(coin)
                  }}
                  className="flex-1 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 font-medium transition-all"
                >
                  View chart
                </button>
                <button
                  onClick={(event) => {
                    event.stopPropagation()
                    toggleWatchlist(coin.address)
                  }}
                  className={`px-4 py-2 rounded-xl font-medium transition-all ${
                    watchlist.has(coin.address)
                      ? 'bg-yellow-500/20 text-yellow-400'
                      : 'bg-slate-700/50 text-gray-400 hover:bg-slate-700'
                  }`}
                >
                  {watchlist.has(coin.address) ? 'Watching' : 'Watch'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && sortedCoins.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-400">No coins match your filters.</p>
        </div>
      )}
    </div>
  )
}
