import { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Search, Download, Filter, Calendar, AlertTriangle } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import { useWalletStore } from '../../store/walletStore'

interface ActivityLog {
  log_id: string
  wallet_address: string
  action: string
  details: any
  ip_address?: string
  timestamp: string
  result: string
}

interface ActivityStats {
  total_actions: number
  successful_actions: number
  failed_actions: number
  action_breakdown: Record<string, number>
  recent_suspicious: ActivityLog[]
}

export function ActivityLog() {
  const { publicKey } = useWalletStore()
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [stats, setStats] = useState<ActivityStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [walletFilter, setWalletFilter] = useState('')
  const [actionFilter, setActionFilter] = useState<string>('all')
  const [resultFilter, setResultFilter] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [page, setPage] = useState(1)
  const [pageSize] = useState(50)

  useEffect(() => {
    if (publicKey) {
      setWalletFilter(publicKey)
      loadStats(publicKey)
    }
    loadLogs()
  }, [publicKey, page, actionFilter, resultFilter, startDate, endDate])

  const loadLogs = async () => {
    setLoading(true)
    setError(null)
    try {
      const logs = await invoke<ActivityLog[]>('get_activity_logs', {
        wallet_address: walletFilter || null,
        action_filter: actionFilter === 'all' ? null : actionFilter,
        result_filter: resultFilter === 'all' ? null : resultFilter,
        start_date: startDate || null,
        end_date: endDate || null,
        limit: pageSize,
        offset: (page - 1) * pageSize,
      })
      setLogs(logs)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const loadStats = async (wallet: string) => {
    try {
      const stats = await invoke<ActivityStats>('get_activity_stats', {
        wallet_address: wallet,
      })
      setStats(stats)
    } catch (err) {
      console.error('Failed to load stats', err)
    }
  }

  const handleExport = async () => {
    try {
      const csv = await invoke<string>('export_activity_logs', {
        wallet_address: walletFilter || null,
        action_filter: actionFilter === 'all' ? null : actionFilter,
        result_filter: resultFilter === 'all' ? null : resultFilter,
        start_date: startDate || null,
        end_date: endDate || null,
      })

      const blob = new Blob([csv], { type: 'text/csv' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `activity_log_${new Date().toISOString()}.csv`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(String(err))
    }
  }

  const filteredLogs = logs.filter((log) => {
    if (!searchTerm) return true
    const term = searchTerm.toLowerCase()
    return (
      log.wallet_address.toLowerCase().includes(term) ||
      log.action.toLowerCase().includes(term) ||
      JSON.stringify(log.details).toLowerCase().includes(term)
    )
  })

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-4xl font-bold mb-2">Activity Log</h1>
        <p className="text-white/60">View and analyze wallet activity</p>
      </div>

      {stats && (
        <div className="grid gap-4 md:grid-cols-4">
          <div className="p-4 bg-slate-800/50 border border-purple-500/20 rounded-2xl">
            <div className="text-sm text-white/60 mb-1">Total Actions</div>
            <div className="text-2xl font-bold">{stats.total_actions}</div>
          </div>
          <div className="p-4 bg-slate-800/50 border border-purple-500/20 rounded-2xl">
            <div className="text-sm text-white/60 mb-1">Successful</div>
            <div className="text-2xl font-bold text-green-400">{stats.successful_actions}</div>
          </div>
          <div className="p-4 bg-slate-800/50 border border-purple-500/20 rounded-2xl">
            <div className="text-sm text-white/60 mb-1">Failed</div>
            <div className="text-2xl font-bold text-red-400">{stats.failed_actions}</div>
          </div>
          <div className="p-4 bg-slate-800/50 border border-purple-500/20 rounded-2xl">
            <div className="text-sm text-white/60 mb-1">Success Rate</div>
            <div className="text-2xl font-bold text-purple-400">
              {stats.total_actions > 0
                ? Math.round((stats.successful_actions / stats.total_actions) * 100)
                : 0}
              %
            </div>
          </div>
        </div>
      )}

      {stats && stats.recent_suspicious.length > 0 && (
        <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-2xl">
          <div className="flex items-center gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-yellow-400" />
            <div className="font-semibold text-yellow-400">Suspicious Activity Detected</div>
          </div>
          <div className="text-sm text-white/80">
            {stats.recent_suspicious.length} suspicious events detected. Review your activity log for details.
          </div>
        </div>
      )}

      <div className="bg-slate-800/50 border border-purple-500/20 rounded-3xl p-6">
        <div className="flex items-center gap-4 mb-6 flex-wrap">
          <div className="flex-1 min-w-[250px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </div>

          <select
            value={actionFilter}
            onChange={(e) => setActionFilter(e.target.value)}
            className="px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
          >
            <option value="all">All Actions</option>
            <option value="connect">Connect</option>
            <option value="disconnect">Disconnect</option>
            <option value="sign">Sign</option>
            <option value="send">Send</option>
            <option value="swap">Swap</option>
            <option value="approve">Approve</option>
            <option value="reject">Reject</option>
          </select>

          <select
            value={resultFilter}
            onChange={(e) => setResultFilter(e.target.value)}
            className="px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
          >
            <option value="all">All Results</option>
            <option value="success">Success</option>
            <option value="failure">Failure</option>
          </select>

          <button
            onClick={handleExport}
            className="px-4 py-3 bg-purple-500/20 border border-purple-500/30 rounded-xl text-purple-400 hover:bg-purple-500/30 transition-colors flex items-center gap-2"
          >
            <Download className="w-5 h-5" />
            Export CSV
          </button>
        </div>

        <div className="flex gap-4 mb-6">
          <div className="flex-1">
            <label className="block text-sm text-white/60 mb-2">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </div>
          <div className="flex-1">
            <label className="block text-sm text-white/60 mb-2">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        {loading ? (
          <div className="py-12 flex flex-col items-center text-white/60">
            <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
            <p className="mt-4">Loading activity logs...</p>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="py-12 text-center text-white/60">No activity logs found</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/60">Timestamp</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/60">Wallet</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/60">Action</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/60">Details</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/60">Result</th>
                </tr>
              </thead>
              <tbody>
                {filteredLogs.map((log) => (
                  <tr key={log.log_id} className="border-b border-purple-500/10 hover:bg-slate-900/40 transition-colors">
                    <td className="px-4 py-3 text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {log.wallet_address.slice(0, 4)}...{log.wallet_address.slice(-4)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 bg-purple-500/20 border border-purple-500/30 rounded text-xs font-semibold">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm max-w-xs truncate" title={JSON.stringify(log.details)}>
                      {JSON.stringify(log.details)}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded text-xs font-semibold ${
                          log.result === 'success'
                            ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                            : 'bg-red-500/20 border border-red-500/30 text-red-400'
                        }`}
                      >
                        {log.result}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <div className="flex items-center justify-between mt-6">
          <div className="text-sm text-white/60">
            Showing {Math.min((page - 1) * pageSize + 1, filteredLogs.length)} to {Math.min(page * pageSize, filteredLogs.length)} of {filteredLogs.length} entries
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(page + 1)}
              disabled={filteredLogs.length < pageSize}
              className="px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white hover:bg-slate-900 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
