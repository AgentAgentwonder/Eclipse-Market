import { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { Usb, CheckCircle, XCircle, Loader2, AlertTriangle, ChevronRight, ChevronLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useWalletStore, HardwareDevice, HardwareWalletSession } from '../../store/walletStore'

type WizardStep = 'select' | 'connect' | 'firmware' | 'test' | 'complete'

interface DeviceSelectionProps {
  devices: HardwareDevice[]
  selectedDevice: HardwareDevice | null
  onSelect: (device: HardwareDevice) => void
  onRefresh: () => void
  loading: boolean
}

function DeviceSelection({ devices, selectedDevice, onSelect, onRefresh, loading }: DeviceSelectionProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xl font-semibold">Select Hardware Wallet</h3>
        <button
          onClick={onRefresh}
          disabled={loading}
          className="px-4 py-2 rounded-lg bg-purple-500/20 border border-purple-500/30 hover:bg-purple-500/30 transition-all disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Refresh'}
        </button>
      </div>

      <div className="space-y-3">
        {devices.length === 0 ? (
          <div className="p-6 rounded-xl border-2 border-dashed border-gray-600 text-center">
            <Usb className="w-12 h-12 mx-auto mb-3 text-gray-500" />
            <p className="text-gray-400">No devices found</p>
            <p className="text-sm text-gray-500 mt-2">Connect your Ledger or Trezor device</p>
          </div>
        ) : (
          devices.map((device) => (
            <motion.button
              key={device.id}
              onClick={() => onSelect(device)}
              className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
                selectedDevice?.id === device.id
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-600 hover:border-gray-500 bg-gray-800/50'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Usb className="w-6 h-6 text-purple-400" />
                  <div>
                    <div className="font-semibold">{device.model}</div>
                    <div className="text-sm text-gray-400 capitalize">{device.deviceType}</div>
                  </div>
                </div>
                {device.firmwareVersion && (
                  <div className="text-xs text-gray-500">v{device.firmwareVersion}</div>
                )}
              </div>
            </motion.button>
          ))
        )}
      </div>
    </div>
  )
}

interface ConnectionStepProps {
  device: HardwareDevice
  connecting: boolean
  error: string | null
}

