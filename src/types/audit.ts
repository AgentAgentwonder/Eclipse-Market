export type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

export type Severity = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type AuditStatus = 'verified' | 'pending' | 'failed' | 'unavailable';

export interface Finding {
  severity: Severity;
  category: string;
  title: string;
  description: string;
  recommendation?: string;
  source: string;
}

export interface AuditSource {
  name: string;
  status: AuditStatus;
  score?: number;
  lastUpdated?: string;
  reportUrl?: string;
}

export interface AuditMetadata {
  isMintable: boolean;
  hasFreezeAuthority: boolean;
  isMutable: boolean;
  hasBlacklist: boolean;
  isHoneypot: boolean;
  creatorAddress?: string;
  totalSupply?: string;
  holderCount?: number;
}

export interface AuditResult {
  contractAddress: string;
  securityScore: number;
  riskLevel: RiskLevel;
  findings: Finding[];
  auditSources: AuditSource[];
  metadata: AuditMetadata;
  timestamp: string;
}

export interface SecurityAlertConfig {
  enabled: boolean;
  minSecurityScore: number;
  blockHighRisk: boolean;
  blockCriticalRisk: boolean;
  showWarnings: boolean;
}
