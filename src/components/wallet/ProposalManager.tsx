import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { CheckCircle, Clock, XCircle, Ban, Play, X, Filter } from 'lucide-react'
import { invoke } from '@tauri-apps/api/tauri'
import { useWalletStore, MultisigProposal, ProposalStatus } from '../../store/walletStore'

interface ProposalManagerProps {
  walletId?: string
  onClose?: () => void
}

interface ProposalWithSignatures extends MultisigProposal {
  signatureCount: number
  threshold: number
  signatures: Array<{ signer: string; signed_at: string }>
}

export function ProposalManager({ walletId, onClose }: ProposalManagerProps) {
  const { activeMultisigWalletId, publicKey, setPendingProposals } = useWalletStore()
  const [proposals, setProposals] = useState<ProposalWithSignatures[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<ProposalStatus | 'all'>('all')
  const [selectedProposal, setSelectedProposal] = useState<ProposalWithSignatures | null>(null)
  const [signing, setSigning] = useState(false)
  const [executing, setExecuting] = useState(false)

  const targetWalletId = walletId || activeMultisigWalletId

  useEffect(() => {
    if (targetWalletId) {
      loadProposals()
    }
  }, [targetWalletId, statusFilter])

  const loadProposals = async () => {
    if (!targetWalletId) return

    setLoading(true)
    setError(null)
    try {
      const filter = statusFilter === 'all' ? null : statusFilter
      const rawProposals = await invoke<MultisigProposal[]>('list_proposals', {
        wallet_id: targetWalletId,
        status: filter,
      })

      const enriched = await Promise.all(
        rawProposals.map(async (p) => {
          try {
            const [status, sigCount, threshold] = await invoke<[ProposalStatus, number, number]>(
              'get_proposal_status',
              { proposal_id: p.proposal_id }
            )
            const signatures = await invoke<Array<{ signer: string; signed_at: string }>>(
              'get_proposal_signatures',
              { proposal_id: p.proposal_id }
            )
            return {
              ...p,
              status,
              signatureCount: sigCount,
              threshold,
              signatures,
            }
          } catch {
            return {
              ...p,
              signatureCount: 0,
              threshold: 0,
              signatures: [],
            }
          }
        })
      )

      setProposals(enriched)
      const pending = enriched.filter((p) => p.status === 'pending').length
      setPendingProposals(pending)
    } catch (err) {
      setError(String(err))
    } finally {
      setLoading(false)
    }
  }

  const handleSign = async (proposalId: string) => {
    if (!publicKey) {
      setError('No wallet connected')
      return
    }

    setSigning(true)
    setError(null)

    try {
      const mockSignature = `sig_${Date.now()}`
      await invoke('sign_proposal', {
        proposal_id: proposalId,
        signer: publicKey,
        signature: mockSignature,
      })
      await loadProposals()
      if (selectedProposal?.proposal_id === proposalId) {
        const updated = proposals.find((p) => p.proposal_id === proposalId)
        if (updated) setSelectedProposal(updated)
      }
    } catch (err) {
      setError(String(err))
    } finally {
      setSigning(false)
    }
  }

  const handleExecute = async (proposalId: string) => {
    setExecuting(true)
    setError(null)

    try {
      await invoke('execute_proposal', { proposal_id: proposalId })
      await loadProposals()
      setSelectedProposal(null)
    } catch (err) {
      setError(String(err))
    } finally {
      setExecuting(false)
    }
  }

  const handleCancel = async (proposalId: string) => {
    if (!publicKey) {
      setError('No wallet connected')
      return
    }

    try {
      await invoke('cancel_proposal', {
        proposal_id: proposalId,
        user: publicKey,
      })
      await loadProposals()
      setSelectedProposal(null)
    } catch (err) {
      setError(String(err))
    }
  }

  const getStatusIcon = (status: ProposalStatus) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-400" />
      case 'approved':
        return <CheckCircle className="w-5 h-5 text-green-400" />
      case 'executed':
        return <Play className="w-5 h-5 text-blue-400" />
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-400" />
      case 'cancelled':
        return <Ban className="w-5 h-5 text-gray-400" />
    }
  }

  const getStatusColor = (status: ProposalStatus) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-500/20 border-yellow-500/30 text-yellow-400'
      case 'approved':
        return 'bg-green-500/20 border-green-500/30 text-green-400'
      case 'executed':
        return 'bg-blue-500/20 border-blue-500/30 text-blue-400'
      case 'rejected':
        return 'bg-red-500/20 border-red-500/30 text-red-400'
      case 'cancelled':
        return 'bg-gray-500/20 border-gray-500/30 text-gray-400'
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Proposals</h2>
          <p className="text-white/60 text-sm">Review and approve transactions</p>
        </div>
        {onClose && (
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-3">
        <Filter className="w-5 h-5 text-white/60" />
        <div className="flex gap-2">
          {(['all', 'pending', 'approved', 'executed', 'cancelled'] as const).map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
                statusFilter === status
                  ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300'
                  : 'bg-slate-900/40 border border-purple-500/20 text-white/60 hover:bg-slate-900/60'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
          {error}
        </div>
      )}

      {loading ? (
        <div className="py-12 flex flex-col items-center text-white/60">
          <div className="w-10 h-10 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
          <p className="mt-4">Loading proposals...</p>
        </div>
      ) : proposals.length === 0 ? (
        <div className="py-12 text-center text-white/60">
          <Clock className="w-12 h-12 mx-auto mb-4 text-purple-400" />
          <p>No proposals found</p>
        </div>
      ) : (
        <div className="space-y-3">
          {proposals.map((proposal) => {
            const canSign =
              publicKey &&
              proposal.status === 'pending' &&
              !proposal.signatures.some((s) => s.signer === publicKey)
            const canExecute = proposal.status === 'approved'
            const canCancel = publicKey && proposal.created_by === publicKey && proposal.status === 'pending'
            const progress = proposal.threshold > 0 ? (proposal.signatureCount / proposal.threshold) * 100 : 0

            return (
              <motion.div
                key={proposal.proposal_id}
                whileHover={{ scale: 1.01 }}
                className="p-5 bg-slate-900/40 border border-purple-500/20 rounded-2xl hover:bg-slate-900/60 transition-all cursor-pointer"
                onClick={() => setSelectedProposal(proposal)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      {getStatusIcon(proposal.status)}
                      <div>
                        <div className="font-semibold">
                          {proposal.description || `Proposal ${proposal.proposal_id.slice(0, 8)}`}
                        </div>
                        <div className="text-xs text-white/40">
                          Created {new Date(proposal.created_at).toLocaleString()}
                        </div>
                      </div>
                    </div>
                    {proposal.description && (
                      <div className="text-sm text-white/60 mt-2 line-clamp-2">
                        {proposal.description}
                      </div>
                    )}
                  </div>
                  <div className={`px-3 py-1 rounded-lg text-xs font-medium border ${getStatusColor(proposal.status)}`}>
                    {proposal.status}
                  </div>
                </div>

                {proposal.status === 'pending' && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-white/60">Signatures</span>
                      <span className="font-semibold">
                        {proposal.signatureCount} / {proposal.threshold}
                      </span>
                    </div>
                    <div className="w-full bg-slate-700/50 rounded-full h-2 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                      />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  {canSign && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleSign(proposal.proposal_id)
                      }}
                      disabled={signing}
                      className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl text-sm font-semibold shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all disabled:opacity-50"
                    >
                      {signing ? 'Signing...' : 'Sign'}
                    </button>
                  )}
                  {canExecute && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleExecute(proposal.proposal_id)
                      }}
                      disabled={executing}
                      className="flex-1 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-sm font-semibold text-green-400 hover:bg-green-500/30 transition-all disabled:opacity-50"
                    >
                      {executing ? 'Executing...' : 'Execute'}
                    </button>
                  )}
                  {canCancel && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleCancel(proposal.proposal_id)
                      }}
                      className="px-4 py-2 bg-red-500/20 border border-red-500/30 rounded-xl text-sm font-semibold text-red-400 hover:bg-red-500/30 transition-all"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </motion.div>
            )
          })}
        </div>
      )}

      <AnimatePresence>
        {selectedProposal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
            onClick={() => setSelectedProposal(null)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="bg-slate-800/95 backdrop-blur-xl rounded-3xl border border-purple-500/20 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold">Proposal Details</h3>
                <button
                  onClick={() => setSelectedProposal(null)}
                  className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-white/5 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-slate-900/50 border border-purple-500/10 rounded-xl">
                  <div className="text-sm text-white/60 mb-1">Status</div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(selectedProposal.status)}
                    <span className="font-semibold capitalize">{selectedProposal.status}</span>
                  </div>
                </div>

                <div className="p-4 bg-slate-900/50 border border-purple-500/10 rounded-xl">
                  <div className="text-sm text-white/60 mb-1">Description</div>
                  <div>{selectedProposal.description || 'No description provided'}</div>
                </div>

                <div className="p-4 bg-slate-900/50 border border-purple-500/10 rounded-xl">
                  <div className="text-sm text-white/60 mb-1">Created By</div>
                  <div className="font-mono text-sm truncate">{selectedProposal.created_by}</div>
                </div>

                <div className="p-4 bg-slate-900/50 border border-purple-500/10 rounded-xl">
                  <div className="text-sm text-white/60 mb-3">
                    Signatures ({selectedProposal.signatureCount} / {selectedProposal.threshold})
                  </div>
                  {selectedProposal.signatures.length > 0 ? (
                    <div className="space-y-2">
                      {selectedProposal.signatures.map((sig, idx) => (
                        <div key={idx} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-xl">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <div className="flex-1">
                            <div className="font-mono text-sm truncate">{sig.signer}</div>
                            <div className="text-xs text-white/40">
                              {new Date(sig.signed_at).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-white/60 text-sm">No signatures yet</div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
