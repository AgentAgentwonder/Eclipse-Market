import React, { useState, useEffect, useMemo } from 'react';
import { invoke } from '@tauri-apps/api';
import {
  Settings,
  Search,
  Download,
  Upload,
  RotateCcw,
  Save,
  AlertCircle,
  Check,
  ChevronDown,
  ChevronRight,
  Info,
  Sparkles,
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface UniversalSettings {
  version: number;
  trading: TradingSettings;
  aiAssistant: AIAssistantSettings;
  voice: VoiceSettings;
  uiTheme: UIThemeSettings;
  alerts: AlertSettings;
  performance: PerformanceSettings;
  security: SecuritySettings;
  dataPrivacy: DataPrivacySettings;
  network: NetworkSettings;
  automation: AutomationSettings;
  developer: DeveloperSettings;
}

interface TradingSettings {
  defaultSlippage: number;
  gasPriority: string;
  defaultOrderType: string;
  autoConfirmBelow: number | null;
  tradeConfirmationTimeout: number;
  maxPositionSizePercent: number;
  paperTradingMode: boolean;
  multiWalletBehavior: string;
  mevProtection: boolean;
  jitoEnabled: boolean;
  privateRpcEnabled: boolean;
}

interface AIAssistantSettings {
  provider: string;
  apiKey: string | null;
  model: string;
  temperature: number;
  maxTokens: number;
  contextWindowSize: number;
  autoSuggestions: boolean;
  patternLearning: boolean;
  voicePersonality: string;
}

interface VoiceSettings {
  wakeWord: string;
  language: string;
  speechRate: number;
  voicePreference: string;
  confirmationRequirements: string;
  audioAlertsVolume: number;
  ttsProvider: string;
  microphoneSensitivity: number;
}

interface UIThemeSettings {
  lunarThemeIntensity: string;
  gradientStrength: number;
  animationSpeed: string;
  glassEffectOpacity: number;
  coronaGlowIntensity: number;
  fontSizeMultiplier: number;
  colorBlindnessMode: string | null;
  reduceMotion: boolean;
  customColors: Record<string, string> | null;
}

interface AlertSettings {
  defaultChannels: string[];
  cooldownSeconds: number;
  smartFilterThreshold: number;
  notificationSound: string;
  doNotDisturbSchedule: any;
  priorityLevels: boolean;
  batchAlerts: boolean;
  desktopNotificationStyle: string;
}

interface PerformanceSettings {
  chartUpdateFrequencyMs: number;
  dataCacheTtlSeconds: number;
  maxConcurrentRequests: number;
  websocketReconnectStrategy: string;
  prefetchAggressiveness: string;
  memoryLimitMb: number;
  gpuAcceleration: boolean;
  virtualScrollingThreshold: number;
}

interface SecuritySettings {
  sessionTimeoutMinutes: number;
  twoFaRequirements: string;
  biometricEnabled: boolean;
  keystoreBackupFrequencyDays: number;
  autoLockOnIdle: boolean;
  autoLockMinutes: number;
  transactionConfirmationRequirements: string;
  hardwareWalletPreferred: boolean;
  apiKeyRotationDays: number;
}

interface DataPrivacySettings {
  dataRetentionDays: number;
  analyticsOptIn: boolean;
  shareAnonymousUsage: boolean;
  activityLogRetentionDays: number;
  exportFormat: string;
  telemetryEnabled: boolean;
  crashReporting: boolean;
}

interface NetworkSettings {
  solanaRpcEndpoint: string;
  rpcFallbackEndpoints: string[];
  websocketEndpoint: string;
  apiRateLimitStrategy: string;
  retryAttempts: number;
  timeoutSeconds: number;
  offlineMode: boolean;
}

interface AutomationSettings {
  dcaDefaultFrequencyHours: number;
  copyTradeDelaySeconds: number;
  autoRebalanceThresholdPercent: number;
  botExecutionLimits: boolean;
  safetyOverrideControls: boolean;
}

interface DeveloperSettings {
  debugMode: boolean;
  consoleLogLevel: string;
  experimentalFeatures: boolean;
  apiMockMode: boolean;
  customApiEndpoints: Record<string, string>;
  webhookUrls: string[];
  customIndicatorsPath: string | null;
}

interface SettingMetadata {
  key: string;
  category: string;
  label: string;
  description: string;
  settingType: SettingType;
  defaultValue: any;
  constraints: any;
}

interface SettingType {
  type: string;
  min?: number;
  max?: number;
  step?: number;
  options?: string[];
  multiline?: boolean;
  itemType?: any;
}

interface SettingsProfile {
  name: string;
  description: string | null;
  settings: UniversalSettings;
  createdAt: string;
  updatedAt: string;
}

const categoryLabels: Record<string, string> = {
  trading: '💱 Trading',
  aiAssistant: '🤖 AI Assistant',
  voice: '🎤 Voice',
  uiTheme: '🎨 UI & Theme',
  alerts: '🔔 Alerts',
  performance: '⚡ Performance',
  security: '🔒 Security',
  dataPrivacy: '🔐 Data & Privacy',
  network: '🌐 Network',
  automation: '🤹 Automation',
  developer: '⚙️ Developer',
};

const templates = [
  { id: 'day_trader', label: '📈 Day Trader', description: 'Fast execution, high performance' },
  { id: 'whale_watcher', label: '🐋 Whale Watcher', description: 'Maximum security, hardware wallet' },
  { id: 'defi_farmer', label: '🌾 DeFi Farmer', description: 'Automated DCA and rebalancing' },
  { id: 'conservative', label: '🛡️ Conservative', description: 'Safety first, paper trading' },
  { id: 'balanced', label: '⚖️ Balanced', description: 'Default balanced settings' },
  { id: 'performance', label: '⚡ Performance', description: 'Optimized for speed' },
];

export default function AdvancedSettings() {
  const [settings, setSettings] = useState<UniversalSettings | null>(null);
  const [schema, setSchema] = useState<SettingMetadata[]>([]);
  const [profiles, setProfiles] = useState<SettingsProfile[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [changedSettings, setChangedSettings] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showProfileDialog, setShowProfileDialog] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [newProfileDescription, setNewProfileDescription] = useState('');

  useEffect(() => {
    loadSettings();
    loadSchema();
    loadProfiles();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await invoke<UniversalSettings>('get_all_settings');
      setSettings(data);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load settings:', error);
      showMessage('error', 'Failed to load settings');
      setLoading(false);
    }
  };

  const loadSchema = async () => {
    try {
      const data = await invoke<SettingMetadata[]>('get_setting_schema');
      setSchema(data);
    } catch (error) {
      console.error('Failed to load schema:', error);
    }
  };

  const loadProfiles = async () => {
    try {
      const data = await invoke<SettingsProfile[]>('list_settings_profiles');
      setProfiles(data);
    } catch (error) {
      console.error('Failed to load profiles:', error);
    }
  };

  const updateSetting = async (category: string, key: string, value: any) => {
    if (!settings) return;

    try {
      await invoke('update_setting', { category, key, value });
      
      // Update local state
      setSettings({
        ...settings,
        [category]: {
          ...settings[category as keyof UniversalSettings],
          [key]: value,
        },
      });

      setChangedSettings(new Set(changedSettings).add(`${category}.${key}`));
      showMessage('success', 'Setting updated');
    } catch (error) {
      console.error('Failed to update setting:', error);
      showMessage('error', `Failed to update setting: ${error}`);
    }
  };

  const resetCategory = async (category: string) => {
    try {
      setSaving(true);
      await invoke('reset_settings', { category });
      await loadSettings();
      showMessage('success', `${categoryLabels[category]} reset to defaults`);
      setChangedSettings(new Set());
    } catch (error) {
      console.error('Failed to reset category:', error);
      showMessage('error', `Failed to reset: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const resetAll = async () => {
    if (!confirm('Are you sure you want to reset ALL settings to defaults?')) return;

    try {
      setSaving(true);
      await invoke('reset_settings', { category: null });
      await loadSettings();
      showMessage('success', 'All settings reset to defaults');
      setChangedSettings(new Set());
    } catch (error) {
      console.error('Failed to reset all:', error);
      showMessage('error', `Failed to reset: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const exportSettings = async () => {
    try {
      const exported = await invoke('export_settings', { profileName: null });
      const blob = new Blob([JSON.stringify(exported, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `eclipse-settings-${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage('success', 'Settings exported');
    } catch (error) {
      console.error('Failed to export settings:', error);
      showMessage('error', 'Failed to export settings');
    }
  };

  const importSettings = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      await invoke('import_settings', { export: imported });
      await loadSettings();
      showMessage('success', 'Settings imported successfully');
      setChangedSettings(new Set());
    } catch (error) {
      console.error('Failed to import settings:', error);
      showMessage('error', `Failed to import: ${error}`);
    }
  };

  const loadTemplate = async (templateId: string) => {
    try {
      setSaving(true);
      const template = await invoke<UniversalSettings>('get_settings_template', {
        templateType: templateId,
      });
      await invoke('import_settings', {
        export: {
          version: 1,
          exportedAt: new Date().toISOString(),
          profileName: null,
          settings: template,
        },
      });
      await loadSettings();
      showMessage('success', 'Template applied');
      setChangedSettings(new Set());
    } catch (error) {
      console.error('Failed to load template:', error);
      showMessage('error', `Failed to load template: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const createProfile = async () => {
    if (!newProfileName.trim()) {
      showMessage('error', 'Profile name is required');
      return;
    }

    try {
      await invoke('create_settings_profile', {
        name: newProfileName,
        description: newProfileDescription || null,
      });
      await loadProfiles();
      setShowProfileDialog(false);
      setNewProfileName('');
      setNewProfileDescription('');
      showMessage('success', `Profile "${newProfileName}" created`);
    } catch (error) {
      console.error('Failed to create profile:', error);
      showMessage('error', `Failed to create profile: ${error}`);
    }
  };

  const loadProfile = async (name: string) => {
    try {
      setSaving(true);
      await invoke('load_settings_profile', { name });
      await loadSettings();
      showMessage('success', `Profile "${name}" loaded`);
      setChangedSettings(new Set());
    } catch (error) {
      console.error('Failed to load profile:', error);
      showMessage('error', `Failed to load profile: ${error}`);
    } finally {
      setSaving(false);
    }
  };

  const deleteProfile = async (name: string) => {
    if (!confirm(`Delete profile "${name}"?`)) return;

    try {
      await invoke('delete_settings_profile', { name });
      await loadProfiles();
      showMessage('success', `Profile "${name}" deleted`);
    } catch (error) {
      console.error('Failed to delete profile:', error);
      showMessage('error', `Failed to delete profile: ${error}`);
    }
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 3000);
  };

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const filteredSchema = useMemo(() => {
    let filtered = schema;

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (setting) =>
          setting.label.toLowerCase().includes(query) ||
          setting.description.toLowerCase().includes(query) ||
          setting.category.toLowerCase().includes(query)
      );
    }

    if (selectedCategory) {
      filtered = filtered.filter((setting) => setting.category === selectedCategory);
    }

    return filtered;
  }, [schema, searchQuery, selectedCategory]);

  const groupedSettings = useMemo(() => {
    const grouped: Record<string, SettingMetadata[]> = {};
    filteredSchema.forEach((setting) => {
      if (!grouped[setting.category]) {
        grouped[setting.category] = [];
      }
      grouped[setting.category].push(setting);
    });
    return grouped;
  }, [filteredSchema]);

  const renderSettingInput = (setting: SettingMetadata, value: any) => {
    const handleChange = (newValue: any) => {
      updateSetting(setting.category, setting.key, newValue);
    };

    switch (setting.settingType.type) {
      case 'boolean':
        return (
          <label className="flex items-center space-x-2 cursor-pointer">
            <input
              type="checkbox"
              checked={value || false}
              onChange={(e) => handleChange(e.target.checked)}
              className="w-4 h-4 rounded border-white/20 bg-black/30 text-purple-500 focus:ring-purple-500"
            />
            <span className="text-sm text-gray-300">
              {value ? 'Enabled' : 'Disabled'}
            </span>
          </label>
        );

      case 'slider':
        return (
          <div className="space-y-2">
            <input
              type="range"
              min={setting.settingType.min}
              max={setting.settingType.max}
              step={setting.settingType.step}
              value={value || setting.settingType.min}
              onChange={(e) => handleChange(parseFloat(e.target.value))}
              className="w-full h-2 bg-black/30 rounded-lg appearance-none cursor-pointer accent-purple-500"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{setting.settingType.min}</span>
              <span className="font-semibold text-purple-400">{value}</span>
              <span>{setting.settingType.max}</span>
            </div>
          </div>
        );

      case 'number':
        return (
          <input
            type="number"
            min={setting.settingType.min}
            max={setting.settingType.max}
            step={setting.settingType.step}
            value={value || ''}
            onChange={(e) => handleChange(parseFloat(e.target.value))}
            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        );

      case 'text':
        if (setting.settingType.multiline) {
          return (
            <textarea
              value={value || ''}
              onChange={(e) => handleChange(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            />
          );
        }
        return (
          <input
            type="text"
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        );

      case 'select':
        return (
          <select
            value={value || ''}
            onChange={(e) => handleChange(e.target.value)}
            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          >
            {setting.settingType.options?.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        );

      default:
        return (
          <input
            type="text"
            value={JSON.stringify(value) || ''}
            onChange={(e) => {
              try {
                handleChange(JSON.parse(e.target.value));
              } catch {
                // Invalid JSON, ignore
              }
            }}
            className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
          />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center h-screen text-gray-400">
        Failed to load settings
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-500/20 rounded-xl">
                <Settings className="w-8 h-8 text-purple-400" />
              </div>
              <div>
                <h1 className="text-3xl font-bold text-white">Universal Settings</h1>
                <p className="text-gray-400">Configure all aspects of Eclipse Market Pro</p>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <button
                onClick={exportSettings}
                className="flex items-center space-x-2 px-4 py-2 bg-black/30 hover:bg-black/50 border border-white/10 rounded-lg text-white transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Export</span>
              </button>

              <label className="flex items-center space-x-2 px-4 py-2 bg-black/30 hover:bg-black/50 border border-white/10 rounded-lg text-white cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Import</span>
                <input type="file" accept=".json" onChange={importSettings} className="hidden" />
              </label>

              <button
                onClick={resetAll}
                disabled={saving}
                className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 transition-colors disabled:opacity-50"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset All</span>
              </button>
            </div>
          </div>

          {/* Search and Filter */}
          <div className="flex items-center space-x-4 mb-6">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search settings..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
              />
            </div>

            <select
              value={selectedCategory || ''}
              onChange={(e) => setSelectedCategory(e.target.value || null)}
              className="px-4 py-3 bg-black/30 border border-white/10 rounded-lg text-white focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
            >
              <option value="">All Categories</option>
              {Object.entries(categoryLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          {/* Templates */}
          <div className="bg-black/20 border border-white/10 rounded-xl p-4 mb-6">
            <div className="flex items-center space-x-2 mb-3">
              <Sparkles className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Quick Templates</h3>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
              {templates.map((template) => (
                <button
                  key={template.id}
                  onClick={() => loadTemplate(template.id)}
                  disabled={saving}
                  className="p-3 bg-black/30 hover:bg-purple-500/20 border border-white/10 hover:border-purple-500/30 rounded-lg text-left transition-colors disabled:opacity-50"
                >
                  <div className="font-semibold text-white text-sm mb-1">{template.label}</div>
                  <div className="text-xs text-gray-400">{template.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Profiles */}
          <div className="bg-black/20 border border-white/10 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-lg font-semibold text-white">Settings Profiles</h3>
              <button
                onClick={() => setShowProfileDialog(true)}
                className="px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-lg text-purple-400 text-sm transition-colors"
              >
                + New Profile
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {profiles.map((profile) => (
                <div
                  key={profile.name}
                  className="flex items-center space-x-2 px-3 py-2 bg-black/30 border border-white/10 rounded-lg"
                >
                  <button
                    onClick={() => loadProfile(profile.name)}
                    className="text-white hover:text-purple-400 transition-colors"
                  >
                    {profile.name}
                  </button>
                  <button
                    onClick={() => deleteProfile(profile.name)}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
              {profiles.length === 0 && (
                <p className="text-gray-500 text-sm">No profiles yet. Create one to save your settings.</p>
              )}
            </div>
          </div>
        </div>

        {/* Settings Categories */}
        <div className="space-y-4">
          {Object.entries(groupedSettings).map(([category, categorySettings]) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-black/20 border border-white/10 rounded-xl overflow-hidden"
            >
              <button
                onClick={() => toggleCategory(category)}
                className="w-full flex items-center justify-between p-4 hover:bg-white/5 transition-colors"
              >
                <div className="flex items-center space-x-3">
                  {expandedCategories.has(category) ? (
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  ) : (
                    <ChevronRight className="w-5 h-5 text-gray-400" />
                  )}
                  <h2 className="text-xl font-bold text-white">{categoryLabels[category]}</h2>
                  <span className="text-sm text-gray-400">({categorySettings.length} settings)</span>
                </div>

                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    resetCategory(category);
                  }}
                  disabled={saving}
                  className="px-3 py-1 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-lg text-red-400 text-sm transition-colors disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                </button>
              </button>

              <AnimatePresence>
                {expandedCategories.has(category) && (
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: 'auto' }}
                    exit={{ height: 0 }}
                    className="border-t border-white/10"
                  >
                    <div className="p-4 space-y-4">
                      {categorySettings.map((setting) => {
                        const value = settings[category as keyof UniversalSettings]?.[
                          setting.key as keyof any
                        ];
                        const isChanged = changedSettings.has(`${category}.${setting.key}`);

                        return (
                          <div
                            key={setting.key}
                            className={`p-4 bg-black/20 rounded-lg border ${
                              isChanged ? 'border-purple-500/50' : 'border-white/5'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-3">
                              <div className="flex-1">
                                <div className="flex items-center space-x-2 mb-1">
                                  <h3 className="font-semibold text-white">{setting.label}</h3>
                                  {isChanged && (
                                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 text-xs rounded">
                                      Modified
                                    </span>
                                  )}
                                </div>
                                <p className="text-sm text-gray-400 flex items-start space-x-1">
                                  <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                                  <span>{setting.description}</span>
                                </p>
                              </div>
                            </div>

                            <div className="mt-3">{renderSettingInput(setting, value)}</div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>

        {/* Profile Creation Dialog */}
        <AnimatePresence>
          {showProfileDialog && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 flex items-center justify-center z-50"
              onClick={() => setShowProfileDialog(false)}
            >
              <motion.div
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                onClick={(e) => e.stopPropagation()}
                className="bg-slate-900 border border-white/10 rounded-xl p-6 w-full max-w-md"
              >
                <h3 className="text-xl font-bold text-white mb-4">Create Settings Profile</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Profile Name
                    </label>
                    <input
                      type="text"
                      value={newProfileName}
                      onChange={(e) => setNewProfileName(e.target.value)}
                      placeholder="e.g., My Trading Setup"
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description (optional)
                    </label>
                    <textarea
                      value={newProfileDescription}
                      onChange={(e) => setNewProfileDescription(e.target.value)}
                      placeholder="Describe this profile..."
                      rows={3}
                      className="w-full px-3 py-2 bg-black/30 border border-white/10 rounded-lg text-white placeholder-gray-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500"
                    />
                  </div>
                  <div className="flex justify-end space-x-3">
                    <button
                      onClick={() => setShowProfileDialog(false)}
                      className="px-4 py-2 bg-black/30 hover:bg-black/50 border border-white/10 rounded-lg text-white transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={createProfile}
                      className="px-4 py-2 bg-purple-500 hover:bg-purple-600 rounded-lg text-white transition-colors"
                    >
                      Create Profile
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Message Toast */}
        <AnimatePresence>
          {message && (
            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 50 }}
              className="fixed bottom-6 right-6 z-50"
            >
              <div
                className={`flex items-center space-x-3 px-6 py-4 rounded-lg shadow-lg ${
                  message.type === 'success'
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                    : 'bg-red-500/20 border border-red-500/30 text-red-400'
                }`}
              >
                {message.type === 'success' ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <AlertCircle className="w-5 h-5" />
                )}
                <span className="font-medium">{message.text}</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
