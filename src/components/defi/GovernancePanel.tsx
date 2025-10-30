import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { Gavel, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { GovernanceProposal } from '../../types/defi';

interface GovernancePanelProps {
  wallet: string;
}

type VoteChoice = 'for' | 'against' | 'abstain';

export function GovernancePanel({ wallet }: GovernancePanelProps) {
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [voting, setVoting] = useState<string | null>(null);

  useEffect(() => {
    const fetchProposals = async () => {
      try {
        const data = await invoke<GovernanceProposal[]>('get_governance_proposals');
        setProposals(data);
      } catch (error) {
        console.error('Failed to fetch governance proposals', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProposals();
  }, []);

  const handleVote = async (proposalId: string, choice: VoteChoice) => {
    try {
      setVoting(proposalId);
      const votingPower = 1000;
      const updated = await invoke<GovernanceProposal>('vote_on_proposal', {
        proposalId,
        wallet,
        choice,
        votingPower,
      });

      setProposals(prev =>
        prev.map(proposal => (proposal.id === proposalId ? updated : proposal))
      );
    } catch (error) {
      console.error('Failed to submit vote', error);
    } finally {
      setVoting(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Gavel className="w-6 h-6 text-purple-400" />
          <div>
            <h2 className="text-xl font-semibold">Governance Proposals</h2>
            <p className="text-sm text-gray-400">Participate in protocol decision-making</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {proposals.length === 0 ? (
          <p className="text-center text-gray-400 py-12">No active governance proposals</p>
        ) : (
          proposals.map(proposal => {
            const totalVotes = proposal.votesFor + proposal.votesAgainst + proposal.votesAbstain;
            const participation = totalVotes > 0 ? (totalVotes / proposal.quorum) * 100 : 0;
            const forPercent = totalVotes > 0 ? (proposal.votesFor / totalVotes) * 100 : 0;
            const againstPercent = totalVotes > 0 ? (proposal.votesAgainst / totalVotes) * 100 : 0;
            const abstainPercent = totalVotes > 0 ? (proposal.votesAbstain / totalVotes) * 100 : 0;

            return (
              <div
                key={proposal.id}
                className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-colors"
              >
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded uppercase">
                        {proposal.protocol}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded uppercase ${
                          proposal.status === 'active'
                            ? 'bg-green-600/20 text-green-300'
                            : proposal.status === 'passed'
                              ? 'bg-blue-600/20 text-blue-300'
                              : 'bg-gray-600/20 text-gray-300'
                        }`}
                      >
                        {proposal.status}
                      </span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">{proposal.title}</h3>
                    <p className="text-sm text-gray-400">{proposal.description}</p>
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">For</span>
                      <span className="text-green-400">
                        {proposal.votesFor.toLocaleString()} ({forPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-green-500 h-2 rounded-full transition-all"
                        style={{ width: `${forPercent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Against</span>
                      <span className="text-red-400">
                        {proposal.votesAgainst.toLocaleString()} ({againstPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-red-500 h-2 rounded-full transition-all"
                        style={{ width: `${againstPercent}%` }}
                      />
                    </div>
                  </div>

                  <div>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-400">Abstain</span>
                      <span className="text-yellow-400">
                        {proposal.votesAbstain.toLocaleString()} ({abstainPercent.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="w-full bg-gray-800 rounded-full h-2">
                      <div
                        className="bg-yellow-500 h-2 rounded-full transition-all"
                        style={{ width: `${abstainPercent}%` }}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-4 border-t border-gray-800">
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <span className="flex items-center gap-1">
                      <Clock className="w-4 h-4" />
                      Ends {new Date(proposal.endTime * 1000).toLocaleDateString()}
                    </span>
                    <span>
                      Participation: {participation.toFixed(1)}% / 100%
                    </span>
                  </div>

                  {proposal.status === 'active' && (
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleVote(proposal.id, 'for')}
                        disabled={voting === proposal.id}
                        className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-4 h-4" /> For
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, 'against')}
                        disabled={voting === proposal.id}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50 flex items-center gap-1"
                      >
                        <XCircle className="w-4 h-4" /> Against
                      </button>
                      <button
                        onClick={() => handleVote(proposal.id, 'abstain')}
                        disabled={voting === proposal.id}
                        className="px-3 py-1 bg-gray-600 hover:bg-gray-700 rounded-md text-sm font-medium transition-colors disabled:opacity-50"
                      >
                        Abstain
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
