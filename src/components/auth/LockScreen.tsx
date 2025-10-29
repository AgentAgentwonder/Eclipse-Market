import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Lock, Shield, AlertCircle } from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';

interface BiometricStatus {
  available: boolean;
  enrolled: boolean;
  fallbackConfigured: boolean;
  platform: 'WindowsHello' | 'TouchId' | 'PasswordOnly';
}

interface LockScreenProps {
  onUnlock: () => void;
}

export function LockScreen({ onUnlock }: LockScreenProps) {
  const [status, setStatus] = useState<BiometricStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showPasswordFallback, setShowPasswordFallback] = useState(false);
  const [password, setPassword] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    checkStatusAndVerify();
  }, []);

  const checkStatusAndVerify = async () => {
    try {
      const biometricStatus = await invoke<BiometricStatus>('biometric_get_status');
      setStatus(biometricStatus);

      if (biometricStatus.enrolled && biometricStatus.available) {
        await attemptBiometricVerification();
      } else if (biometricStatus.enrolled && !biometricStatus.available) {
        setShowPasswordFallback(true);
      } else {
        onUnlock();
      }
    } catch (err) {
      console.error('Failed to check biometric status:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const attemptBiometricVerification = async () => {
    setVerifying(true);
    setError(null);
    try {
      await invoke('biometric_verify');
      onUnlock();
    } catch (err) {
      console.error('Biometric verification failed:', err);
      setError(String(err));
      setShowPasswordFallback(true);
    } finally {
      setVerifying(false);
    }
  };

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;

    setVerifying(true);
    setError(null);
    try {
      await invoke('biometric_verify_fallback', { password });
      onUnlock();
    } catch (err) {
      console.error('Password verification failed:', err);
      setError('Invalid password');
      setPassword('');
    } finally {
      setVerifying(false);
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
        return 'Password';
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Shield className="w-10 h-10 animate-pulse" />
          </div>
          <p className="text-xl text-white/80">Initializing security...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[100] flex items-center justify-center bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="w-full max-w-md px-6"
        >
          <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-8 shadow-2xl">
            <div className="text-center mb-8">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', damping: 10 }}
                className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/50"
              >
                <Lock className="w-10 h-10" />
              </motion.div>
              <h2 className="text-3xl font-bold text-white mb-2">Eclipse Market Pro</h2>
              <p className="text-white/60">
                {showPasswordFallback
                  ? 'Enter your password'
                  : `Authenticate with ${getPlatformName()}`}
              </p>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 text-sm font-medium">Authentication Failed</p>
                  <p className="text-red-400/80 text-xs mt-1">{error}</p>
                </div>
              </motion.div>
            )}

            {!showPasswordFallback && status?.available && (
              <div className="space-y-4">
                <motion.button
                  onClick={attemptBiometricVerification}
                  disabled={verifying}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Verifying...' : `Unlock with ${getPlatformName()}`}
                </motion.button>
                <button
                  onClick={() => setShowPasswordFallback(true)}
                  className="w-full py-2 text-white/60 hover:text-white text-sm transition-colors"
                >
                  Use password instead
                </button>
              </div>
            )}

            {showPasswordFallback && (
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <input
                    type="password"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="Enter your password"
                    className="w-full px-4 py-3 bg-slate-900/50 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                    autoFocus
                    disabled={verifying}
                  />
                </div>
                <motion.button
                  type="submit"
                  disabled={!password.trim() || verifying}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-4 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {verifying ? 'Verifying...' : 'Unlock'}
                </motion.button>
                {status?.available && !error && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordFallback(false);
                      setError(null);
                      setPassword('');
                    }}
                    className="w-full py-2 text-white/60 hover:text-white text-sm transition-colors"
                  >
                    Try {getPlatformName()} again
                  </button>
                )}
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
