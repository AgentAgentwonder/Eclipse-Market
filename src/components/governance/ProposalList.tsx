import { GovernanceProposal } from '../../types/governance';
import { Clock, ExternalLink, TrendingUp, Eye } from 'lucide-react';
import { motion } from 'framer-motion';

interface ProposalListProps {
  proposals: GovernanceProposal[];
  onVote: (proposal: GovernanceProposal) => void;
  onViewImpact: (proposal: GovernanceProposal) => void;
}

export function ProposalList({ proposals, onVote, onViewImpact }: ProposalListProps) {
  const formatTimeRemaining = (timestamp: number) => {
    const now = Math.floor(Date.now() / 1000);
    const diff = timestamp - now;
    const hours = Math.floor(diff / 3600);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h`;
    return 'Less than 1h';
  };

  return (
    <div className="space-y-4">
      {proposals.length === 0 ? (
        <div className="bg-gray-900 rounded-xl p-12 border border-gray-800 text-center">
          <p className="text-gray-400">No active proposals</p>
        </div>
      ) : (
        proposals.map((proposal, index) => {
          const totalVotes = proposal.yesVotes + proposal.noVotes + proposal.abstainVotes;
          const yesPercent = totalVotes > 0 ? (proposal.yesVotes / totalVotes) * 100 : 0;
          const participation = (totalVotes / proposal.quorumRequired) * 100;

          return (
            <motion.div
              key={proposal.proposalId}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-gray-900 rounded-xl p-6 border border-gray-800 hover:border-gray-700 transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded uppercase">
                      {proposal.platform}
                    </span>
                    <span className="text-xs text-gray-400">{proposal.daoName}</span>
                    <span
                      className={`text-xs px-2 py-1 rounded uppercase ${
                        proposal.status === 'active'
                          ? 'bg-green-600/20 text-green-300'
                          : 'bg-gray-600/20 text-gray-300'
                      }`}
                    >
                      {proposal.status}
                    </span>
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{proposal.title}</h3>
                  <p className="text-sm text-gray-400 line-clamp-2">{proposal.description}</p>
                </div>
              </div>

              <div className="space-y-3 mb-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="text-gray-400">Yes</span>
                    <span className="text-green-400">{yesPercent.toFixed(1)}%</span>
                  </div>
                  <div className="w-full bg-gray-800 rounded-full h-2">
                    <div
                      className="bg-green-500 h-2 rounded-full transition-all"
                      style={{ width: `${yesPercent}%` }}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between text-sm text-gray-400">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    <span>Ends in {formatTimeRemaining(proposal.votingEndsAt)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    <span>Participation: {participation.toFixed(1)}%</span>
                  </div>
                </div>

                {proposal.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2">
                    {proposal.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs px-2 py-1 bg-gray-800 text-gray-400 rounded"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 pt-4 border-t border-gray-800">
                <button
                  onClick={() => onViewImpact(proposal)}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  <span className="text-sm font-medium">Impact Analysis</span>
                </button>

                {proposal.status === 'active' && (
                  <button
                    onClick={() => onVote(proposal)}
                    className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg text-sm font-medium transition-colors"
                  >
                    Vote Now
                  </button>
                )}

                {proposal.discussionUrl && (
                  <a
                    href={proposal.discussionUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <ExternalLink className="w-4 h-4" />
                  </a>
                )}
              </div>
            </motion.div>
          );
        })
      )}
    </div>
  );
}
