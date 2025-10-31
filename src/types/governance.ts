export type DAOPlatform = 'realms' | 'tribeca' | 'squads' | 'custom';

export type ProposalStatus =
  | 'draft'
  | 'active'
  | 'succeeded'
  | 'defeated'
  | 'queued'
  | 'executed'
  | 'cancelled'
  | 'expired';

export type VoteChoice = 'yes' | 'no' | 'abstain';

export interface DAOMembership {
  daoId: string;
  daoName: string;
  daoAddress: string;
  platform: DAOPlatform;
  walletAddress: string;
  governanceToken: string;
  tokenBalance: number;
  votingPower: number;
  delegatedTo: string | null;
  delegatedFrom: string[];
  joinedAt: number;
  isActive: boolean;
}

export interface ProposalInstruction {
  programId: string;
  accounts: string[];
  data: string;
  description: string;
}

export interface GovernanceProposal {
  proposalId: string;
  daoId: string;
  daoName: string;
  platform: DAOPlatform;
  title: string;
  description: string;
  proposer: string;
  status: ProposalStatus;
  createdAt: number;
  votingStartsAt: number;
  votingEndsAt: number;
  executionEta: number | null;
  yesVotes: number;
  noVotes: number;
  abstainVotes: number;
  quorumRequired: number;
  thresholdPercent: number;
  instructions: ProposalInstruction[];
  discussionUrl: string | null;
  tags: string[];
}

export interface VoteRecord {
  voteId: string;
  proposalId: string;
  voter: string;
  voteChoice: VoteChoice;
  votingPower: number;
  timestamp: number;
  transactionSignature: string | null;
}

export interface DelegationRecord {
  delegationId: string;
  daoId: string;
  delegator: string;
  delegate: string;
  votingPower: number;
  createdAt: number;
  expiresAt: number | null;
  isActive: boolean;
}

export interface SimilarProposal {
  proposalId: string;
  title: string;
  similarityScore: number;
  outcome: ProposalStatus;
  finalYesPercent: number;
}

export interface ProposalImpactAnalysis {
  proposalId: string;
  historicalSimilarityScore: number;
  similarProposals: SimilarProposal[];
  predictedOutcome: ProposalStatus;
  confidence: number;
  riskFactors: string[];
  potentialImpacts: Record<string, string>;
  recommendedVote: VoteChoice | null;
}

export interface ProposalReminder {
  reminderId: string;
  proposalId: string;
  walletAddress: string;
  remindAt: number;
  notificationSent: boolean;
}

export interface VoteSignatureRequest {
  proposalId: string;
  voteChoice: VoteChoice;
  walletAddress: string;
  message: string;
  timestamp: number;
}

export interface VoteSignatureResponse {
  signature: string;
  publicKey: string;
  timestamp: number;
}

export interface GovernanceSummary {
  totalDaos: number;
  activeMemberships: number;
  totalVotingPower: number;
  activeProposals: number;
  pendingVotes: number;
  upcomingDeadlines: UpcomingDeadline[];
}

export interface UpcomingDeadline {
  proposalId: string;
  daoName: string;
  title: string;
  endsAt: number;
  timeRemainingHours: number;
  hasVoted: boolean;
}
