export interface TransactionDetails {
  signature: string;
  timestamp: string;
  blockTime: number;
  
  // Token details
  tokenSymbol: string;
  tokenMint: string;
  amount: number;
  usdValue: number;
  
  // Transaction costs
  fee: number;
  feeUsd?: number;
  
  // Trade details (if applicable)
  executionPrice?: number;
  slippage?: number;
  expectedPrice?: number;
  
  // Addresses
  fromAddress: string;
  toAddress: string;
  
  // Address metadata
  fromLabel?: string;
  toLabel?: string;
  fromEns?: string;
  fromSns?: string;
  toEns?: string;
  toSns?: string;
  
  // Known address flags
  fromKnownAddress?: boolean;
  toKnownAddress?: boolean;
}

export interface EnhancedAlertNotification {
  alertId: string;
  alertName: string;
  symbol: string;
  
  // Price information
  currentPrice: number;
  priceChange24h?: number;
  priceChange7d?: number;
  
  // Conditions
  conditionsMet: string;
  triggeredAt: string;
  
  // Transaction details (optional - for transaction-based alerts)
  transaction?: TransactionDetails;
  
  // Context
  contextMessage?: string;
  similarOpportunities?: SimilarOpportunity[];
}

export interface SimilarOpportunity {
  symbol: string;
  mint: string;
  currentPrice: number;
  priceChange24h: number;
  matchReason: string;
  volume24h?: number;
}

export interface AddressLabel {
  address: string;
  label: string;
  nickname?: string;
  isKnown: boolean;
  category?: 'exchange' | 'whale' | 'protocol' | 'custom';
  addedAt: string;
}
