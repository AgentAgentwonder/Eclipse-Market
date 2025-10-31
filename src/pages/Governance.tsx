import { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { motion } from 'framer-motion';
import {
  Vote,
  Users,
  TrendingUp,
  Clock,
  AlertCircle,
  ChevronRight,
  Shield,
} from 'lucide-react';
import { GovernanceSummary, DAOMembership, GovernanceProposal } from '../types/governance';
import { useWalletStore } from '../store/walletStore';
import { DAOMembershipList } from '../components/governance/DAOMembershipList';
import { ProposalList } from '../components/governance/ProposalList';
import { VotingModal } from '../components/governance/VotingModal';
import { ProposalImpactModal } from '../components/governance/ProposalImpactModal';
import { DelegationModal } from '../components/governance/DelegationModal';
import { UpcomingDeadlines } from '../components/governance/UpcomingDeadlines';

export default function Governance() {
  const { publicKey } = useWalletStore();
  const [summary, setSummary] = useState<GovernanceSummary | null>(null);
  const [memberships, setMemberships] = useState<DAOMembership[]>([]);
  const [proposals, setProposals] = useState<GovernanceProposal[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProposal, setSelectedProposal] = useState<GovernanceProposal | null>(null);
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [showImpactModal, setShowImpactModal] = useState(false);
  const [showDelegationModal, setShowDelegationModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'proposals' | 'memberships' | 'delegations'>('overview');

  useEffect(() => {
    if (publicKey) {
      loadGovernanceData();
    }
  }, [publicKey]);

  const loadGovernanceData = async () => {
    if (!publicKey) return;

    try {
      setLoading(true);

      const [summaryData, membershipsData] = await Promise.all([
        invoke<GovernanceSummary>('get_governance_summary', { walletAddress: publicKey }),
        invoke<DAOMembership[]>('sync_governance_memberships', { walletAddress: publicKey }),
      ]);

      setSummary(summaryData);
      setMemberships(membershipsData);

      for (const membership of membershipsData) {
        await invoke('sync_governance_proposals', { daoId: membership.daoId });
      }

      const allProposals = await invoke<GovernanceProposal[]>(
        'get_all_active_governance_proposals',
        { walletAddress: publicKey }
      );
      setProposals(allProposals);
    } catch (error) {
      console.error('Failed to load governance data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVote = (proposal: GovernanceProposal) => {
    setSelectedProposal(proposal);
    setShowVotingModal(true);
  };

  const handleViewImpact = (proposal: GovernanceProposal) => {
    setSelectedProposal(proposal);
    setShowImpactModal(true);
  };

  const handleVoteComplete = () => {
    setShowVotingModal(false);
    setSelectedProposal(null);
    loadGovernanceData();
  };

  if (!publicKey) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <Shield className="w-16 h-16 mx-auto mb-4 text-purple-500" />
          <h2 className="text-2xl font-bold mb-2">Connect Your Wallet</h2>
          <p className="text-gray-400">
            Connect your wallet to participate in DAO governance
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-4xl font-bold mb-2">Governance Center</h1>
          <p className="text-gray-400">
            Participate in DAO governance across multiple platforms
          </p>
        </motion.div>

        {summary && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8"
          >
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Users className="w-5 h-5 text-purple-400" />
                <span className="text-2xl font-bold">{summary.totalDaos}</span>
              </div>
              <p className="text-sm text-gray-400">DAO Memberships</p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Vote className="w-5 h-5 text-blue-400" />
                <span className="text-2xl font-bold">{summary.activeProposals}</span>
              </div>
              <p className="text-sm text-gray-400">Active Proposals</p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-bold">
                  {summary.totalVotingPower.toLocaleString()}
                </span>
              </div>
              <p className="text-sm text-gray-400">Voting Power</p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <Clock className="w-5 h-5 text-yellow-400" />
                <span className="text-2xl font-bold">{summary.pendingVotes}</span>
              </div>
              <p className="text-sm text-gray-400">Pending Votes</p>
            </div>

            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-2">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <span className="text-2xl font-bold">
                  {summary.upcomingDeadlines.length}
                </span>
              </div>
              <p className="text-sm text-gray-400">Urgent Deadlines</p>
            </div>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="mb-6"
        >
          <div className="flex gap-2 border-b border-gray-800">
            {[
              { id: 'overview', label: 'Overview' },
              { id: 'proposals', label: 'Proposals' },
              { id: 'memberships', label: 'DAOs' },
              { id: 'delegations', label: 'Delegations' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-6 py-3 font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'text-purple-400 border-b-2 border-purple-400'
                    : 'text-gray-400 hover:text-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          {activeTab === 'overview' && summary && (
            <div className="space-y-6">
              <UpcomingDeadlines
                deadlines={summary.upcomingDeadlines}
                onVote={(proposalId) => {
                  const proposal = proposals.find(p => p.proposalId === proposalId);
                  if (proposal) handleVote(proposal);
                }}
              />

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold mb-4">Recent Activity</h3>
                  <div className="space-y-3">
                    {proposals.slice(0, 5).map((proposal) => (
                      <div
                        key={proposal.proposalId}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-750 cursor-pointer transition-colors"
                        onClick={() => handleViewImpact(proposal)}
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{proposal.title}</p>
                          <p className="text-xs text-gray-400">{proposal.daoName}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-gray-400" />
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
                  <h3 className="text-lg font-semibold mb-4">Your DAOs</h3>
                  <div className="space-y-3">
                    {memberships.slice(0, 5).map((membership) => (
                      <div
                        key={membership.daoId}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg"
                      >
                        <div className="flex-1">
                          <p className="font-medium text-sm">{membership.daoName}</p>
                          <p className="text-xs text-gray-400">
                            {membership.votingPower.toLocaleString()} voting power
                          </p>
                        </div>
                        <span className="text-xs px-2 py-1 bg-purple-600/20 text-purple-300 rounded capitalize">
                          {membership.platform}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'proposals' && (
            <ProposalList
              proposals={proposals}
              onVote={handleVote}
              onViewImpact={handleViewImpact}
            />
          )}

          {activeTab === 'memberships' && (
            <DAOMembershipList
              memberships={memberships}
              onDelegate={() => setShowDelegationModal(true)}
            />
          )}

          {activeTab === 'delegations' && (
            <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold">Voting Delegations</h3>
                <button
                  onClick={() => setShowDelegationModal(true)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  New Delegation
                </button>
              </div>
              <p className="text-gray-400 text-center py-12">
                No active delegations
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {showVotingModal && selectedProposal && (
        <VotingModal
          proposal={selectedProposal}
          walletAddress={publicKey}
          onClose={() => setShowVotingModal(false)}
          onComplete={handleVoteComplete}
        />
      )}

      {showImpactModal && selectedProposal && (
        <ProposalImpactModal
          proposal={selectedProposal}
          onClose={() => setShowImpactModal(false)}
          onVote={() => {
            setShowImpactModal(false);
            setShowVotingModal(true);
          }}
        />
      )}

      {showDelegationModal && (
        <DelegationModal
          memberships={memberships}
          walletAddress={publicKey}
          onClose={() => setShowDelegationModal(false)}
          onComplete={() => {
            setShowDelegationModal(false);
            loadGovernanceData();
          }}
        />
      )}
    </div>
  );
}
