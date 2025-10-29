import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key,
  CheckCircle,
  AlertCircle,
  Eye,
  EyeOff,
  RefreshCw,
  Server,
  Shield,
  Activity,
  Calendar,
  AlertTriangle,
  TrendingUp,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface ServiceStatus {
  configured: boolean;
  usingDefault: boolean;
  connectionStatus: {
    connected: boolean;
    lastError?: string;
    statusCode?: number;
  };
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    resetAt: string;
  };
  lastTested?: string;
  expiryDate?: string;
  daysUntilExpiry?: number;
}

interface ApiStatus {
  helius: ServiceStatus;
  birdeye: ServiceStatus;
  jupiter: ServiceStatus;
  solanaRpc: ServiceStatus;
}

interface ConnectionTestResult {
  service: string;
  success: boolean;
  statusCode?: number;
  error?: string;
  latencyMs?: number;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    resetAt: string;
  };
}

export function ApiSettings() {
  const [apiStatus, setApiStatus] = useState<ApiStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form states for each service
  const [heliusKey, setHeliusKey] = useState('');
  const [birdeyeKey, setBirdeyeKey] = useState('');
  const [jupiterKey, setJupiterKey] = useState('');
  const [solanaRpc, setSolanaRpc] = useState('');

  const [showHelius, setShowHelius] = useState(false);
  const [showBirdeye, setShowBirdeye] = useState(false);
  const [showJupiter, setShowJupiter] = useState(false);

  const [heliusExpiry, setHeliusExpiry] = useState('');
  const [birdeyeExpiry, setBirdeyeExpiry] = useState('');
  const [jupiterExpiry, setJupiterExpiry] = useState('');

  const [saving, setSaving] = useState<string | null>(null);
  const [testing, setTesting] = useState<string | null>(null);

  useEffect(() => {
    loadApiStatus();
  }, []);

  const loadApiStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const status = await invoke<ApiStatus>('get_api_status');
      setApiStatus(status);
    } catch (err) {
      console.error('Failed to load API status:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSaveKey = async (service: string, apiKey: string, expiryDate?: string) => {
    if (!apiKey.trim()) {
      setError(`Please enter an API key for ${service}`);
      return;
    }

    setSaving(service);
    setError(null);
    setSuccess(null);

    try {
      const result = await invoke<string>('save_api_key', {
        service,
        api_key: apiKey.trim(),
        expiry_date: expiryDate ? new Date(expiryDate).toISOString() : null,
      });
      setSuccess(result);

      // Clear the input fields
      if (service === 'helius') {
        setHeliusKey('');
        setHeliusExpiry('');
      }
      if (service === 'birdeye') {
        setBirdeyeKey('');
        setBirdeyeExpiry('');
      }
      if (service === 'jupiter') {
        setJupiterKey('');
        setJupiterExpiry('');
      }
      if (service === 'solana_rpc') {
        setSolanaRpc('');
      }

      // Reload status
      await loadApiStatus();

      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to save API key:', err);
      setError(String(err));
    } finally {
      setSaving(null);
    }
  };

  const handleRemoveKey = async (service: string) => {
    if (
      !window.confirm(`Remove API key for ${service}? The service will fallback to default keys.`)
    ) {
      return;
    }

    setSaving(service);
    setError(null);
    setSuccess(null);

    try {
      const result = await invoke<string>('remove_api_key', { service });
      setSuccess(result);
      await loadApiStatus();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to remove API key:', err);
      setError(String(err));
    } finally {
      setSaving(null);
    }
  };

  const handleToggleDefault = async (service: string, useDefault: boolean) => {
    setSaving(service);
    setError(null);
    setSuccess(null);

    try {
      const result = await invoke<string>('set_use_default_key', {
        service,
        use_default: useDefault,
      });
      setSuccess(result);
      await loadApiStatus();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      console.error('Failed to toggle default key:', err);
      setError(String(err));
    } finally {
      setSaving(null);
    }
  };

  const handleTestConnection = async (service: string) => {
    setTesting(service);
    setError(null);

    try {
      const result = await invoke<ConnectionTestResult>('test_api_connection', { service });

      if (result.success) {
        setSuccess(
          `✓ ${service.toUpperCase()} connected successfully! ` +
            `(${result.latencyMs}ms${result.rateLimitInfo ? `, ${result.rateLimitInfo.remaining}/${result.rateLimitInfo.limit} calls remaining` : ''})`
        );
      } else {
        setError(`${service.toUpperCase()} connection failed: ${result.error}`);
      }

      await loadApiStatus();
      setTimeout(() => setSuccess(null), 5000);
    } catch (err) {
      console.error('Failed to test connection:', err);
      setError(String(err));
    } finally {
      setTesting(null);
    }
  };

  const renderServiceCard = (
    service: string,
    displayName: string,
    status: ServiceStatus | undefined,
    apiKey: string,
    setApiKey: (value: string) => void,
    showKey: boolean,
    setShowKey: (value: boolean) => void,
    expiryDate: string,
    setExpiryDate: (value: string) => void,
    icon: React.ReactNode,
    color: string
  ) => {
    return (
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg`}
            >
              {icon}
            </div>
            <div>
              <h3 className="text-lg font-semibold">{displayName}</h3>
              <div className="flex items-center gap-2 mt-1">
                {status?.connectionStatus.connected ? (
                  <div className="flex items-center gap-1 text-green-400 text-xs">
                    <CheckCircle className="w-3 h-3" />
                    <span>Connected</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 text-red-400 text-xs">
                    <AlertCircle className="w-3 h-3" />
                    <span>Not connected</span>
                  </div>
                )}
                {status?.configured && !status?.usingDefault && (
                  <span className="text-xs text-purple-400 bg-purple-500/20 px-2 py-0.5 rounded">
                    Custom
                  </span>
                )}
                {status?.usingDefault && (
                  <span className="text-xs text-yellow-400 bg-yellow-500/20 px-2 py-0.5 rounded">
                    Default
                  </span>
                )}
              </div>
            </div>
          </div>
          <motion.button
            onClick={() => handleTestConnection(service)}
            disabled={testing === service}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="p-2 bg-slate-700/50 hover:bg-slate-700 rounded-lg transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${testing === service ? 'animate-spin' : ''}`} />
          </motion.button>
        </div>

        {/* Status information */}
        {status && (
          <div className="space-y-3 mb-4">
            {status.rateLimitInfo && (
              <div className="p-3 bg-slate-900/50 rounded-lg">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-blue-400" />
                    <span className="text-sm text-white/80">Rate Limit</span>
                  </div>
                  <div className="text-sm">
                    <span className="font-medium">{status.rateLimitInfo.remaining}</span>
                    <span className="text-white/60">/{status.rateLimitInfo.limit}</span>
                  </div>
                </div>
                <div className="mt-1 text-xs text-white/50">
                  Reset {new Date(status.rateLimitInfo.resetAt).toLocaleTimeString()}
                </div>
              </div>
            )}

            {status.expiryDate && (
              <div className="flex items-center gap-2 p-3 bg-slate-900/40 border border-purple-500/10 rounded-lg text-xs text-white/70">
                <Calendar className="w-4 h-4 text-purple-300" />
                <span>
                  Expires {new Date(status.expiryDate).toLocaleDateString()}
                  {typeof status.daysUntilExpiry === 'number' && (
                    <span className="text-white/50">
                      {status.daysUntilExpiry >= 0
                        ? ` (${status.daysUntilExpiry} days remaining)`
                        : ` (expired ${Math.abs(status.daysUntilExpiry)} days ago)`}
                    </span>
                  )}
                </span>
              </div>
            )}

            {typeof status.daysUntilExpiry === 'number' && status.daysUntilExpiry < 30 && (
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  status.daysUntilExpiry < 7
                    ? 'bg-red-500/10 border border-red-500/30'
                    : 'bg-yellow-500/10 border border-yellow-500/30'
                }`}
              >
                <AlertTriangle
                  className={`w-4 h-4 ${
                    status.daysUntilExpiry < 7 ? 'text-red-400' : 'text-yellow-400'
                  }`}
                />
                <span
                  className={`text-sm ${
                    status.daysUntilExpiry < 7 ? 'text-red-400' : 'text-yellow-400'
                  }`}
                >
                  {status.daysUntilExpiry >= 0
                    ? `Key expires in ${status.daysUntilExpiry} days`
                    : `Key expired ${Math.abs(status.daysUntilExpiry)} days ago`}
                </span>
              </div>
            )}

            {status.connectionStatus.statusCode && (
              <div className="text-xs text-white/50">
                Last status: HTTP {status.connectionStatus.statusCode}
              </div>
            )}

            {status.lastTested && (
              <div className="text-xs text-white/40">
                Last tested: {new Date(status.lastTested).toLocaleString()}
              </div>
            )}

            {status.connectionStatus.lastError && (
              <div className="text-xs text-red-400 p-2 bg-red-500/10 rounded">
                {status.connectionStatus.lastError}
              </div>
            )}
          </div>
        )}

        {/* Use default toggle */}
        <div className="mb-4 p-3 bg-slate-900/50 rounded-lg">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-yellow-400" />
              <div>
                <div className="text-sm font-medium">Use Default Keys</div>
                <div className="text-xs text-white/60">Fallback to developer keys</div>
              </div>
            </div>
            <input
              type="checkbox"
              checked={status?.usingDefault || false}
              onChange={e => handleToggleDefault(service, e.target.checked)}
              disabled={saving === service}
              className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
            />
          </label>
          {status?.usingDefault && (
            <div className="mt-2 p-2 bg-yellow-500/10 border border-yellow-500/20 rounded text-xs text-yellow-400">
              ⚠️ Using shared developer keys. Rate limits may be shared across users.
            </div>
          )}
        </div>

        {/* API Key input form */}
        {!status?.usingDefault && (
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-2">
                {service === 'solana_rpc' ? 'RPC Endpoint URL' : 'API Key'}
              </label>
              <div className="relative">
                <input
                  type={showKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={e => setApiKey(e.target.value)}
                  placeholder={service === 'solana_rpc' ? 'https://...' : 'Enter API key'}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors pr-12"
                  disabled={saving === service}
                />
                {service !== 'solana_rpc' && (
                  <button
                    type="button"
                    onClick={() => setShowKey(!showKey)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                  >
                    {showKey ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                )}
              </div>
            </div>

            {service !== 'solana_rpc' && (
              <div>
                <label className="block text-sm font-medium mb-2 flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Expiry Date (Optional)
                </label>
                <input
                  type="date"
                  value={expiryDate}
                  onChange={e => setExpiryDate(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                  disabled={saving === service}
                />
              </div>
            )}

            <div className="flex gap-2">
              <motion.button
                onClick={() => handleSaveKey(service, apiKey, expiryDate)}
                disabled={saving === service || !apiKey.trim()}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving === service ? 'Saving...' : status?.configured ? 'Update Key' : 'Save Key'}
              </motion.button>

              {status?.configured && (
                <motion.button
                  onClick={() => handleRemoveKey(service)}
                  disabled={saving === service}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="px-4 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-semibold text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Remove
                </motion.button>
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Alerts */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
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
            exit={{ opacity: 0, y: -10 }}
            className="p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3"
          >
            <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-green-400 text-sm font-medium">Success</p>
              <p className="text-green-400/80 text-sm mt-1">{success}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
          <p className="text-white/60 mt-4">Loading API configuration...</p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          {/* Helius */}
          {renderServiceCard(
            'helius',
            'Helius',
            apiStatus?.helius,
            heliusKey,
            setHeliusKey,
            showHelius,
            setShowHelius,
            heliusExpiry,
            setHeliusExpiry,
            <Server className="w-5 h-5" />,
            'from-purple-500 to-pink-500'
          )}

          {/* Birdeye */}
          {renderServiceCard(
            'birdeye',
            'Birdeye',
            apiStatus?.birdeye,
            birdeyeKey,
            setBirdeyeKey,
            showBirdeye,
            setShowBirdeye,
            birdeyeExpiry,
            setBirdeyeExpiry,
            <TrendingUp className="w-5 h-5" />,
            'from-blue-500 to-cyan-500'
          )}

          {/* Jupiter */}
          {renderServiceCard(
            'jupiter',
            'Jupiter',
            apiStatus?.jupiter,
            jupiterKey,
            setJupiterKey,
            showJupiter,
            setShowJupiter,
            jupiterExpiry,
            setJupiterExpiry,
            <Activity className="w-5 h-5" />,
            'from-emerald-500 to-teal-500'
          )}

          {/* Solana RPC */}
          {renderServiceCard(
            'solana_rpc',
            'Solana RPC',
            apiStatus?.solanaRpc,
            solanaRpc,
            setSolanaRpc,
            false,
            () => {},
            '',
            () => {},
            <Key className="w-5 h-5" />,
            'from-orange-500 to-yellow-500'
          )}
        </div>
      )}

      {/* Information box */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-6">
        <h3 className="font-semibold mb-3 flex items-center gap-2">
          <Shield className="w-5 h-5 text-purple-400" />
          About API Keys
        </h3>
        <div className="space-y-2 text-sm text-white/60">
          <p>• All API keys are encrypted and stored securely in your system keychain</p>
          <p>• Default keys are provided for testing but may have shared rate limits</p>
          <p>• Custom keys give you dedicated rate limits and better performance</p>
          <p>• Set expiry dates to receive reminders before keys expire</p>
          <p>• Test connections regularly to ensure services are working correctly</p>
        </div>
      </div>
    </div>
  );
}
