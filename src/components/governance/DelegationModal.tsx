import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, Clock } from 'lucide-react';
import { DAOMembership } from '../../types/governance';

interface DelegationModalProps {
  memberships: DAOMembership[];
  walletAddress: string;
  onClose: () => void;
  onComplete: () => void;
}

export function DelegationModal({ memberships, walletAddress, onClose, onComplete }: DelegationModalProps) {
  const [selectedDao, setSelectedDao] = useState<string>(memberships[0]?.daoId ?? '');
  const [delegateAddress, setDelegateAddress] = useState('');
  const [votingPower, setVotingPower] = useState<number>(0);
  const [expiresAt, setExpiresAt] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!selectedDao || !delegateAddress) {
      setError('Please select a DAO and enter a delegate address');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const parsedExpiration = expiresAt ? Math.floor(new Date(expiresAt).getTime() / 1000) : null;

      await invoke('delegate_governance_votes', {
        daoId: selectedDao,
        delegator: walletAddress,
        delegate: delegateAddress,
        votingPower,
        expiresAt: parsedExpiration,
      });

      onComplete();
    } catch (err) {
      console.error('Failed to delegate votes:', err);
      setError(err instanceof Error ? err.message : 'Failed to delegate votes');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 rounded-xl max-w-xl w-full border border-gray-800 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Delegate Governance Rights</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Select DAO</label>
              <div className="relative">
                <select
                  value={selectedDao}
                  onChange={(event) => setSelectedDao(event.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
                >
                  {memberships.map((membership) => (
                    <option key={membership.daoId} value={membership.daoId}>
                      {membership.daoName}
                    </option>
                  ))}
                </select>
                <Users className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Delegate Address</label>
              <input
                type="text"
                value={delegateAddress}
                onChange={(event) => setDelegateAddress(event.target.value)}
                placeholder="Enter wallet address"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Voting Power</label>
              <input
                type="number"
                value={votingPower}
                onChange={(event) => setVotingPower(Number(event.target.value))}
                placeholder="Amount to delegate"
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Expiration (Optional)</label>
              <div className="relative">
                <input
                  type="datetime-local"
                  value={expiresAt}
                  onChange={(event) => setExpiresAt(event.target.value)}
                  className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-purple-500"
                />
                <Clock className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
          </div>

          <div className="p-6 border-t border-gray-800 flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Delegating...' : 'Delegate Votes'}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
