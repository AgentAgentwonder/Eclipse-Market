import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Usb, CheckCircle, AlertCircle, Loader2, Shield, Eye, X } from 'lucide-react';
import { useLedger } from '../../hooks/useLedger';
import { useWalletStore } from '../../store/walletStore';

interface LedgerConnectProps {
  onClose?: () => void;
  onConnected?: (address: string, publicKey: string) => void;
}

function LedgerConnect({ onClose, onConnected }: LedgerConnectProps) {
  const { device, isConnecting, isConnected, error, connect, disconnect, getAddress, clearError } =
    useLedger();

  const { defaultDerivationPath, setActiveHardwareDevice, setSigningMethod } = useWalletStore();

  const [step, setStep] = useState<'instructions' | 'connecting' | 'address' | 'complete'>(
    'instructions'
  );
  const [address, setAddress] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [showAddress, setShowAddress] = useState(false);

  useEffect(() => {
    if (isConnected && step === 'connecting') {
      setStep('address');
      handleGetAddress();
    }
  }, [isConnected, step]);

  useEffect(() => {
    if (error) {
      setStep('instructions');
    }
  }, [error]);

  const handleConnect = async () => {
    clearError();
    setStep('connecting');
    const connectedDevice = await connect();
    if (!connectedDevice) {
      setStep('instructions');
    }
  };

  const handleGetAddress = async () => {
    const result = await getAddress(defaultDerivationPath, false);
    if (result) {
      setAddress(result.address);
      setPublicKey(result.publicKey);
      setStep('complete');
      setActiveHardwareDevice({
        deviceId: device?.deviceId || '',
        deviceType: 'ledger',
        productName: device?.productName || 'Ledger Device',
        manufacturer: device?.manufacturer || 'Ledger',
        connected: true,
        firmwareVersion: device?.firmwareVersion || null,
        address: result.address,
      });
      setSigningMethod('hardware');
      if (onConnected) {
        onConnected(result.address, result.publicKey);
      }
    }
  };

  const handleVerifyAddress = async () => {
    setShowAddress(true);
    await getAddress(defaultDerivationPath, true);
  };

  const handleDisconnect = async () => {
    await disconnect();
    setStep('instructions');
    setAddress(null);
    setPublicKey(null);
    setShowAddress(false);
    if (onClose) {
      onClose();
    }
  };

  const renderStepContent = () => {
    switch (step) {
      case 'instructions':
        return (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <Usb className="w-16 h-16 mx-auto mb-4 text-purple-400" />
              <h3 className="text-2xl font-bold mb-2">Connect Ledger Device</h3>
              <p className="text-white/60">
                Follow these steps to connect your Ledger hardware wallet
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-xl border border-purple-500/20">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold">
                  1
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Connect Your Device</h4>
                  <p className="text-sm text-white/60">
                    Plug your Ledger device into your computer via USB
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-xl border border-purple-500/20">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold">
                  2
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Unlock Your Device</h4>
                  <p className="text-sm text-white/60">Enter your PIN code on the Ledger device</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-4 bg-slate-800/50 rounded-xl border border-purple-500/20">
                <div className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center text-sm font-bold">
                  3
                </div>
                <div>
                  <h4 className="font-semibold mb-1">Open Solana App</h4>
                  <p className="text-sm text-white/60">
                    Navigate to and open the Solana app on your Ledger device
                  </p>
                </div>
              </div>
            </div>

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
              >
                <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 text-sm font-medium">Connection Error</p>
                  <p className="text-red-400/80 text-sm mt-1">{error}</p>
                </div>
              </motion.div>
            )}

            <div className="flex gap-3">
              {onClose && (
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-6 py-3 bg-slate-800 border border-purple-500/20 rounded-xl font-semibold"
                >
                  Cancel
                </motion.button>
              )}
              <motion.button
                onClick={handleConnect}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={isConnecting}
                className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold shadow-lg shadow-purple-500/30 disabled:opacity-50"
              >
                Connect Ledger
              </motion.button>
            </div>
          </motion.div>
        );

      case 'connecting':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <Loader2 className="w-16 h-16 mx-auto mb-6 text-purple-400 animate-spin" />
            <h3 className="text-xl font-bold mb-2">Connecting to Ledger...</h3>
            <p className="text-white/60">Please select your device in the browser prompt</p>
          </motion.div>
        );

      case 'address':
        return (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center py-12"
          >
            <Loader2 className="w-16 h-16 mx-auto mb-6 text-purple-400 animate-spin" />
            <h3 className="text-xl font-bold mb-2">Retrieving Address...</h3>
            <p className="text-white/60">Getting your wallet address from the device</p>
          </motion.div>
        );

      case 'complete':
        return (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="space-y-6"
          >
            <div className="text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', duration: 0.5 }}
              >
                <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
              </motion.div>
              <h3 className="text-2xl font-bold mb-2">Connected Successfully!</h3>
              <p className="text-white/60">Your Ledger device is ready to use</p>
            </div>

            <div className="space-y-4">
              <div className="p-4 bg-slate-800/50 rounded-xl border border-purple-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">Device</span>
                  <span className="font-medium">{device?.productName}</span>
                </div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-white/60">Firmware</span>
                  <span className="font-medium">{device?.firmwareVersion || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Status</span>
                  <span className="flex items-center gap-2 text-green-400 font-medium">
                    <Shield className="w-4 h-4" />
                    Connected
                  </span>
                </div>
              </div>

              {address && (
                <div className="p-4 bg-slate-900/50 rounded-xl border border-purple-500/20">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm text-white/60">Wallet Address</span>
                    <motion.button
                      onClick={handleVerifyAddress}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex items-center gap-1 text-xs text-purple-400 hover:text-purple-300"
                    >
                      <Eye className="w-3 h-3" />
                      Verify on device
                    </motion.button>
                  </div>
                  <p className="text-sm font-mono break-all text-white/80">{address}</p>
                </div>
              )}

              <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <p className="text-blue-400 font-medium mb-1">Security Tips</p>
                    <ul className="text-white/70 space-y-1 text-xs">
                      <li>• Always verify transaction details on your device</li>
                      <li>• Keep your device firmware up to date</li>
                      <li>• Never share your recovery phrase</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <motion.button
                onClick={handleDisconnect}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 px-6 py-3 bg-slate-800 border border-purple-500/20 rounded-xl font-semibold"
              >
                Disconnect
              </motion.button>
              {onClose && (
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold shadow-lg shadow-purple-500/30"
                >
                  Done
                </motion.button>
              )}
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-lg bg-slate-900 rounded-3xl border border-purple-500/20 shadow-2xl overflow-hidden"
      >
        <div className="p-6">
          <AnimatePresence mode="wait">{renderStepContent()}</AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}

export default LedgerConnect;
