import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Power, Clock, Rocket, AlertCircle, CheckCircle } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface AutoStartSettings {
  enabled: boolean;
  start_minimized: boolean;
  delay_seconds: number;
}

export const StartupSettings: React.FC = () => {
  const [settings, setSettings] = useState<AutoStartSettings>({
    enabled: false,
    start_minimized: false,
    delay_seconds: 0,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const loadedSettings = await invoke<AutoStartSettings>('get_auto_start_settings');
      setSettings(loadedSettings);
    } catch (err) {
      console.error('Failed to load auto-start settings:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: AutoStartSettings) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await invoke('update_auto_start_settings', { settings: newSettings });
      setSettings(newSettings);
      setSuccess('Startup settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save auto-start settings:', err);
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof AutoStartSettings, value: boolean | number) => {
    const newSettings = { ...settings, [key]: value };
    saveSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-white/60 mt-4">Loading startup settings...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
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

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3"
        >
          <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-green-400 text-sm font-medium">Success</p>
            <p className="text-green-400/80 text-sm mt-1">{success}</p>
          </div>
        </motion.div>
      )}

      <div className="p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Power className="w-5 h-5 text-purple-400" />
              Launch on Startup
            </h3>
            <p className="text-sm text-white/60 mt-1">Run Eclipse Market Pro when your system boots</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={e => handleToggle('enabled', e.target.checked)}
              disabled={saving}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
          </label>
        </div>

        <div className="mt-4 text-xs text-white/60">
          <p>Windows: Task Scheduler entry • macOS: LaunchAgent • Linux: systemd/autostart entry</p>
        </div>
      </div>

      {settings.enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-6"
        >
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-4">
            <h3 className="font-semibold text-lg">Startup Options</h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.start_minimized}
                onChange={e => handleToggle('start_minimized', e.target.checked)}
                disabled={saving}
                className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
              />
              <div>
                <div className="font-medium">Start minimized</div>
                <div className="text-xs text-white/60">
                  Launch to system tray when auto-started (restorable from tray or shortcut)
                </div>
              </div>
            </label>

            <div>
              <label className="block text-sm font-medium mb-2">Startup delay (seconds)</label>
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  min={0}
                  max={300}
                  value={settings.delay_seconds}
                  onChange={e => handleToggle('delay_seconds', Number(e.target.value))}
                  disabled={saving}
                  className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                />
                <motion.button
                  onClick={() => handleToggle('delay_seconds', 0)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={saving}
                  className="px-3 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-sm text-purple-300"
                >
                  Reset
                </motion.button>
              </div>
              <div className="text-xs text-white/60 mt-2">
                Delay app startup to avoid boot storms and heavy resource usage (Windows Task Scheduler, macOS LaunchAgents, systemd timers)
              </div>
            </div>
          </div>

          <div className="p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10">
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Rocket className="w-5 h-5 text-green-400" />
              Quick Actions
            </h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <motion.button
                onClick={() => invoke('enable_auto_start')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={saving}
                className="py-3 bg-green-500/10 hover:bg-green-500/20 border border-green-500/30 rounded-xl text-green-300 font-semibold"
              >
                Enable Auto-start
              </motion.button>
              <motion.button
                onClick={() => invoke('disable_auto_start')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={saving}
                className="py-3 bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 rounded-xl text-red-300 font-semibold"
              >
                Disable Auto-start
              </motion.button>
            </div>
            <div className="mt-3 text-xs text-white/60 flex items-center gap-2">
              <Clock className="w-4 h-4 text-white/40" />
              <span>Use global shortcut (default Cmd/Ctrl + Shift + M) to restore when minimized.</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
