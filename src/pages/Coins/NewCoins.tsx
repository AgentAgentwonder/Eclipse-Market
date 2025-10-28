import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import {
  Search,
  AlertTriangle,
  CheckCircle,
  Shield,
  Clock,
  Droplets,
  Users,
  RefreshCw,
  Zap
} from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'

interface NewCoin {
  address: string
  symbol: string
  name: string
  logoUri: string | null
  createdAt: string
  liquidity: number
  mintAuthorityRevoked: boolean
  freezeAuthorityRevoked: boolean
  holderCount: number
  topHolderPercent: number
  creatorWallet: string
  creatorReputationScore: number
  safetyScore: number
  isSpam: boolean
  detectedAt: string
}

interface SafetyReport {
  address: string
  symbol: string
  name: string
  safetyScore: number
  checks: {
    mintAuthorityRevoked: boolean
    freezeAuthorityRevoked: boolean
    hasMinimumLiquidity: boolean
    holderDistributionHealthy: boolean
    creatorReputationGood: boolean
    notFlaggedAsSpam: boolean
  }
  liquidityInfo: {
    totalLiquidity: number
    poolAddress: string | null
    liquidityLocked: boolean
  }
  holderInfo: {
    holderCount: number
    topHolderPercent: number
    top10HoldersPercent: number
  }
  creatorInfo: {
    walletAddress: string
    reputationScore: number
    previousTokensCreated: number
    suspiciousActivity: boolean
  }
  recommendation: string
}

type SortBy = 'newest' | 'safest' | 'liquidity'

interface CoinNotification {
  id: string
  coin: NewCoin
}

