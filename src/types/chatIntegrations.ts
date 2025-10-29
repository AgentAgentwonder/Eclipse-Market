export type ChatServiceType = 'telegram' | 'slack' | 'discord';
export type AlertPriority = 'low' | 'medium' | 'high' | 'critical';
export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'rate_limited';

export interface TelegramConfig {
  id: string;
  name: string;
  botToken: string;
  chatId: string;
  enabled: boolean;
  alertTypes?: string[];
  alertPriorities?: AlertPriority[];
}

export interface SlackConfig {
  id: string;
  name: string;
  webhookUrl: string;
  channel?: string;
  enabled: boolean;
  alertTypes?: string[];
  alertPriorities?: AlertPriority[];
}

export interface DiscordConfig {
  id: string;
  name: string;
  webhookUrl: string;
  username?: string;
  enabled: boolean;
  roleMentions?: string[];
  alertTypes?: string[];
  alertPriorities?: AlertPriority[];
}

export interface ChatIntegrationSettings {
  telegram: TelegramConfig[];
  slack: SlackConfig[];
  discord: DiscordConfig[];
}

export interface DeliveryLog {
  id: string;
  serviceType: ChatServiceType;
  configId: string;
  configName: string;
  alertId?: string;
  alertName?: string;
  message: string;
  status: DeliveryStatus;
  error?: string;
  retryCount: number;
  timestamp: string;
}

export interface TestMessageRequest {
  serviceType: ChatServiceType;
  configId: string;
  message: string;
}

export interface TestMessageResult {
  success: boolean;
  message: string;
  deliveryTime?: number;
  error?: string;
}

export interface RateLimitStatus {
  serviceType: ChatServiceType;
  configId: string;
  currentCount: number;
  maxPerMinute: number;
  resetAt: string;
}
