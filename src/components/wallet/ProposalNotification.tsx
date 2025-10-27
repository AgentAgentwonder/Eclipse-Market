import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import { useWalletStore } from '../../store/walletStore'

interface ProposalNotificationItem {
  proposal_id: string
  wallet_id: string
  description?: string | null
  created_at: string
}

interface ProposalNotificationProps {
  onOpenManager: () => void
}

export function ProposalNotification({ onOpenManager }: ProposalNotificationProps) {
  const { activeMultisigWalletId, setPendingProposals } = useWalletStore()
  const [notifications, setNotifications] = useState<ProposalNotificationItem[]>([])
  const [showPanel, setShowPanel] = useState(false)

  useEffect(() => {
    if (!activeMultisigWalletId) return

    const fetchNotifications = async () => {
      try {
        const proposals = await invoke<any[]>('list_proposals', {
          wallet_id: activeMultisigWalletId,
          status: 'pending',
        })

        const items = proposals.slice(0, 5).map((proposal: any) => ({
          proposal_id: proposal.proposal_id,
          wallet_id: proposal.wallet_id,
          description: proposal.description,
          created_at: proposal.created_at,
        }))

        setNotifications(items)
        setPendingProposals(proposals.length)
      } catch (err) {
        console.error('Failed to load proposal notifications', err)
      }
    }

    fetchNotifications()
    const interval = setInterval(fetchNotifications, 30000)
    return () => clearInterval(interval)
  }, [activeMultisigWalletId, setPendingProposals])

  const count = notifications.length

  return (
    <div className="relative">
      <button
        onClick={() => setShowPanel(!showPanel)}
        className="relative w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/10 transition-colors"
      >
        <Bell className="w-5 h-5" />
        {count > 0 && (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs font-semibold px-1.5 py-0.5 rounded-full">
            {count > 9 ? '9+' : count}
          </span>
        )}
      </button>

      <AnimatePresence>
        {showPanel && count > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-3 w-80 bg-slate-900/90 border border-purple-500/30 rounded-2xl backdrop-blur-xl shadow-2xl z-30"
          >
            <div className="p-4 border-b border-purple-500/20 flex items-center justify-between">
              <div>
                <h4 className="font-semibold">Pending Proposals</h4>
                <p className="text-xs text-white/60">Awaiting signatures</p>
              </div>
              <button
                onClick={() => {
                  setShowPanel(false)
                  onOpenManager()
                }}
                className="text-xs text-purple-300 hover:text-purple-100"
              >
                View all
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-72 overflow-y-auto">
              {notifications.map((item) => (
                <div key={item.proposal_id} className="p-3 bg-slate-800/50 rounded-xl border border-purple-500/20">
                  <div className="text-sm font-semibold">
                    {item.description || `Proposal ${item.proposal_id.slice(0, 6)}`}
                  </div>
                  <div className="text-xs text-white/40 mt-1">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
