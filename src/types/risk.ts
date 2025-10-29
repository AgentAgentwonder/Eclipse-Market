export interface RiskScore {
  tokenAddress: string;
  score: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Critical';
  contributingFactors: RiskFactor[];
  timestamp: string;
}

export interface RiskFactor {
  factorName: string;
  impact: number;
  severity: 'Low' | 'Medium' | 'High';
  description: string;
}

export interface RiskHistory {
  tokenAddress: string;
  history: RiskHistoryPoint[];
}

export interface RiskHistoryPoint {
  timestamp: string;
  score: number;
  riskLevel: string;
}

export interface RiskFeatures {
  giniCoefficient: number;
  top10Percentage: number;
  totalHolders: number;
  liquidityUsd: number;
  liquidityToMcapRatio: number;
  hasMintAuthority: boolean;
  hasFreezeAuthority: boolean;
  verified: boolean;
  audited: boolean;
  communityTrustScore: number;
  sentimentScore: number;
  tokenAgeDays: number;
  volume24h: number;
  priceVolatility: number;
}
