export interface HolderInfo {
  address: string;
  balance: number;
  percentage: number;
  isKnownWallet: boolean;
  walletLabel?: string;
  rank: number;
}

export interface HolderDistribution {
  tokenAddress: string;
  totalHolders: number;
  topHolders: HolderInfo[];
  giniCoefficient: number;
  concentrationRisk: string;
  top10Percentage: number;
  top50Percentage: number;
  updatedAt: string;
}

export interface HolderTrend {
  timestamp: string;
  holderCount: number;
  newHolders: number;
  existingHolders: number;
}

export interface LargeTransfer {
  id: string;
  tokenAddress: string;
  fromAddress: string;
  toAddress: string;
  amount: number;
  percentageOfSupply: number;
  timestamp: string;
  transactionSignature: string;
}

export interface TokenMetadata {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: number;
  mintAuthority?: string;
  freezeAuthority?: string;
  updateAuthority?: string;
  creationDate: string;
  creator: string;
  logoUri?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  description?: string;
  tokenProgram: string;
}

export interface Vulnerability {
  severity: string;
  description: string;
  discoveredAt: string;
}

export interface CommunityVotes {
  upvotes: number;
  downvotes: number;
  totalVotes: number;
  trustScore: number;
}

export interface VerificationStatus {
  verified: boolean;
  verifiedOnSolanaExplorer: boolean;
  auditStatus: string;
  auditProvider?: string;
  auditDate?: string;
  vulnerabilities: Vulnerability[];
  communityVotes: CommunityVotes;
  riskScore: number;
}
