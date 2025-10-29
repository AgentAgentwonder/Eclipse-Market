import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Usb,
  ChevronRight,
  ChevronLeft,
  CheckCircle,
  AlertCircle,
  Loader2,
  Fingerprint,
} from 'lucide-react';
import { invoke } from '@tauri-apps/api/tauri';
import { useWalletStore, HardwareWalletDevice, DeviceType } from '../../store/walletStore';

type SetupStep = 'select' | 'connect' | 'detect' | 'firmware' | 'test' | 'complete';

interface HardwareWalletSetupProps {
  onClose: () => void;
  onComplete?: (device: HardwareWalletDevice) => void;
}

interface FirmwareVersion {
  major: number;
  minor: number;
  patch: number;
}

function HardwareWalletSetup({ onClose, onComplete }: HardwareWalletSetupProps) {
  const [currentStep, setCurrentStep] = useState<SetupStep>('select');
  const [selectedType, setSelectedType] = useState<DeviceType | null>(null);
  const [detectedDevices, setDetectedDevices] = useState<HardwareWalletDevice[]>([]);
  const [selectedDevice, setSelectedDevice] = useState<HardwareWalletDevice | null>(null);
  const [firmwareVersion, setFirmwareVersion] = useState<FirmwareVersion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [testAddress, setTestAddress] = useState<string | null>(null);

  const { setActiveHardwareDevice, setHardwareDevices, setSigningMethod, defaultDerivationPath } =
    useWalletStore();

  const steps: Array<{ id: SetupStep; title: string; description: string }> = [
    { id: 'select', title: 'Select Device', description: 'Choose your hardware wallet type' },
    { id: 'connect', title: 'Connection', description: 'Connect your device' },
    { id: 'detect', title: 'Detection', description: 'Detecting your device' },
    { id: 'firmware', title: 'Firmware Check', description: 'Verify firmware version' },
    { id: 'test', title: 'Test Signing', description: 'Verify device functionality' },
    { id: 'complete', title: 'Complete', description: 'Setup successful!' },
  ];

  const getCurrentStepIndex = () => steps.findIndex(s => s.id === currentStep);

  const handleSelectType = (type: DeviceType) => {
    setSelectedType(type);
    setError(null);
  };

  const handleNext = async () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex >= steps.length - 1) return;

    const nextStep = steps[stepIndex + 1].id;

    if (currentStep === 'select' && selectedType) {
      setCurrentStep('connect');
    } else if (currentStep === 'connect') {
      setCurrentStep('detect');
      await detectDevices();
    } else if (currentStep === 'detect' && selectedDevice) {
      setCurrentStep('firmware');
      await checkFirmware();
    } else if (currentStep === 'firmware' && firmwareVersion) {
      setCurrentStep('test');
      await testSigning();
    } else if (currentStep === 'test' && testAddress) {
      setCurrentStep('complete');
      await completeSetup();
    }
  };

  const handleBack = () => {
    const stepIndex = getCurrentStepIndex();
    if (stepIndex > 0) {
      setCurrentStep(steps[stepIndex - 1].id);
      setError(null);
    }
  };

  const detectDevices = async () => {
    setLoading(true);
    setError(null);
    try {
      const devices = await invoke<HardwareWalletDevice[]>('list_hardware_wallets');
      const filtered = devices.filter(d => d.deviceType === selectedType);
      setDetectedDevices(filtered);
      setHardwareDevices(devices);

      if (filtered.length === 0) {
        setError(`No ${selectedType} devices detected. Please make sure your device is connected.`);
      } else {
        setSelectedDevice(filtered[0]);
      }
    } catch (err) {
      console.error('Failed to detect devices:', err);
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
      setSelectedDevice(connected);
    } catch (err) {
      console.error('Failed to connect device:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const checkFirmware = async () => {
    if (!selectedDevice) return;
    setLoading(true);
    setError(null);
    try {
      const version = await invoke<FirmwareVersion>('get_firmware_version', {
        deviceId: selectedDevice.deviceId,
      });
      setFirmwareVersion(version);

      if (version.major === 0 && version.minor < 5) {
        setError(
          `Firmware version ${version.major}.${version.minor}.${version.patch} may be outdated. Please consider upgrading.`
        );
      }
    } catch (err) {
      console.error('Failed to get firmware version:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const testSigning = async () => {
    if (!selectedDevice) return;
    setLoading(true);
    setError(null);
    try {
      const response = await invoke<{ address: string; publicKey: string }>(
        'get_hardware_wallet_address',
        {
          request: {
            deviceId: selectedDevice.deviceId,
            derivationPath: defaultDerivationPath,
            display: false,
          },
        }
      );
      setTestAddress(response.address);
    } catch (err) {
      console.error('Failed to test device:', err);
      setError(String(err));
    } finally {
      setLoading(false);
    }
  };

  const completeSetup = async () => {
    if (!selectedDevice) return;
    setActiveHardwareDevice(selectedDevice);
    setSigningMethod('hardware');
    if (onComplete) {
      onComplete(selectedDevice);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 'select':
        return (
          <div className="space-y-4">
            <p className="text-white/60 text-center mb-6">
              Select your hardware wallet type to begin setup
            </p>
            <div className="grid grid-cols-2 gap-4">
              <motion.button
                onClick={() => handleSelectType('ledger')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  selectedType === 'ledger'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-purple-500/20 bg-slate-800/50 hover:border-purple-500/50'
                }`}
              >
                <Usb className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                <h3 className="font-semibold mb-1">Ledger</h3>
                <p className="text-sm text-white/60">Nano S, S Plus, X</p>
              </motion.button>

              <motion.button
                onClick={() => handleSelectType('trezor')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 rounded-2xl border-2 transition-all ${
                  selectedType === 'trezor'
                    ? 'border-purple-500 bg-purple-500/20'
                    : 'border-purple-500/20 bg-slate-800/50 hover:border-purple-500/50'
                }`}
              >
                <Fingerprint className="w-12 h-12 mx-auto mb-3 text-purple-400" />
                <h3 className="font-semibold mb-1">Trezor</h3>
                <p className="text-sm text-white/60">Model T, Model One</p>
              </motion.button>
            </div>
          </div>
        );

      case 'connect':
        return (
          <div className="space-y-4">
            <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
              <h3 className="font-semibold mb-2 text-blue-400">Connection Instructions</h3>
              <ul className="space-y-2 text-sm text-white/80">
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Connect your {selectedType} device to your computer via USB</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Unlock your device by entering your PIN</span>
                </li>
                <li className="flex items-start gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400 mt-0.5 flex-shrink-0" />
                  <span>Open the Solana app on your device</span>
                </li>
              </ul>
            </div>
            <div className="text-center py-8">
              <Usb className="w-16 h-16 mx-auto mb-4 text-purple-400 animate-pulse" />
              <p className="text-white/60">Ready to detect your device</p>
            </div>
          </div>
        );

      case 'detect':
        return (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
                <p className="text-white/60">Searching for devices...</p>
              </div>
            ) : detectedDevices.length > 0 ? (
              <div className="space-y-3">
                <p className="text-white/60 text-sm">Found {detectedDevices.length} device(s):</p>
                {detectedDevices.map(device => (
                  <div
                    key={device.deviceId}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      selectedDevice?.deviceId === device.deviceId
                        ? 'border-purple-500 bg-purple-500/20'
                        : 'border-purple-500/20 bg-slate-800/50'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{device.productName}</h3>
                        <p className="text-sm text-white/60">{device.manufacturer}</p>
                      </div>
                      {!device.connected && (
                        <motion.button
                          onClick={() => connectDevice(device)}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className="px-4 py-2 bg-purple-500 rounded-lg text-sm font-medium"
                        >
                          Connect
                        </motion.button>
                      )}
                      {device.connected && (
                        <div className="flex items-center gap-2 text-green-400">
                          <CheckCircle className="w-5 h-5" />
                          <span className="text-sm font-medium">Connected</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <AlertCircle className="w-12 h-12 mx-auto mb-4 text-yellow-400" />
                <p className="text-white/60">No devices found</p>
                <motion.button
                  onClick={detectDevices}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="mt-4 px-4 py-2 bg-purple-500/20 border border-purple-500/50 rounded-lg text-sm font-medium"
                >
                  Retry Detection
                </motion.button>
              </div>
            )}
          </div>
        );

      case 'firmware':
        return (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
                <p className="text-white/60">Checking firmware version...</p>
              </div>
            ) : firmwareVersion ? (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <h3 className="font-semibold text-green-400">Firmware Check Complete</h3>
                  </div>
                  <p className="text-sm text-white/80">
                    Version: {firmwareVersion.major}.{firmwareVersion.minor}.{firmwareVersion.patch}
                  </p>
                </div>
                {selectedDevice && (
                  <div className="p-4 bg-slate-800/50 rounded-xl border border-purple-500/20">
                    <h3 className="font-semibold mb-2">Device Information</h3>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-white/60">Device:</span>
                        <span className="font-medium">{selectedDevice.productName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Type:</span>
                        <span className="font-medium capitalize">{selectedDevice.deviceType}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-white/60">Status:</span>
                        <span className="font-medium text-green-400">Connected</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </div>
        );

      case 'test':
        return (
          <div className="space-y-4">
            {loading ? (
              <div className="text-center py-12">
                <Loader2 className="w-12 h-12 mx-auto mb-4 text-purple-400 animate-spin" />
                <p className="text-white/60">Testing device functionality...</p>
                <p className="text-sm text-white/40 mt-2">This may take a moment</p>
              </div>
            ) : testAddress ? (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <CheckCircle className="w-6 h-6 text-green-400" />
                    <h3 className="font-semibold text-green-400">Device Test Successful</h3>
                  </div>
                  <p className="text-sm text-white/80 mb-3">
                    Your device is working correctly and can sign transactions.
                  </p>
                  <div className="mt-3 p-3 bg-slate-900/50 rounded-lg">
                    <p className="text-xs text-white/60 mb-1">Test Address:</p>
                    <p className="text-sm font-mono break-all">{testAddress}</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        );

      case 'complete':
        return (
          <div className="text-center py-8">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', duration: 0.5 }}
            >
              <CheckCircle className="w-20 h-20 mx-auto mb-6 text-green-400" />
            </motion.div>
            <h3 className="text-2xl font-bold mb-2">Setup Complete!</h3>
            <p className="text-white/60 mb-6">
              Your {selectedType} hardware wallet is ready to use for signing transactions.
            </p>
            {selectedDevice && (
              <div className="max-w-sm mx-auto p-4 bg-slate-800/50 rounded-xl border border-purple-500/20">
                <div className="text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-white/60">Device:</span>
                    <span className="font-medium">{selectedDevice.productName}</span>
                  </div>
                  {firmwareVersion && (
                    <div className="flex justify-between">
                      <span className="text-white/60">Firmware:</span>
                      <span className="font-medium">
                        {firmwareVersion.major}.{firmwareVersion.minor}.{firmwareVersion.patch}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 'select':
        return selectedType !== null;
      case 'connect':
        return true;
      case 'detect':
        return selectedDevice !== null && selectedDevice.connected;
      case 'firmware':
        return firmwareVersion !== null;
      case 'test':
        return testAddress !== null;
      case 'complete':
        return false;
      default:
        return false;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-2xl bg-slate-900 rounded-3xl border border-purple-500/20 shadow-2xl"
      >
        <div className="p-6 border-b border-purple-500/20">
          <h2 className="text-2xl font-bold">Hardware Wallet Setup</h2>
          <p className="text-white/60 text-sm mt-1">
            Step {getCurrentStepIndex() + 1} of {steps.length}:{' '}
            {steps[getCurrentStepIndex()].description}
          </p>

          <div className="mt-4 flex gap-2">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`h-1 flex-1 rounded-full transition-all ${
                  index <= getCurrentStepIndex() ? 'bg-purple-500' : 'bg-slate-700'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
            >
              {renderStepContent()}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-red-400 text-sm font-medium">Error</p>
                    <p className="text-red-400/80 text-sm mt-1">{error}</p>
                  </div>
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="p-6 border-t border-purple-500/20 flex justify-between">
          {currentStep === 'complete' ? (
            <>
              <div />
              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold shadow-lg shadow-purple-500/30"
              >
                Finish
              </motion.button>
            </>
          ) : (
            <>
              <motion.button
                onClick={currentStep === 'select' ? onClose : handleBack}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="px-6 py-3 bg-slate-800 rounded-xl font-semibold border border-purple-500/20 flex items-center gap-2"
              >
                <ChevronLeft className="w-4 h-4" />
                {currentStep === 'select' ? 'Cancel' : 'Back'}
              </motion.button>

              <motion.button
                onClick={handleNext}
                disabled={!canProceed() || loading}
                whileHover={canProceed() && !loading ? { scale: 1.02 } : {}}
                whileTap={canProceed() && !loading ? { scale: 0.98 } : {}}
                className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold shadow-lg shadow-purple-500/30 flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </>
                )}
              </motion.button>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

export default HardwareWalletSetup;
