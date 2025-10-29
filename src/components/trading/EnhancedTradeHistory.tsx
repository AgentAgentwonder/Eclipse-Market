import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  ExternalLink,
  Clock,
  Download,
  Filter,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Calendar,
  AlertTriangle,
  CheckCircle2,
} from 'lucide-react';
import { useTradingSettingsStore } from '../../store/tradingSettingsStore';
import { EnhancedTradeMetrics } from '../../types/tradeReporting';
import {
  filterTrades,
  sortTrades,
  paginateTrades,
  calculateExecutionQuality,
} from '../../utils/tradeFilters';
import { TradeDetailModal } from './TradeDetailModal';
import { ExportConfigModal } from './ExportConfigModal';
import { ExportScheduleModal } from './ExportScheduleModal';
import { format } from 'date-fns';

export function EnhancedTradeHistory() {
  const {
    tradeHistory,
    tradeFilters,
    tradePagination,
    mevProtection,
    setTradeFilters,
    setTradePagination,
    resetTradeFilters,
  } = useTradingSettingsStore();

  const [showFilters, setShowFilters] = useState(false);
  const [selectedTrade, setSelectedTrade] = useState<EnhancedTradeMetrics | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showExportModal, setShowExportModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);

  const tokenOptions = useMemo(() => {
    const tokens = new Set<string>();
    tradeHistory.forEach(trade => {
      if (trade.fromToken) tokens.add(trade.fromToken);
      if (trade.toToken) tokens.add(trade.toToken);
    });
    return Array.from(tokens).sort((a, b) => a.localeCompare(b));
  }, [tradeHistory]);

  const filteredAndSortedTrades = useMemo(() => {
    const filtered = filterTrades(tradeHistory as EnhancedTradeMetrics[], tradeFilters);
    return sortTrades(filtered, tradePagination.sortBy, tradePagination.sortOrder);
  }, [tradeHistory, tradeFilters, tradePagination.sortBy, tradePagination.sortOrder]);

  const {
    trades: paginatedTrades,
    totalPages,
    totalCount,
  } = useMemo(() => {
    return paginateTrades(filteredAndSortedTrades, tradePagination.page, tradePagination.pageSize);
  }, [filteredAndSortedTrades, tradePagination.page, tradePagination.pageSize]);

  const formatDate = (timestamp: number) => {
    return format(new Date(timestamp), 'MMM dd, HH:mm:ss');
  };

  const getSlippageColor = (slippage: number) => {
    if (slippage < 0.5) return 'text-green-400';
    if (slippage < 1) return 'text-yellow-400';
    return 'text-red-400';
  };

  const getPriceImpactColor = (impact: number) => {
    if (impact < 1) return 'text-green-400';
    if (impact < 5) return 'text-yellow-400';
    return 'text-red-400';
  };

  const handleTradeClick = (trade: EnhancedTradeMetrics) => {
    setSelectedTrade(trade);
    setShowDetailModal(true);
  };

  const handlePageChange = (newPage: number) => {
    setTradePagination({ page: newPage });
  };

  const toggleTokenFilter = (token: string) => {
    const current = tradeFilters.tokens || [];
    const exists = current.includes(token);
    const updated = exists ? current.filter(t => t !== token) : [...current, token];
    setTradeFilters({ tokens: updated });
  };

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (tradeFilters.side && tradeFilters.side !== 'all') count++;
    if (tradeFilters.status && tradeFilters.status !== 'all') count++;
    if (tradeFilters.isPaperTrade !== 'all') count++;
    if (tradeFilters.tokens && tradeFilters.tokens.length > 0) count++;
    if (tradeFilters.searchQuery && tradeFilters.searchQuery.trim() !== '') count++;
    if (tradeFilters.dateRange?.start || tradeFilters.dateRange?.end) count++;
    if (tradeFilters.pnlRange?.min !== null || tradeFilters.pnlRange?.max !== null) count++;
    return count;
  }, [tradeFilters]);

  return (
    <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Trade History</h2>
          <p className="text-white/60 text-sm">
            {totalCount} {totalCount === 1 ? 'trade' : 'trades'} found
            {activeFiltersCount > 0 && (
              <span className="ml-2 text-purple-400">
                ({activeFiltersCount} {activeFiltersCount === 1 ? 'filter' : 'filters'} active)
              </span>
            )}
          </p>
        </div>

        <div className="flex items-center gap-3">
          {mevProtection.enabled && (
            <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl">
              <div className="flex items-center gap-2 mb-1">
                <Shield className="w-4 h-4 text-green-400" />
                <span className="text-green-400 font-semibold text-sm">MEV Protected</span>
              </div>
              <div className="text-xl font-bold text-green-400">
                {mevProtection.protectedTrades}
              </div>
            </div>
          )}

          <button
            onClick={() => setShowExportModal(true)}
            disabled={filteredAndSortedTrades.length === 0}
            className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Download className="w-4 h-4" />
            <span className="font-semibold">Export</span>
          </button>

          <button
            onClick={() => setShowScheduleModal(true)}
            className="px-4 py-2 bg-slate-700/40 hover:bg-slate-700/60 border border-purple-500/20 rounded-xl transition-colors flex items-center gap-2"
          >
            <Calendar className="w-4 h-4" />
            <span className="font-semibold">Schedule</span>
          </button>

          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`px-4 py-2 border rounded-xl transition-colors flex items-center gap-2 ${
              showFilters || activeFiltersCount > 0
                ? 'bg-purple-500/20 border-purple-500/30'
                : 'bg-slate-700/50 border-purple-500/10 hover:border-purple-500/30'
            }`}
          >
            <Filter className="w-4 h-4" />
            <span className="font-semibold">Filters</span>
            {activeFiltersCount > 0 && (
              <span className="px-2 py-0.5 bg-purple-500 rounded-full text-xs">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>
      </div>

      {showFilters && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="mb-6 p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10"
        >
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-xs text-white/60 mb-2 block flex items-center gap-2">
                <Search className="w-3 h-3" />
                Search
              </label>
              <input
                type="text"
                placeholder="Signature or token..."
                value={tradeFilters.searchQuery || ''}
                onChange={e => setTradeFilters({ searchQuery: e.target.value })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 mb-2 block">Side</label>
              <select
                value={tradeFilters.side || 'all'}
                onChange={e => setTradeFilters({ side: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none text-sm"
              >
                <option value="all">All</option>
                <option value="buy">Buy</option>
                <option value="sell">Sell</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-white/60 mb-2 block">Status</label>
              <select
                value={tradeFilters.status || 'all'}
                onChange={e => setTradeFilters({ status: e.target.value as any })}
                className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none text-sm"
              >
                <option value="all">All</option>
                <option value="filled">Filled</option>
                <option value="pending">Pending</option>
                <option value="failed">Failed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <div>
              <label className="text-xs text-white/60 mb-2 block flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                Start Date
              </label>
              <input
                type="date"
                value={
                  tradeFilters.dateRange?.start
                    ? format(tradeFilters.dateRange.start, 'yyyy-MM-dd')
                    : ''
                }
                onChange={e =>
                  setTradeFilters({
                    dateRange: {
                      ...tradeFilters.dateRange,
                      start: e.target.value ? new Date(e.target.value) : null,
                      end: tradeFilters.dateRange?.end || null,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 mb-2 block flex items-center gap-2">
                <Calendar className="w-3 h-3" />
                End Date
              </label>
              <input
                type="date"
                value={
                  tradeFilters.dateRange?.end
                    ? format(tradeFilters.dateRange.end, 'yyyy-MM-dd')
                    : ''
                }
                onChange={e =>
                  setTradeFilters({
                    dateRange: {
                      ...tradeFilters.dateRange,
                      start: tradeFilters.dateRange?.start || null,
                      end: e.target.value ? new Date(e.target.value) : null,
                    },
                  })
                }
                className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none text-sm"
              />
            </div>

            <div>
              <label className="text-xs text-white/60 mb-2 block">Trade Type</label>
              <select
                value={tradeFilters.isPaperTrade?.toString() || 'all'}
                onChange={e =>
                  setTradeFilters({
                    isPaperTrade: e.target.value === 'all' ? 'all' : e.target.value === 'true',
                  })
                }
                className="w-full px-3 py-2 bg-slate-800/50 border border-purple-500/20 rounded-lg focus:border-purple-500/50 focus:outline-none text-sm"
              >
                <option value="all">All</option>
                <option value="false">Real Trades</option>
                <option value="true">Paper Trades</option>
              </select>
            </div>

            {tokenOptions.length > 0 && (
              <div className="md:col-span-2 lg:col-span-3">
                <label className="text-xs text-white/60 mb-2 block">Tokens</label>
                <div className="flex flex-wrap gap-2">
                  {tokenOptions.map(token => {
                    const selected = (tradeFilters.tokens || []).includes(token);
                    return (
                      <button
                        key={token}
                        onClick={() => toggleTokenFilter(token)}
                        className={`px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          selected
                            ? 'bg-purple-500/30 border-purple-500/60 text-white'
                            : 'bg-slate-800/50 border-purple-500/20 text-white/70 hover:border-purple-500/40'
                        }`}
                      >
                        {token}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 mt-4 pt-4 border-t border-purple-500/10">
            <button
              onClick={resetTradeFilters}
              className="px-3 py-1.5 text-sm bg-slate-700/50 hover:bg-slate-700/70 rounded-lg transition-colors"
            >
              Reset Filters
            </button>
          </div>
        </motion.div>
      )}

      {tradeHistory.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-purple-500/10 flex items-center justify-center">
            <Clock className="w-8 h-8 text-purple-400" />
          </div>
          <p className="text-white/60 text-lg">No trades yet</p>
          <p className="text-white/40 text-sm mt-2">Your trade history will appear here</p>
        </div>
      ) : filteredAndSortedTrades.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-yellow-500/10 flex items-center justify-center">
            <Search className="w-8 h-8 text-yellow-400" />
          </div>
          <p className="text-white/60 text-lg">No trades match your filters</p>
          <button
            onClick={resetTradeFilters}
            className="mt-4 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl transition-colors"
          >
            Clear Filters
          </button>
        </div>
      ) : (
        <>
          <div className="space-y-3 mb-6">
            {paginatedTrades.map((trade, index) => (
              <motion.div
                key={trade.id || trade.timestamp + index}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10 hover:border-purple-500/30 transition-colors cursor-pointer"
                onClick={() => handleTradeClick(trade)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                        trade.side === 'buy'
                          ? 'bg-gradient-to-br from-green-500 to-emerald-500'
                          : 'bg-gradient-to-br from-red-500 to-pink-500'
                      }`}
                    >
                      {trade.side === 'buy' ? (
                        <TrendingUp className="w-5 h-5" />
                      ) : (
                        <TrendingDown className="w-5 h-5" />
                      )}
                    </div>
                    <div>
                      <div className="font-semibold">
                        {trade.fromToken} → {trade.toToken}
                      </div>
                      <div className="text-sm text-white/60">{formatDate(trade.timestamp)}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {trade.status === 'filled' && (
                      <CheckCircle2 className="w-4 h-4 text-green-400" />
                    )}
                    {trade.status === 'pending' && <Clock className="w-4 h-4 text-yellow-400" />}
                    {trade.status === 'failed' && (
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    )}
                    {trade.status === 'cancelled' && <X className="w-4 h-4 text-gray-400" />}

                    {trade.mevProtected && (
                      <div className="px-2 py-1 bg-green-500/20 border border-green-500/30 rounded-lg flex items-center gap-1">
                        <Shield className="w-3 h-3 text-green-400" />
                        <span className="text-xs text-green-400 font-medium">Protected</span>
                      </div>
                    )}

                    {trade.isPaperTrade && (
                      <div className="px-2 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-lg">
                        <span className="text-xs text-yellow-400 font-medium">Paper</span>
                      </div>
                    )}

                    {trade.txSignature && (
                      <a
                        href={`https://solscan.io/tx/${trade.txSignature}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-2 hover:bg-white/5 rounded-lg transition-colors"
                        title="View on Solscan"
                        onClick={e => e.stopPropagation()}
                      >
                        <ExternalLink className="w-4 h-4 text-purple-400" />
                      </a>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-xs text-white/60 mb-1">Amount</div>
                    <div className="font-semibold text-sm">{trade.amount}</div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-xs text-white/60 mb-1">Slippage</div>
                    <div className={`font-semibold text-sm ${getSlippageColor(trade.slippage)}`}>
                      {trade.slippage.toFixed(2)}%
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-xs text-white/60 mb-1">Price Impact</div>
                    <div
                      className={`font-semibold text-sm ${getPriceImpactColor(trade.priceImpact)}`}
                    >
                      {trade.priceImpact.toFixed(2)}%
                    </div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-xs text-white/60 mb-1">Gas Cost</div>
                    <div className="font-semibold text-sm">{trade.gasCost.toFixed(6)} SOL</div>
                  </div>

                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-xs text-white/60 mb-1">Quality</div>
                    <div className="font-semibold text-sm">{calculateExecutionQuality(trade)}</div>
                  </div>
                </div>

                {trade.pnl !== undefined && (
                  <div className="mt-3 p-3 bg-slate-800/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-white/60">P&L</span>
                      <div className="text-right">
                        <div
                          className={`font-bold ${trade.pnl >= 0 ? 'text-green-400' : 'text-red-400'}`}
                        >
                          {trade.pnl >= 0 ? '+' : ''}
                          {trade.pnl.toFixed(6)} SOL
                        </div>
                        {trade.pnlPercent !== undefined && (
                          <div
                            className={`text-xs ${trade.pnlPercent >= 0 ? 'text-green-400/80' : 'text-red-400/80'}`}
                          >
                            {trade.pnlPercent >= 0 ? '+' : ''}
                            {trade.pnlPercent.toFixed(2)}%
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-4 border-t border-purple-500/20">
              <div className="text-sm text-white/60">
                Page {tradePagination.page} of {totalPages} • {totalCount} total
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => handlePageChange(tradePagination.page - 1)}
                  disabled={tradePagination.page === 1}
                  className="p-2 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>

                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (tradePagination.page <= 3) {
                      pageNum = i + 1;
                    } else if (tradePagination.page >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = tradePagination.page - 2 + i;
                    }

                    return (
                      <button
                        key={pageNum}
                        onClick={() => handlePageChange(pageNum)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                          tradePagination.page === pageNum
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-700/50 hover:bg-slate-700/70'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={() => handlePageChange(tradePagination.page + 1)}
                  disabled={tradePagination.page === totalPages}
                  className="p-2 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>

              <div>
                <select
                  value={tradePagination.pageSize}
                  onChange={e =>
                    setTradePagination({ pageSize: parseInt(e.target.value), page: 1 })
                  }
                  className="px-3 py-1.5 bg-slate-700/50 border border-purple-500/20 rounded-lg text-sm focus:border-purple-500/50 focus:outline-none"
                >
                  <option value="5">5 per page</option>
                  <option value="10">10 per page</option>
                  <option value="25">25 per page</option>
                  <option value="50">50 per page</option>
                </select>
              </div>
            </div>
          )}
        </>
      )}

      <TradeDetailModal
        trade={selectedTrade}
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
      />

      <ExportConfigModal
        isOpen={showExportModal}
        onClose={() => setShowExportModal(false)}
        trades={filteredAndSortedTrades}
      />

      <ExportScheduleModal isOpen={showScheduleModal} onClose={() => setShowScheduleModal(false)} />
    </div>
  );
}
