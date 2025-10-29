import type { ActivityAction, WalletActivity, ActivityFilter } from '../types/insiders';

export function parseWalletActivity(event: Record<string, unknown>): WalletActivity {
  const type = (event.type as ActivityAction) || 'unknown';
  const fallbackId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `activity-${Math.random().toString(36).slice(2, 10)}`;

  return {
    id: String(event.id ?? event.tx_signature ?? fallbackId),
    wallet_address: String(event.wallet_address || ''),
    wallet_label: typeof event.wallet_label === 'string' ? event.wallet_label : undefined,
    tx_signature: String(event.tx_signature || ''),
    type,
    input_mint: typeof event.input_mint === 'string' ? event.input_mint : undefined,
    output_mint: typeof event.output_mint === 'string' ? event.output_mint : undefined,
    input_symbol: typeof event.input_symbol === 'string' ? event.input_symbol : undefined,
    output_symbol: typeof event.output_symbol === 'string' ? event.output_symbol : undefined,
    amount: typeof event.amount === 'number' ? event.amount : undefined,
    amount_usd: typeof event.amount_usd === 'number' ? event.amount_usd : undefined,
    price: typeof event.price === 'number' ? event.price : undefined,
    is_whale: Boolean(event.is_whale),
    timestamp: typeof event.timestamp === 'string' ? event.timestamp : new Date().toISOString(),
  };
}

export function buildActivityFilter(
  wallet: string | null,
  action: ActivityAction | null,
  minAmount: number | null
): ActivityFilter {
  return {
    wallets: wallet ? [wallet] : undefined,
    actions: action ? [action] : undefined,
    min_amount_usd: minAmount ?? undefined,
  };
}

export function calculateCopyTradeAmount(
  activity: WalletActivity,
  multiplier: number,
  customAmount?: number | null
): number {
  if (customAmount && customAmount > 0) {
    return customAmount;
  }
  const base = activity.amount_usd ?? activity.amount ?? 0;
  return base * multiplier;
}
