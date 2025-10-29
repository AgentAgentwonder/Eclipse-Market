import { EnhancedTradeMetrics, TradeFilters } from '../types/tradeReporting';

export function filterTrades(
  trades: EnhancedTradeMetrics[],
  filters: TradeFilters
): EnhancedTradeMetrics[] {
  return trades.filter(trade => {
    if (filters.dateRange?.start && new Date(trade.timestamp) < filters.dateRange.start) {
      return false;
    }

    if (filters.dateRange?.end && new Date(trade.timestamp) > filters.dateRange.end) {
      return false;
    }

    if (filters.tokens && filters.tokens.length > 0) {
      const hasToken =
        filters.tokens.includes(trade.fromToken) || filters.tokens.includes(trade.toToken);
      if (!hasToken) return false;
    }

    if (filters.side && filters.side !== 'all' && trade.side !== filters.side) {
      return false;
    }

    if (filters.status && filters.status !== 'all' && trade.status !== filters.status) {
      return false;
    }

    if (filters.pnlRange?.min !== null && filters.pnlRange?.min !== undefined) {
      if (!trade.pnl || trade.pnl < filters.pnlRange.min) {
        return false;
      }
    }

    if (filters.pnlRange?.max !== null && filters.pnlRange?.max !== undefined) {
      if (!trade.pnl || trade.pnl > filters.pnlRange.max) {
        return false;
      }
    }

    if (filters.searchQuery && filters.searchQuery.trim() !== '') {
      const query = filters.searchQuery.toLowerCase();
      const searchableText = [trade.txSignature, trade.fromToken, trade.toToken, trade.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();

      if (!searchableText.includes(query)) {
        return false;
      }
    }

    if (filters.walletAddress && trade.walletAddress !== filters.walletAddress) {
      return false;
    }

    if (
      filters.isPaperTrade !== undefined &&
      filters.isPaperTrade !== 'all' &&
      trade.isPaperTrade !== filters.isPaperTrade
    ) {
      return false;
    }

    return true;
  });
}

export function sortTrades(
  trades: EnhancedTradeMetrics[],
  sortBy: keyof EnhancedTradeMetrics,
  sortOrder: 'asc' | 'desc'
): EnhancedTradeMetrics[] {
  return [...trades].sort((a, b) => {
    const aVal = a[sortBy];
    const bVal = b[sortBy];

    if (aVal === undefined || aVal === null) return 1;
    if (bVal === undefined || bVal === null) return -1;

    let comparison = 0;
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      comparison = aVal - bVal;
    } else {
      comparison = String(aVal).localeCompare(String(bVal));
    }

    return sortOrder === 'asc' ? comparison : -comparison;
  });
}

export function paginateTrades(
  trades: EnhancedTradeMetrics[],
  page: number,
  pageSize: number
): { trades: EnhancedTradeMetrics[]; totalPages: number; totalCount: number } {
  const totalCount = trades.length;
  const totalPages = Math.ceil(totalCount / pageSize);
  const start = (page - 1) * pageSize;
  const end = start + pageSize;
  const paginatedTrades = trades.slice(start, end);

  return {
    trades: paginatedTrades,
    totalPages,
    totalCount,
  };
}

export function calculateExecutionQuality(trade: EnhancedTradeMetrics): string {
  const slippageScore =
    trade.slippage < 0.5 ? 100 : trade.slippage < 1 ? 85 : trade.slippage < 2 ? 65 : 45;
  const priceImpactScore =
    trade.priceImpact < 1 ? 100 : trade.priceImpact < 3 ? 80 : trade.priceImpact < 5 ? 65 : 45;
  const mevScore = trade.mevProtected ? 90 : 60;

  const averageScore = (slippageScore + priceImpactScore + mevScore) / 3;

  if (averageScore >= 90) return 'Excellent';
  if (averageScore >= 75) return 'Good';
  if (averageScore >= 55) return 'Fair';
  return 'Poor';
}
