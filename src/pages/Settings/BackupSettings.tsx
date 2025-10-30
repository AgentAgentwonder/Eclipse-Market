import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  CloudIcon,
  Save,
  Upload,
  Download,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  Clock,
  FileJson,
  Shield,
  Calendar,
  Trash2,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface BackupMetadata {
  filename: string;
  sizeBytes: number;
  createdAt: string;
  version: number;
  checksum: string;
}

interface BackupSchedule {
  enabled: boolean;
  frequency: 'manual' | 'daily' | 'weekly' | 'monthly';
  timeOfDay: string;
  dayOfWeek?: number;
  dayOfMonth?: number;
  lastBackup?: string;
  nextBackup?: string;
  autoDeleteOld: boolean;
  keepLastNBackups: number;
}

interface BackupStatus {
  running: boolean;
  lastBackup?: string;
  nextBackup?: string;
  lastBackupSize?: number;
  lastError?: string;
  totalBackups: number;
}

interface CloudProvider {
  type: 's3' | 'google_drive' | 'dropbox';
  region?: string;
  bucket?: string;
  accessKeyId?: string;
  secretAccessKey?: string;
  endpoint?: string;
  accessToken?: string;
  refreshToken?: string;
  clientId?: string;
  clientSecret?: string;
  folderId?: string;
  appKey?: string;
  appSecret?: string;
  folderPath?: string;
}

