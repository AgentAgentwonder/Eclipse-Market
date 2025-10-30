import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import {
  Shield,
  TrendingUp,
  TrendingDown,
  Users,
  Clock,
  AlertCircle,
  CheckCircle,
  XCircle,
  Activity,
} from 'lucide-react';
import { ReputationBadge, ReputationWarning } from './ReputationBadge';

interface WalletReputation {
  address: string;
  trustScore: number;
  reputationLevel: string;
  vouchesReceived: number;
  vouchesGiven: number;
  isBlacklisted: boolean;
  blacklistReason?: string;
  firstSeen: string;
  lastUpdated: string;
  transactionCount: number;
  totalVolume: number;
  ageDays: number;
  riskFlags: string[];
}

interface WalletReputationViewProps {
  address: string;
  className?: string;
}

export const WalletReputationView: React.FC<WalletReputationViewProps> = ({
  address,
  className = '',
}) => {
  const [reputation, setReputation] = useState<WalletReputation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadReputation();
  }, [address]);

  const loadReputation = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await invoke<WalletReputation>('get_wallet_reputation', { address });
      setReputation(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load reputation');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center justify-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  if (error || !reputation) {
    return (
      <div className={`bg-gray-800/50 rounded-lg p-6 ${className}`}>
        <div className="flex items-center gap-2 text-red-400">
          <AlertCircle className="w-5 h-5" />
          <p>{error || 'Failed to load reputation'}</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatVolume = (volume: number) => {
    if (volume >= 1_000_000) {
      return `$${(volume / 1_000_000).toFixed(2)}M`;
    }
    if (volume >= 1_000) {
      return `$${(volume / 1_000).toFixed(2)}K`;
    }
    return `$${volume.toFixed(2)}`;
  };

  return (
    <div className={`bg-gray-800/50 rounded-lg ${className}`}>
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-2">Wallet Reputation</h3>
            <p className="text-sm text-gray-400 font-mono">{address}</p>
          </div>
          <ReputationBadge
            level={reputation.reputationLevel.toLowerCase() as any}
            score={reputation.trustScore}
            size="lg"
          />
        </div>

        <ReputationWarning
          level={reputation.reputationLevel.toLowerCase() as any}
          isBlacklisted={reputation.isBlacklisted}
          blacklistReason={reputation.blacklistReason}
        />
      </div>

      <div className="p-6 grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Activity className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Transactions</span>
          </div>
          <p className="text-xl font-semibold text-white">
            {reputation.transactionCount.toLocaleString()}
          </p>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Total Volume</span>
          </div>
          <p className="text-xl font-semibold text-white">
            {formatVolume(reputation.totalVolume)}
          </p>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <span className="text-xs text-gray-400">Age</span>
          </div>
          <p className="text-xl font-semibold text-white">
            {reputation.ageDays} days
          </p>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="text-xs text-gray-400">Vouches Received</span>
          </div>
          <p className="text-xl font-semibold text-white">
            {reputation.vouchesReceived}
          </p>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Users className="w-4 h-4 text-blue-400" />
            <span className="text-xs text-gray-400">Vouches Given</span>
          </div>
          <p className="text-xl font-semibold text-white">
            {reputation.vouchesGiven}
          </p>
        </div>

        <div className="bg-gray-900/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Shield className="w-4 h-4 text-yellow-400" />
            <span className="text-xs text-gray-400">First Seen</span>
          </div>
          <p className="text-sm font-medium text-white">
            {formatDate(reputation.firstSeen)}
          </p>
        </div>
      </div>

      {reputation.riskFlags.length > 0 && (
        <div className="p-6 border-t border-gray-700">
          <div className="flex items-center gap-2 mb-3">
            <AlertCircle className="w-5 h-5 text-yellow-400" />
            <h4 className="text-sm font-semibold text-white">Risk Flags</h4>
          </div>
          <div className="flex flex-wrap gap-2">
            {reputation.riskFlags.map((flag, idx) => (
              <span
                key={idx}
                className="px-2 py-1 text-xs rounded bg-yellow-500/10 text-yellow-400 border border-yellow-500/30"
              >
                {flag}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="p-6 border-t border-gray-700">
        <p className="text-xs text-gray-500">
          Last updated: {formatDate(reputation.lastUpdated)}
        </p>
      </div>
    </div>
  );
};
