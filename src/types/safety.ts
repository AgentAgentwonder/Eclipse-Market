export interface SafetyPolicy {
  enabled: boolean;
  cooldown_enabled: boolean;
  cooldown_seconds: number;
  max_trade_amount_usd: number | null;
  max_daily_trades: number | null;
  require_simulation: boolean;
  block_high_risk: boolean;
  high_risk_threshold: number;
  require_insurance_above_usd: number | null;
  max_price_impact_percent: number;
  max_slippage_percent: number;
}

export interface PolicyViolation {
  rule: string;
  message: string;
  severity: 'warning' | 'error' | 'critical';
  can_override: boolean;
}

export interface PolicyCheckResult {
  allowed: boolean;
  violations: PolicyViolation[];
  warnings: string[];
  requires_insurance: boolean;
}

export interface CooldownStatus {
  wallet_address: string;
  cooldown_seconds: number;
  remaining_seconds: number;
  last_trade_timestamp: number;
}

export interface TransactionSimulation {
  expected_output: number;
  minimum_output: number;
  maximum_output: number;
  price_impact: number;
  effective_price: number;
  route_efficiency: number;
  gas_estimate: number;
  mev_risk_level: 'low' | 'medium' | 'high' | 'critical';
  mev_loss_estimate: number;
  success_probability: number;
}

export interface RouteHop {
  dex: string;
  input_token: string;
  output_token: string;
  percent_of_trade: number;
}

export interface ImpactPreview {
  input_amount: number;
  input_symbol: string;
  output_amount: number;
  output_symbol: string;
  price_impact_percent: number;
  slippage_percent: number;
  total_fees: number;
  route: RouteHop[];
}

export interface SafetyCheckRequest {
  wallet_address: string;
  input_amount: number;
  input_mint: string;
  output_mint: string;
  input_symbol: string;
  output_symbol: string;
  amount_usd: number;
  slippage_bps: number;
  price_impact_percent: number;
  security_score: number | null;
}

export interface SafetyCheckResult {
  allowed: boolean;
  policy_result: PolicyCheckResult;
  cooldown_status: CooldownStatus | null;
  simulation: TransactionSimulation | null;
  impact_preview: ImpactPreview | null;
  insurance_required: boolean;
  insurance_recommendation: InsuranceQuote | null;
  mev_suggestions: string[];
}

export interface InsuranceProvider {
  id: string;
  name: string;
  coverage_limit_usd: number;
  premium_rate_bps: number;
  response_time_ms: number;
  reliability_percent: number;
  is_active: boolean;
}

export interface InsuranceQuote {
  provider_id: string;
  total_premium_usd: number;
  coverage_amount_usd: number;
  coverage_percentage: number;
  estimated_slippage_reimbursement: number;
  mev_protection_included: boolean;
}

export interface InsuranceSelection {
  provider_id: string;
  premium_usd: number;
  coverage_usd: number;
  includes_mev_protection: boolean;
}
