import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Webhook,
  Plus,
  Edit2,
  Trash2,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import type { WebhookConfig, WebhookDeliveryLog, WebhookTestResult } from '../../types/webhooks';

const WebhookSettings = () => {
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([]);
  const [deliveryLogs, setDeliveryLogs] = useState<WebhookDeliveryLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null);
  const [testingId, setTestingId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<{ id: string; result: WebhookTestResult } | null>(
    null
  );
  const [expandedLog, setExpandedLog] = useState<string | null>(null);

  useEffect(() => {
    loadWebhooks();
    loadDeliveryLogs();
  }, []);

  const loadWebhooks = async () => {
    setIsLoading(true);
    try {
      const result = await invoke<WebhookConfig[]>('list_webhooks');
      setWebhooks(result);
      setError(null);
    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
    }
  };

  const loadDeliveryLogs = async () => {
    try {
      const result = await invoke<WebhookDeliveryLog[]>('list_webhook_delivery_logs', {
        webhookId: null,
        limit: 50,
      });
      setDeliveryLogs(result);
    } catch (err) {
      console.error('Failed to load delivery logs:', err);
    }
  };

  const handleCreateWebhook = () => {
    setEditingWebhook(null);
    setModalOpen(true);
  };

  const handleEditWebhook = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook);
    setModalOpen(true);
  };

  const handleDeleteWebhook = async (id: string) => {
    if (!confirm('Are you sure you want to delete this webhook?')) return;

    try {
      await invoke('delete_webhook', { id });
      await loadWebhooks();
    } catch (err) {
      setError(String(err));
    }
  };

  const handleTestWebhook = async (id: string) => {
    setTestingId(id);
    setTestResult(null);
    try {
      const result = await invoke<WebhookTestResult>('test_webhook', {
        id,
        variables: {
          token: 'SOL',
          price: 150.5,
          change24h: 5.2,
          timestamp: new Date().toISOString(),
        },
      });
      setTestResult({ id, result });
    } catch (err) {
      setError(String(err));
    } finally {
      setTestingId(null);
      setTimeout(() => setTestResult(null), 5000);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'sent':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'failed':
        return 'bg-red-500/20 text-red-400 border-red-500/30';
      case 'retrying':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Webhooks</h2>
          <p className="text-white/60 text-sm">Configure custom webhook integrations</p>
        </div>
        <motion.button
          onClick={handleCreateWebhook}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold hover:shadow-lg hover:shadow-purple-500/50 transition-all"
        >
          <Plus className="w-5 h-5" />
          New Webhook
        </motion.button>
      </div>

      {error && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
        >
          <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <p className="text-red-400 text-sm">{error}</p>
        </motion.div>
      )}

      {isLoading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-white/60 mt-4">Loading webhooks...</p>
        </div>
      ) : webhooks.length === 0 ? (
        <div className="text-center py-12 text-white/40">
          <Webhook className="w-16 h-16 mx-auto mb-4 opacity-50" />
          <p className="text-lg font-medium mb-2">No webhooks configured</p>
          <p className="text-sm">Create your first webhook to start sending automated notifications</p>
        </div>
      ) : (
        <div className="space-y-4">
          {webhooks.map(webhook => (
            <motion.div
              key={webhook.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-bold">{webhook.name}</h3>
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold uppercase ${
                        webhook.method === 'post'
                          ? 'bg-blue-500/20 text-blue-400'
                          : 'bg-green-500/20 text-green-400'
                      }`}
                    >
                      {webhook.method}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-lg text-xs font-semibold ${
                        webhook.enabled
                          ? 'bg-green-500/20 text-green-400'
                          : 'bg-slate-500/20 text-slate-400'
                      }`}
                    >
                      {webhook.enabled ? 'Enabled' : 'Disabled'}
                    </span>
                  </div>
                  {webhook.description && (
                    <p className="text-sm text-white/60 mb-2">{webhook.description}</p>
                  )}
                  <p className="text-sm text-white/40 font-mono">{webhook.url}</p>
                </div>
              </div>

              {testResult && testResult.id === webhook.id && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className={`mb-4 p-4 rounded-xl ${
                    testResult.result.success
                      ? 'bg-green-500/10 border border-green-500/20'
                      : 'bg-red-500/10 border border-red-500/20'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {testResult.result.success ? (
                      <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p
                        className={`text-sm font-medium mb-1 ${
                          testResult.result.success ? 'text-green-400' : 'text-red-400'
                        }`}
                      >
                        {testResult.result.message}
                      </p>
                      {testResult.result.responseCode && (
                        <p className="text-xs text-white/60">
                          Response Code: {testResult.result.responseCode}
                        </p>
                      )}
                      {testResult.result.latencyMs && (
                        <p className="text-xs text-white/60">
                          Latency: {testResult.result.latencyMs}ms
                        </p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

              <div className="flex gap-2">
                <motion.button
                  onClick={() => handleTestWebhook(webhook.id)}
                  disabled={testingId === webhook.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 rounded-xl transition-colors disabled:opacity-50"
                >
                  <Send className="w-4 h-4" />
                  {testingId === webhook.id ? 'Testing...' : 'Test'}
                </motion.button>
                <motion.button
                  onClick={() => handleEditWebhook(webhook)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-xl transition-colors"
                >
                  <Edit2 className="w-4 h-4" />
                  Edit
                </motion.button>
                <motion.button
                  onClick={() => handleDeleteWebhook(webhook.id)}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-2 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {deliveryLogs.length > 0 && (
        <div className="mt-8">
          <h3 className="text-xl font-bold mb-4">Recent Deliveries</h3>
          <div className="space-y-3">
            {deliveryLogs.slice(0, 10).map(log => (
              <motion.div
                key={log.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-slate-900/50 border border-purple-500/10 rounded-xl"
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold">{log.webhookName}</span>
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${getStatusColor(log.status)}`}>
                        {log.status}
                      </span>
                    </div>
                    {log.responseCode && (
                      <p className="text-sm text-white/60">
                        Status: {log.responseCode} • Latency: {log.responseTimeMs}ms • Attempt:{' '}
                        {log.attempt}
                      </p>
                    )}
                  </div>
                  <span className="text-xs text-white/40">
                    {new Date(log.triggeredAt).toLocaleString()}
                  </span>
                </div>
                {log.error && (
                  <p className="text-xs text-red-400 bg-red-500/10 p-2 rounded mt-2">{log.error}</p>
                )}
                {log.payloadPreview && (
                  <button
                    onClick={() =>
                      setExpandedLog(expandedLog === log.id ? null : log.id)
                    }
                    className="flex items-center gap-2 mt-2 text-xs text-purple-400 hover:text-purple-300"
                  >
                    {expandedLog === log.id ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                    View Payload
                  </button>
                )}
                {expandedLog === log.id && log.payloadPreview && (
                  <pre className="mt-2 p-3 bg-slate-950 rounded text-xs overflow-x-auto text-white/80 font-mono">
                    {log.payloadPreview}
                  </pre>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      )}

      <AnimatePresence>
        {modalOpen && (
          <WebhookModal
            webhook={editingWebhook}
            onClose={() => setModalOpen(false)}
            onSave={async () => {
              setModalOpen(false);
              await loadWebhooks();
              await loadDeliveryLogs();
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default WebhookSettings;

// Webhook Modal component will be continued in next message
interface WebhookModalProps {
  webhook: WebhookConfig | null;
  onClose: () => void;
  onSave: () => void;
}

const WebhookModal = ({ webhook, onClose, onSave }: WebhookModalProps) => {
  const [formData, setFormData] = useState<Partial<WebhookConfig>>({
    name: webhook?.name || '',
    description: webhook?.description || '',
    url: webhook?.url || '',
    method: webhook?.method || 'post',
    headers: webhook?.headers || {},
    bodyTemplate: webhook?.bodyTemplate || '{}',
    enabled: webhook?.enabled ?? true,
    retryPolicy: webhook?.retryPolicy || {
      maxAttempts: 3,
      baseDelaySecs: 2,
      maxDelaySecs: 60,
      jitter: true,
    },
    variables: webhook?.variables || [],
  });
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [headerKey, setHeaderKey] = useState('');
  const [headerValue, setHeaderValue] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);

    try {
      if (webhook) {
        await invoke('update_webhook', {
          id: webhook.id,
          config: formData,
        });
      } else {
        await invoke('create_webhook', {
          config: formData,
        });
      }
      onSave();
    } catch (err) {
      setError(String(err));
    } finally {
      setIsSaving(false);
    }
  };

  const addHeader = () => {
    if (headerKey && headerValue) {
      setFormData({
        ...formData,
        headers: {
          ...formData.headers,
          [headerKey]: headerValue,
        },
      });
      setHeaderKey('');
      setHeaderValue('');
    }
  };

  const removeHeader = (key: string) => {
    const newHeaders = { ...formData.headers };
    delete newHeaders[key];
    setFormData({ ...formData, headers: newHeaders });
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
        className="bg-slate-800 rounded-2xl border border-purple-500/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-2xl font-bold mb-6">{webhook ? 'Edit' : 'Create'} Webhook</h2>

        {error && (
          <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              placeholder="My Webhook"
              className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Description (Optional)</label>
            <input
              type="text"
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              placeholder="Sends price alerts to monitoring service"
              className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">URL</label>
            <input
              type="url"
              value={formData.url}
              onChange={e => setFormData({ ...formData, url: e.target.value })}
              placeholder="https://api.example.com/webhook"
              className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 font-mono text-sm"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Method</label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="post"
                  checked={formData.method === 'post'}
                  onChange={e => setFormData({ ...formData, method: e.target.value as 'post' | 'get' })}
                  className="text-purple-500 focus:ring-purple-500"
                />
                <span>POST</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  value="get"
                  checked={formData.method === 'get'}
                  onChange={e => setFormData({ ...formData, method: e.target.value as 'post' | 'get' })}
                  className="text-purple-500 focus:ring-purple-500"
                />
                <span>GET</span>
              </label>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Custom Headers</label>
            <div className="space-y-2 mb-3">
              {Object.entries(formData.headers || {}).map(([key, value]) => (
                <div key={key} className="flex items-center gap-2 p-2 bg-slate-900/50 rounded-lg">
                  <span className="text-sm font-mono flex-1">
                    {key}: {value}
                  </span>
                  <button
                    type="button"
                    onClick={() => removeHeader(key)}
                    className="p-1 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={headerKey}
                onChange={e => setHeaderKey(e.target.value)}
                placeholder="Header name"
                className="flex-1 px-3 py-2 bg-slate-900/50 border border-purple-500/20 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
              <input
                type="text"
                value={headerValue}
                onChange={e => setHeaderValue(e.target.value)}
                placeholder="Header value"
                className="flex-1 px-3 py-2 bg-slate-900/50 border border-purple-500/20 rounded-lg text-sm text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50"
              />
              <button
                type="button"
                onClick={addHeader}
                className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 text-purple-400 rounded-lg transition-colors text-sm"
              >
                Add
              </button>
            </div>
          </div>

          {formData.method === 'post' && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Body Template (JSON with Variables)
              </label>
              <textarea
                value={formData.bodyTemplate}
                onChange={e => setFormData({ ...formData, bodyTemplate: e.target.value })}
                placeholder='{"token": "${token}", "price": ${price}, "timestamp": "${timestamp}"}'
                className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 font-mono text-sm"
                rows={6}
              />
              <p className="text-xs text-white/40 mt-1">
                Use ${'{'}variable_name{'}'} for substitution. Available variables: token, price,
                change24h, timestamp
              </p>
            </div>
          )}

          <div className="flex items-center justify-between p-4 bg-slate-900/50 rounded-xl">
            <div>
              <p className="font-medium">Enable Webhook</p>
              <p className="text-sm text-white/60">Active webhooks will send notifications</p>
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
              {isSaving ? 'Saving...' : webhook ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};
