import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { PlusCircle, Users, Shield, TriangleAlert, ArrowRight } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import { useWalletStore, MultisigWallet } from '../../store/walletStore'
import { MultisigWizard } from './MultisigWizard'

interface MultisigDashboardProps {
  onCreateProposal: () => void
}

export function MultisigDashboard({ onCreateProposal }: MultisigDashboardProps) {
  const {
    multisigWallets,
    setMultisigWallets,
    activeMultisigWalletId,
    setActiveMultisigWalletId,
    pendingProposals,
    setPendingProposals,
    publicKey,
  } = useWalletStore()

  const [loading, setLoading] = useState(false)
  const [showWizard, setShowWizard] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [selectedWallet, setSelectedWallet] = useState<MultisigWallet | null>(null)

  useEffect(() => {
    refreshWallets()
  }, [])

  useEffect(() => {
    if (!multisigWallets.length) {
      setSelectedWallet(null)
      return
    }
    const active = multisigWallets.find((w) => w.wallet_id === activeMultisigWalletId)
    if (active) {
      setSelectedWallet(active)
    } else {
      setSelectedWallet(multisigWallets[0])
      setActiveMultisigWalletId(multisigWallets[0].wallet_id)
    }
  }, [multisigWallets, activeMultisigWalletId, setActiveMultisigWalletId])

  const refreshWallets = async () => {
    setLoading(true)
    setError(null)
    try {
      const wallets = await invoke<MultisigWallet[]>('list_multisig_wallets')
      setMultisigWallets(wallets)
      if (wallets.length) {
        const active = wallets.find(w => w.wallet_id === activeMultisigWalletId) ?? wallets[0]
        setSelectedWallet(active)
        setActiveMultisigWalletId(active.wallet_id)
        await refreshPendingProposals(active.wallet_id)
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const refreshPendingProposals = async (walletId: string) => {
    try {
      const proposals = await invoke<any[]>('list_proposals', {
        walletId,
        status: 'pending',
      })
      setPendingProposals(proposals.length)
    } catch (err) {
      console.error('Failed to load proposal count', err)
    }
  }

  const handleSelectWallet = async (wallet: MultisigWallet) => {
    setSelectedWallet(wallet)
    setActiveMultisigWalletId(wallet.wallet_id)
    await refreshPendingProposals(wallet.wallet_id)
  }

  return (
    <div className="bg-slate-800/50 border border-purple-500/20 rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-bold">Multisig Wallets</h2>
          <p className="text-white/60 text-sm">
            Manage collaborative wallets and approvals
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowWizard(true)}
            className="px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center gap-2 font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
          >
            <PlusCircle className="w-5 h-5" />
            New Multisig
          </button>
          {selectedWallet && (
            <button
              onClick={onCreateProposal}
              className="px-4 py-2 bg-slate-900/60 border border-purple-500/20 rounded-xl flex items-center gap-2 hover:bg-slate-900 transition-colors"
            >
              Create Proposal
              <ArrowRight className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex flex-col items-center text-white/60">
          <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="mt-4">Loading multisig wallets...</p>
        </div>
      ) : multisigWallets.length === 0 ? (
        <div className="py-12 flex flex-col items-center text-white/60">
          <Users className="w-12 h-12 text-purple-400 mb-4" />
          <p className="text-center max-w-md">
            No multisig wallets yet. Create one to collaborate on approvals and secure treasury operations.
          </p>
          <button
            onClick={() => setShowWizard(true)}
            className="mt-6 px-5 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
          >
            Create Multisig Wallet
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {multisigWallets.map((wallet) => {
            const isActive = selectedWallet?.wallet_id === wallet.wallet_id
            const memberCount = wallet.members.length
            const isMember = publicKey ? wallet.members.includes(publicKey) : false
            return (
              <motion.button
                key={wallet.wallet_id}
                whileHover={{ scale: 1.01 }}
                onClick={() => handleSelectWallet(wallet)}
                className={`text-left p-5 rounded-2xl border transition-all ${
                  isActive
                    ? 'bg-purple-500/20 border-purple-500/60 shadow-lg shadow-purple-500/30'
                    : 'bg-slate-900/40 border-purple-500/20 hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-lg font-semibold">{wallet.name}</div>
                    <div className="text-xs uppercase tracking-wide text-white/40">
                      Created {new Date(wallet.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <Shield className="w-5 h-5 text-purple-300" />
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <div>
                    <div className="text-white/60">Members</div>
                    <div className="font-semibold">{memberCount}</div>
                  </div>
                  <div>
                    <div className="text-white/60">Threshold</div>
                    <div className="font-semibold">{wallet.threshold}</div>
                  </div>
                  <div>
                    <div className="text-white/60">Pending</div>
                    <div className="font-semibold">{isActive ? pendingProposals : '—'}</div>
                  </div>
                </div>
                {!isMember && (
                  <div className="mt-4 p-2 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-400 text-xs">
                    You are not a signer on this wallet
                  </div>
                )}
              </motion.button>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {showWizard && (
          <MultisigWizard
            onClose={() => setShowWizard(false)}
            onCreated={refreshWallets}
          />
        )}
      </AnimatePresence>
    </div>
  )
}
