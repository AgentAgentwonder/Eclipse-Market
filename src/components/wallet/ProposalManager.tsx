import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import {
  FileText,
  Plus,
  Check,
  X,
  Clock,
  PlayCircle,
  XCircle,
  Filter,
  RefreshCw,
} from 'lucide-react';
import { motion } from 'framer-motion';

interface MultisigWallet {
  id: string;
  name: string;
  address: string;
  threshold: number;
  members: string[];
  createdAt: string;
  balance: number;
}

interface MultisigProposal {
  id: string;
  walletId: string;
  transactionData: string;
  status: 'pending' | 'approved' | 'executed' | 'rejected' | 'cancelled';
  createdBy: string;
  createdAt: string;
  description?: string;
  signatures: ProposalSignature[];
  executedAt?: string;
  txSignature?: string;
}

interface ProposalSignature {
  id: string;
  proposalId: string;
  signer: string;
  signature: string;
  signedAt: string;
}

interface ProposalManagerProps {
  wallet: MultisigWallet;
  currentUserAddress?: string;
}

type StatusFilter = 'all' | 'pending' | 'approved' | 'executed' | 'rejected' | 'cancelled';

const ProposalManager: React.FC<ProposalManagerProps> = ({ wallet, currentUserAddress }) => {
  const [proposals, setProposals] = useState<MultisigProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newProposal, setNewProposal] = useState({
    description: '',
    transactionData: '',
  });

  useEffect(() => {
    loadProposals();
  }, [wallet.id, statusFilter]);

  const loadProposals = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<MultisigProposal[]>('list_proposals', {
        walletId: wallet.id,
        statusFilter: statusFilter === 'all' ? null : statusFilter,
      });
      setProposals(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProposal = async () => {
    if (!currentUserAddress) {
      setError('User address not available');
      return;
    }

    if (!newProposal.transactionData.trim()) {
      setError('Transaction data is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await invoke('create_proposal', {
        request: {
          walletId: wallet.id,
          transactionData: newProposal.transactionData,
          description: newProposal.description || null,
          createdBy: currentUserAddress,
        },
      });

      setNewProposal({ description: '', transactionData: '' });
      setShowCreateForm(false);
      await loadProposals();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleSignProposal = async (proposalId: string) => {
    if (!currentUserAddress) {
      setError('User address not available');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Generate a mock signature for demo purposes
      // In production, this would sign the transaction with the user's wallet
      const signature = `sig_${Math.random().toString(36).substring(7)}`;

      await invoke('sign_proposal', {
        request: {
          proposalId,
          signer: currentUserAddress,
          signature,
        },
      });

      await loadProposals();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleExecuteProposal = async (proposalId: string) => {
    setLoading(true);
    setError(null);
    try {
      await invoke('execute_proposal', {
        proposalId,
      });

      await loadProposals();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const handleCancelProposal = async (proposalId: string) => {
    if (!currentUserAddress) {
      setError('User address not available');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      await invoke('cancel_proposal', {
        proposalId,
        userAddress: currentUserAddress,
      });

      await loadProposals();
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const canSign = (proposal: MultisigProposal): boolean => {
    if (!currentUserAddress) return false;
    if (proposal.status !== 'pending' && proposal.status !== 'approved') return false;
    if (!wallet.members.includes(currentUserAddress)) return false;
    return !proposal.signatures.some(sig => sig.signer === currentUserAddress);
  };

  const canExecute = (proposal: MultisigProposal): boolean => {
    return proposal.status === 'approved' && proposal.signatures.length >= wallet.threshold;
  };

  const canCancel = (proposal: MultisigProposal): boolean => {
    if (!currentUserAddress) return false;
    return proposal.status === 'pending' && proposal.createdBy === currentUserAddress;
  };

  const formatAddress = (address: string) => {
    if (address.length < 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock size={16} className="text-yellow-400" />;
      case 'approved':
        return <Check size={16} className="text-green-400" />;
      case 'executed':
        return <PlayCircle size={16} className="text-blue-400" />;
      case 'cancelled':
      case 'rejected':
        return <XCircle size={16} className="text-red-400" />;
      default:
        return null;
    }
  };

  const filterButtons: { value: StatusFilter; label: string; color: string }[] = [
    { value: 'all', label: 'All', color: 'bg-gray-700' },
    { value: 'pending', label: 'Pending', color: 'bg-yellow-900/30 text-yellow-400' },
    { value: 'approved', label: 'Approved', color: 'bg-green-900/30 text-green-400' },
    { value: 'executed', label: 'Executed', color: 'bg-blue-900/30 text-blue-400' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold text-white">Proposals</h3>
        <div className="flex items-center gap-3">
          <button
            onClick={loadProposals}
            disabled={loading}
            className="p-2 text-gray-400 hover:text-white disabled:opacity-50"
          >
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={() => setShowCreateForm(true)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus size={20} />
            Create Proposal
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
          {error}
        </div>
      )}

      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-800 rounded-lg p-6"
        >
          <h4 className="text-lg font-semibold text-white mb-4">Create New Proposal</h4>
          <div className="space-y-4">
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Description (optional)</label>
              <input
                type="text"
                value={newProposal.description}
                onChange={e => setNewProposal({ ...newProposal, description: e.target.value })}
                placeholder="e.g., Transfer 100 SOL to treasury"
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div>
              <label className="text-gray-400 text-sm mb-2 block">Transaction Data</label>
              <textarea
                value={newProposal.transactionData}
                onChange={e => setNewProposal({ ...newProposal, transactionData: e.target.value })}
                placeholder="Enter base64 encoded transaction data"
                rows={4}
                className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white font-mono text-sm focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => {
                  setShowCreateForm(false);
                  setNewProposal({ description: '', transactionData: '' });
                }}
                className="px-4 py-2 text-gray-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProposal}
                disabled={loading || !newProposal.transactionData.trim()}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                Create Proposal
              </button>
            </div>
          </div>
        </motion.div>
      )}

      <div className="flex items-center gap-2 flex-wrap">
        <Filter size={20} className="text-gray-400" />
        {filterButtons.map(filter => (
          <button
            key={filter.value}
            onClick={() => setStatusFilter(filter.value)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              statusFilter === filter.value
                ? filter.color
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {loading && proposals.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
        </div>
      ) : proposals.length === 0 ? (
        <div className="text-center py-12">
          <FileText size={64} className="mx-auto text-gray-600 mb-4" />
          <h4 className="text-xl font-semibold text-white mb-2">No Proposals</h4>
          <p className="text-gray-400 mb-6">Create a proposal to get started</p>
        </div>
      ) : (
        <div className="space-y-4">
          {proposals.map(proposal => (
            <motion.div
              key={proposal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-gray-800 rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    {getStatusIcon(proposal.status)}
                    <h4 className="text-lg font-semibold text-white">
                      {proposal.description || 'Transaction Proposal'}
                    </h4>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Created by {formatAddress(proposal.createdBy)} •{' '}
                    {formatDate(proposal.createdAt)}
                  </p>
                </div>
                <span
                  className={`px-3 py-1 text-xs font-medium rounded-full ${
                    proposal.status === 'pending'
                      ? 'bg-yellow-900/30 text-yellow-400'
                      : proposal.status === 'approved'
                        ? 'bg-green-900/30 text-green-400'
                        : proposal.status === 'executed'
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-gray-900/30 text-gray-400'
                  }`}
                >
                  {proposal.status}
                </span>
              </div>

              {/* Signature Progress */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-gray-400 text-sm">
                    Signatures: {proposal.signatures.length} / {wallet.threshold}
                  </span>
                  <span className="text-gray-400 text-sm">
                    {Math.round((proposal.signatures.length / wallet.threshold) * 100)}%
                  </span>
                </div>
                <div className="bg-gray-900 rounded-full h-2 overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{
                      width: `${(proposal.signatures.length / wallet.threshold) * 100}%`,
                    }}
                    className="bg-blue-500 h-full"
                  />
                </div>
              </div>

              {/* Signers */}
              {proposal.signatures.length > 0 && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Signed by:</p>
                  <div className="flex flex-wrap gap-2">
                    {proposal.signatures.map(sig => (
                      <div
                        key={sig.id}
                        className="flex items-center gap-2 px-3 py-1 bg-gray-900 rounded-full"
                      >
                        <Check size={14} className="text-green-400" />
                        <span className="text-white text-sm font-mono">
                          {formatAddress(sig.signer)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transaction Signature */}
              {proposal.txSignature && (
                <div className="mb-4">
                  <p className="text-gray-400 text-sm mb-2">Transaction Signature:</p>
                  <div className="bg-gray-900 rounded-lg p-3">
                    <p className="text-white font-mono text-sm break-all">{proposal.txSignature}</p>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 flex-wrap">
                {canSign(proposal) && (
                  <button
                    onClick={() => handleSignProposal(proposal.id)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                  >
                    <Check size={16} />
                    Sign Proposal
                  </button>
                )}
                {canExecute(proposal) && (
                  <button
                    onClick={() => handleExecuteProposal(proposal.id)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    <PlayCircle size={16} />
                    Execute
                  </button>
                )}
                {canCancel(proposal) && (
                  <button
                    onClick={() => handleCancelProposal(proposal.id)}
                    disabled={loading}
                    className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                  >
                    <X size={16} />
                    Cancel
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProposalManager;
