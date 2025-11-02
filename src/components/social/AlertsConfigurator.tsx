import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BellRing, Settings, Zap, ShieldCheck } from 'lucide-react';
import { SentimentAlertConfig } from '../../types/sentiment';
import { useAlertStore } from '../../store/alertStore';

interface AlertsConfiguratorProps {
  config: SentimentAlertConfig | null;
  onSave: (config: SentimentAlertConfig) => Promise<void>;
  onTest?: () => void;
  isSaving?: boolean;
}

const channelLabels: Record<string, string> = {
  in_app: 'In-App',
  system: 'System Toast',
  email: 'Email',
  telegram: 'Telegram',
  slack: 'Slack',
  discord: 'Discord',
};

const defaultConfig: SentimentAlertConfig = {
  enabled: true,
  positive_threshold: 0.65,
  negative_threshold: -0.55,
  spike_threshold: 3,
  notification_channels: ['in_app'],
};

export function AlertsConfigurator({ config, onSave, onTest, isSaving }: AlertsConfiguratorProps) {
  const [localConfig, setLocalConfig] = useState<SentimentAlertConfig>(config ?? defaultConfig);
  const [hasChanges, setHasChanges] = useState(false);
  const { alerts } = useAlertStore();

  useEffect(() => {
    if (config) {
      setLocalConfig(config);
      setHasChanges(false);
    }
  }, [config]);

  const updateConfig = <K extends keyof SentimentAlertConfig>(key: K, value: SentimentAlertConfig[K]) => {
    setLocalConfig(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const toggleChannel = (channel: string) => {
    const channels = new Set(localConfig.notification_channels);
    if (channels.has(channel)) {
      channels.delete(channel);
    } else {
      channels.add(channel);
    }
    updateConfig('notification_channels', Array.from(channels));
  };

  const handleSave = async () => {
    await onSave(localConfig);
    setHasChanges(false);
  };

  return (
    <div className="glass-card rounded-3xl p-6 border border-slate-700/60">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-white/90 flex items-center gap-2">
            <BellRing className="w-5 h-5 text-rose-400" />
            Sentiment Alerts
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Configure threshold-driven notifications when social sentiment crosses key momentum values.
          </p>
        </div>

        <div className="text-right text-xs text-slate-400">
          <div>{alerts.length} price alerts active</div>
          <div className="text-slate-500">Integrates with notification router</div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Auto-protect exposure
            </div>
            <div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={localConfig.enabled}
                  onChange={() => updateConfig('enabled', !localConfig.enabled)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:bg-gradient-to-r from-rose-500 via-purple-500 to-sky-500 transition" />
                <span className="sr-only">Toggle alerts</span>
              </label>
            </div>
          </div>
          <p className="text-xs text-slate-400">
            When enabled, notifications will trigger across selected channels as soon as FOMO/FUD gauges or
            velocity spikes exceed configured thresholds.
          </p>
        </div>

        <div className="rounded-2xl bg-slate-900/60 border border-slate-800/60 p-4">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/90 mb-3">
            <Zap className="w-4 h-4 text-amber-400" />
            Thresholds
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Positive FOMO trigger</span>
              <input
                type="number"
                step="0.05"
                min="0"
                max="1"
                value={localConfig.positive_threshold}
                onChange={event => updateConfig('positive_threshold', parseFloat(event.target.value) || 0)}
                className="w-20 bg-slate-950/60 border border-slate-800/80 rounded-lg text-right px-2 py-1 text-white/90 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Negative sentiment trigger</span>
              <input
                type="number"
                step="0.05"
                min="-1"
                max="0"
                value={localConfig.negative_threshold}
                onChange={event => updateConfig('negative_threshold', parseFloat(event.target.value) || 0)}
                className="w-20 bg-slate-950/60 border border-slate-800/80 rounded-lg text-right px-2 py-1 text-white/90 focus:outline-none"
              />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-400">Mention spike (x baseline)</span>
              <input
                type="number"
                step="0.5"
                min="1"
                value={localConfig.spike_threshold}
                onChange={event => updateConfig('spike_threshold', parseFloat(event.target.value) || 1)}
                className="w-20 bg-slate-950/60 border border-slate-800/80 rounded-lg text-right px-2 py-1 text-white/90 focus:outline-none"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mt-6">
        <div className="text-sm font-semibold text-white/90 mb-3">Notification Channels</div>
        <div className="flex flex-wrap gap-2 text-xs">
          {Object.entries(channelLabels).map(([channel, label]) => {
            const isActive = localConfig.notification_channels.includes(channel);
            return (
              <button
                key={channel}
                onClick={() => toggleChannel(channel)}
                className={`px-3 py-2 rounded-xl border transition flex items-center gap-2 ${
                  isActive
                    ? 'border-purple-500/60 bg-purple-500/10 text-purple-200'
                    : 'border-slate-700/60 bg-slate-900/80 text-slate-400 hover:border-purple-500/40 hover:text-purple-200'
                }`}
              >
                <Settings className="w-3 h-3" />
                {label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex flex-wrap justify-end gap-3">
        {onTest && (
          <button
            onClick={() => onTest()}
            className="px-4 py-2 rounded-xl border border-slate-600/60 text-slate-200 text-sm hover:border-slate-500/80 transition"
          >
            Send Test Alert
          </button>
        )}

        <motion.button
          whileTap={{ scale: 0.98 }}
          onClick={handleSave}
          disabled={!hasChanges || isSaving}
          className="px-4 py-2 rounded-xl bg-gradient-to-r from-purple-500/80 to-indigo-500/80 text-white text-sm font-medium shadow-lg shadow-purple-500/20 hover:from-purple-500 hover:to-indigo-500 transition disabled:opacity-40"
        >
          {isSaving ? 'Saving…' : hasChanges ? 'Save Changes' : 'Saved'}
        </motion.button>
      </div>
    </div>
  );
}
