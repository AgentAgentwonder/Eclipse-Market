import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Download, RefreshCw, AlertCircle, CheckCircle, Clock, History } from 'lucide-react';
import { useUpdateStore } from '../../store/updateStore';

export function UpdateSettings() {
  const {
    settings,
    rollbackInfo,
    isCheckingForUpdates,
    error,
    loadSettings,
    saveSettings,
    checkForUpdates,
    loadRollbackInfo,
    rollbackUpdate,
  } = useUpdateStore();

  const [localSettings, setLocalSettings] = useState(settings);

  useEffect(() => {
    loadSettings();
    loadRollbackInfo();
  }, [loadSettings, loadRollbackInfo]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  const handleSave = async () => {
    if (localSettings) {
      await saveSettings(localSettings);
    }
  };

  const handleCheckNow = async () => {
    await checkForUpdates();
  };

  const handleRollback = async () => {
    if (window.confirm('Are you sure you want to rollback to the previous version? The application will restart.')) {
      await rollbackUpdate();
    }
  };

  if (!localSettings) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-white/60 mt-4">Loading update settings...</p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
          <Download className="w-6 h-6" />
        </div>
        <div>
          <h2 className="text-2xl font-bold">Auto Update</h2>
          <p className="text-white/60 text-sm">Manage application update settings</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-red-400 text-sm font-medium">Error</p>
            <p className="text-red-400/80 text-sm mt-1">{error}</p>
          </div>
        </motion.div>
      )}

      {/* Update Schedule */}
      <div className="p-6 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-4">
        <div className="flex items-center gap-3 mb-4">
          <Clock className="w-5 h-5 text-purple-400" />
          <h3 className="font-semibold">Update Schedule</h3>
        </div>

        <div className="space-y-3">
          {(['daily', 'weekly', 'never'] as const).map((schedule) => (
            <label
              key={schedule}
              className="flex items-center gap-3 p-3 rounded-xl bg-slate-800/50 border border-purple-500/10 hover:border-purple-500/30 cursor-pointer transition-colors"
            >
              <input
                type="radio"
                name="schedule"
                value={schedule}
                checked={localSettings.schedule === schedule}
                onChange={(e) => setLocalSettings({ ...localSettings, schedule: e.target.value as any })}
                className="w-4 h-4 text-purple-500 bg-slate-900 border-purple-500/30 focus:ring-purple-500/50"
              />
              <div>
                <div className="font-medium capitalize">{schedule}</div>
                <div className="text-sm text-white/60">
                  {schedule === 'daily' && 'Check for updates every day'}
                  {schedule === 'weekly' && 'Check for updates once a week'}
                  {schedule === 'never' && 'Never check for updates automatically'}
                </div>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Update Options */}
      <div className="p-6 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-4">
        <h3 className="font-semibold mb-4">Update Options</h3>

        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-purple-500/10 hover:border-purple-500/30 cursor-pointer transition-colors">
          <div>
            <div className="font-medium">Auto Download</div>
            <div className="text-sm text-white/60">Automatically download updates in the background</div>
          </div>
          <input
            type="checkbox"
            checked={localSettings.autoDownload}
            onChange={(e) => setLocalSettings({ ...localSettings, autoDownload: e.target.checked })}
            className="w-5 h-5 text-purple-500 bg-slate-900 border-purple-500/30 rounded focus:ring-purple-500/50"
          />
        </label>

        <label className="flex items-center justify-between p-3 rounded-xl bg-slate-800/50 border border-purple-500/10 hover:border-purple-500/30 cursor-pointer transition-colors">
          <div>
            <div className="font-medium">Auto Install</div>
            <div className="text-sm text-white/60">
              Automatically install updates after downloading (app will restart)
            </div>
          </div>
          <input
            type="checkbox"
            checked={localSettings.autoInstall}
            onChange={(e) => setLocalSettings({ ...localSettings, autoInstall: e.target.checked })}
            className="w-5 h-5 text-purple-500 bg-slate-900 border-purple-500/30 rounded focus:ring-purple-500/50"
            disabled={!localSettings.autoDownload}
          />
        </label>
      </div>

      {/* Last Check Info */}
      {localSettings.lastCheck && (
        <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/10 flex items-center gap-3">
          <CheckCircle className="w-5 h-5 text-green-400" />
          <div className="text-sm">
            <span className="text-white/60">Last checked: </span>
            <span className="text-white">
              {new Date(localSettings.lastCheck).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Rollback Section */}
      {rollbackInfo?.available && (
        <div className="p-6 bg-slate-900/50 rounded-2xl border border-yellow-500/20 space-y-4">
          <div className="flex items-center gap-3 mb-4">
            <History className="w-5 h-5 text-yellow-400" />
            <h3 className="font-semibold">Rollback Available</h3>
          </div>

          <div className="p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
            <p className="text-sm text-yellow-400/80 mb-3">
              A backup of the previous version ({rollbackInfo.previousVersion}) is available. 
              You can rollback if you experience issues with the current version.
            </p>
            <button
              onClick={handleRollback}
              className="px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 border border-yellow-500/30 rounded-xl transition-colors text-sm font-medium"
            >
              Rollback to Previous Version
            </button>
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-medium hover:shadow-lg hover:shadow-purple-500/30 transition-all"
        >
          Save Settings
        </button>

        <button
          onClick={handleCheckNow}
          disabled={isCheckingForUpdates}
          className="px-6 py-3 bg-slate-800/50 border border-purple-500/20 rounded-xl font-medium hover:border-purple-500/40 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <RefreshCw className={`w-5 h-5 ${isCheckingForUpdates ? 'animate-spin' : ''}`} />
          {isCheckingForUpdates ? 'Checking...' : 'Check Now'}
        </button>
      </div>
    </motion.div>
  );
}
