import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Users, FileText, AlertTriangle } from 'lucide-react'
import MultisigDashboard from '../components/wallet/MultisigDashboard'
import ProposalManager from '../components/wallet/ProposalManager'
import { useWalletStore } from '../store/walletStore'
import { invoke } from '@tauri-apps/api/tauri'

interface MultisigWallet {
  id: string
  name: string
  address: string
  threshold: number
  members: string[]
  createdAt: string
  balance: number
}

type View = 'dashboard' | 'proposals'

export default function Multisig() {
  const [currentView, setCurrentView] = useState<View>('dashboard')
  const [selectedWallet, setSelectedWallet] = useState<MultisigWallet | null>(null)
  const [wallets, setWallets] = useState<MultisigWallet[]>([])
  const { address } = useWalletStore()

  useEffect(() => {
    loadWallets()
  }, [])

  const loadWallets = async () => {
    try {
      const result = await invoke<MultisigWallet[]>('list_multisig_wallets')
      setWallets(result)
      if (result.length > 0 && !selectedWallet) {
        setSelectedWallet(result[0])
      }
    } catch (err) {
      console.error('Failed to load multisig wallets:', err)
    }
  }

  const handleWalletSelect = (wallet: MultisigWallet) => {
    setSelectedWallet(wallet)
    setCurrentView('proposals')
  }

  return (
    <div className="space-y-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div>
          <h1 className="text-4xl font-bold mb-2">Multisig Wallets</h1>
          <p className="text-white/60">Manage your multisignature wallets and proposals</p>
        </div>

        {/* Info Banner */}
        <div className="bg-blue-500/10 border border-blue-500/30 rounded-2xl p-4 flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-300">
            <p className="font-medium mb-1">Multisig Security</p>
            <p className="text-blue-300/80">
              Multisig wallets require multiple signatures to execute transactions, providing enhanced security for team funds.
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-purple-500/20 p-2">
          <button
            onClick={() => setCurrentView('dashboard')}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all ${
              currentView === 'dashboard'
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 shadow-lg'
                : 'hover:bg-white/5'
            }`}
          >
            <Users className="w-5 h-5" />
            Wallets
          </button>
          <button
            onClick={() => setCurrentView('proposals')}
            disabled={!selectedWallet}
            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
              currentView === 'proposals'
                ? 'bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 shadow-lg'
                : 'hover:bg-white/5'
            }`}
          >
            <FileText className="w-5 h-5" />
            Proposals {selectedWallet && `(${selectedWallet.name})`}
          </button>
        </div>

        {/* Content */}
        <div className="bg-slate-800/50 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6">
          {currentView === 'dashboard' && (
            <MultisigDashboard />
          )}
          {currentView === 'proposals' && selectedWallet && (
            <ProposalManager wallet={selectedWallet} currentUserAddress={address} />
          )}
          {currentView === 'proposals' && !selectedWallet && (
            <div className="text-center py-12">
              <Users size={64} className="mx-auto text-gray-600 mb-4" />
              <h3 className="text-xl font-semibold text-white mb-2">No Wallet Selected</h3>
              <p className="text-gray-400 mb-6">Select or create a multisig wallet first</p>
              <button
                onClick={() => setCurrentView('dashboard')}
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Go to Wallets
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
