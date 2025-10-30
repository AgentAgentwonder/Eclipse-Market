import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { MinusSquare, AlertCircle, CheckCircle, Bell, Eye, Minimize2 } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface TraySettings {
  enabled: boolean;
  minimize_to_tray: boolean;
  close_to_tray: boolean;
  show_badge: boolean;
  show_stats: boolean;
  show_alerts: boolean;
  show_notifications: boolean;
  icon_style: 'default' | 'bullish' | 'bearish' | 'minimal';
  restore_shortcut: string | null;
}

export const TraySettings: React.FC = () => {
  const [settings, setSettings] = useState<TraySettings>({
    enabled: true,
    minimize_to_tray: true,
    close_to_tray: true,
    show_badge: true,
    show_stats: true,
    show_alerts: true,
    show_notifications: true,
    icon_style: 'default',
    restore_shortcut: 'CmdOrControl+Shift+M',
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
      const loadedSettings = await invoke<TraySettings>('get_tray_settings');
      setSettings(loadedSettings);
    } catch (err) {
      console.error('Failed to load tray settings:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const saveSettings = async (newSettings: TraySettings) => {
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      await invoke('update_tray_settings', { settings: newSettings });
      setSettings(newSettings);
      setSuccess('Tray settings saved successfully!');
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save tray settings:', err);
      setError(String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleToggle = (key: keyof TraySettings, value: boolean | string | null) => {
    const newSettings = { ...settings, [key]: value } as TraySettings;
    saveSettings(newSettings);
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
        <p className="text-white/60 mt-4">Loading tray settings...</p>
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

      {/* Master Toggle */}
      <div className="p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <MinusSquare className="w-5 h-5 text-purple-400" />
              Enable System Tray
            </h3>
            <p className="text-sm text-white/60 mt-1">Show icon in system tray</p>
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
      </div>

      {settings.enabled && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="space-y-6"
        >
          {/* Minimize/Close Behavior */}
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-4">
            <h3 className="font-semibold text-lg">Window Behavior</h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.minimize_to_tray}
                onChange={e => handleToggle('minimize_to_tray', e.target.checked)}
                disabled={saving}
                className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
              />
              <div>
                <div className="font-medium">Minimize to tray</div>
                <div className="text-xs text-white/60">
                  Hide window in tray when minimized instead of taskbar
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.close_to_tray}
                onChange={e => handleToggle('close_to_tray', e.target.checked)}
                disabled={saving}
                className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
              />
              <div>
                <div className="font-medium">Close to tray</div>
                <div className="text-xs text-white/60">
                  Minimize to tray when closing window instead of exiting
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.show_notifications}
                onChange={e => handleToggle('show_notifications', e.target.checked)}
                disabled={saving}
                className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
              />
              <div>
                <div className="font-medium">Show notifications</div>
                <div className="text-xs text-white/60">
                  Display notification when minimizing to tray
                </div>
              </div>
            </label>
          </div>

          {/* Tray Menu Customization */}
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-4">
            <h3 className="font-semibold text-lg">Tray Menu</h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.show_stats}
                onChange={e => handleToggle('show_stats', e.target.checked)}
                disabled={saving}
                className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
              />
              <div>
                <div className="font-medium">Show portfolio stats</div>
                <div className="text-xs text-white/60">Display portfolio value and P&L in menu</div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.show_alerts}
                onChange={e => handleToggle('show_alerts', e.target.checked)}
                disabled={saving}
                className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
              />
              <div>
                <div className="font-medium">Show alert previews</div>
                <div className="text-xs text-white/60">
                  Display recent alerts and count in tray menu
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.show_badge}
                onChange={e => handleToggle('show_badge', e.target.checked)}
                disabled={saving}
                className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
              />
              <div>
                <div className="font-medium">Show badge count</div>
                <div className="text-xs text-white/60">Show alert count in tray icon</div>
              </div>
            </label>
          </div>

          {/* Icon Style */}
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-4">
            <h3 className="font-semibold text-lg">Icon Style</h3>
            <div className="grid grid-cols-2 gap-3">
              {(['default', 'bullish', 'bearish', 'minimal'] as const).map(style => (
                <button
                  key={style}
                  onClick={() => handleToggle('icon_style', style)}
                  disabled={saving}
                  className={`p-3 rounded-xl border-2 transition-colors ${
                    settings.icon_style === style
                      ? 'border-purple-500 bg-purple-500/20'
                      : 'border-purple-500/20 hover:border-purple-500/50'
                  }`}
                >
                  <div className="font-medium capitalize">{style}</div>
                  <div className="text-xs text-white/60 mt-1">
                    {style === 'default' && 'Eclipse'}
                    {style === 'bullish' && '🐂 Eclipse'}
                    {style === 'bearish' && '🐻 Eclipse'}
                    {style === 'minimal' && 'EMP'}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Restore Shortcut */}
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-4">
            <h3 className="font-semibold text-lg">Restore Shortcut</h3>
            <div>
              <label className="block text-sm font-medium mb-2">Global keyboard shortcut</label>
              <input
                type="text"
                value={settings.restore_shortcut || ''}
                onChange={e => handleToggle('restore_shortcut', e.target.value || null)}
                placeholder="e.g., CmdOrControl+Shift+M"
                disabled={saving}
                className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <div className="text-xs text-white/60 mt-2">
                Use <span className="font-mono">CmdOrControl</span> for Cmd (Mac) or Ctrl
                (Windows/Linux)
              </div>
            </div>
          </div>

          {/* Test Actions */}
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-4">
            <h3 className="font-semibold text-lg">Test Actions</h3>
            <div className="flex gap-3">
              <motion.button
                onClick={() => invoke('minimize_to_tray')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl font-semibold text-purple-400 transition-all"
              >
                <Minimize2 className="w-4 h-4 inline-block mr-2" />
                Minimize to Tray
              </motion.button>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
};
