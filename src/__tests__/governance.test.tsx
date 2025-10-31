import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import Governance from '../pages/Governance';
import { invoke } from '@tauri-apps/api/tauri';
import { useWalletStore } from '../store/walletStore';

vi.mock('@tauri-apps/api/tauri');

const mockSummary = {
  totalDaos: 2,
  activeMemberships: 2,
  totalVotingPower: 23500,
  activeProposals: 2,
  pendingVotes: 1,
  upcomingDeadlines: [
    {
      proposalId: 'mango-prop-8',
      daoName: 'Mango DAO',
      title: 'Treasury Diversification Strategy',
      endsAt: Math.floor(Date.now() / 1000) + 3600,
      timeRemainingHours: 1,
      hasVoted: false,
    },
  ],
};

const mockMemberships = [
  {
    daoId: 'realms-mango-dao',
    daoName: 'Mango DAO',
    daoAddress: 'test-address',
    platform: 'realms' as const,
    walletAddress: 'test-wallet',
    governanceToken: 'MNGO',
    tokenBalance: 12345,
    votingPower: 12345,
    delegatedTo: null,
    delegatedFrom: [],
    joinedAt: Math.floor(Date.now() / 1000) - 86400,
    isActive: true,
  },
];

const mockProposals = [
  {
    proposalId: 'mango-prop-8',
    daoId: 'realms-mango-dao',
    daoName: 'Mango DAO',
    platform: 'realms' as const,
    title: 'Treasury Diversification Strategy',
    description: 'Proposal to diversify the DAO treasury',
    proposer: 'mango_council',
    status: 'active' as const,
    createdAt: Math.floor(Date.now() / 1000) - 3600,
    votingStartsAt: Math.floor(Date.now() / 1000) - 1800,
    votingEndsAt: Math.floor(Date.now() / 1000) + 3600,
    executionEta: null,
    yesVotes: 75000,
    noVotes: 25000,
    abstainVotes: 5000,
    quorumRequired: 150000,
    thresholdPercent: 66,
    instructions: [],
    discussionUrl: null,
    tags: ['treasury'],
  },
];

vi.mock('../store/walletStore', async () => {
  const actual = await vi.importActual<typeof import('../store/walletStore')>('../store/walletStore');
  return {
    ...actual,
    useWalletStore: vi.fn(),
  };
});

const mockInvoke = vi.mocked(invoke);

describe('Governance Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(useWalletStore).mockReturnValue({ publicKey: 'test-wallet' } as any);

    mockInvoke.mockImplementation(async (command: string) => {
      switch (command) {
        case 'get_governance_summary':
          return mockSummary;
        case 'sync_governance_memberships':
          return mockMemberships;
        case 'get_all_active_governance_proposals':
          return mockProposals;
        case 'sync_governance_proposals':
          return mockProposals;
        case 'prepare_vote_signature':
          return {
            proposalId: 'mango-prop-8',
            voteChoice: 'yes',
            walletAddress: 'test-wallet',
            message: 'mock-message',
            timestamp: Math.floor(Date.now() / 1000),
          };
        case 'verify_vote_signature':
          return true;
        case 'submit_signed_vote':
          return {
            voteId: 'vote-1',
            proposalId: 'mango-prop-8',
            voter: 'test-wallet',
            voteChoice: 'yes',
            votingPower: 12345,
            timestamp: Math.floor(Date.now() / 1000),
            transactionSignature: 'test-sig',
          };
        default:
          return null;
      }
    });
  });

  it('renders governance summary', async () => {
    render(<Governance />);
    await waitFor(() => {
      expect(screen.getByText('Governance Center')).toBeInTheDocument();
    });

    expect(screen.getByText('DAO Memberships')).toBeInTheDocument();
    expect(screen.getByText('Active Proposals')).toBeInTheDocument();
    expect(screen.getByText('Voting Power')).toBeInTheDocument();
  });

  it('loads proposals and allows voting', async () => {
    render(<Governance />);

    await waitFor(() => {
      expect(screen.getByText('Treasury Diversification Strategy')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Vote Now'));
    await waitFor(() => {
      expect(screen.getByText('Cast Your Vote')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByText('Yes'));
    fireEvent.click(screen.getByText('Submit Vote'));

    await waitFor(() => {
      expect(mockInvoke).toHaveBeenCalledWith('submit_signed_vote', expect.anything());
    });
  });

  it('shows proposal impact analysis', async () => {
    mockInvoke.mockImplementation(async (command: string) => {
      if (command === 'analyze_governance_proposal') {
        return {
          proposalId: 'mango-prop-8',
          historicalSimilarityScore: 0.75,
          similarProposals: [],
          predictedOutcome: 'succeeded',
          confidence: 0.82,
          riskFactors: ['Low participation'],
          potentialImpacts: { treasury: 'Adjusts treasury allocation' },
          recommendedVote: 'yes',
        };
      }
      return (mockInvoke.getMockImplementation() as any)(command);
    });

    render(<Governance />);

    await waitFor(() => {
      expect(screen.getByText('Treasury Diversification Strategy')).toBeInTheDocument();
    });

    fireEvent.click(screen.getAllByText('Impact Analysis')[0]);

    await waitFor(() => {
      expect(screen.getByText('Proposal Impact Analysis')).toBeInTheDocument();
      expect(screen.getByText('Recommended Vote')).toBeInTheDocument();
    });
  });
});