export function BackupSettings() {
  const [backups, setBackups] = useState<BackupMetadata[]>([]);
  const [status, setStatus] = useState<BackupStatus | null>(null);
  const [schedule, setSchedule] = useState<BackupSchedule>({
    enabled: false,
    frequency: 'daily',
    timeOfDay: '03:00',
    autoDeleteOld: true,
    keepLastNBackups: 10,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(
    null
  );
  const [activeTab, setActiveTab] = useState<'backups' | 'schedule' | 'settings'>('backups');
  const [selectedProvider, setSelectedProvider] = useState<'s3' | 'google_drive' | 'dropbox'>(
    's3'
  );

  useEffect(() => {
    loadBackupStatus();
    loadSchedule();
  }, []);

  const loadBackupStatus = async () => {
    try {
      const statusData = await invoke<BackupStatus>('get_backup_status');
      setStatus(statusData);
    } catch (error) {
      console.error('Failed to load backup status:', error);
    }
  };

  const loadSchedule = async () => {
    try {
      const scheduleData = await invoke<BackupSchedule>('get_backup_schedule');
      setSchedule(scheduleData);
    } catch (error) {
      console.error('Failed to load schedule:', error);
    }
  };

  const loadBackups = async () => {
    setLoading(true);
    try {
      // Create a mock provider - in production, this would be stored/configured
      const mockProvider: CloudProvider = {
        type: 's3',
        region: 'us-east-1',
        bucket: 'my-backup-bucket',
        accessKeyId: 'mock-key',
        secretAccessKey: 'mock-secret',
      };

      const backupList = await invoke<BackupMetadata[]>('list_backups', {
        provider: mockProvider,
      });
      setBackups(backupList);
    } catch (error) {
      showMessage('error', `Failed to load backups: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleManualBackup = async () => {
    setLoading(true);
    showMessage('success', 'Creating backup...');

    try {
      const mockProvider: CloudProvider = {
        type: 's3',
        region: 'us-east-1',
        bucket: 'my-backup-bucket',
        accessKeyId: 'mock-key',
        secretAccessKey: 'mock-secret',
      };

      const metadata = await invoke<BackupMetadata>('trigger_manual_backup', {
        provider: mockProvider,
      });

      showMessage('success', `Backup created successfully: ${metadata.filename}`);
      await loadBackupStatus();
      await loadBackups();
    } catch (error) {
      showMessage('error', `Backup failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRestoreBackup = async (filename: string) => {
    if (!window.confirm(`Restore backup from ${filename}? Current settings will be replaced.`)) {
      return;
    }

    setLoading(true);
    try {
      const mockProvider: CloudProvider = {
        type: 's3',
        region: 'us-east-1',
        bucket: 'my-backup-bucket',
        accessKeyId: 'mock-key',
        secretAccessKey: 'mock-secret',
      };

      await invoke('restore_backup', {
        provider: mockProvider,
        filename,
        merge: false,
      });

      showMessage('success', 'Settings restored successfully!');
    } catch (error) {
      showMessage('error', `Restore failed: ${error}`);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSchedule = async () => {
    try {
      await invoke('update_backup_schedule', { schedule });
      showMessage('success', 'Schedule updated successfully');
      await loadSchedule();
    } catch (error) {
      showMessage('error', `Failed to update schedule: ${error}`);
    }
  };

  const handleExportSettings = async () => {
    try {
      const settings = await invoke('export_settings', { sections: null });
      const blob = new Blob([JSON.stringify(settings, null, 2)], {
        type: 'application/json',
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings_export_${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('success', 'Settings exported successfully');
    } catch (error) {
      showMessage('error', `Export failed: ${error}`);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    return new Date(dateString).toLocaleString();
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
  };

  return (
    <div className="space-y-6">
      {message && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className={`p-4 rounded-lg flex items-center gap-2 ${
            message.type === 'success'
              ? 'bg-green-500/10 border border-green-500/20 text-green-400'
              : 'bg-red-500/10 border border-red-500/20 text-red-400'
          }`}
        >
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertCircle size={20} />}
          <span>{message.text}</span>
        </motion.div>
      )}

      {/* Status Overview */}
      {status && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0a0a0f] rounded-lg border border-purple-500/20 p-6"
        >
          <div className="flex items-center gap-3 mb-4">
            <CloudIcon className="text-purple-400" size={24} />
            <h3 className="text-lg font-semibold text-white">Backup Status</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-[#0f0f1a] rounded-lg p-4 border border-purple-500/10">
              <div className="text-sm text-gray-400 mb-1">Total Backups</div>
              <div className="text-2xl font-bold text-white">{status.totalBackups}</div>
            </div>

            <div className="bg-[#0f0f1a] rounded-lg p-4 border border-purple-500/10">
              <div className="text-sm text-gray-400 mb-1">Last Backup</div>
              <div className="text-sm font-medium text-white">{formatDate(status.lastBackup)}</div>
            </div>

            <div className="bg-[#0f0f1a] rounded-lg p-4 border border-purple-500/10">
              <div className="text-sm text-gray-400 mb-1">Next Backup</div>
              <div className="text-sm font-medium text-white">{formatDate(status.nextBackup)}</div>
            </div>
          </div>

          {status.running && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg flex items-center gap-2 text-blue-400">
              <RefreshCw className="animate-spin" size={16} />
              <span className="text-sm">Backup in progress...</span>
            </div>
          )}

          {status.lastError && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-sm text-red-400">
              Last error: {status.lastError}
            </div>
          )}
        </motion.div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 border-b border-purple-500/20">
        {(['backups', 'schedule', 'settings'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium transition-colors capitalize ${
              activeTab === tab
                ? 'text-purple-400 border-b-2 border-purple-400'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Backups Tab */}
      {activeTab === 'backups' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          <div className="flex gap-3">
            <button
              onClick={handleManualBackup}
              disabled={loading}
              className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <Save size={20} />
              {loading ? 'Creating...' : 'Create Backup Now'}
            </button>

            <button
              onClick={loadBackups}
              disabled={loading}
              className="px-6 py-3 bg-slate-700 hover:bg-slate-600 text-white rounded-lg transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <RefreshCw size={20} />
              Refresh
            </button>
          </div>

          {backups.length === 0 ? (
            <div className="text-center py-12 bg-[#0a0a0f] rounded-lg border border-purple-500/20">
              <CloudIcon size={48} className="mx-auto text-gray-600 mb-4" />
              <p className="text-gray-400">No backups found</p>
              <p className="text-sm text-gray-500 mt-2">Create your first backup to get started</p>
            </div>
          ) : (
            <div className="space-y-2">
              {backups.map((backup, index) => (
                <div
                  key={backup.filename}
                  className="bg-[#0a0a0f] rounded-lg border border-purple-500/20 p-4 flex items-center justify-between hover:border-purple-500/40 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <FileJson size={18} className="text-purple-400" />
                      <span className="font-medium text-white">{backup.filename}</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock size={14} />
                        {formatDate(backup.createdAt)}
                      </span>
                      <span>{formatBytes(backup.sizeBytes)}</span>
                      <span className="flex items-center gap-1">
                        <Shield size={14} />
                        v{backup.version}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleRestoreBackup(backup.filename)}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
                    >
                      <Download size={16} />
                      Restore
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#0a0a0f] rounded-lg border border-purple-500/20 p-6 space-y-4"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="text-sm font-medium text-white">Enable Automatic Backups</div>
              <div className="text-xs text-gray-400">Schedule regular automated backups</div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={schedule.enabled}
                onChange={e => setSchedule({ ...schedule, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">Frequency</label>
            <select
              value={schedule.frequency}
              onChange={e =>
                setSchedule({
                  ...schedule,
                  frequency: e.target.value as 'manual' | 'daily' | 'weekly' | 'monthly',
                })
              }
              disabled={!schedule.enabled}
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-white mb-2">
              Keep Last N Backups
            </label>
            <input
              type="number"
              value={schedule.keepLastNBackups}
              onChange={e =>
                setSchedule({ ...schedule, keepLastNBackups: parseInt(e.target.value) })
              }
              disabled={!schedule.enabled}
              min="1"
              max="100"
              className="w-full px-4 py-2 bg-slate-900/50 border border-purple-500/20 rounded-lg text-white focus:outline-none focus:border-purple-500/50 disabled:opacity-50"
            />
          </div>

          <button
            onClick={handleUpdateSchedule}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            <Calendar size={20} />
            Update Schedule
          </button>
        </motion.div>
      )}

      {/* Settings Tab */}
      {activeTab === 'settings' && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-[#0a0a0f] rounded-lg border border-purple-500/20 p-6 space-y-4"
        >
          <h3 className="text-lg font-semibold text-white mb-4">Import/Export Settings</h3>

          <div className="space-y-3">
            <button
              onClick={handleExportSettings}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              <Upload size={20} />
              Export Settings to JSON
            </button>

            <p className="text-sm text-gray-400 text-center">
              Export your settings to a JSON file for manual backup or migration
            </p>
          </div>

          <div className="border-t border-purple-500/20 my-6"></div>

          <div>
            <h4 className="text-md font-semibold text-white mb-3">Cloud Providers</h4>
            <div className="grid grid-cols-3 gap-2 mb-4">
              {(['s3', 'google_drive', 'dropbox'] as const).map(provider => (
                <button
                  key={provider}
                  onClick={() => setSelectedProvider(provider)}
                  className={`p-3 rounded-lg border transition-all ${
                    selectedProvider === provider
                      ? 'bg-purple-500/20 border-purple-500/50 text-white'
                      : 'bg-slate-800/50 border-purple-500/10 text-white/70 hover:border-purple-500/30'
                  }`}
                >
                  <div className="text-sm font-medium capitalize">
                    {provider.replace('_', ' ')}
                  </div>
                </button>
              ))}
            </div>
            <p className="text-xs text-gray-500">
              Cloud backup is stored locally in this demo. Configure your cloud provider credentials for real cloud backups.
            </p>
          </div>
        </motion.div>
      )}
    </div>
  );
}
