export type IssueSeverity = 'critical' | 'warning' | 'info';
export type IssueCategory = 
  | 'file_system'
  | 'dependencies'
  | 'database'
  | 'network'
  | 'performance'
  | 'code_integrity'
  | 'configuration'
  | 'security'
  | 'environment'
  | 'service'
  | 'unknown';

export type RepairLevel = 'automatic' | 'confirmation' | 'manual';
export type RepairStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
export type HealthLevel = 'excellent' | 'good' | 'degraded' | 'critical' | 'unknown';
export type AutoRepairMode = 'auto' | 'ask' | 'never';

export interface PanelMetric {
  label: string;
  value: string;
  level?: HealthLevel;
}

export interface PanelStatus {
  title: string;
  level: HealthLevel;
  summary: string;
  metrics: PanelMetric[];
  actions: string[];
}

export interface DiagnosticsSummary {
  issues_found: number;
  auto_fixed: number;
  manual_needed: number;
  ignored: number;
}

export interface DiagnosticIssue {
  id: string;
  category: IssueCategory;
  severity: IssueSeverity;
  title: string;
  description: string;
  detected_at: string;
  recommended_action: string;
  repair_level: RepairLevel;
  auto_repair_available: boolean;
  status: RepairStatus;
  metadata: Record<string, any>;
}

export interface RepairAction {
  action: string;
  description: string;
  estimated_duration?: string;
  level: RepairLevel;
  requires_confirmation: boolean;
}

export interface RepairRecord {
  id: string;
  issue_id?: string;
  started_at: string;
  completed_at?: string;
  status: RepairStatus;
  summary: string;
  actions: RepairAction[];
  backup_location?: string;
  rollback_token?: string;
  metadata: Record<string, any>;
}

export interface DiagnosticsReport {
  generated_at: string;
  health_score: number;
  summary: DiagnosticsSummary;
  panels: Record<string, PanelStatus>;
  issues: DiagnosticIssue[];
  repair_history: RepairRecord[];
  notes: string[];
}

export interface AutoRepairResult {
  issue_id?: string;
  status: RepairStatus;
  message: string;
  actions: RepairAction[];
  backup_location?: string;
  rollback_token?: string;
}

export interface RepairPlan {
  level: RepairLevel;
  steps: RepairAction[];
  requires_backup: boolean;
  estimated_time: string;
  risk: string;
}

export interface DiagnosticsSettings {
  auto_scan_on_startup: boolean;
  scan_interval_minutes: number;
  auto_repair_mode: AutoRepairMode;
  backup_before_repair: boolean;
  history_retention_days: number;
  dry_run: boolean;
}
