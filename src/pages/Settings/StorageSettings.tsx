import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  HardDrive,
  Zap,
  Clock,
  Settings as SettingsIcon,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface CompressionStats {
  total_uncompressed_bytes: number;
  total_compressed_bytes: number;
  compression_ratio: number;
  num_compressed_records: number;
  space_saved_mb: number;
  last_compression_run: string | null;
}

interface CompressionConfig {
  enabled: boolean;
  age_threshold_days: number;
  compression_level: number;
  auto_compress: boolean;
}

interface DatabaseSize {
  total_bytes: number;
  total_mb: number;
  compressed_data_bytes: number;
  uncompressed_data_bytes: number;
}

export function StorageSettings() {
  const [stats, setStats] = useState<CompressionStats | null>(null);
  const [config, setConfig] = useState<CompressionConfig>({
    enabled: true,
    age_threshold_days: 7,
    compression_level: 3,
    auto_compress: true,
  });
  const [dbSize, setDbSize] = useState<DatabaseSize | null>(null);
  const [loading, setLoading] = useState(true);
  const [compressing, setCompressing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [statsData, configData, dbSizeData] = await Promise.all([
        invoke<CompressionStats>('get_compression_stats'),
        invoke<CompressionConfig>('get_compression_config'),
        invoke<DatabaseSize>('get_database_size'),
      ]);
      setStats(statsData);
      setConfig(configData);
      setDbSize(dbSizeData);
    } catch (error) {
      console.error('Failed to load storage data:', error);
      showMessage('error', 'Failed to load storage data');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const handleCompressNow = async () => {
    setCompressing(true);
    try {
      const recordsCompressed = await invoke<number>('compress_old_data');
      await loadData();
      showMessage('success', `Successfully compressed ${recordsCompressed} records`);
    } catch (error) {
      console.error('Failed to compress data:', error);
      showMessage('error', `Failed to compress data: ${error}`);
    } finally {
      setCompressing(false);
    }
  };

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      await invoke('update_compression_config', { config });
      await loadData();
      showMessage('success', 'Configuration saved successfully');
    } catch (error) {
      console.error('Failed to save config:', error);
      showMessage('error', `Failed to save configuration: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(2)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(2)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  };

  const formatDate = (dateString: string | null): string => {
    if (!dateString) return 'Never';
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return 'Unknown';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-400">Loading storage settings...</div>
      </div>
    );
  }

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

      {/* Storage Statistics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#0a0a0f] rounded-lg border border-purple-500/20 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <HardDrive className="text-purple-400" size={24} />
          <h3 className="text-lg font-semibold text-white">Storage Statistics</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-[#0f0f1a] rounded-lg p-4 border border-purple-500/10">
            <div className="text-sm text-gray-400 mb-1">Total Database Size</div>
            <div className="text-2xl font-bold text-white">
              {dbSize ? formatBytes(dbSize.total_bytes) : '---'}
            </div>
          </div>

          <div className="bg-[#0f0f1a] rounded-lg p-4 border border-purple-500/10">
            <div className="text-sm text-gray-400 mb-1">Compressed Data</div>
            <div className="text-2xl font-bold text-purple-400">
              {stats ? formatBytes(stats.total_compressed_bytes) : '---'}
            </div>
          </div>

          <div className="bg-[#0f0f1a] rounded-lg p-4 border border-purple-500/10">
            <div className="text-sm text-gray-400 mb-1">Space Saved</div>
            <div className="text-2xl font-bold text-green-400">
              {stats ? `${stats.space_saved_mb.toFixed(2)} MB` : '---'}
            </div>
          </div>

          <div className="bg-[#0f0f1a] rounded-lg p-4 border border-purple-500/10">
            <div className="text-sm text-gray-400 mb-1">Compression Ratio</div>
            <div className="text-2xl font-bold text-blue-400">
              {stats ? `${stats.compression_ratio.toFixed(1)}%` : '---'}
            </div>
          </div>

          <div className="bg-[#0f0f1a] rounded-lg p-4 border border-purple-500/10">
            <div className="text-sm text-gray-400 mb-1">Compressed Records</div>
            <div className="text-2xl font-bold text-white">
              {stats ? stats.num_compressed_records.toLocaleString() : '---'}
            </div>
          </div>

          <div className="bg-[#0f0f1a] rounded-lg p-4 border border-purple-500/10">
            <div className="text-sm text-gray-400 mb-1">Last Compression</div>
            <div className="text-sm font-medium text-white">
              {stats ? formatDate(stats.last_compression_run) : '---'}
            </div>
          </div>
        </div>
      </motion.div>

      {/* Compression Configuration */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#0a0a0f] rounded-lg border border-purple-500/20 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <SettingsIcon className="text-purple-400" size={24} />
          <h3 className="text-lg font-semibold text-white">Compression Configuration</h3>
        </div>

        <div className="space-y-4">
          {/* Enable Compression */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Enable Compression</div>
              <div className="text-xs text-gray-400">
                Automatically compress old data to save space
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.enabled}
                onChange={e => setConfig({ ...config, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
            </label>
          </div>

          {/* Auto Compress */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Auto Compress</div>
              <div className="text-xs text-gray-400">
                Run compression automatically at 3 AM daily
              </div>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={config.auto_compress}
                onChange={e => setConfig({ ...config, auto_compress: e.target.checked })}
                disabled={!config.enabled}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-purple-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600 peer-disabled:opacity-50"></div>
            </label>
          </div>

          {/* Age Threshold */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium text-white">Age Threshold</div>
                <div className="text-xs text-gray-400">Compress data older than this many days</div>
              </div>
              <div className="text-sm font-bold text-purple-400">
                {config.age_threshold_days} days
              </div>
            </div>
            <input
              type="range"
              min="7"
              max="90"
              step="1"
              value={config.age_threshold_days}
              onChange={e => setConfig({ ...config, age_threshold_days: parseInt(e.target.value) })}
              disabled={!config.enabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>7 days</span>
              <span>90 days</span>
            </div>
          </div>

          {/* Compression Level */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <div>
                <div className="text-sm font-medium text-white">Compression Level</div>
                <div className="text-xs text-gray-400">
                  Higher levels = better compression but slower
                </div>
              </div>
              <div className="text-sm font-bold text-purple-400">
                Level {config.compression_level}
              </div>
            </div>
            <input
              type="range"
              min="1"
              max="9"
              step="1"
              value={config.compression_level}
              onChange={e => setConfig({ ...config, compression_level: parseInt(e.target.value) })}
              disabled={!config.enabled}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-600 disabled:opacity-50"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>Fast (1)</span>
              <span>Balanced (5)</span>
              <span>Max (9)</span>
            </div>
          </div>

          {/* Save Configuration */}
          <div className="flex gap-3 pt-4">
            <button
              onClick={handleSaveConfig}
              disabled={saving}
              className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              <SettingsIcon size={16} />
              {saving ? 'Saving...' : 'Save Configuration'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Manual Compression */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#0a0a0f] rounded-lg border border-purple-500/20 p-6"
      >
        <div className="flex items-center gap-3 mb-4">
          <Zap className="text-purple-400" size={24} />
          <h3 className="text-lg font-semibold text-white">Manual Compression</h3>
        </div>

        <p className="text-sm text-gray-400 mb-4">
          Manually trigger compression of old data. This will compress historical events and closed
          trades that are older than the configured age threshold.
        </p>

        <button
          onClick={handleCompressNow}
          disabled={compressing || !config.enabled}
          className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {compressing ? (
            <>
              <Clock className="animate-spin" size={20} />
              Compressing...
            </>
          ) : (
            <>
              <Zap size={20} />
              Compress Now
            </>
          )}
        </button>

        {stats && stats.last_compression_run && (
          <div className="mt-4 text-xs text-gray-400 text-center flex items-center justify-center gap-2">
            <Clock size={14} />
            Last run: {formatDate(stats.last_compression_run)}
          </div>
        )}
      </motion.div>
    </div>
  );
}
