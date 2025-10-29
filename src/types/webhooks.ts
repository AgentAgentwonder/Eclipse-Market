export type WebhookMethod = 'get' | 'post';

export interface WebhookTemplateVariable {
  key: string;
  description?: string;
}

export interface RetryPolicy {
  maxAttempts: number;
  baseDelaySecs: number;
  maxDelaySecs: number;
  jitter: boolean;
}

export interface WebhookConfig {
  id: string;
  name: string;
  description?: string;
  url: string;
  method: WebhookMethod;
  headers: Record<string, string>;
  bodyTemplate?: string;
  variables: WebhookTemplateVariable[];
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  retryPolicy: RetryPolicy;
}

export type DeliveryStatus = 'pending' | 'sent' | 'failed' | 'retrying';

export interface WebhookDeliveryLog {
  id: string;
  webhookId: string;
  webhookName: string;
  status: DeliveryStatus;
  attempt: number;
  responseCode?: number;
  responseTimeMs?: number;
  error?: string;
  payloadPreview?: string;
  triggeredAt: string;
  completedAt?: string;
}

export interface WebhookTestResult {
  success: boolean;
  message: string;
  responseCode?: number;
  responseBody?: string;
  latencyMs?: number;
}

export interface ApiHealthMetrics {
  serviceName: string;
  uptimePercent: number;
  avgLatencyMs: number;
  errorRate: number;
  totalRequests: number;
  successfulRequests: number;
  failedRequests: number;
  lastSuccess?: string;
  lastFailure?: string;
  lastError?: string;
  rateLimitInfo?: {
    limit: number;
    remaining: number;
    resetAt: string;
    usagePercent: number;
  };
  failoverActive: boolean;
  healthStatus: 'healthy' | 'degraded' | 'down';
}

export interface TimeSeriesDataPoint {
  timestamp: string;
  latencyMs: number;
  errorRate: number;
  successRate: number;
}

export interface ApiHealthDashboard {
  services: Record<string, ApiHealthMetrics>;
  history: Record<string, TimeSeriesDataPoint[]>;
  overallHealth: 'healthy' | 'degraded' | 'down';
}
