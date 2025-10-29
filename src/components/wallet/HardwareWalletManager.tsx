import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { invoke } from '@tauri-apps/api/tauri';
import {
  Usb,
  Plug,
  PlugZap,
  RefreshCcw,
  Settings,
  AlertCircle,
  Loader2,
  CheckCircle,
} from 'lucide-react';
import {
  useWalletStore,
  HardwareWalletDevice,
  SigningMethod,
  DeviceType,
} from '../../store/walletStore';
import HardwareWalletSetup from './HardwareWalletSetup';

interface HardwareWalletManagerProps {
  onClose: () => void;
}

interface FirmwareVersion {
  major: number;
  minor: number;
  patch: number;
}

const DeviceBadge = ({ type }: { type: DeviceType }) => {
  return (
    <span
      className={`px-2 py-1 rounded-full text-xs font-semibold capitalize border ${
        type === 'ledger'
          ? 'border-purple-400 text-purple-300'
          : 'border-emerald-400 text-emerald-300'
      }`}
    >
      {type}
    </span>
  );
};

function HardwareWalletManager({ onClose }: HardwareWalletManagerProps) {
  const {
    hardwareDevices,
    activeHardwareDevice,
    signingMethod,
    defaultDerivationPath,
    setHardwareDevices,
    setActiveHardwareDevice,
    setSigningMethod,
    setDefaultDerivationPath,
  } = useWalletStore();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSetupWizard, setShowSetupWizard] = useState(false);
  const [firmwareVersions, setFirmwareVersions] = useState<Record<string, FirmwareVersion>>({});

  useEffect(() => {
    refreshDevices();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const refreshDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const devices = await invoke<HardwareWalletDevice[]>('list_hardware_wallets');
      setHardwareDevices(devices);
      if (activeHardwareDevice) {
        const updated = devices.find(d => d.deviceId === activeHardwareDevice.deviceId);
        if (updated) {
          setActiveHardwareDevice(updated);
        }
      }
    } catch (err) {
      console.error('Failed to refresh hardware wallets:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const disconnectDevice = async (device: HardwareWalletDevice) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('disconnect_hardware_wallet', {
        deviceId: device.deviceId,
      });
      if (activeHardwareDevice?.deviceId === device.deviceId) {
        setActiveHardwareDevice(null);
        setSigningMethod('software');
      }
      await refreshDevices();
    } catch (err) {
      console.error('Failed to disconnect hardware wallet:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const connectDevice = async (device: HardwareWalletDevice) => {
    setLoading(true);
    setError(null);
    try {
      const connected = await invoke<HardwareWalletDevice>('connect_hardware_wallet', {
        deviceId: device.deviceId,
      });
      setActiveHardwareDevice(connected);
      setSigningMethod('hardware');
      await refreshDevices();
      await loadFirmwareVersion(connected.deviceId);
    } catch (err) {
      console.error('Failed to connect hardware wallet:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadFirmwareVersion = async (deviceId: string) => {
    try {
      const version = await invoke<FirmwareVersion>('get_firmware_version', {
        deviceId,
      });
      setFirmwareVersions(prev => ({ ...prev, [deviceId]: version }));
    } catch (err) {
      console.warn('Failed to fetch firmware version:', err);
    }
  };

  const handleSigningMethodChange = (method: SigningMethod) => {
    setSigningMethod(method);
  };

  const handleDerivationPathChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setDefaultDerivationPath(event.target.value);
  };

  const renderDeviceCard = (device: HardwareWalletDevice) => {
    const isActive = activeHardwareDevice?.deviceId === device.deviceId;
    const firmware = firmwareVersions[device.deviceId];

    return (
      <motion.div
        key={device.deviceId}
        layout
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className={`p-4 rounded-2xl border transition-all ${
          isActive ? 'border-purple-500 bg-purple-500/20' : 'border-purple-500/20 bg-slate-800/50'
        }`}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-900 flex items-center justify-center">
              <Usb className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold leading-none">{device.productName}</h3>
                <DeviceBadge type={device.deviceType} />
              </div>
              <p className="text-sm text-white/60">{device.manufacturer}</p>
              {firmware && (
                <p className="text-xs text-white/40 mt-1">
                  Firmware: {firmware.major}.{firmware.minor}.{firmware.patch}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {device.connected ? (
              <div className="flex items-center gap-2 text-green-400 text-sm font-medium">
                <CheckCircle className="w-4 h-4" />
                Connected
              </div>
            ) : (
              <div className="flex items-center gap-2 text-white/50 text-sm font-medium">
                <Plug className="w-4 h-4" />
                Disconnected
              </div>
            )}
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-4">
          <div className="flex-1">
            <p className="text-xs text-white/40 mb-2">Status</p>
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  device.connected ? 'bg-green-400' : 'bg-yellow-400'
                }`}
              />
              <span className="text-sm text-white/70">
                {device.connected ? 'Ready for signing' : 'Connect to enable signing'}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {device.connected ? (
              <motion.button
                onClick={() => disconnectDevice(device)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-red-500/20 border border-red-500/40 rounded-lg text-sm font-medium text-red-200"
              >
                Disconnect
              </motion.button>
            ) : (
              <motion.button
                onClick={() => connectDevice(device)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-2 bg-purple-500 rounded-lg text-sm font-medium"
              >
                Connect
              </motion.button>
            )}
            <motion.button
              onClick={() => loadFirmwareVersion(device.deviceId)}
              whileHover={{ rotate: 20 }}
              className="p-2 rounded-lg border border-purple-500/30 text-white/70"
            >
              <RefreshCcw className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 p-4 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-slate-900 rounded-3xl border border-purple-500/20 shadow-2xl"
      >
        <div className="p-6 border-b border-purple-500/20 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Hardware Wallet Manager</h2>
            <p className="text-white/60 text-sm mt-1">Manage connected Ledger and Trezor devices</p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              onClick={refreshDevices}
              whileHover={{ rotate: 20 }}
              className="p-2 rounded-xl border border-purple-500/20 text-white/60"
            >
              <RefreshCcw className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => setShowSetupWizard(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold shadow-lg shadow-purple-500/30 flex items-center gap-2"
            >
              <PlugZap className="w-4 h-4" />
              New Device
            </motion.button>
            <motion.button
              onClick={onClose}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-slate-800 rounded-xl font-semibold border border-purple-500/20"
            >
              Close
            </motion.button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 p-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Devices</h3>
              <span className="text-xs text-white/40">{hardwareDevices.length} detected</span>
            </div>

            <div className="space-y-4">
              <AnimatePresence initial={false}>
                {hardwareDevices.length === 0 && !loading ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-6 text-center rounded-2xl border border-purple-500/20 bg-slate-800/50"
                  >
                    <Usb className="w-10 h-10 mx-auto mb-3 text-purple-400" />
                    <p className="text-white/60 mb-3">No hardware wallets detected</p>
                    <motion.button
                      onClick={() => setShowSetupWizard(true)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-4 py-2 bg-purple-500 rounded-lg text-sm font-medium"
                    >
                      Set Up Hardware Wallet
                    </motion.button>
                  </motion.div>
                ) : (
                  hardwareDevices.map(device => renderDeviceCard(device))
                )}
              </AnimatePresence>

              {loading && (
                <div className="flex items-center gap-3 text-white/60 text-sm">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Updating devices...
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 text-sm font-medium">Error</p>
                    <p className="text-red-400/80 text-sm mt-1">{error}</p>
                  </div>
                </motion.div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="p-5 bg-slate-800/50 rounded-2xl border border-purple-500/20">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center">
                  <Settings className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-semibold">Preferences</h3>
                  <p className="text-xs text-white/40">Signing preferences and derivation paths</p>
                </div>
              </div>

              <div className="space-y-3">
                <div>
                  <p className="text-xs text-white/40 mb-1">Default Signing Method</p>
                  <div className="flex gap-2">
                    {(['software', 'hardware'] as SigningMethod[]).map(method => (
                      <motion.button
                        key={method}
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => handleSigningMethodChange(method)}
                        className={`px-3 py-2 rounded-lg text-xs font-semibold uppercase tracking-wide transition-all ${
                          signingMethod === method
                            ? 'bg-purple-500 text-white'
                            : 'bg-slate-900 text-white/60 border border-purple-500/20'
                        }`}
                      >
                        {method}
                      </motion.button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs text-white/40 block mb-1" htmlFor="derivationPath">
                    Default Derivation Path
                  </label>
                  <input
                    id="derivationPath"
                    type="text"
                    value={defaultDerivationPath}
                    onChange={handleDerivationPathChange}
                    className="w-full px-3 py-2 bg-slate-900 border border-purple-500/20 rounded-lg text-sm focus:outline-none focus:border-purple-500/50"
                    placeholder="m/44'/501'/0'/0'"
                  />
                </div>

                <div className="bg-slate-900/80 rounded-xl p-3 text-xs text-white/50 space-y-2">
                  <p className="font-semibold text-white/70">Tips</p>
                  <ul className="space-y-1 list-disc list-inside">
                    <li>Ensure the Solana app is open on your device before signing</li>
                    <li>Use hardware signing for high-value transactions</li>
                    <li>Update firmware regularly for security fixes</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="p-5 bg-slate-800/50 rounded-2xl border border-purple-500/20">
              <h3 className="font-semibold mb-3">Active Device</h3>
              {activeHardwareDevice ? (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/60">Device:</span>
                    <span className="font-medium">{activeHardwareDevice.productName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Type:</span>
                    <span className="font-medium capitalize">
                      {activeHardwareDevice.deviceType}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/60">Status:</span>
                    <span
                      className={`font-medium ${activeHardwareDevice.connected ? 'text-green-400' : 'text-yellow-400'}`}
                    >
                      {activeHardwareDevice.connected ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-white/60">No active hardware wallet selected.</p>
              )}
            </div>
          </div>
        </div>

        {showSetupWizard && (
          <HardwareWalletSetup
            onClose={() => setShowSetupWizard(false)}
            onComplete={device => {
              setShowSetupWizard(false);
              setActiveHardwareDevice(device);
              setSigningMethod('hardware');
              refreshDevices();
            }}
          />
        )}
      </motion.div>
    </div>
  );
}

export default HardwareWalletManager;
