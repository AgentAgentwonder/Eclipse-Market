import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Fingerprint, AlertCircle, AlertTriangle, CheckCircle, Eye, EyeOff, Usb, TrendingUp, Zap, FileText, Server, Bell } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { BIOMETRIC_STATUS_EVENT } from '../constants/events';
import HardwareWalletManager from '../components/wallet/HardwareWalletManager';
import { useWalletStore } from '../store/walletStore';
import { useTradingSettingsStore } from '../store/tradingSettingsStore';
import { usePaperTradingStore } from '../store/paperTradingStore';
import { ActivityLog } from './Settings/ActivityLog';
import { EventAuditLog } from './Settings/EventAuditLog';
import { PerformanceDashboard } from './Settings/PerformanceDashboard';
import { CacheSettings } from '../components/CacheSettings';
import { ApiSettings } from './Settings/ApiSettings';
import AlertSettings from './Settings/AlertSettings';
import { StorageSettings } from './Settings/StorageSettings';

interface BiometricStatus {
  available: boolean;
  enrolled: boolean;
  fallbackConfigured: boolean;
  platform: 'WindowsHello' | 'TouchId' | 'PasswordOnly';
}

interface CongestionData {
  level: 'low' | 'medium' | 'high';
  averageFee: number;
  medianFee: number;
  percentile75: number;
  percentile95: number;
  timestamp: number;
}

interface PriorityFeeEstimate {
  preset: 'slow' | 'normal' | 'fast';
  microLamports: number;
  estimatedConfirmationTime: string;
}

