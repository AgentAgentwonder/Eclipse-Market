import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { AlertTriangle, X, Eye } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import { useWalletStore } from '../../store/walletStore'

interface SuspiciousActivity {
  wallet_address: string
  reason: string
  timestamp: string
  related_logs: Array<{
    log_id: string
    wallet_address: string
    action: string
    timestamp: string
    result: string
  }>
}

export function SecurityAlert() {
  const { publicKey } = useWalletStore()
  const [alerts, setAlerts] = useState<SuspiciousActivity[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  const [showDetails, setShowDetails] = useState<string | null>(null)

  useEffect(() => {
    if (publicKey) {
      checkForAlerts()
      const interval = setInterval(checkForAlerts, 60000) // Check every minute
      return () => clearInterval(interval)
    }
  }, [publicKey])

  const checkForAlerts = async () => {
    if (!publicKey) return

    try {
      const suspicious = await invoke<SuspiciousActivity[]>('check_suspicious_activity', {
        wallet_address: publicKey,
      })
      setAlerts(suspicious)
    } catch (err) {
      console.error('Failed to check suspicious activity', err)
    }
  }

  const handleDismiss = (timestamp: string) => {
    setDismissed(new Set([...dismissed, timestamp]))
  }

  const visibleAlerts = alerts.filter((alert) => !dismissed.has(alert.timestamp))

  if (visibleAlerts.length === 0) return null

  return (
    <div className="fixed top-20 right-6 z-40 space-y-3 max-w-md">
      <AnimatePresence>
        {visibleAlerts.map((alert) => (
          <motion.div
            key={alert.timestamp}
            initial={{ opacity: 0, x: 100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 100 }}
            className="bg-yellow-500/10 border-2 border-yellow-500/50 rounded-2xl p-4 backdrop-blur-xl shadow-2xl"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
                <div>
                  <div className="font-semibold text-yellow-400">Suspicious Activity</div>
                  <div className="text-xs text-white/60">{new Date(alert.timestamp).toLocaleString()}</div>
                </div>
              </div>
              <button
                onClick={() => handleDismiss(alert.timestamp)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-sm text-white/80 mb-3">{alert.reason}</div>

            <div className="flex gap-2">
              <button
                onClick={() => setShowDetails(showDetails === alert.timestamp ? null : alert.timestamp)}
                className="flex-1 px-3 py-2 bg-yellow-500/20 border border-yellow-500/30 rounded-xl text-xs font-semibold text-yellow-400 hover:bg-yellow-500/30 transition-colors flex items-center justify-center gap-2"
              >
                <Eye className="w-4 h-4" />
                {showDetails === alert.timestamp ? 'Hide Details' : 'View Details'}
              </button>
            </div>

            <AnimatePresence>
              {showDetails === alert.timestamp && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 space-y-2 overflow-hidden"
                >
                  <div className="text-xs text-white/60">Related Events:</div>
                  {alert.related_logs.slice(0, 5).map((log) => (
                    <div
                      key={log.log_id}
                      className="p-2 bg-slate-900/50 border border-purple-500/10 rounded-lg text-xs"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-semibold text-purple-400">{log.action}</span>
                        <span
                          className={
                            log.result === 'success' ? 'text-green-400' : 'text-red-400'
                          }
                        >
                          {log.result}
                        </span>
                      </div>
                      <div className="text-white/60">
                        {new Date(log.timestamp).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
