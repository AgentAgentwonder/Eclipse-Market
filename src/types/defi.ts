export type Protocol =
  | 'solend'
  | 'marginfi'
  | 'kamino'
  | 'jupiter'
  | 'raydium'
  | 'orca';

export type PositionType = 'lending' | 'borrowing' | 'liquidityPool' | 'staking' | 'farming';

export interface Reward {
  token: string;
  amount: number;
  valueUsd: number;
}

export interface DeFiPosition {
  id: string;
  protocol: Protocol;
  positionType: PositionType;
  asset: string;
  amount: number;
  valueUsd: number;
  apy: number;
  rewards: Reward[];
  healthFactor?: number | null;
  createdAt: number;
  lastUpdated: number;
}

export interface LendingPool {
  id: string;
  protocol: Protocol;
  asset: string;
  totalSupply: number;
  totalBorrow: number;
  supplyApy: number;
  borrowApy: number;
  utilizationRate: number;
  availableLiquidity: number;
  collateralFactor: number;
}

export interface YieldFarm {
  id: string;
  protocol: Protocol;
  name: string;
  tokenA: string;
  tokenB: string;
  apy: number;
  tvl: number;
  rewardsToken: string[];
  riskScore: number;
}

export interface StakingPool {
  id: string;
  protocol: Protocol;
  asset: string;
  apy: number;
  tvl: number;
  lockPeriod?: number | null;
  minStake: number;
}

export interface PortfolioSummary {
  totalValueUsd: number;
  lendingValue: number;
  borrowingValue: number;
  lpValue: number;
  stakingValue: number;
  farmingValue: number;
  totalEarnings24h: number;
  averageApy: number;
  positions: DeFiPosition[];
}

export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export interface RiskMetrics {
  positionId: string;
  riskLevel: RiskLevel;
  liquidationPrice?: number | null;
  healthFactor?: number | null;
  collateralRatio?: number | null;
  warnings: string[];
}

export interface AutoCompoundSettings {
  positionId: string;
  enabled: boolean;
  threshold: number;
  frequency: number;
  slippageTolerance: number;
  gasLimit: number;
}

export interface CompoundTransaction {
  positionId: string;
  timestamp: number;
  rewardsClaimed: Reward[];
  amountCompounded: number;
  gasCost: number;
  netGain: number;
}

export interface GovernanceProposal {
  id: string;
  protocol: Protocol;
  title: string;
  description: string;
  proposer: string;
  startTime: number;
  endTime: number;
  votesFor: number;
  votesAgainst: number;
  votesAbstain: number;
  status: 'active' | 'passed' | 'rejected' | 'executed' | 'cancelled';
  quorum: number;
  executionEta?: number | null;
}

export interface FarmingOpportunity {
  farm: YieldFarm;
  projectedEarnings24h: number;
  projectedEarnings30d: number;
  riskAdjustedApy: number;
}
