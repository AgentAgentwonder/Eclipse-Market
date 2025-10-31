import React, { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api';
import { motion } from 'framer-motion';
import { Settings, Terminal, Bug, Activity, Save } from 'lucide-react';

interface DevSettings {
  autoCompilationEnabled: boolean;
  autoFixEnabled: boolean;
  logLevel: string;
  logRetentionDays: number;
  crashReportingEnabled: boolean;
  performanceMonitoringEnabled: boolean;
  autoFixConfidenceThreshold: number;
  maxCompilationRetries: number;
  developerConsoleHotkey: string;
}

const LOG_LEVELS = ['TRACE', 'DEBUG', 'INFO', 'WARN', 'ERROR', 'FATAL'];

const DeveloperSettings: React.FC = () => {
  const [settings, setSettings] = useState<DevSettings>({
    autoCompilationEnabled: true,
    autoFixEnabled: true,
    logLevel: 'INFO',
    logRetentionDays: 30,
    crashReportingEnabled: true,
    performanceMonitoringEnabled: true,
    autoFixConfidenceThreshold: 0.7,
    maxCompilationRetries: 3,
    developerConsoleHotkey: 'Ctrl+Shift+D',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const loadedSettings = await invoke<DevSettings>('get_dev_settings');
      setSettings(loadedSettings);
    } catch (error) {
      console.error('Failed to load developer settings:', error);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveSuccess(false);

    try {
      await invoke('update_dev_settings', { settings });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (error) {
      console.error('Failed to save developer settings:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleChange = (key: keyof DevSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <div className="glass-panel p-6 rounded-xl">
        <div className="flex items-center gap-3 mb-6">
          <Settings className="w-6 h-6 text-purple-400" />
          <h2 className="text-2xl font-bold">Developer Tools Settings</h2>
        </div>

        <div className="space-y-6">
          {/* Auto-Compilation */}
          <section className="space-y-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-blue-400" />
              <h3 className="text-lg font-semibold">Auto-Compilation</h3>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoCompilationEnabled}
                onChange={e => handleChange('autoCompilationEnabled', e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-gray-300">Enable auto-compilation on file save</span>
            </label>

            <div className="ml-8 space-y-3">
              <label className="block">
                <span className="text-sm text-gray-400 mb-1 block">Max Compilation Retries</span>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={settings.maxCompilationRetries}
                  onChange={e => handleChange('maxCompilationRetries', parseInt(e.target.value))}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
                />
              </label>
            </div>
          </section>

          {/* Auto-Fixer */}
          <section className="space-y-4 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Bug className="w-5 h-5 text-green-400" />
              <h3 className="text-lg font-semibold">Auto-Fixer</h3>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoFixEnabled}
                onChange={e => handleChange('autoFixEnabled', e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-gray-300">Enable automatic error fixing</span>
            </label>

            <div className="ml-8 space-y-3">
              <label className="block">
                <span className="text-sm text-gray-400 mb-1 block">
                  Auto-Fix Confidence Threshold
                </span>
                <div className="flex items-center gap-4">
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    value={settings.autoFixConfidenceThreshold}
                    onChange={e => handleChange('autoFixConfidenceThreshold', parseFloat(e.target.value))}
                    className="flex-1"
                  />
                  <span className="text-sm font-mono text-gray-400 w-12">
                    {(settings.autoFixConfidenceThreshold * 100).toFixed(0)}%
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Only apply fixes with confidence above this threshold
                </p>
              </label>
            </div>
          </section>

          {/* Logging */}
          <section className="space-y-4 pt-6 border-t border-gray-700">
            <div className="flex items-center gap-2">
              <Activity className="w-5 h-5 text-yellow-400" />
              <h3 className="text-lg font-semibold">Logging</h3>
            </div>

            <label className="block">
              <span className="text-sm text-gray-400 mb-1 block">Log Level</span>
              <select
                value={settings.logLevel}
                onChange={e => handleChange('logLevel', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
              >
                {LOG_LEVELS.map(level => (
                  <option key={level} value={level}>
                    {level}
                  </option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Minimum log level to capture (lower levels = more verbose)
              </p>
            </label>

            <label className="block">
              <span className="text-sm text-gray-400 mb-1 block">Log Retention (Days)</span>
              <input
                type="number"
                min="1"
                max="365"
                value={settings.logRetentionDays}
                onChange={e => handleChange('logRetentionDays', parseInt(e.target.value))}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500"
              />
              <p className="text-xs text-gray-500 mt-1">
                How long to keep log files before automatic deletion
              </p>
            </label>
          </section>

          {/* Monitoring */}
          <section className="space-y-4 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold">Monitoring & Reporting</h3>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.crashReportingEnabled}
                onChange={e => handleChange('crashReportingEnabled', e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-gray-300">Enable crash reporting</span>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.performanceMonitoringEnabled}
                onChange={e => handleChange('performanceMonitoringEnabled', e.target.checked)}
                className="w-5 h-5 rounded border-gray-600 bg-gray-700 text-purple-500 focus:ring-purple-500"
              />
              <span className="text-gray-300">Enable performance monitoring</span>
            </label>
          </section>

          {/* Keyboard Shortcuts */}
          <section className="space-y-4 pt-6 border-t border-gray-700">
            <h3 className="text-lg font-semibold">Keyboard Shortcuts</h3>

            <label className="block">
              <span className="text-sm text-gray-400 mb-1 block">Developer Console Hotkey</span>
              <input
                type="text"
                value={settings.developerConsoleHotkey}
                onChange={e => handleChange('developerConsoleHotkey', e.target.value)}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg focus:outline-none focus:border-purple-500 font-mono"
                placeholder="Ctrl+Shift+D"
              />
              <p className="text-xs text-gray-500 mt-1">
                Keyboard shortcut to open the developer console
              </p>
            </label>
          </section>

          {/* Save Button */}
          <div className="pt-6 border-t border-gray-700 flex items-center gap-4">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg font-medium transition-colors"
            >
              <Save className="w-5 h-5" />
              {isSaving ? 'Saving...' : 'Save Settings'}
            </button>

            {saveSuccess && (
              <motion.span
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="text-green-400 text-sm"
              >
                ✓ Settings saved successfully
              </motion.span>
            )}
          </div>
        </div>
      </div>

      <div className="glass-panel p-6 rounded-xl bg-blue-900/20 border-l-4 border-blue-500">
        <h3 className="font-semibold mb-2 text-blue-300">Developer Tools Information</h3>
        <p className="text-sm text-gray-300 mb-2">
          These settings control the behavior of the integrated developer tools including
          auto-compilation, automatic error fixing, comprehensive logging, and performance monitoring.
        </p>
        <p className="text-sm text-gray-300">
          For more information, see the Developer Tools Guide in the documentation.
        </p>
      </div>
    </motion.div>
  );
};

export default DeveloperSettings;