export default function NewCoins() {
  const [coins, setCoins] = useState<NewCoin[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [minSafetyScore, setMinSafetyScore] = useState(50)
  const [sortBy, setSortBy] = useState<SortBy>('newest')
  const [safetyReport, setSafetyReport] = useState<SafetyReport | null>(null)
  const [showReportModal, setShowReportModal] = useState(false)
  const [notificationsEnabled, setNotificationsEnabled] = useState(true)
  const [minNotificationScore, setMinNotificationScore] = useState(70)
  const [statusMessage, setStatusMessage] = useState<string | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<CoinNotification[]>([])

  const timeoutIds = useRef<number[]>([])

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((notification) => notification.id !== id))
  }, [])

  const addNotification = useCallback(
    (coin: NewCoin) => {
      const id = `${coin.address}-${Date.now()}`
      setNotifications((prev) => [...prev, { id, coin }])

      const timeoutId = window.setTimeout(() => {
        removeNotification(id)
      }, 6000)
      timeoutIds.current.push(timeoutId)
    },
    [removeNotification]
  )

  const fetchCoins = useCallback(async () => {
    setLoading(true)
    setStatusMessage(null)
    setErrorMessage(null)
    try {
      const result = await invoke<NewCoin[]>('get_new_coins', {
        hours: 24,
        minSafetyScore,
      })
      setCoins(result)
    } catch (error) {
      console.error('Failed to fetch new coins:', error)
      setErrorMessage('Failed to fetch new coins')
    } finally {
      setLoading(false)
    }
  }, [minSafetyScore])

  const forceScan = useCallback(async () => {
    setStatusMessage('Scanning for new tokens...')
    setErrorMessage(null)
    setLoading(true)
    try {
      const result = await invoke<NewCoin[]>('scan_for_new_coins')
      setCoins(result)
      setStatusMessage(result.length ? `Detected ${result.length} tokens` : 'No new tokens found')
    } catch (error) {
      console.error('Failed to scan for new coins:', error)
      setStatusMessage(null)
      setErrorMessage('Failed to scan for new coins')
    } finally {
      setLoading(false)
    }
  }, [])

  const viewSafetyReport = useCallback(async (address: string) => {
    try {
      const report = await invoke<SafetyReport>('get_coin_safety_report', {
        tokenAddress: address,
      })
      setSafetyReport(report)
      setShowReportModal(true)
    } catch (error) {
      console.error('Failed to fetch safety report:', error)
      setErrorMessage('Failed to fetch safety report')
    }
  }, [])

  const handleNewCoinEvent = useCallback(
    (coin: NewCoin) => {
      setCoins((prev) => {
        const existingIndex = prev.findIndex((item) => item.address === coin.address)
        if (existingIndex !== -1) {
          const updated = [...prev]
          updated[existingIndex] = coin
          return updated
        }
        return [coin, ...prev]
      })

      setStatusMessage(`${coin.symbol} detected with safety score ${coin.safetyScore}`)

      if (notificationsEnabled && coin.safetyScore >= minNotificationScore) {
        addNotification(coin)
      }
    },
    [notificationsEnabled, minNotificationScore, addNotification]
  )

  useEffect(() => {
    void fetchCoins()
  }, [fetchCoins])

  useEffect(() => {
    let mounted = true
    let unlisten: (() => void) | undefined

    listen<NewCoin>('new-coin-detected', (event) => {
      handleNewCoinEvent(event.payload)
    })
      .then((fn) => {
        if (!mounted) {
          fn()
        } else {
          unlisten = fn
        }
      })
      .catch((error) => {
        console.error('Failed to bind new coin listener:', error)
      })

    return () => {
      mounted = false
      if (unlisten) {
        unlisten()
      }
    }
  }, [handleNewCoinEvent])

  useEffect(() => {
    return () => {
      timeoutIds.current.forEach((id) => window.clearTimeout(id))
      timeoutIds.current = []
    }
  }, [])

  const filteredCoins = useMemo(() => {
    const result = coins.filter((coin) => {
      if (!searchQuery) return true
      const query = searchQuery.toLowerCase()
      return coin.symbol.toLowerCase().includes(query) || coin.name.toLowerCase().includes(query)
    })

    result.sort((a, b) => {
      if (sortBy === 'newest') {
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      }
      if (sortBy === 'safest') {
        return b.safetyScore - a.safetyScore
      }
      return b.liquidity - a.liquidity
    })

    return result
  }, [coins, searchQuery, sortBy])

  const getSafetyColor = (score: number) => {
    if (score >= 80) return 'text-green-400 bg-green-500/20 border-green-500/30'
    if (score >= 50) return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30'
    return 'text-red-400 bg-red-500/20 border-red-500/30'
  }

  const getSafetyIcon = (score: number) => {
    if (score >= 80) return <CheckCircle className="w-5 h-5" />
    if (score >= 50) return <Shield className="w-5 h-5" />
    return <AlertTriangle className="w-5 h-5" />
  }

  const getAgeInHours = (createdAt: string) => {
    const created = new Date(createdAt)
    const now = new Date()
    return Math.max(0, Math.floor((now.getTime() - created.getTime()) / (1000 * 60 * 60)))
  }

  const formatLiquidity = (value: number) => {
    if (value >= 1_000_000) return `$${(value / 1_000_000).toFixed(2)}M`
    if (value >= 1_000) return `$${(value / 1_000).toFixed(1)}K`
    return `$${value.toFixed(0)}`
  }

  const handleNotificationClick = useCallback(
    (notification: CoinNotification) => {
      void viewSafetyReport(notification.coin.address)
      removeNotification(notification.id)
    },
    [viewSafetyReport, removeNotification]
  )

  return (
    <div className="space-y-6">
      {notifications.length > 0 && (
        <div className="fixed top-24 right-6 z-50 space-y-3">
          {notifications.map((notification, idx) => (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => handleNotificationClick(notification)}
              className="cursor-pointer bg-slate-800/90 backdrop-blur-md border border-purple-500/40 rounded-xl px-4 py-3 shadow-lg hover:shadow-purple-500/40 transition-all"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-purple-500/30 flex items-center justify-center">
                  <Zap className="w-5 h-5 text-yellow-300" />
                </div>
                <div>
                  <div className="font-semibold">{notification.coin.symbol} detected</div>
                  <div className="text-sm text-gray-300">
                    Safety {notification.coin.safetyScore}/100 - click to view report
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">New Coins Scanner</h1>
          <p className="text-gray-400">Discover newly deployed tokens with safety filtering</p>
        </div>
        <button
          onClick={() => void forceScan()}
          className="px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 font-medium transition-all flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Force Scan
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl p-6 border border-purple-500/20 space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
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

          {/* Min Safety Score */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Min Safety Score: {minSafetyScore}
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={minSafetyScore}
              onChange={(e) => setMinSafetyScore(Number(e.target.value))}
              className="w-full"
            />
          </div>

          {/* Sort By */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">Sort By</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortBy)}
              className="w-full px-4 py-2 rounded-xl bg-slate-700/50 border border-purple-500/30 outline-none focus:border-purple-500 transition-all"
            >
              <option value="newest">Newest First</option>
              <option value="safest">Safest First</option>
              <option value="liquidity">Highest Liquidity</option>
            </select>
          </div>

          {/* Notifications */}
          <div>
            <label className="block text-sm text-gray-400 mb-1">
              Notify for score ≥ {minNotificationScore}
            </label>
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm text-gray-300">
                <input
                  type="checkbox"
                  checked={notificationsEnabled}
                  onChange={(e) => setNotificationsEnabled(e.target.checked)}
                  className="w-4 h-4"
                />
                Enable
              </label>
              <input
                type="range"
                min="50"
                max="100"
                value={minNotificationScore}
                onChange={(e) => setMinNotificationScore(Number(e.target.value))}
                className="flex-1"
                disabled={!notificationsEnabled}
              />
            </div>
          </div>
        </div>

        {(statusMessage || errorMessage) && (
          <div className="text-sm">
            {statusMessage && (
              <div className="text-purple-300">{statusMessage}</div>
            )}
            {errorMessage && (
              <div className="text-red-400">{errorMessage}</div>
            )}
          </div>
        )}
      </div>

      {/* Coins Table */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="w-8 h-8 animate-spin text-purple-400" />
        </div>
      ) : filteredCoins.length === 0 ? (
        <div className="text-center py-12 text-gray-400">
          No new coins found matching your criteria
        </div>
      ) : (
        <div className="bg-slate-800/50 backdrop-blur-sm rounded-2xl border border-purple-500/20 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-slate-700/50 border-b border-purple-500/20">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Token</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Age</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Liquidity</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Holders</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Safety</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-purple-500/10">
                {filteredCoins.map((coin, idx) => {
                  const ageHours = getAgeInHours(coin.createdAt)
                  const isEarlyBird = ageHours < 1

                  return (
                    <motion.tr
                      key={coin.address}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className="hover:bg-slate-700/30 transition-all cursor-pointer"
                      onClick={() => void viewSafetyReport(coin.address)}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold">{coin.symbol}</span>
                              {isEarlyBird && (
                                <span className="px-2 py-0.5 text-xs rounded-full bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 flex items-center gap-1">
                                  <Zap className="w-3 h-3" />
                                  Early Bird
                                </span>
                              )}
                            </div>
                            <div className="text-sm text-gray-400">{coin.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <span>{ageHours}h ago</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Droplets className="w-4 h-4 text-blue-400" />
                          <span className="font-medium">{formatLiquidity(coin.liquidity)}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2 text-sm">
                          <Users className="w-4 h-4 text-gray-400" />
                          <span>{coin.holderCount}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-lg border ${getSafetyColor(coin.safetyScore)}`}>
                          {getSafetyIcon(coin.safetyScore)}
                          <span className="font-bold">{coin.safetyScore}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            void viewSafetyReport(coin.address)
                          }}
                          className="px-4 py-2 rounded-lg bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-sm font-medium transition-all"
                        >
                          View Report
                        </button>
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Safety Report Modal */}
      {showReportModal && safetyReport && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800 rounded-2xl border border-purple-500/20 max-w-3xl w-full max-h-[90vh] overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-slate-800 border-b border-purple-500/20 p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-3">
                    {safetyReport.symbol}
                    <span className={`px-3 py-1 rounded-lg text-sm border ${getSafetyColor(safetyReport.safetyScore)}`}>
                      Safety: {safetyReport.safetyScore}/100
                    </span>
                  </h2>
                  <p className="text-gray-400">{safetyReport.name}</p>
                </div>
                <button
                  onClick={() => setShowReportModal(false)}
                  className="w-10 h-10 rounded-full hover:bg-slate-700 flex items-center justify-center transition-all"
                >
                  <span className="text-2xl">×</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Recommendation */}
              <div
                className={`p-4 rounded-xl border ${
                  safetyReport.safetyScore >= 80
                    ? 'bg-green-500/10 border-green-500/30'
                    : safetyReport.safetyScore >= 50
                      ? 'bg-yellow-500/10 border-yellow-500/30'
                      : 'bg-red-500/10 border-red-500/30'
                }`}
              >
                <div className="flex items-start gap-3">
                  <Shield className="w-6 h-6 flex-shrink-0 mt-0.5" />
                  <div>
                    <div className="font-bold mb-1">Recommendation</div>
                    <div className="text-sm">{safetyReport.recommendation}</div>
                  </div>
                </div>
              </div>

              {/* Safety Checks */}
              <div>
                <h3 className="text-lg font-bold mb-3">Safety Checks</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {Object.entries(safetyReport.checks).map(([key, value]) => (
                    <div
                      key={key}
                      className={`p-3 rounded-xl border ${
                        value ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {value ? (
                          <CheckCircle className="w-5 h-5 text-green-400" />
                        ) : (
                          <AlertTriangle className="w-5 h-5 text-red-400" />
                        )}
                        <span className="text-sm font-medium">
                          {key.replace(/([A-Z])/g, ' $1').replace(/^./, (str) => str.toUpperCase())}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Liquidity Info */}
              <div>
                <h3 className="text-lg font-bold mb-3">Liquidity Information</h3>
                <div className="bg-slate-700/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Liquidity</span>
                    <span className="font-bold">{formatLiquidity(safetyReport.liquidityInfo.totalLiquidity)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Liquidity Locked</span>
                    <span
                      className={
                        safetyReport.liquidityInfo.liquidityLocked ? 'text-green-400' : 'text-red-400'
                      }
                    >
                      {safetyReport.liquidityInfo.liquidityLocked ? 'Yes' : 'No'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Holder Info */}
              <div>
                <h3 className="text-lg font-bold mb-3">Holder Distribution</h3>
                <div className="bg-slate-700/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total Holders</span>
                    <span className="font-bold">{safetyReport.holderInfo.holderCount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Top Holder</span>
                    <span
                      className={
                        safetyReport.holderInfo.topHolderPercent > 50
                          ? 'text-red-400'
                          : safetyReport.holderInfo.topHolderPercent > 25
                            ? 'text-yellow-400'
                            : 'text-green-400'
                      }
                    >
                      {safetyReport.holderInfo.topHolderPercent.toFixed(1)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Top 10 Holders</span>
                    <span className="font-medium">
                      {safetyReport.holderInfo.top10HoldersPercent.toFixed(1)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Creator Info */}
              <div>
                <h3 className="text-lg font-bold mb-3">Creator Information</h3>
                <div className="bg-slate-700/50 rounded-xl p-4 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Wallet</span>
                    <span className="font-mono text-sm">
                      {safetyReport.creatorInfo.walletAddress.slice(0, 8)}...
                      {safetyReport.creatorInfo.walletAddress.slice(-6)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Reputation Score</span>
                    <span
                      className={
                        safetyReport.creatorInfo.reputationScore >= 0.7
                          ? 'text-green-400'
                          : safetyReport.creatorInfo.reputationScore >= 0.4
                            ? 'text-yellow-400'
                            : 'text-red-400'
                      }
                    >
                      {(safetyReport.creatorInfo.reputationScore * 100).toFixed(0)}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Suspicious Activity</span>
                    <span
                      className={
                        safetyReport.creatorInfo.suspiciousActivity ? 'text-red-400' : 'text-green-400'
                      }
                    >
                      {safetyReport.creatorInfo.suspiciousActivity ? 'Detected' : 'None'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="sticky bottom-0 bg-slate-800 border-t border-purple-500/20 p-6">
              <button
                onClick={() => setShowReportModal(false)}
                className="w-full py-3 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 font-medium transition-all"
              >
                Close
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  )
}
