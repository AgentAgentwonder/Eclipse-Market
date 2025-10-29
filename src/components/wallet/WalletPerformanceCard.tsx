import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { PerformanceScore } from '../../types/performance';
import { PerformanceScoreBadge } from './PerformanceScoreBadge';
import { TrendingUp, TrendingDown, Activity, ChevronRight } from 'lucide-react';

interface WalletPerformanceCardProps {
  walletAddress: string;
  onViewDetails?: () => void;
}

export const WalletPerformanceCard: React.FC<WalletPerformanceCardProps> = ({
  walletAddress,
  onViewDetails,
}) => {
  const [score, setScore] = useState<PerformanceScore | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadPerformanceScore();
  }, [walletAddress]);

  const loadPerformanceScore = async () => {
    try {
      setLoading(true);
      const data = await invoke<PerformanceScore>('calculate_wallet_performance', {
        walletAddress,
      });
      setScore(data);
    } catch (err) {
      console.error('Error loading performance score:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4 animate-pulse">
        <div className="h-6 bg-gray-700 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-700 rounded w-2/3"></div>
      </div>
    );
  }

  if (!score || score.totalTrades === 0) {
    return (
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Activity size={16} />
          <span className="text-sm">No trading activity yet</span>
        </div>
      </div>
    );
  }

  const formatCurrency = (value: number): string => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  return (
    <div
      className="bg-gradient-to-br from-gray-800/80 to-gray-900/80 rounded-lg p-4 border border-gray-700/50 hover:border-purple-500/30 transition-all cursor-pointer"
      onClick={onViewDetails}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-gray-400">Performance</h3>
        <PerformanceScoreBadge score={score.score} size="sm" showLabel={false} />
      </div>

      <div className="grid grid-cols-3 gap-3 mb-3">
        <div>
          <p className="text-xs text-gray-500 mb-1">Win Rate</p>
          <p className="text-sm font-bold text-white">{score.winRate.toFixed(1)}%</p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Net P&L</p>
          <p
            className={`text-sm font-bold ${
              score.netPnl >= 0 ? 'text-green-500' : 'text-red-500'
            }`}
          >
            {formatCurrency(score.netPnl)}
          </p>
        </div>
        <div>
          <p className="text-xs text-gray-500 mb-1">Trades</p>
          <p className="text-sm font-bold text-white">{score.totalTrades}</p>
        </div>
      </div>

      <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
        <div className="flex gap-4 text-xs">
          <div className="flex items-center gap-1 text-green-500">
            <TrendingUp size={12} />
            <span>{score.winningTrades}W</span>
          </div>
          <div className="flex items-center gap-1 text-red-500">
            <TrendingDown size={12} />
            <span>{score.losingTrades}L</span>
          </div>
        </div>
        {onViewDetails && (
          <button className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300 transition-colors">
            <span>View Details</span>
            <ChevronRight size={12} />
          </button>
        )}
      </div>
    </div>
  );
};
