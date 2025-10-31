import { useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ThumbsUp, ThumbsDown, Minus, CheckCircle, AlertTriangle } from 'lucide-react';
import { GovernanceProposal, VoteChoice, VoteSignatureRequest, VoteSignatureResponse } from '../../types/governance';

interface VotingModalProps {
  proposal: GovernanceProposal;
  walletAddress: string;
  onClose: () => void;
  onComplete: () => void;
}

export function VotingModal({ proposal, walletAddress, onClose, onComplete }: VotingModalProps) {
  const [selectedVote, setSelectedVote] = useState<VoteChoice | null>(null);
  const [voting, setVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleVote = async () => {
    if (!selectedVote) return;

    try {
      setVoting(true);
      setError(null);

      const signatureRequest = await invoke<VoteSignatureRequest>(
        'prepare_vote_signature',
        {
          proposalId: proposal.proposalId,
          voteChoice: selectedVote,
          walletAddress,
        }
      );

      const mockSignature: VoteSignatureResponse = {
        signature: `sig_${Date.now()}_${Math.random().toString(36)}`,
        publicKey: walletAddress,
        timestamp: Math.floor(Date.now() / 1000),
      };

      const isValid = await invoke<boolean>('verify_vote_signature', {
        request: signatureRequest,
        response: mockSignature,
      });

      if (!isValid) {
        throw new Error('Invalid signature');
      }

      await invoke('submit_signed_vote', {
        proposalId: proposal.proposalId,
        walletAddress,
        voteChoice: selectedVote,
        signature: mockSignature.signature,
      });

      setSuccess(true);
      setTimeout(() => {
        onComplete();
      }, 2000);
    } catch (err) {
      console.error('Failed to submit vote:', err);
      setError(err instanceof Error ? err.message : 'Failed to submit vote');
    } finally {
      setVoting(false);
    }
  };

  const totalVotes = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
  const yesPercent = totalVotes > 0 ? (proposal.yesVotes / totalVotes) * 100 : 0;
  const noPercent = totalVotes > 0 ? (proposal.noVotes / totalVotes) * 100 : 0;
  const abstainPercent = totalVotes > 0 ? (proposal.abstainVotes / totalVotes) * 100 : 0;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.95 }}
          className="bg-gray-900 rounded-xl max-w-2xl w-full border border-gray-800 overflow-hidden"
        >
          <div className="p-6 border-b border-gray-800 flex items-center justify-between">
            <h2 className="text-2xl font-bold">Cast Your Vote</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
            {success ? (
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className="text-center py-12"
              >
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">Vote Submitted!</h3>
                <p className="text-gray-400">
                  Your vote has been successfully recorded on-chain
                </p>
              </motion.div>
            ) : (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded uppercase">
                      {proposal.platform}
                    </span>
                    <span className="text-xs text-gray-400">{proposal.daoName}</span>
                  </div>
                  <h3 className="text-xl font-semibold mb-2">{proposal.title}</h3>
                  <p className="text-gray-400 text-sm">{proposal.description}</p>
                </div>

                <div className="bg-gray-800 rounded-lg p-4 space-y-3">
                  <h4 className="font-medium text-sm text-gray-300">Current Results</h4>
                  <div className="space-y-2">
                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-green-400">Yes</span>
                        <span className="text-green-400">
                          {proposal.yesVotes.toLocaleString()} ({yesPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full transition-all"
                          style={{ width: `${yesPercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-red-400">No</span>
                        <span className="text-red-400">
                          {proposal.noVotes.toLocaleString()} ({noPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-red-500 h-2 rounded-full transition-all"
                          style={{ width: `${noPercent}%` }}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between text-sm mb-1">
                        <span className="text-yellow-400">Abstain</span>
                        <span className="text-yellow-400">
                          {proposal.abstainVotes.toLocaleString()} ({abstainPercent.toFixed(1)}%)
                        </span>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-2">
                        <div
                          className="bg-yellow-500 h-2 rounded-full transition-all"
                          style={{ width: `${abstainPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h4 className="font-medium">Your Vote</h4>
                  <div className="grid grid-cols-3 gap-3">
                    <button
                      onClick={() => setSelectedVote('yes')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedVote === 'yes'
                          ? 'border-green-500 bg-green-500/20'
                          : 'border-gray-700 bg-gray-800 hover:border-green-500/50'
                      }`}
                    >
                      <ThumbsUp
                        className={`w-6 h-6 mx-auto mb-2 ${
                          selectedVote === 'yes' ? 'text-green-400' : 'text-gray-400'
                        }`}
                      />
                      <span className="block text-sm font-medium">Yes</span>
                    </button>

                    <button
                      onClick={() => setSelectedVote('no')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedVote === 'no'
                          ? 'border-red-500 bg-red-500/20'
                          : 'border-gray-700 bg-gray-800 hover:border-red-500/50'
                      }`}
                    >
                      <ThumbsDown
                        className={`w-6 h-6 mx-auto mb-2 ${
                          selectedVote === 'no' ? 'text-red-400' : 'text-gray-400'
                        }`}
                      />
                      <span className="block text-sm font-medium">No</span>
                    </button>

                    <button
                      onClick={() => setSelectedVote('abstain')}
                      className={`p-4 rounded-lg border-2 transition-all ${
                        selectedVote === 'abstain'
                          ? 'border-yellow-500 bg-yellow-500/20'
                          : 'border-gray-700 bg-gray-800 hover:border-yellow-500/50'
                      }`}
                    >
                      <Minus
                        className={`w-6 h-6 mx-auto mb-2 ${
                          selectedVote === 'abstain' ? 'text-yellow-400' : 'text-gray-400'
                        }`}
                      />
                      <span className="block text-sm font-medium">Abstain</span>
                    </button>
                  </div>
                </div>

                {error && (
                  <div className="p-4 bg-red-900/30 border border-red-800 rounded-lg flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}
              </>
            )}
          </div>

          {!success && (
            <div className="p-6 border-t border-gray-800 flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-6 py-3 bg-gray-800 hover:bg-gray-700 rounded-lg font-medium transition-colors"
                disabled={voting}
              >
                Cancel
              </button>
              <button
                onClick={handleVote}
                disabled={!selectedVote || voting}
                className="flex-1 px-6 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {voting ? 'Submitting...' : 'Submit Vote'}
              </button>
            </div>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
