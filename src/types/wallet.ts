export interface TokenBalance {
  mint: string;
  symbol: string;
  name: string;
  balance: number;
  decimals: number;
  usdValue: number;
  change24h: number;
  logoUri?: string;
  lastUpdated: string;
}

export interface SendTransactionInput {
  recipient: string;
  amount: number;
  tokenMint?: string;
  memo?: string;
}

export interface TransactionFeeEstimate {
  baseFee: number;
  priorityFee: number;
  totalFee: number;
  estimatedUnits: number;
}

export interface AddressBookContact {
  id: string;
  address: string;
  label: string;
  nickname?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  lastUsed?: string;
  transactionCount: number;
  tags: string[];
}

export interface BridgeProvider {
  id: string;
  name: string;
  logo: string;
  supportedChains: string[];
  fees: {
    percentage: number;
    fixed: number;
  };
  estimatedTime: string;
}

export interface BridgeTransaction {
  id: string;
  provider: string;
  sourceChain: string;
  destinationChain: string;
  sourceToken: string;
  destinationToken: string;
  amount: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  createdAt: number;
  completedAt?: number;
}

export interface CexTransfer {
  id: string;
  exchange: string;
  direction: 'deposit' | 'withdraw';
  asset: string;
  amount: number;
  address: string;
  memo?: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  txHash?: string;
  createdAt: number;
  completedAt?: number;
}

export interface SwapHistoryEntry {
  id: string;
  fromToken: string;
  toToken: string;
  fromAmount: number;
  toAmount: number;
  rate: number;
  fee: number;
  priceImpact: number;
  txSignature?: string;
  timestamp: string;
  status: 'pending' | 'completed' | 'failed';
}

export interface QRCodeData {
  address: string;
  amount?: number;
  label?: string;
  message?: string;
  spl?: string;
}

export interface SolanaPayQR {
  url: string;
  qrData: string;
  recipient: string;
  amount?: number;
  splToken?: string;
  reference?: string;
  label?: string;
  message?: string;
  memo?: string;
}

export interface HardwareSigningRequest {
  deviceType: 'ledger' | 'trezor';
  transactionData: string;
  requireConfirmation: boolean;
  displayMessage?: string;
}

export interface HardwareSigningResponse {
  signature: string;
  publicKey: string;
  deviceId: string;
}
