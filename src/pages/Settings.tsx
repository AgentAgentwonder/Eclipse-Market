import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Lock, Fingerprint, AlertCircle, CheckCircle, Eye, EyeOff, Usb } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { BIOMETRIC_STATUS_EVENT } from '../constants/events';
import HardwareWalletManager from '../components/wallet/HardwareWalletManager';
import { useWalletStore } from '../store/walletStore';

interface BiometricStatus {
  available: boolean;
  enrolled: boolean;
  fallbackConfigured: boolean;
  platform: 'WindowsHello' | 'TouchId' | 'PasswordOnly';
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

  const { hardwareDevices, activeHardwareDevice, signingMethod } = useWalletStore();

  useEffect(() => {
    loadStatus();
  }, []);

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
    </div>
  );
}

export default Settings;
