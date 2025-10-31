import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api';
import {
  Settings,
  Shield,
  AlertTriangle,
  BarChart,
  Lock,
  Eye,
  EyeOff,
  Save,
  CheckCircle,
} from 'lucide-react';

interface ReputationSettings {
  enabled: boolean;
  autoBlacklistThreshold: number;
  minVouchWeight: number;
  showWarnings: boolean;
  shareData: boolean;
}

interface ReputationStats {
  totalWalletsTracked: number;
  totalTokensTracked: number;
  totalVouches: number;
  totalBlacklisted: number;
  recentReports: number;
  averageTrustScore: number;
}

interface BlacklistEntry {
  id: number;
  address: string;
  entryType: string;
  reason: string;
  reporter?: string;
  source: string;
  timestamp: string;
  isActive: boolean;
}

interface ModerationControlsProps {
  className?: string;
}

export const ModerationControls: React.FC<ModerationControlsProps> = ({ className = '' }) => {
  const [settings, setSettings] = useState<ReputationSettings>({
    enabled: true,
    autoBlacklistThreshold: 10.0,
    minVouchWeight: 50.0,
    showWarnings: true,
    shareData: false,
  });
  const [stats, setStats] = useState<ReputationStats | null>(null);
  const [blacklist, setBlacklist] = useState<BlacklistEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'settings' | 'stats' | 'blacklist'>('settings');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [settingsData, statsData, blacklistData] = await Promise.all([
        invoke<ReputationSettings>('get_reputation_settings'),
        invoke<ReputationStats>('get_reputation_stats'),
        invoke<BlacklistEntry[]>('get_blacklist', { entryType: null }),
      ]);
      setSettings(settingsData);
      setStats(statsData);
      setBlacklist(blacklistData);
    } catch (err) {
      console.error('Failed to load reputation data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      setSaving(true);
      setSuccess(false);
      await invoke('update_reputation_settings', { settings });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save settings:', err);
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromBlacklist = async (address: string, entryType: string) => {
    try {
      await invoke('remove_from_blacklist', { address, entryType });
      await loadData();
    } catch (err) {
      console.error('Failed to remove from blacklist:', err);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  return (
    <div className={`bg-gray-800/50 rounded-lg ${className}`}>
      <div className="p-6 border-b border-gray-700">
        <div className="flex items-center gap-3 mb-2">
          <Shield className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold text-white">Reputation System</h2>
        </div>
        <p className="text-sm text-gray-400">
          Manage reputation settings, view statistics, and moderate blacklisted addresses
        </p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-4 px-6 border-b border-gray-700">
        {[
          { id: 'settings', label: 'Settings', icon: Settings },
          { id: 'stats', label: 'Statistics', icon: BarChart },
          { id: 'blacklist', label: 'Blacklist', icon: AlertTriangle },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`
                flex items-center gap-2 px-4 py-3 font-medium transition-all border-b-2
                ${
                  activeTab === tab.id
                    ? 'text-purple-300 border-purple-500'
                    : 'text-gray-400 border-transparent hover:text-gray-300'
                }
              `}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <div className="p-6 space-y-6">
          {success && (
            <div className="flex items-center gap-2 p-3 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-sm">
              <CheckCircle className="w-4 h-4 flex-shrink-0" />
              <p>Settings saved successfully!</p>
            </div>
          )}

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div>
                <h4 className="font-medium text-white mb-1">Enable Reputation System</h4>
                <p className="text-sm text-gray-400">
                  Track and display reputation scores for wallets and tokens
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, enabled: !settings.enabled })}
                className={`
                  relative w-12 h-6 rounded-full transition-colors
                  ${settings.enabled ? 'bg-green-500' : 'bg-gray-600'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                    ${settings.enabled ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-5 h-5 text-yellow-400" />
                <h4 className="font-medium text-white">Auto-Blacklist Threshold</h4>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Automatically blacklist addresses when trust score falls below this threshold
              </p>
              <input
                type="number"
                min="0"
                max="50"
                step="5"
                value={settings.autoBlacklistThreshold}
                onChange={(e) =>
                  setSettings({ ...settings, autoBlacklistThreshold: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {settings.autoBlacklistThreshold} (Range: 0-50)
              </p>
            </div>

            <div className="p-4 bg-gray-900/50 rounded-lg">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-5 h-5 text-blue-400" />
                <h4 className="font-medium text-white">Minimum Vouch Weight</h4>
              </div>
              <p className="text-sm text-gray-400 mb-3">
                Minimum trust score required to vouch for other addresses
              </p>
              <input
                type="number"
                min="0"
                max="100"
                step="5"
                value={settings.minVouchWeight}
                onChange={(e) =>
                  setSettings({ ...settings, minVouchWeight: parseFloat(e.target.value) })
                }
                className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                Current: {settings.minVouchWeight} (Range: 0-100)
              </p>
            </div>

            <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Eye className="w-5 h-5 text-purple-400" />
                  <h4 className="font-medium text-white">Show Reputation Warnings</h4>
                </div>
                <p className="text-sm text-gray-400">
                  Display warnings for low-reputation addresses throughout the app
                </p>
              </div>
              <button
                onClick={() => setSettings({ ...settings, showWarnings: !settings.showWarnings })}
                className={`
                  relative w-12 h-6 rounded-full transition-colors
                  ${settings.showWarnings ? 'bg-green-500' : 'bg-gray-600'}
                `}
              >
                <div
                  className={`
                    absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                    ${settings.showWarnings ? 'translate-x-7' : 'translate-x-1'}
                  `}
                />
              </button>
            </div>

            <div className="p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
              <div className="flex items-start gap-3">
                <Lock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-white">Share Reputation Data</h4>
                    <button
                      onClick={() => setSettings({ ...settings, shareData: !settings.shareData })}
                      className={`
                        relative w-12 h-6 rounded-full transition-colors
                        ${settings.shareData ? 'bg-green-500' : 'bg-gray-600'}
                      `}
                    >
                      <div
                        className={`
                          absolute top-1 w-4 h-4 bg-white rounded-full transition-transform
                          ${settings.shareData ? 'translate-x-7' : 'translate-x-1'}
                        `}
                      />
                    </button>
                  </div>
                  <p className="text-sm text-yellow-200">
                    Contribute your reputation data to the community network. This helps improve
                    security for everyone but shares anonymized usage data.
                  </p>
                </div>
              </div>
            </div>
          </div>

          <button
            onClick={handleSaveSettings}
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving...' : 'Save Settings'}
          </button>
        </div>
      )}

      {/* Statistics Tab */}
      {activeTab === 'stats' && stats && (
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Wallets Tracked</p>
              <p className="text-2xl font-bold text-white">
                {stats.totalWalletsTracked.toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Tokens Tracked</p>
              <p className="text-2xl font-bold text-white">
                {stats.totalTokensTracked.toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Total Vouches</p>
              <p className="text-2xl font-bold text-white">
                {stats.totalVouches.toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Blacklisted</p>
              <p className="text-2xl font-bold text-red-400">
                {stats.totalBlacklisted.toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Recent Reports</p>
              <p className="text-2xl font-bold text-yellow-400">
                {stats.recentReports.toLocaleString()}
              </p>
            </div>

            <div className="bg-gray-900/50 rounded-lg p-4">
              <p className="text-sm text-gray-400 mb-2">Avg Trust Score</p>
              <p className="text-2xl font-bold text-green-400">
                {stats.averageTrustScore.toFixed(1)}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Blacklist Tab */}
      {activeTab === 'blacklist' && (
        <div className="p-6">
          {blacklist.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              <Shield className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No blacklisted addresses</p>
            </div>
          ) : (
            <div className="space-y-3">
              {blacklist.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-start justify-between p-4 bg-gray-900/50 rounded-lg border border-red-500/20"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`
                          px-2 py-0.5 text-xs rounded font-medium
                          ${entry.entryType === 'wallet' ? 'bg-blue-500/20 text-blue-400' : 'bg-purple-500/20 text-purple-400'}
                        `}
                      >
                        {entry.entryType}
                      </span>
                      <span className="font-mono text-sm text-white">{entry.address}</span>
                    </div>
                    <p className="text-sm text-gray-300 mb-1">{entry.reason}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>Source: {entry.source}</span>
                      <span>{formatDate(entry.timestamp)}</span>
                      {entry.reporter && <span>Reporter: {entry.reporter}</span>}
                    </div>
                  </div>
                  <button
                    onClick={() => handleRemoveFromBlacklist(entry.address, entry.entryType)}
                    className="ml-4 px-3 py-1.5 text-sm bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