function Settings() {
  const [status, setStatus] = useState<BiometricStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [enrollPassword, setEnrollPassword] = useState('');
  const [enrollConfirmPassword, setEnrollConfirmPassword] = useState('');
  const [showEnrollPassword, setShowEnrollPassword] = useState(false);
  const [showEnrollConfirmPassword, setShowEnrollConfirmPassword] = useState(false);
  const [enrolling, setEnrolling] = useState(false);
  const [disabling, setDisabling] = useState(false);
  const [showHardwareManager, setShowHardwareManager] = useState(false);
  const [congestionData, setCongestionData] = useState<CongestionData | null>(null);
  const [priorityEstimates, setPriorityEstimates] = useState<PriorityFeeEstimate[]>([]);
  const [networkLoading, setNetworkLoading] = useState(false);
  const [networkError, setNetworkError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'security' | 'hardware' | 'trading' | 'activity' | 'alerts'>('security');
  const [paperModeDialogOpen, setPaperModeDialogOpen] = useState(false);
  const [paperModeTarget, setPaperModeTarget] = useState<'paper' | 'live'>('paper');
  const [acknowledgeLiveTrading, setAcknowledgeLiveTrading] = useState(false);

  const { hardwareDevices, activeHardwareDevice, signingMethod } = useWalletStore();
  
  const {
    slippage,
    setSlippageTolerance,
    setSlippageAutoAdjust,
    setSlippageMaxTolerance,
    setSlippageRejectAbove,
    mevProtection,
    toggleMEVProtection,
    setJitoEnabled,
    setPrivateRPCEnabled,
    gasOptimization,
    setPriorityFeePreset,
    setCustomPriorityFee,
    tradeHistory,
    updateCongestionData,
  } = useTradingSettingsStore();

  const { isPaperMode, togglePaperMode } = usePaperTradingStore();

  useEffect(() => {
    loadStatus();
    loadNetworkData();
  }, []);

  const averageGasCost = tradeHistory.length
    ? tradeHistory.reduce((sum, trade) => sum + trade.gasCost, 0) / tradeHistory.length
    : 0;

  const latestTrade = tradeHistory[0];

  const loadNetworkData = async () => {
    setNetworkLoading(true);
    setNetworkError(null);
    try {
      const [congestion, estimates] = await Promise.all([
        invoke<CongestionData>('get_network_congestion'),
        invoke<PriorityFeeEstimate[]>('get_priority_fee_estimates'),
      ]);
      setCongestionData(congestion);
      setPriorityEstimates(estimates);
      
      // Update congestion data in store
      updateCongestionData(
        congestion.level,
        congestion.averageFee,
        congestion.medianFee
      );
    } catch (err) {
      console.error('Failed to load network data:', err);
      setNetworkError(String(err));
    } finally {
      setNetworkLoading(false);
    }
  };

  const loadStatus = async () => {
    setLoading(true);
    setError(null);
    try {
      const biometricStatus = await invoke<BiometricStatus>('biometric_get_status');
      setStatus(biometricStatus);
    } catch (err) {
      console.error('Failed to load biometric status:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleEnroll = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!enrollPassword || !enrollConfirmPassword) {
      setError('Please enter a fallback password');
      return;
    }
    if (enrollPassword !== enrollConfirmPassword) {
      setError('Passwords do not match');
      return;
    }
    if (enrollPassword.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setEnrolling(true);
    setError(null);
    setSuccess(null);

    try {
      const newStatus = await invoke<BiometricStatus>('biometric_enroll', {
        fallbackPassword: enrollPassword,
      });
      setStatus(newStatus);
      setSuccess('Biometric authentication enrolled successfully!');
      setEnrollPassword('');
      setEnrollConfirmPassword('');
      
      window.dispatchEvent(
        new CustomEvent(BIOMETRIC_STATUS_EVENT, { detail: newStatus })
      );
    } catch (err) {
      console.error('Failed to enroll biometric:', err);
      setError(String(err));
    } finally {
      setEnrolling(false);
    }
  };

  const handleDisable = async () => {
    if (!window.confirm('Are you sure you want to disable biometric authentication?')) {
      return;
    }

    setDisabling(true);
    setError(null);
    setSuccess(null);

    try {
      const newStatus = await invoke<BiometricStatus>('biometric_disable');
      setStatus(newStatus);
      setSuccess('Biometric authentication disabled');

      window.dispatchEvent(
        new CustomEvent(BIOMETRIC_STATUS_EVENT, { detail: newStatus })
      );
    } catch (err) {
      console.error('Failed to disable biometric:', err);
      setError(String(err));
    } finally {
      setDisabling(false);
    }
  };

  const getPlatformName = () => {
    if (!status) return 'Biometric';
    switch (status.platform) {
      case 'WindowsHello':
        return 'Windows Hello';
      case 'TouchId':
        return 'Touch ID';
      default:
        return 'Password Only';
    }
  };

  const getPlatformIcon = () => {
    if (!status) return <Shield className="w-6 h-6" />;
    switch (status.platform) {
      case 'WindowsHello':
        return <Shield className="w-6 h-6" />;
      case 'TouchId':
        return <Fingerprint className="w-6 h-6" />;
      default:
        return <Lock className="w-6 h-6" />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2">Settings</h1>
          <p className="text-white/60">Manage your security and preferences</p>
        </div>

        {/* Security Section */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <Shield className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Security</h2>
              <p className="text-white/60 text-sm">Biometric authentication settings</p>
            </div>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block w-8 h-8 border-4 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
              <p className="text-white/60 mt-4">Loading security settings...</p>
            </div>
          ) : (
            <>
              {/* Status Display */}
              <div className="mb-6 p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getPlatformIcon()}
                    <div>
                      <h3 className="font-semibold">{getPlatformName()}</h3>
                      <p className="text-sm text-white/60">
                        {status?.available
                          ? status.enrolled
                            ? 'Enrolled and active'
                            : 'Available for enrollment'
                          : 'Not available on this system'}
                      </p>
                    </div>
                  </div>
                  <div
                    className={`px-3 py-1 rounded-lg text-sm font-medium ${
                      status?.enrolled
                        ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                        : status?.available
                        ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                        : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                    }`}
                  >
                    {status?.enrolled ? 'Enrolled' : status?.available ? 'Available' : 'Unavailable'}
                  </div>
                </div>

                {status?.platform === 'PasswordOnly' && (
                  <div className="flex items-start gap-3 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                    <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-blue-400">
                      <p className="font-medium mb-1">Platform Information</p>
                      <p className="text-blue-400/80">
                        Biometric authentication is not available on Linux. Only password-based authentication is supported.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Alerts */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
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
                  className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-start gap-3"
                >
                  <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-green-400 text-sm font-medium">Success</p>
                    <p className="text-green-400/80 text-sm mt-1">{success}</p>
                  </div>
                </motion.div>
              )}

              {/* Enrollment Form */}
              {status?.available && !status.enrolled && (
                <form onSubmit={handleEnroll} className="space-y-4">
                  <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                    <h3 className="font-semibold mb-2">Enable Biometric Authentication</h3>
                    <p className="text-sm text-white/60 mb-4">
                      Set a fallback password that can be used if biometric authentication fails or is unavailable.
                    </p>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Fallback Password</label>
                    <div className="relative">
                      <input
                        type={showEnrollPassword ? 'text' : 'password'}
                        value={enrollPassword}
                        onChange={(e) => setEnrollPassword(e.target.value)}
                        placeholder="Enter password (min. 8 characters)"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors pr-12"
                        disabled={enrolling}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEnrollPassword(!showEnrollPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                      >
                        {showEnrollPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Confirm Password</label>
                    <div className="relative">
                      <input
                        type={showEnrollConfirmPassword ? 'text' : 'password'}
                        value={enrollConfirmPassword}
                        onChange={(e) => setEnrollConfirmPassword(e.target.value)}
                        placeholder="Confirm password"
                        className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors pr-12"
                        disabled={enrolling}
                      />
                      <button
                        type="button"
                        onClick={() => setShowEnrollConfirmPassword(!showEnrollConfirmPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/60 transition-colors"
                      >
                        {showEnrollConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>

                  <motion.button
                    type="submit"
                    disabled={enrolling || !enrollPassword || !enrollConfirmPassword}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {enrolling ? 'Enrolling...' : `Enable ${getPlatformName()}`}
                  </motion.button>
                </form>
              )}

              {/* Disable Button */}
              {status?.enrolled && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                    <h3 className="font-semibold mb-2 text-green-400">Biometric Authentication Active</h3>
                    <p className="text-sm text-white/60">
                      Your app is protected with {getPlatformName()}. You will be prompted to authenticate when launching the app.
                    </p>
                  </div>

                  <motion.button
                    onClick={handleDisable}
                    disabled={disabling}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="w-full py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-semibold text-red-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {disabling ? 'Disabling...' : 'Disable Biometric Authentication'}
                  </motion.button>
                </div>
              )}
            </>
          )}
        </div>

        {/* API Settings */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <Server className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">API Configuration</h2>
              <p className="text-white/60 text-sm">Manage API keys and service connections</p>
            </div>
          </div>

          <ApiSettings />
        </div>

        {/* Price Alerts & Watchlists */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center shadow-lg shadow-amber-500/30">
              <Bell className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Price Alerts</h2>
              <p className="text-white/60 text-sm">Manage watchlists and notification preferences</p>
            </div>
          </div>

          <AlertSettings />
        </div>

        {/* Hardware Wallets */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
              <Usb className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Hardware Wallets</h2>
              <p className="text-white/60 text-sm">Manage Ledger and Trezor devices</p>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-lg">Default Signing</h3>
                  <p className="text-sm text-white/60">Current signing method preference</p>
                </div>
                <div
                  className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase tracking-wide ${
                    signingMethod === 'hardware'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                      : 'bg-slate-700/50 text-white/60 border border-purple-500/10'
                  }`}
                >
                  {signingMethod}
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-white/60">Detected devices</span>
                  <span className="font-medium">{hardwareDevices.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-white/60">Active device</span>
                  <span className="font-medium">
                    {activeHardwareDevice ? activeHardwareDevice.productName : 'None'}
                  </span>
                </div>
              </div>

              <motion.button
                onClick={() => setShowHardwareManager(true)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/30"
              >
                Manage Hardware Wallets
              </motion.button>
            </div>

            <div className="p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-3">
              <h3 className="font-semibold text-lg">Active Device</h3>
              {activeHardwareDevice ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Device</span>
                    <span className="font-medium">{activeHardwareDevice.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Type</span>
                    <span className="font-medium capitalize">{activeHardwareDevice.deviceType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Status</span>
                    <span
                      className={
                        activeHardwareDevice.connected
                          ? 'font-medium text-emerald-400'
                          : 'font-medium text-yellow-400'
                      }
                    >
                      {activeHardwareDevice.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  {activeHardwareDevice.address && (
                    <div className="mt-2 p-3 bg-slate-900 rounded-xl">
                      <p className="text-xs text-white/50 mb-1">Last known address</p>
                      <p className="text-xs font-mono break-all text-white/80">
                        {activeHardwareDevice.address}
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-4 bg-slate-900 rounded-xl border border-purple-500/10 text-center">
                  <p className="text-sm text-white/60">No hardware wallet connected.</p>
                  <p className="text-xs text-white/40 mt-1">Connect a Ledger or Trezor device to get started.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Trading Settings */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/30">
              <TrendingUp className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Trading Execution</h2>
              <p className="text-white/60 text-sm">Paper mode, slippage, MEV protection, and gas optimization</p>
            </div>
          </div>

          {/* Paper Trading Mode */}
          <div className="mb-6 p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-orange-400" />
                  Paper Trading Mode
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Practice trading with virtual balance
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={isPaperMode}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setPaperModeTarget('paper');
                      setPaperModeDialogOpen(true);
                    } else {
                      setPaperModeTarget('live');
                      setPaperModeDialogOpen(true);
                    }
                  }}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-orange-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-orange-500"></div>
              </label>
            </div>

            {isPaperMode && (
              <div className="space-y-3 pl-7">
                <div className="p-3 bg-orange-500/10 border border-orange-500/20 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div className="text-sm text-orange-400">
                      <p className="font-medium mb-1">Paper Mode Active</p>
                      <p className="text-orange-400/80">
                        No real transactions will occur. All trades are simulated with virtual balance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Slippage Configuration */}
          <div className="mb-6 p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-4">
            <h3 className="font-semibold text-lg">Slippage Tolerance</h3>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Default Tolerance (bps)
              </label>
              <input
                type="number"
                value={slippage.tolerance}
                onChange={(e) => setSlippageTolerance(parseInt(e.target.value) || 50)}
                className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <div className="text-xs text-white/60 mt-1">
                {(slippage.tolerance / 100).toFixed(2)}% slippage tolerance
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Maximum Tolerance (bps)
              </label>
              <input
                type="number"
                value={slippage.maxTolerance}
                onChange={(e) => setSlippageMaxTolerance(parseInt(e.target.value) || 1000)}
                className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
              />
              <div className="text-xs text-white/60 mt-1">
                {(slippage.maxTolerance / 100).toFixed(2)}% maximum allowed
              </div>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={slippage.autoAdjust}
                onChange={(e) => setSlippageAutoAdjust(e.target.checked)}
                className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
              />
              <div>
                <div className="font-medium">Auto-adjust for volatility</div>
                <div className="text-xs text-white/60">
                  Dynamically adjust slippage based on market conditions
                </div>
              </div>
            </label>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={slippage.rejectAboveThreshold}
                onChange={(e) => setSlippageRejectAbove(e.target.checked)}
                className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
              />
              <div>
                <div className="font-medium">Block trades exceeding threshold</div>
                <div className="text-xs text-white/60">
                  Automatically reject trades that exceed maximum tolerance
                </div>
              </div>
            </label>
          </div>

          {/* MEV Protection */}
          <div className="mb-6 p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-lg flex items-center gap-2">
                  <Shield className="w-5 h-5 text-green-400" />
                  MEV Protection
                </h3>
                <p className="text-sm text-white/60 mt-1">
                  Protect your trades from MEV attacks
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={mevProtection.enabled}
                  onChange={(e) => toggleMEVProtection(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-500/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
              </label>
            </div>

            {mevProtection.enabled && (
              <div className="space-y-3 pl-7">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mevProtection.useJito}
                    onChange={(e) => setJitoEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium">Use Jito bundles</div>
                    <div className="text-xs text-white/60">
                      Submit transactions via Jito block engine
                    </div>
                  </div>
                </label>

                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={mevProtection.usePrivateRPC}
                    onChange={(e) => setPrivateRPCEnabled(e.target.checked)}
                    className="w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
                  />
                  <div>
                    <div className="font-medium">Use private RPC</div>
                    <div className="text-xs text-white/60">
                      Route through private mempool
                    </div>
                  </div>
                </label>

                <div className="grid grid-cols-2 gap-3 mt-4">
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-xs text-white/60 mb-1">Protected Trades</div>
                    <div className="text-2xl font-bold text-green-400">
                      {mevProtection.protectedTrades}
                    </div>
                  </div>
                  <div className="p-3 bg-slate-800/50 rounded-lg">
                    <div className="text-xs text-white/60 mb-1">Est. Savings</div>
                    <div className="text-2xl font-bold text-green-400">
                      {mevProtection.estimatedSavings.toFixed(4)} SOL
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Gas Optimization */}
          <div className="p-4 bg-slate-900/50 rounded-2xl border border-purple-500/10 space-y-4">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-lg">Gas Optimization</h3>
            </div>

            {networkError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-sm text-red-400">
                Failed to load network data. Please refresh.
              </div>
            )}

            {networkLoading ? (
              <div className="text-center py-4">
                <div className="inline-block w-6 h-6 border-2 border-purple-500/30 border-t-purple-500 rounded-full animate-spin"></div>
                <p className="text-sm text-white/60 mt-2">Loading network data...</p>
              </div>
            ) : (
              <>
                {congestionData && (
                  <div className="p-3 bg-slate-800/50 rounded-lg mb-3">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-white/60">Network Congestion</span>
                      <span
                        className={`px-3 py-1 rounded-lg text-xs font-semibold uppercase ${
                          congestionData.level === 'high'
                            ? 'bg-red-500/20 text-red-400 border border-red-500/30'
                            : congestionData.level === 'medium'
                            ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                            : 'bg-green-500/20 text-green-400 border border-green-500/30'
                        }`}
                      >
                        {congestionData.level}
                      </span>
                    </div>
                    <div className="text-xs text-white/60">
                      Avg fee: {(congestionData.averageFee / 1e6).toFixed(4)} SOL
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium mb-3">
                    Priority Fee Preset
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {['slow', 'normal', 'fast'].map((preset) => {
                      const estimate = priorityEstimates.find((e) => e.preset === preset);
                      return (
                        <button
                          key={preset}
                          onClick={() => setPriorityFeePreset(preset as any)}
                          className={`p-3 rounded-xl border transition-all ${
                            gasOptimization.priorityFeePreset === preset
                              ? 'bg-purple-500/20 border-purple-500/50 text-white'
                              : 'bg-slate-800/50 border-purple-500/10 text-white/70 hover:border-purple-500/30'
                          }`}
                        >
                          <div className="font-semibold capitalize">{preset}</div>
                          {estimate && (
                            <>
                              <div className="text-xs text-white/60 mt-1">
                                {estimate.estimatedConfirmationTime}
                              </div>
                              <div className="text-xs text-white/40 mt-1">
                                {(estimate.microLamports / 1e6).toFixed(4)} SOL
                              </div>
                            </>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {gasOptimization.priorityFeePreset === 'custom' && (
                  <div className="mt-3">
                    <label className="block text-sm font-medium mb-2">
                      Custom Priority Fee (micro lamports)
                    </label>
                    <input
                      type="number"
                      value={gasOptimization.customPriorityFee || ''}
                      onChange={(e) => setCustomPriorityFee(parseInt(e.target.value) || 0)}
                      className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                      placeholder="Enter custom fee"
                    />
                  </div>
                )}

                {tradeHistory.length > 0 && (
                  <div className="grid grid-cols-2 gap-3 mt-4">
                    <div className="p-3 bg-slate-800/50 rounded-lg">
                      <div className="text-xs text-white/60 mb-1">Avg Gas Cost</div>
                      <div className="font-bold text-white">
                        {averageGasCost.toFixed(6)} SOL
                      </div>
                    </div>
                    {latestTrade && (
                      <div className="p-3 bg-slate-800/50 rounded-lg">
                        <div className="text-xs text-white/60 mb-1">Last Trade</div>
                        <div className="font-bold text-white">
                          {latestTrade.gasCost.toFixed(6)} SOL
                        </div>
                      </div>
                    )}
                  </div>
                )}

                <motion.button
                  onClick={loadNetworkData}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full mt-3 py-2 bg-slate-700/50 hover:bg-slate-700 rounded-xl font-medium text-sm transition-colors"
                >
                  Refresh Network Data
                </motion.button>
              </>
            )}
          </div>
        </div>

        {/* Performance Dashboard */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <PerformanceDashboard />
        </div>

        {/* Activity Logging */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/30">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Wallet Activity</h2>
              <p className="text-white/60 text-sm">Review recent wallet actions and investigate alerts</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-purple-500/10 rounded-2xl p-4">
            <ActivityLog />
          </div>
        </div>

        {/* Event Sourcing Audit Trail */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6 space-y-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow-lg shadow-cyan-500/30">
              <Zap className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-bold">Event Sourcing Audit Trail</h2>
              <p className="text-white/60 text-sm">Immutable event log for all state changes with replay capability</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-purple-500/10 rounded-2xl p-4">
            <EventAuditLog />
          </div>
        </div>

        {/* Platform Requirements */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          <h3 className="font-semibold mb-4">Platform Requirements</h3>
          <div className="space-y-3 text-sm text-white/60">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Windows Hello</p>
                <p>Requires Windows 10 or later with compatible biometric hardware (fingerprint reader, facial recognition camera, or PIN)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Fingerprint className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Touch ID</p>
                <p>Requires macOS with Touch ID sensor (MacBook Pro, MacBook Air, iMac, or Magic Keyboard with Touch ID)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Lock className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-white">Linux</p>
                <p>Password-based authentication only. Biometric authentication is not currently supported on Linux systems.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <AnimatePresence>
        {showHardwareManager && <HardwareWalletManager onClose={() => setShowHardwareManager(false)} />}
      </AnimatePresence>

      {/* Paper Mode Confirmation Modal */}
      <AnimatePresence>
        {paperModeDialogOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
              onClick={() => {
                setPaperModeDialogOpen(false);
                setAcknowledgeLiveTrading(false);
              }}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-md"
            >
              <div className={`bg-slate-900 border rounded-2xl shadow-2xl ${
                paperModeTarget === 'live' 
                  ? 'border-red-500/30' 
                  : 'border-orange-500/30'
              }`}>
                <div className={`p-6 border-b ${
                  paperModeTarget === 'live'
                    ? 'border-red-500/20'
                    : 'border-orange-500/20'
                }`}>
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                      paperModeTarget === 'live'
                        ? 'bg-red-500/20'
                        : 'bg-orange-500/20'
                    }`}>
                      {paperModeTarget === 'live' ? (
                        <AlertTriangle className="w-5 h-5 text-red-400" />
                      ) : (
                        <FileText className="w-5 h-5 text-orange-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold">
                        {paperModeTarget === 'paper' ? 'Enable Paper Trading Mode?' : 'Switch to Live Trading?'}
                      </h3>
                      <p className="text-sm text-white/60">
                        {paperModeTarget === 'paper' 
                          ? 'Practice trading with virtual balance'
                          : 'Execute real trades with real money'
                        }
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6 space-y-4">
                  {paperModeTarget === 'paper' ? (
                    <>
                      <div className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl">
                        <div className="flex items-start gap-2">
                          <CheckCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm">
                            <p className="font-medium text-orange-400 mb-2">Paper Trading Features:</p>
                            <ul className="space-y-1 text-orange-400/80">
                              <li>• Virtual $10,000 starting balance</li>
                              <li>• Practice trading strategies safely</li>
                              <li>• Track performance metrics</li>
                              <li>• No real money at risk</li>
                              <li>• Switch back to live anytime</li>
                            </ul>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-white/60">
                        All trades will be simulated. No real transactions will occur.
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <div className="flex items-start gap-2">
                          <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div className="text-sm text-red-400">
                            <p className="font-medium mb-1">Warning: Real Money at Risk</p>
                            <p className="text-red-400/80">
                              Switching to live trading will execute real transactions with real money. 
                              You will be responsible for all trades and fees.
                            </p>
                          </div>
                        </div>
                      </div>

                      <label className="flex items-start gap-3 cursor-pointer p-3 bg-slate-800/50 rounded-xl">
                        <input
                          type="checkbox"
                          checked={acknowledgeLiveTrading}
                          onChange={(e) => setAcknowledgeLiveTrading(e.target.checked)}
                          className="mt-1 w-5 h-5 rounded border-purple-500/30 bg-slate-800 text-purple-500 focus:ring-purple-500"
                        />
                        <div className="text-sm">
                          <p className="font-medium text-white">I understand and acknowledge</p>
                          <p className="text-white/60 mt-1">
                            I understand that real trades will execute and I am responsible for all transactions.
                          </p>
                        </div>
                      </label>
                    </>
                  )}

                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={() => {
                        setPaperModeDialogOpen(false);
                        setAcknowledgeLiveTrading(false);
                      }}
                      className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-semibold transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        togglePaperMode(paperModeTarget === 'paper');
                        setPaperModeDialogOpen(false);
                        setAcknowledgeLiveTrading(false);
                        setSuccess(
                          paperModeTarget === 'paper'
                            ? 'Paper trading mode enabled'
                            : 'Switched to live trading mode'
                        );
                        setTimeout(() => setSuccess(null), 3000);
                      }}
                      disabled={paperModeTarget === 'live' && !acknowledgeLiveTrading}
                      className={`flex-1 py-3 rounded-xl font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                        paperModeTarget === 'live'
                          ? 'bg-red-500 hover:bg-red-600'
                          : 'bg-gradient-to-r from-orange-500 to-yellow-500 hover:from-orange-600 hover:to-yellow-600'
                      }`}
                    >
                      {paperModeTarget === 'paper' ? 'Enable Paper Mode' : 'Switch to Live Trading'}
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Storage Management */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
        <StorageSettings />
      </div>

      {/* Cache Management */}
      <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
        <CacheSettings />
      </div>
    </div>
  );
}

export default Settings;
