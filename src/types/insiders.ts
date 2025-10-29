export interface MonitoredWallet {
  id: string;
  wallet_address: string;
  label?: string;
  min_transaction_size?: number;
  is_whale: boolean;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface AddMonitoredWalletRequest {
  wallet_address: string;
  label?: string;
  min_transaction_size?: number;
  is_whale: boolean;
}

export interface UpdateMonitoredWalletRequest {
  id: string;
  label?: string;
  min_transaction_size?: number;
  is_whale?: boolean;
  is_active?: boolean;
}

export type ActivityAction = 'buy' | 'sell' | 'transfer' | 'swap' | 'unknown';

export interface WalletActivity {
  id: string;
  wallet_address: string;
  wallet_label?: string;
  tx_signature: string;
  type: ActivityAction;
  input_mint?: string;
  output_mint?: string;
  input_symbol?: string;
  output_symbol?: string;
  amount?: number;
  amount_usd?: number;
  price?: number;
  is_whale: boolean;
  timestamp: string;
}

export interface ActivityFilter {
  wallets?: string[];
  tokens?: string[];
  actions?: string[];
  min_amount_usd?: number;
  max_amount_usd?: number;
  start_date?: string;
  end_date?: string;
}

export interface WalletStatistics {
  wallet_address: string;
  total_transactions: number;
  buy_count: number;
  sell_count: number;
  transfer_count: number;
  total_volume_usd: number;
  avg_transaction_size: number;
  last_activity?: string;
}

export interface CopyTradeParams {
  wallet_activity_id: string;
  wallet_address: string;
  multiplier: number;
  delay_seconds: number;
}
