export type ConditionType =
  | 'above'
  | 'below'
  | 'percent_change'
  | 'volume_spike'
  | 'whale_transaction'
  | 'time_window'
  | 'market_cap'
  | 'liquidity'
  | 'trading_volume'
  | 'price_range'
  | 'volatility'
  | 'trend_change';

export interface ConditionParameters {
  threshold?: number;
  minValue?: number;
  maxValue?: number;
  timeframeMinutes?: number;
  whaleThresholdUsd?: number;
  startTime?: string;
  endTime?: string;
  daysOfWeek?: number[];
  comparisonOperator?: 'greater' | 'greater_or_equal' | 'less' | 'less_or_equal' | 'equal' | 'between';
}

export interface Condition {
  id?: string;
  conditionType: ConditionType;
  parameters: ConditionParameters;
  description?: string;
}

export interface RuleGroup {
  operator: 'and' | 'or';
  nodes: RuleNode[];
  windowMinutes?: number;
  label?: string;
  description?: string;
}

export interface RuleNode {
  id?: string;
  label?: string;
  condition?: Condition;
  group?: RuleGroup;
  metadata?: Record<string, unknown> | null;
}

export type ActionType =
  | 'notify'
  | 'send_email'
  | 'send_webhook'
  | 'send_telegram'
  | 'send_slack'
  | 'send_discord'
  | 'execute_trade'
  | 'pause_strategy'
  | 'update_alert'
  | 'log_event';

export type TradeSide = 'buy' | 'sell';
export type OrderType = 'market' | 'limit' | 'stop_loss' | 'stop_limit';
export type NotificationPriority = 'low' | 'normal' | 'high' | 'critical';

export interface TradeConfig {
  tokenMint: string;
  side: TradeSide;
  orderType: OrderType;
  amount?: number;
  amountPercent?: number;
  price?: number;
  slippageBps: number;
  stopLossPercent?: number;
  takeProfitPercent?: number;
  maxRetries: number;
}

export interface ActionParameters {
  message?: string;
  title?: string;
  priority?: NotificationPriority;
  webhookUrl?: string;
  emailTo?: string[];
  emailSubject?: string;
  chatId?: string;
  channelId?: string;
  tradeConfig?: TradeConfig;
  strategyId?: string;
  customPayload?: Record<string, unknown>;
}

export interface Action {
  id?: string;
  actionType: ActionType;
  parameters: ActionParameters;
  description?: string;
  enabled: boolean;
}

export type Permission = 'view' | 'edit' | 'execute' | 'admin';

export interface SharedAccess {
  userId: string;
  permission: Permission;
  grantedAt: string;
}

export interface SmartAlertRule {
  id: string;
  name: string;
  description?: string;
  ruleTree: RuleNode;
  actions: Action[];
  enabled: boolean;
  symbol?: string;
  ownerId?: string;
  teamId?: string;
  sharedWith: SharedAccess[];
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateSmartRuleRequest {
  name: string;
  description?: string;
  ruleTree: RuleNode;
  actions: Action[];
  enabled: boolean;
  symbol?: string;
  ownerId?: string;
  teamId?: string;
  sharedWith?: SharedAccess[];
  tags?: string[];
}

export interface UpdateSmartRuleRequest {
  name?: string;
  description?: string | null;
  ruleTree?: RuleNode;
  actions?: Action[];
  enabled?: boolean;
  symbol?: string | null;
  ownerId?: string | null;
  teamId?: string | null;
  sharedWith?: SharedAccess[];
  tags?: string[];
}

export interface SmartRuleFilter {
  ownerId?: string;
  teamId?: string;
  includeDisabled?: boolean;
  tag?: string;
}

export interface DryRunResult {
  ruleId: string;
  ruleName: string;
  wouldTrigger: boolean;
  evaluationMessage: string;
  actionsSimulated: Array<{
    actionType: string;
    wouldExecute: boolean;
    reason: string;
    validationErrors: string[];
    estimatedImpact?: string;
  }>;
  warnings: string[];
  executionTimeMs: number;
  dryRunAt: string;
}

export interface RuleExecutionResult {
  ruleId: string;
  triggered: boolean;
  evaluation: {
    ruleId: string;
    triggered: boolean;
    conditionResults: Array<{
      conditionId: string;
      met: boolean;
      message: string;
      confidence: number;
      data?: Record<string, unknown>;
    }>;
    message: string;
    confidence: number;
    evaluatedAt: string;
    windowSatisfied?: boolean;
  };
  actionResults: Array<{
    actionId: string;
    success: boolean;
    message: string;
    error?: string;
    data?: Record<string, unknown>;
    executedAt: string;
  }>;
  dryRun: boolean;
  executedAt: string;
}
