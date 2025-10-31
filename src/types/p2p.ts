export type OfferType = 'buy' | 'sell';

export interface P2POffer {
  id: string;
  creator: string;
  offerType: OfferType;
  tokenAddress: string;
  tokenSymbol: string;
  amount: number;
  price: number;
  fiatCurrency: string;
  paymentMethods: string[];
  minAmount?: number;
  maxAmount?: number;
  terms?: string;
  timeLimit: number;
  createdAt: string;
  expiresAt?: string;
  isActive: boolean;
  completedTrades: number;
  reputationRequired?: number;
}

export type EscrowState =
  | 'created'
  | 'funded'
  | 'confirmed'
  | 'released'
  | 'disputed'
  | 'cancelled'
  | 'refunded'
  | 'completed';

export interface EscrowRecord {
  id: string;
  offerId: string;
  buyer: string;
  seller: string;
  amount: number;
  tokenAddress: string;
  fiatAmount: number;
  fiatCurrency: string;
  state: EscrowState;
  multisigAddress?: string;
  escrowPubkey?: string;
  createdAt: string;
  fundedAt?: string;
  releasedAt?: string;
  timeoutAt: string;
  arbitrators: string[];
  feeRate: number;
}

export interface ComplianceCheck {
  passed: boolean;
  warnings: string[];
  errors: string[];
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  checksPerformed: string[];
}

export interface DisputeRecord {
  id: string;
  escrowId: string;
  filedBy: string;
  reason: string;
  description: string;
  status: 'open' | 'under_review' | 'evidence' | 'resolved' | 'escalated';
  arbitrator?: string;
  createdAt: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface ChatMessage {
  id: string;
  escrowId: string;
  sender: string;
  recipient: string;
  message: string;
  encrypted: boolean;
  timestamp: string;
  read: boolean;
}

export interface TraderProfile {
  address: string;
  username?: string;
  reputationScore: number;
  totalTrades: number;
  successfulTrades: number;
  cancelledTrades: number;
  disputedTrades: number;
  avgCompletionTime: number;
  firstTradeAt?: string;
  lastTradeAt?: string;
  verified: boolean;
  verificationLevel: number;
}

export interface P2PStats {
  totalOffers: number;
  activeOffers: number;
  totalEscrows: number;
  activeEscrows: number;
  completedEscrows: number;
  totalDisputes: number;
  openDisputes: number;
  totalVolume: number;
  avgCompletionTime: number;
}
