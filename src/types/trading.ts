export type OrderType = 'market' | 'limit' | 'stop_loss' | 'take_profit' | 'trailing_stop';

export type OrderStatus =
  | 'pending'
  | 'partially_filled'
  | 'filled'
  | 'cancelled'
  | 'expired'
  | 'failed';

export type OrderSide = 'buy' | 'sell';

export interface Order {
  id: string;
  order_type: OrderType;
  side: OrderSide;
  status: OrderStatus;
  input_mint: string;
  output_mint: string;
  input_symbol: string;
  output_symbol: string;
  amount: number;
  filled_amount: number;
  limit_price?: number | null;
  stop_price?: number | null;
  trailing_percent?: number | null;
  highest_price?: number | null;
  lowest_price?: number | null;
  linked_order_id?: string | null;
  slippage_bps: number;
  priority_fee_micro_lamports: number;
  wallet_address: string;
  created_at: string;
  updated_at: string;
  triggered_at?: string | null;
  tx_signature?: string | null;
  error_message?: string | null;
}
