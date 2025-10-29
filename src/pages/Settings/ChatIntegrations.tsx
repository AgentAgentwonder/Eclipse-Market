import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  MessageSquare,
  Plus,
  Edit2,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Eye,
  EyeOff,
  Save,
  X,
} from 'lucide-react';
import { useChatIntegrationsStore } from '../../store/chatIntegrationsStore';
import type {
  TelegramConfig,
  SlackConfig,
  DiscordConfig,
  DeliveryLog,
} from '../../types/chatIntegrations';

interface ConfigModalProps {
  type: 'telegram' | 'slack' | 'discord';
  config?: TelegramConfig | SlackConfig | DiscordConfig;
  onClose: () => void;
  onSave: (config: any) => void;
}

const ConfigModal = ({ type, config, onClose, onSave }: ConfigModalProps) => {
  const [formData, setFormData] = useState<any>({
    name: '',
    enabled: true,
    ...(config || {}),
  });
  const [showSecrets, setShowSecrets] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (error) {
      console.error('Failed to save config:', error);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-slate-800 rounded-2xl border border-purple-500/20 p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold capitalize">{type} Configuration</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Configuration Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder={`My ${type} notification`}
              className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              required
            />
          </div>

          {type === 'telegram' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Bot Token</label>
                <div className="relative">
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={formData.botToken || ''}
                    onChange={e => setFormData({ ...formData, botToken: e.target.value })}
                    placeholder="123456789:ABCdefGHIjklMNOpqrsTUVwxyz"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  Get from @BotFather on Telegram
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Chat ID</label>
                <input
                  type="text"
                  value={formData.chatId || ''}
                  onChange={e => setFormData({ ...formData, chatId: e.target.value })}
                  placeholder="-1001234567890"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                  required
                />
                <p className="text-xs text-white/40 mt-1">
                  Use @userinfobot to get your chat ID
                </p>
              </div>
            </>
          )}

          {type === 'slack' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Webhook URL</label>
                <div className="relative">
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={formData.webhookUrl || ''}
                    onChange={e => setFormData({ ...formData, webhookUrl: e.target.value })}
                    placeholder="https://hooks.slack.com/services/..."
                    className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  Create an incoming webhook in your Slack workspace
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Channel (Optional)</label>
                <input
                  type="text"
                  value={formData.channel || ''}
                  onChange={e => setFormData({ ...formData, channel: e.target.value })}
                  placeholder="#alerts"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </>
          )}

          {type === 'discord' && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Webhook URL</label>
                <div className="relative">
                  <input
                    type={showSecrets ? 'text' : 'password'}
                    value={formData.webhookUrl || ''}
                    onChange={e => setFormData({ ...formData, webhookUrl: e.target.value })}
                    placeholder="https://discord.com/api/webhooks/..."
                    className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 pr-12"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSecrets(!showSecrets)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60"
                  >
                    {showSecrets ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <p className="text-xs text-white/40 mt-1">
                  Create a webhook in Server Settings → Integrations
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Username (Optional)</label>
                <input
                  type="text"
                  value={formData.username || ''}
                  onChange={e => setFormData({ ...formData, username: e.target.value })}
                  placeholder="Trading Alert Bot"
                  className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
                />
              </div>
            </>
          )}

          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
            <div>
              <p className="font-medium">Enable Notifications</p>
              <p className="text-sm text-white/60">Send alerts to this destination</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={formData.enabled}
                onChange={e => setFormData({ ...formData, enabled: e.target.checked })}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-500"></div>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-slate-700 hover:bg-slate-600 rounded-xl font-semibold transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all disabled:opacity-50"
            >
              {isSaving ? 'Saving...' : config ? 'Update' : 'Add'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const ChatIntegrations = () => {
  const {
    settings,
    deliveryLogs,
    isLoading,
    error,
    loadSettings,
    addTelegramConfig,
    updateTelegramConfig,
    deleteTelegramConfig,
    addSlackConfig,
    updateSlackConfig,
    deleteSlackConfig,
    addDiscordConfig,
    updateDiscordConfig,
    deleteDiscordConfig,
    testTelegramConfig,
    testSlackConfig,
    testDiscordConfig,
    fetchDeliveryLogs,
  } = useChatIntegrationsStore();

  const [activeTab, setActiveTab] = useState<'telegram' | 'slack' | 'discord' | 'logs'>(
    'telegram'
  );
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<any>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{
    id: string;
    success: boolean;
    message: string;
  } | null>(null);

  useEffect(() => {
    loadSettings();
    fetchDeliveryLogs(50);
  }, []);

  const handleAddConfig = () => {
    setEditingConfig(null);
    setModalOpen(true);
  };

  const handleEditConfig = (config: any) => {
    setEditingConfig(config);
    setModalOpen(true);
  };

  const handleSaveConfig = async (formData: any) => {
    if (activeTab === 'telegram') {
      if (editingConfig) {
        await updateTelegramConfig(editingConfig.id, formData);
      } else {
        await addTelegramConfig(formData);
      }
    } else if (activeTab === 'slack') {
      if (editingConfig) {
        await updateSlackConfig(editingConfig.id, formData);
      } else {
        await addSlackConfig(formData);
      }
    } else if (activeTab === 'discord') {
      if (editingConfig) {
        await updateDiscordConfig(editingConfig.id, formData);
      } else {
        await addDiscordConfig(formData);
      }
    }
    await loadSettings();
  };

  const handleDeleteConfig = async (id: string) => {
    if (!confirm('Are you sure you want to delete this configuration?')) return;

    if (activeTab === 'telegram') {
      await deleteTelegramConfig(id);
    } else if (activeTab === 'slack') {
      await deleteSlackConfig(id);
    } else if (activeTab === 'discord') {
      await deleteDiscordConfig(id);
    }
  };

  const handleTestConfig = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      let result;
      if (activeTab === 'telegram') {
        result = await testTelegramConfig(id);
      } else if (activeTab === 'slack') {
        result = await testSlackConfig(id);
      } else if (activeTab === 'discord') {
        result = await testDiscordConfig(id);
      }
      setTestResult({ id, ...result! });
    } catch (error) {
      setTestResult({
        id,
        success: false,
        message: String(error),
      });
    } finally {
      setTestingId(null);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const renderConfigList = (configs: any[]) => (
    <div className="space-y-3">
      {configs.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No configurations added yet</p>
          <p className="text-sm mt-1">Click the button above to add one</p>
        </div>
      ) : (
        configs.map(config => (
          <motion.div
            key={config.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-slate-900/50 border border-purple-500/10 rounded-xl"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{config.name}</h3>
                <p className="text-sm text-white/60 mt-1">
                  {activeTab === 'telegram'
                    ? `Chat ID: ${config.chatId}`
                    : activeTab === 'slack'
                      ? config.channel || 'Default channel'
                      : config.username || 'Default username'}
                </p>
              </div>
              <div
                className={`px-3 py-1 rounded-lg text-xs font-semibold ${
                  config.enabled
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-slate-500/20 text-slate-400'
                }`}
              >
                {config.enabled ? 'Enabled' : 'Disabled'}
              </div>
            </div>

            {testResult && testResult.id === config.id && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className={`mb-3 p-3 rounded-lg flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-green-500/10 border border-green-500/20'
                    : 'bg-red-500/10 border border-red-500/20'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                )}
                <div className="flex-1">
                  <p
                    className={`text-sm ${testResult.success ? 'text-green-400' : 'text-red-400'}`}
                  >
                    {testResult.message}
                  </p>
                </div>
              </motion.div>
            )}

            <div className="flex gap-2">
              <button
                onClick={() => handleTestConfig(config.id)}
                disabled={testingId === config.id}
                className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-lg transition-colors disabled:opacity-50"
              >
                <Send className="w-4 h-4" />
                {testingId === config.id ? 'Testing...' : 'Test'}
              </button>
              <button
                onClick={() => handleEditConfig(config)}
                className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors"
              >
                <Edit2 className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteConfig(config.id)}
                className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  const renderDeliveryLogs = () => (
    <div className="space-y-3">
      {deliveryLogs.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <Info className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>No delivery logs yet</p>
        </div>
      ) : (
        deliveryLogs.map(log => (
          <motion.div
            key={log.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-slate-900/50 border border-purple-500/10 rounded-xl"
          >
            <div className="flex items-start justify-between mb-2">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold capitalize">{log.serviceType}</span>
                  <span className="text-white/60">→</span>
                  <span className="text-white/60">{log.configName}</span>
                </div>
                {log.alertName && (
                  <p className="text-sm text-white/40">Alert: {log.alertName}</p>
                )}
              </div>
              <div
                className={`px-2 py-1 rounded text-xs font-semibold ${
                  log.status === 'sent'
                    ? 'bg-green-500/20 text-green-400'
                    : log.status === 'failed'
                      ? 'bg-red-500/20 text-red-400'
                      : log.status === 'rate_limited'
                        ? 'bg-yellow-500/20 text-yellow-400'
                        : 'bg-blue-500/20 text-blue-400'
                }`}
              >
                {log.status}
              </div>
            </div>
            <p className="text-sm text-white/60 mb-2">{log.message}</p>
            {log.error && (
              <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded">{log.error}</p>
            )}
            <div className="flex items-center justify-between mt-2 text-xs text-white/40">
              <span>Retries: {log.retryCount}</span>
              <span>{new Date(log.timestamp).toLocaleString()}</span>
            </div>
          </motion.div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Chat Integrations</h2>
          <p className="text-white/60">Configure Telegram, Slack, and Discord notifications</p>
        </div>
        {activeTab !== 'logs' && (
          <button
            onClick={handleAddConfig}
            className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
          >
            <Plus className="w-5 h-5" />
            Add {activeTab}
          </button>
        )}
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl flex items-start gap-3"
        >
          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      <div className="flex gap-2 p-1 bg-slate-900/50 rounded-xl border border-purple-500/10">
        {['telegram', 'slack', 'discord', 'logs'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab as any)}
            className={`flex-1 py-2 px-4 rounded-lg font-medium capitalize transition-all ${
              activeTab === tab
                ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg'
                : 'text-white/60 hover:text-white hover:bg-slate-800'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      <div className="min-h-[400px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          </div>
        ) : activeTab === 'logs' ? (
          renderDeliveryLogs()
        ) : activeTab === 'telegram' ? (
          renderConfigList(settings.telegram)
        ) : activeTab === 'slack' ? (
          renderConfigList(settings.slack)
        ) : (
          renderConfigList(settings.discord)
        )}
      </div>

      <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
        <div className="flex items-start gap-3">
          <Info className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-400 space-y-2">
            <p className="font-medium">Setup Guides:</p>
            <ul className="space-y-1 text-blue-400/80">
              <li>
                • <strong>Telegram:</strong> Create a bot with @BotFather, get token, add bot to
                group/channel, use @userinfobot for chat ID
              </li>
              <li>
                • <strong>Slack:</strong> Go to workspace settings → Manage apps → Custom
                Integrations → Incoming Webhooks
              </li>
              <li>
                • <strong>Discord:</strong> Server Settings → Integrations → Webhooks → New
                Webhook
              </li>
            </ul>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {modalOpen && (
          <ConfigModal
            type={activeTab as any}
            config={editingConfig}
            onClose={() => {
              setModalOpen(false);
              setEditingConfig(null);
            }}
            onSave={handleSaveConfig}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default ChatIntegrations;