function ConnectionStep({ device, connecting, error }: ConnectionStepProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Connect to {device.model}</h3>
      
      <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
        <div className="flex items-start gap-4">
          {connecting ? (
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin flex-shrink-0" />
          ) : error ? (
            <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="font-medium mb-2">
              {connecting ? 'Connecting...' : error ? 'Connection Failed' : 'Ready to Connect'}
            </div>
            <ul className="text-sm text-gray-400 space-y-1">
              <li>• Make sure your device is unlocked</li>
              <li>• Open the Solana app on your device</li>
              <li>• Approve the connection request</li>
            </ul>
            {error && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

interface FirmwareCheckProps {
  device: HardwareDevice
  checking: boolean
  isCompatible: boolean | null
}

function FirmwareCheck({ device, checking, isCompatible }: FirmwareCheckProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Firmware Check</h3>

      <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
        <div className="flex items-start gap-4">
          {checking ? (
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin flex-shrink-0" />
          ) : isCompatible === false ? (
            <AlertTriangle className="w-8 h-8 text-yellow-400 flex-shrink-0" />
          ) : (
            <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="font-medium mb-2">
              {checking ? 'Checking firmware...' : isCompatible === false ? 'Firmware Update Required' : 'Firmware Compatible'}
            </div>
            <div className="text-sm text-gray-400 space-y-1">
              <div>Device: {device.model}</div>
              <div>Current Version: {device.firmwareVersion || 'Unknown'}</div>
              {isCompatible === false && (
                <div className="mt-3 p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 text-yellow-400">
                  Please update your device firmware to the latest version
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

interface TestSigningProps {
  testing: boolean
  success: boolean | null
  error: string | null
}

function TestSigning({ testing, success, error }: TestSigningProps) {
  return (
    <div className="space-y-4">
      <h3 className="text-xl font-semibold">Test Signing</h3>

      <div className="p-6 rounded-xl bg-gray-800/50 border border-gray-700">
        <div className="flex items-start gap-4">
          {testing ? (
            <Loader2 className="w-8 h-8 text-purple-400 animate-spin flex-shrink-0" />
          ) : success === false ? (
            <XCircle className="w-8 h-8 text-red-400 flex-shrink-0" />
          ) : success === true ? (
            <CheckCircle className="w-8 h-8 text-green-400 flex-shrink-0" />
          ) : (
            <Usb className="w-8 h-8 text-gray-400 flex-shrink-0" />
          )}
          <div className="flex-1">
            <div className="font-medium mb-2">
              {testing ? 'Testing signature...' : success === false ? 'Test Failed' : success === true ? 'Test Successful' : 'Ready to Test'}
            </div>
            <div className="text-sm text-gray-400">
              {testing ? 'Please approve the test transaction on your device' : 'We will perform a test signature to verify the connection'}
            </div>
            {error && (
              <div className="mt-3 p-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export function HardwareWalletWizard({ onComplete, onCancel }: { onComplete: () => void; onCancel: () => void }) {
  const [step, setStep] = useState<WizardStep>('select')
  const [devices, setDevices] = useState<HardwareDevice[]>([])
  const [selectedDevice, setSelectedDevice] = useState<HardwareDevice | null>(null)
  const [loading, setLoading] = useState(false)
  const [connecting, setConnecting] = useState(false)
  const [checking, setChecking] = useState(false)
  const [testing, setTesting] = useState(false)
  const [isCompatible, setIsCompatible] = useState<boolean | null>(null)
  const [testSuccess, setTestSuccess] = useState<boolean | null>(null)
  const [error, setError] = useState<string | null>(null)

  const {
    setHardwareDevices,
    setHardwareSession,
    setHardwareStatus,
    setHardwareError,
    setWalletType,
    setPublicKey,
  } = useWalletStore()

  const discoverDevices = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const foundDevices = await invoke<HardwareDevice[]>('hw_discover_devices')
      setDevices(foundDevices)
      setHardwareDevices(foundDevices)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setHardwareError(message)
    } finally {
      setLoading(false)
    }
  }, [setHardwareDevices, setHardwareError])

  useEffect(() => {
    if (step === 'select') {
      discoverDevices()
    }
  }, [step, discoverDevices])

  const handleDeviceSelect = (device: HardwareDevice) => {
    setSelectedDevice(device)
  }

  const handleConnect = async () => {
    if (!selectedDevice) return

    setConnecting(true)
    setError(null)
    setHardwareStatus('connecting')

    try {
      const session = await invoke<HardwareWalletSession>('hw_connect_device', {
        deviceId: selectedDevice.id,
        derivationPath: "44'/501'/0'/0'",
      })

      setHardwareSession(session)
      setWalletType(session.device.deviceType)
      if (session.publicKey) {
        setPublicKey(session.publicKey)
      }
      setHardwareStatus('connected')
      setStep('firmware')
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setHardwareError(message)
      setHardwareStatus('error')
    } finally {
      setConnecting(false)
    }
  }

  const handleFirmwareCheck = async () => {
    if (!selectedDevice) return

    setChecking(true)
    setError(null)

    try {
      const info = await invoke('hw_get_device_info', {
        deviceType: selectedDevice.deviceType,
      })
      setIsCompatible(true)
      setTimeout(() => setStep('test'), 500)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setIsCompatible(false)
    } finally {
      setChecking(false)
    }
  }

  const handleTestSigning = async () => {
    setTesting(true)
    setError(null)
    setTestSuccess(null)

    try {
      await invoke('hw_sign_message', {
        request: {
          message: 'Test message for hardware wallet signing',
        },
      })
      setTestSuccess(true)
      setTimeout(() => setStep('complete'), 1000)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setError(message)
      setTestSuccess(false)
    } finally {
      setTesting(false)
    }
  }

  const handleNext = () => {
    switch (step) {
      case 'select':
        if (selectedDevice) {
          setStep('connect')
        }
        break
      case 'connect':
        handleConnect()
        break
      case 'firmware':
        handleFirmwareCheck()
        break
      case 'test':
        handleTestSigning()
        break
      case 'complete':
        onComplete()
        break
    }
  }

  const handleBack = () => {
    setError(null)
    switch (step) {
      case 'connect':
        setStep('select')
        break
      case 'firmware':
        setStep('connect')
        break
      case 'test':
        setStep('firmware')
        break
    }
  }

  const canProceed = () => {
    switch (step) {
      case 'select':
        return selectedDevice !== null
      case 'connect':
        return !connecting && !error
      case 'firmware':
        return !checking && isCompatible !== false
      case 'test':
        return !testing
      case 'complete':
        return true
      default:
        return false
    }
  }

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gray-900 rounded-2xl border border-gray-700 max-w-2xl w-full p-6"
      >
        <div className="mb-6">
          <h2 className="text-2xl font-bold mb-2">Hardware Wallet Setup</h2>
          <div className="flex gap-2">
            {(['select', 'connect', 'firmware', 'test', 'complete'] as WizardStep[]).map((s, i) => (
              <div
                key={s}
                className={`h-1 flex-1 rounded-full transition-all ${
                  (['select', 'connect', 'firmware', 'test', 'complete'] as WizardStep[]).indexOf(step) >= i
                    ? 'bg-purple-500'
                    : 'bg-gray-700'
                }`}
              />
            ))}
          </div>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="min-h-[300px]"
          >
            {step === 'select' && (
              <DeviceSelection
                devices={devices}
                selectedDevice={selectedDevice}
                onSelect={handleDeviceSelect}
                onRefresh={discoverDevices}
                loading={loading}
              />
            )}
            {step === 'connect' && selectedDevice && (
              <ConnectionStep device={selectedDevice} connecting={connecting} error={error} />
            )}
            {step === 'firmware' && selectedDevice && (
              <FirmwareCheck device={selectedDevice} checking={checking} isCompatible={isCompatible} />
            )}
            {step === 'test' && <TestSigning testing={testing} success={testSuccess} error={error} />}
            {step === 'complete' && (
              <div className="space-y-4 text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-400 mx-auto" />
                <h3 className="text-2xl font-semibold">Setup Complete!</h3>
                <p className="text-gray-400">Your hardware wallet is ready to use</p>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3 mt-6 pt-6 border-t border-gray-700">
          {step !== 'select' && step !== 'complete' && (
            <button
              onClick={handleBack}
              className="px-6 py-2 rounded-xl border border-gray-600 hover:border-gray-500 transition-all flex items-center gap-2"
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>
          )}
          <button
            onClick={onCancel}
            className="px-6 py-2 rounded-xl border border-gray-600 hover:border-gray-500 hover:bg-red-500/10 transition-all ml-auto"
          >
            Cancel
          </button>
          {step !== 'complete' ? (
            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              {step === 'connect' && connecting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Connecting...
                </>
              ) : step === 'firmware' && checking ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking...
                </>
              ) : step === 'test' && testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={onComplete}
              className="px-6 py-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition-all"
            >
              Finish
            </button>
          )}
        </div>
      </motion.div>
    </div>
  )
}
