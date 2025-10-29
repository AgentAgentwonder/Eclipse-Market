import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import { Download, Filter, Search, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';

interface ActivityLog {
  id: number;
  walletAddress: string;
  action: string;
  detailsJson: string;
  ipAddress: string | null;
  timestamp: string;
  result: string;
}

interface ActivityFilter {
  walletAddress?: string;
  action?: string;
  result?: string;
  startDate?: string;
  endDate?: string;
  limit?: number;
  offset?: number;
}

interface ActivityStats {
  totalActions: number;
  actionsToday: number;
  actionsThisWeek: number;
  actionsThisMonth: number;
  successRate: number;
  actionTypeCounts: Record<string, number>;
  suspiciousActivities: SuspiciousActivity[];
}

interface SuspiciousActivity {
  activityType: string;
  description: string;
  timestamp: string;
  walletAddress: string;
  severity: string;
}

const PAGE_SIZES = [50, 100, 500];

export function ActivityLog() {
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [stats, setStats] = useState<ActivityStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resultFilter, setResultFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);

  const actionTypes = ['connect', 'disconnect', 'sign', 'send', 'swap', 'approve', 'reject'];

  useEffect(() => {
    loadData();
  }, [searchTerm, actionFilter, resultFilter, startDate, endDate, currentPage, pageSize]);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const filter: ActivityFilter = {
        limit: pageSize,
        offset: (currentPage - 1) * pageSize,
      };

      if (searchTerm) filter.walletAddress = searchTerm;
      if (actionFilter) filter.action = actionFilter;
      if (resultFilter) filter.result = resultFilter;
      if (startDate) filter.startDate = new Date(startDate).toISOString();
      if (endDate) filter.endDate = new Date(endDate).toISOString();

      const [logsData, statsData] = await Promise.all([
        invoke<ActivityLog[]>('get_activity_logs', { filter }),
        invoke<ActivityStats>('get_activity_stats', { walletAddress: searchTerm || null }),
      ]);

      setLogs(logsData);
      setStats(statsData);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const filter: ActivityFilter = {};
      if (searchTerm) filter.walletAddress = searchTerm;
      if (actionFilter) filter.action = actionFilter;
      if (resultFilter) filter.result = resultFilter;
      if (startDate) filter.startDate = new Date(startDate).toISOString();
      if (endDate) filter.endDate = new Date(endDate).toISOString();

      const csv = await invoke<string>('export_activity_logs', { filter });

      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-log-${new Date().toISOString()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to export activity logs:', err);
      setError(String(err));
    }
  };

  const resetFilters = () => {
    setSearchTerm('');
    setActionFilter('');
    setResultFilter('');
    setStartDate('');
    setEndDate('');
    setCurrentPage(1);
  };

  const totalPages = stats ? Math.ceil(stats.totalActions / pageSize) : 1;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Activity Log</h2>
        <button
          onClick={handleExport}
          className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl font-medium transition-colors"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10">
            <p className="text-white/60 text-sm mb-1">Today</p>
            <p className="text-2xl font-bold">{stats.actionsToday}</p>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10">
            <p className="text-white/60 text-sm mb-1">This Week</p>
            <p className="text-2xl font-bold">{stats.actionsThisWeek}</p>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10">
            <p className="text-white/60 text-sm mb-1">This Month</p>
            <p className="text-2xl font-bold">{stats.actionsThisMonth}</p>
          </div>
          <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10">
            <p className="text-white/60 text-sm mb-1">Success Rate</p>
            <p className="text-2xl font-bold">{stats.successRate.toFixed(1)}%</p>
          </div>
        </div>
      )}

      {stats && stats.suspiciousActivities.length > 0 && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
          <div className="flex items-start gap-3 mb-3">
            <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-400 mb-2">Suspicious Activity Detected</h3>
              <div className="space-y-2">
                {stats.suspiciousActivities.map((activity, idx) => (
                  <div key={idx} className="text-sm text-red-300/90">
                    <span className="font-medium">{activity.walletAddress}</span>:{' '}
                    {activity.description}
                    <span
                      className={`ml-2 px-2 py-0.5 rounded text-xs ${
                        activity.severity === 'high'
                          ? 'bg-red-500/20 text-red-300'
                          : 'bg-yellow-500/20 text-yellow-300'
                      }`}
                    >
                      {activity.severity}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-purple-400" />
          <span className="font-semibold">Filters</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Wallet Address</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Search address..."
                className="w-full pl-10 pr-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Action Type</label>
            <select
              value={actionFilter}
              onChange={e => setActionFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            >
              <option value="">All Actions</option>
              {actionTypes.map(action => (
                <option key={action} value={action}>
                  {action}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Result</label>
            <select
              value={resultFilter}
              onChange={e => setResultFilter(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            >
              <option value="">All Results</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Page Size</label>
            <select
              value={pageSize}
              onChange={e => {
                setPageSize(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            >
              {PAGE_SIZES.map(size => (
                <option key={size} value={size}>
                  {size} per page
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2">Start Date</label>
            <input
              type="datetime-local"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">End Date</label>
            <input
              type="datetime-local"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
            />
          </div>
        </div>

        <button
          onClick={resetFilters}
          className="px-4 py-2 bg-slate-700/50 hover:bg-slate-700/70 border border-slate-600/50 rounded-xl font-medium transition-colors"
        >
          Reset Filters
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
          {error}
        </div>
      )}

      {loading ? (
        <div className="text-center py-8">
          <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-white/60 mt-4">Loading activity logs...</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-purple-500/20">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">
                    Timestamp
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">
                    Wallet
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">
                    Action
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">
                    Details
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-white/80">
                    Result
                  </th>
                </tr>
              </thead>
              <tbody>
                {logs.map(log => (
                  <tr
                    key={log.id}
                    className="border-b border-purple-500/10 hover:bg-purple-500/5 transition-colors"
                  >
                    <td className="px-4 py-3 text-sm">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-sm font-mono">
                      {log.walletAddress.slice(0, 8)}...{log.walletAddress.slice(-8)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-1 rounded-lg text-xs font-medium bg-purple-500/20 text-purple-300">
                        {log.action}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60 max-w-xs truncate">
                      {log.detailsJson}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-lg text-xs font-medium ${
                          log.result === 'success'
                            ? 'bg-green-500/20 text-green-300'
                            : 'bg-red-500/20 text-red-300'
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

          <div className="flex items-center justify-between">
            <p className="text-sm text-white/60">
              Showing {Math.min((currentPage - 1) * pageSize + 1, stats?.totalActions || 0)} to{' '}
              {Math.min(currentPage * pageSize, stats?.totalActions || 0)} of{' '}
              {stats?.totalActions || 0} entries
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="p-2 bg-slate-900/50 border border-purple-500/20 rounded-xl hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-xl">
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage >= totalPages}
                className="p-2 bg-slate-900/50 border border-purple-500/20 rounded-xl hover:bg-purple-500/10 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
