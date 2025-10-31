import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { PortfolioSummary } from './PortfolioSummary';
import { QuickActions } from './QuickActions';
import { AlertsList } from './AlertsList';
import { PriceWatch } from './PriceWatch';

interface MobileSyncData {
  markets: Array<{
    symbol: string;
    price: number;
    change_24h: number;
    volume_24h: number;
    timestamp: number;
  }>;
  portfolio: {
    total_value: number;
    total_change_24h: number;
    total_change_pct: number;
    top_holdings: Array<{
      symbol: string;
      amount: number;
      value: number;
      change_pct: number;
    }>;
  } | null;
  alerts: Array<{
    alert_id: string;
    symbol: string;
    condition: string;
    value: number;
    triggered: boolean;
    timestamp: number;
  }>;
  last_sync: number;
}

interface MobileDashboardProps {
  deviceId: string;
  sessionToken: string;
}

export const MobileDashboard: React.FC<MobileDashboardProps> = ({
  deviceId,
  sessionToken,
}) => {
  const [syncData, setSyncData] = useState<MobileSyncData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);

  const performSync = async () => {
    try {
      setLoading(true);
      const data = await invoke<MobileSyncData>('mobile_sync_data', {
        device_id: deviceId,
      });
      setSyncData(data);
      setLastSyncTime(new Date());
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to sync data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    performSync();
    const interval = setInterval(performSync, 30000); // Sync every 30 seconds
    return () => clearInterval(interval);
  }, [deviceId]);

  const handleRefresh = () => {
    performSync();
  };

  if (loading && !syncData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 px-4">
        <div className="text-red-500 mb-4">{error}</div>
        <button
          onClick={handleRefresh}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg"
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-gray-800 border-b border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Eclipse Market Pro</h1>
          <button
            onClick={handleRefresh}
            className="p-2 hover:bg-gray-700 rounded-full transition-colors"
            disabled={loading}
          >
            <svg
              className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
        {lastSyncTime && (
          <div className="text-xs text-gray-400 mt-1">
            Last synced: {lastSyncTime.toLocaleTimeString()}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {syncData?.portfolio && (
          <PortfolioSummary portfolio={syncData.portfolio} />
        )}

        <QuickActions deviceId={deviceId} sessionToken={sessionToken} />

        {syncData?.markets && syncData.markets.length > 0 && (
          <PriceWatch markets={syncData.markets} />
        )}

        {syncData?.alerts && syncData.alerts.length > 0 && (
          <AlertsList alerts={syncData.alerts} />
        )}
      </div>
    </div>
  );
};
