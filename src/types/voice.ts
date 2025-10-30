export type VoiceIntentType =
  | 'trade_buy'
  | 'trade_sell'
  | 'trade_cancel'
  | 'portfolio_query'
  | 'price_query'
  | 'alert_create'
  | 'alert_list'
  | 'market_summary'
  | 'assistant_query'
  | 'navigation'
  | 'settings_change';

export type VoiceCommandStatus =
  | 'listening'
  | 'processing'
  | 'confirming'
  | 'executing'
  | 'completed'
  | 'error'
  | 'cancelled';

export type VoiceSensitivityLevel = 'low' | 'medium' | 'high' | 'critical';

export type VoiceLocale = 'en-US' | 'en-GB' | 'es-ES' | 'fr-FR' | 'de-DE' | 'ja-JP' | 'zh-CN';

export interface VoiceIntent {
  type: VoiceIntentType;
  confidence: number;
  parameters: Record<string, any>;
  rawText: string;
  timestamp: number;
}

export interface VoiceCommand {
  id: string;
  intent: VoiceIntent;
  status: VoiceCommandStatus;
  requiresConfirmation: boolean;
  requiresMFA: boolean;
  sensitivityLevel: VoiceSensitivityLevel;
  riskScore?: number;
  confirmationData?: VoiceConfirmationData;
  result?: VoiceCommandResult;
  error?: VoiceError;
  createdAt: number;
  completedAt?: number;
}

export interface VoiceConfirmationData {
  title: string;
  description: string;
  riskWarnings: string[];
  estimatedCost?: {
    amount: number;
    currency: string;
  };
  estimatedGas?: {
    amount: number;
    currency: string;
  };
  priceImpact?: number;
  slippage?: number;
  summary: string;
  audioSummary: string;
}

export interface VoiceCommandResult {
  success: boolean;
  message: string;
  data?: any;
  transactionId?: string;
}

export interface VoiceError {
  code: string;
  message: string;
  details?: string;
  recoverable: boolean;
  suggestedAction?: string;
}

export interface VoiceNotificationSettings {
  enabled: boolean;
  frequency: 'all' | 'important' | 'critical';
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  drivingMode: boolean;
  maxNotificationsPerMinute: number;
}

export interface VoiceSpeechSynthesisConfig {
  voice?: SpeechSynthesisVoice;
  rate: number;
  pitch: number;
  volume: number;
  lang: VoiceLocale;
}

export interface VoiceRecognitionConfig {
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  lang: VoiceLocale;
}

export interface VoiceTradingAction {
  type: 'buy' | 'sell' | 'cancel' | 'modify';
  symbol: string;
  amount?: number;
  price?: number;
  orderType?: 'market' | 'limit' | 'stop';
  slippage?: number;
}

export interface VoicePortfolioQuery {
  type: 'balance' | 'position' | 'pnl' | 'summary';
  symbol?: string;
  timeframe?: string;
}

export interface VoiceAlertAction {
  type: 'create' | 'list' | 'cancel';
  symbol?: string;
  condition?: 'above' | 'below';
  price?: number;
  alertId?: string;
}

export interface VoiceMarketQuery {
  type: 'price' | 'volume' | 'change' | 'summary';
  symbol?: string;
  timeframe?: string;
}

export interface VoiceMFAChallenge {
  id: string;
  commandId: string;
  type: 'pin' | 'biometric' | 'voice_passphrase';
  prompt: string;
  expiresAt: number;
  attempts: number;
  maxAttempts: number;
  verified?: boolean;
}

export interface VoiceMFAResponse {
  challengeId: string;
  response: string;
  timestamp: number;
}

export interface VoiceSession {
  id: string;
  active: boolean;
  startedAt: number;
  lastActivityAt: number;
  commandCount: number;
  locale: VoiceLocale;
  drivingMode: boolean;
}
