import { useCallback } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { Usb, Loader2, AlertTriangle, CheckCircle, XCircle } from 'lucide-react'
import { useWalletStore } from '../../store/walletStore'

function formatPublicKey(publicKey?: string) {
  if (!publicKey) return 'N/A'
  return `${publicKey.slice(0, 4)}...${publicKey.slice(-4)}`
}

export function HardwareWalletStatus() {
  const {
    hardwareSession,
    hardwareStatus,
    hardwareError,
    setHardwareStatus,
    setHardwareSession,
    setHardwareError,
    resetHardware,
    setPublicKey,
  } = useWalletStore((state) => ({
    hardwareSession: state.hardwareSession,
    hardwareStatus: state.hardwareStatus,
    hardwareError: state.hardwareError,
    setHardwareStatus: state.setHardwareStatus,
    setHardwareSession: state.setHardwareSession,
    setHardwareError: state.setHardwareError,
    resetHardware: state.resetHardware,
    setPublicKey: state.setPublicKey,
  }))

  const handleDisconnect = useCallback(async () => {
    try {
      setHardwareStatus('connecting')
      await invoke('hw_disconnect_device')
      resetHardware()
      setPublicKey(null)
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err)
      setHardwareError(message)
      setHardwareStatus('error')
    }
  }, [resetHardware, setHardwareError, setHardwareStatus, setPublicKey])

  if (!hardwareSession) {
    return null
  }

  return (
    <div className="flex items-center gap-3">
      <div className="px-4 py-2 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center gap-3">
        <Usb className="w-4 h-4" />
        <div>
          <div className="text-sm font-semibold">
            {hardwareSession.device.model}
          </div>
          <div className="text-xs text-gray-300">{formatPublicKey(hardwareSession.publicKey)}</div>
        </div>
      </div>
      {hardwareStatus === 'connecting' ? (
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm">
          <Loader2 className="w-4 h-4 animate-spin" />
          <span>Working...</span>
        </div>
      ) : hardwareStatus === 'connected' ? (
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-green-500/20 border border-green-500/30 text-green-300 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Connected</span>
        </div>
      ) : hardwareStatus === 'error' ? (
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-red-500/20 border border-red-500/30 text-red-300 text-sm">
          <XCircle className="w-4 h-4" />
          <span>Error</span>
        </div>
      ) : (
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm">
          <AlertTriangle className="w-4 h-4" />
          <span>{hardwareStatus}</span>
        </div>
      )}
      <button
        onClick={handleDisconnect}
        className="px-4 py-2 rounded-xl border-2 border-red-500/30 hover:border-red-500/50 hover:bg-red-500/10 transition-all text-sm"
      >
        Disconnect
      </button>
      {hardwareError && (
        <div className="px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-sm max-w-xs truncate">
          {hardwareError}
        </div>
      )}
    </div>
  )
}
