import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Users, Plus, AlertCircle, RefreshCw, FileText, CheckCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import MultisigWizard from './MultisigWizard';

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

const MultisigDashboard: React.FC = () => {
  const [wallets, setWallets] = useState<MultisigWallet[]>([]);
  const [selectedWallet, setSelectedWallet] = useState<MultisigWallet | null>(null);
  const [proposals, setProposals] = useState<MultisigProposal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showWizard, setShowWizard] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  useEffect(() => {
    if (selectedWallet) {
      loadProposals(selectedWallet.id);
    }
  }, [selectedWallet]);

  const loadWallets = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await invoke<MultisigWallet[]>('list_multisig_wallets');
      setWallets(result);
      if (result.length > 0 && !selectedWallet) {
        setSelectedWallet(result[0]);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setLoading(false);
    }
  };

  const loadProposals = async (walletId: string) => {
    try {
      const result = await invoke<MultisigProposal[]>('list_proposals', {
        walletId,
        statusFilter: null,
      });
      setProposals(result);
    } catch (err) {
      console.error('Failed to load proposals:', err);
    }
  };

  const handleWalletCreated = (wallet: MultisigWallet) => {
    setWallets([...wallets, wallet]);
    setSelectedWallet(wallet);
  };

  const getPendingProposalsCount = (walletId: string) => {
    return proposals.filter(p => p.walletId === walletId && p.status === 'pending').length;
  };

  const formatAddress = (address: string) => {
    if (address.length < 12) return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Multisig Wallets</h2>
          <p className="text-gray-400 mt-1">Manage your multisignature wallets and proposals</p>
        </div>
        <button
          onClick={() => setShowWizard(true)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus size={20} />
          Create Multisig
        </button>
      </div>

      {error && (
        <div className="flex items-center gap-3 p-4 bg-red-900/20 border border-red-700 rounded-lg text-red-400">
          <AlertCircle size={20} />
          <p>{error}</p>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <RefreshCw className="animate-spin text-blue-500" size={32} />
        </div>
      ) : wallets.length === 0 ? (
        <div className="text-center py-12">
          <Users size={64} className="mx-auto text-gray-600 mb-4" />
          <h3 className="text-xl font-semibold text-white mb-2">No Multisig Wallets</h3>
          <p className="text-gray-400 mb-6">Create your first multisig wallet to get started</p>
          <button
            onClick={() => setShowWizard(true)}
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus size={20} />
            Create Multisig Wallet
          </button>
        </div>
      ) : (
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Wallet List */}
          <div className="lg:col-span-1 space-y-3">
            {wallets.map(wallet => (
              <motion.div
                key={wallet.id}
                whileHover={{ scale: 1.02 }}
                onClick={() => setSelectedWallet(wallet)}
                className={`p-4 rounded-lg cursor-pointer transition-colors ${
                  selectedWallet?.id === wallet.id
                    ? 'bg-blue-900/30 border-2 border-blue-600'
                    : 'bg-gray-800 border-2 border-transparent hover:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-white">{wallet.name}</h3>
                  {getPendingProposalsCount(wallet.id) > 0 && (
                    <span className="px-2 py-1 text-xs font-medium bg-yellow-900/30 text-yellow-400 rounded-full">
                      {getPendingProposalsCount(wallet.id)} pending
                    </span>
                  )}
                </div>
                <p className="text-gray-400 text-sm font-mono mb-3">
                  {formatAddress(wallet.address)}
                </p>
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-400">
                    <Users size={16} />
                    <span>
                      {wallet.threshold}/{wallet.members.length}
                    </span>
                  </div>
                  <div className="text-gray-400">{wallet.balance.toFixed(2)} SOL</div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Wallet Details */}
          {selectedWallet && (
            <div className="lg:col-span-2 space-y-4">
              <div className="bg-gray-800 rounded-lg p-6">
                <h3 className="text-xl font-semibold text-white mb-4">{selectedWallet.name}</h3>

                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-gray-400 text-sm">Balance</label>
                    <p className="text-white font-semibold text-2xl">
                      {selectedWallet.balance.toFixed(4)} SOL
                    </p>
                  </div>
                  <div>
                    <label className="text-gray-400 text-sm">Threshold</label>
                    <p className="text-white font-semibold text-2xl">
                      {selectedWallet.threshold} / {selectedWallet.members.length}
                    </p>
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-gray-400 text-sm mb-2 block">Address</label>
                  <div className="bg-gray-900 rounded-lg p-3">
                    <p className="text-white font-mono text-sm break-all">
                      {selectedWallet.address}
                    </p>
                  </div>
                </div>

                <div>
                  <label className="text-gray-400 text-sm mb-2 block">
                    Members ({selectedWallet.members.length})
                  </label>
                  <div className="space-y-2">
                    {selectedWallet.members.map((member, index) => (
                      <div
                        key={index}
                        className="bg-gray-900 rounded-lg p-3 flex items-center gap-3"
                      >
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-medium">
                          {index + 1}
                        </div>
                        <p className="text-white font-mono text-sm truncate flex-1">{member}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Proposals Section */}
              <div className="bg-gray-800 rounded-lg p-6">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="text-lg font-semibold text-white">Recent Proposals</h4>
                  <button
                    onClick={() => loadProposals(selectedWallet.id)}
                    className="text-gray-400 hover:text-white"
                  >
                    <RefreshCw size={20} />
                  </button>
                </div>

                {proposals.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText size={48} className="mx-auto text-gray-600 mb-2" />
                    <p className="text-gray-400">No proposals yet</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {proposals.slice(0, 5).map(proposal => (
                      <div
                        key={proposal.id}
                        className="bg-gray-900 rounded-lg p-4 hover:bg-gray-800 transition-colors"
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-white font-medium mb-1">
                              {proposal.description || 'Transaction Proposal'}
                            </p>
                            <p className="text-gray-400 text-sm">
                              Created by {formatAddress(proposal.createdBy)} •{' '}
                              {formatDate(proposal.createdAt)}
                            </p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs font-medium rounded-full ${
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
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <CheckCircle size={16} />
                          <span>
                            {proposal.signatures.length} / {selectedWallet.threshold} signatures
                          </span>
                          <div className="flex-1 bg-gray-700 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-500 h-full transition-all"
                              style={{
                                width: `${
                                  (proposal.signatures.length / selectedWallet.threshold) * 100
                                }%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <MultisigWizard
        isOpen={showWizard}
        onClose={() => setShowWizard(false)}
        onSuccess={handleWalletCreated}
      />
    </div>
  );
};

export default MultisigDashboard;
