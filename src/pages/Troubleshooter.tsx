import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  Database,
  FileText,
  Globe,
  HardDrive,
  Info,
  Play,
  RefreshCw,
  Settings,
  Shield,
  TrendingUp,
  Wrench,
  X,
  XCircle,
  Zap,
} from 'lucide-react';
import { useTroubleshooterStore } from '@/store/troubleshooterStore';
import { DiagnosticIssue, HealthLevel, IssueSeverity, PanelStatus } from '@/types/diagnostics';

const healthColors: Record<HealthLevel, string> = {
  excellent: 'text-green-500 bg-green-500/10',
  good: 'text-blue-500 bg-blue-500/10',
  degraded: 'text-yellow-500 bg-yellow-500/10',
  critical: 'text-red-500 bg-red-500/10',
  unknown: 'text-gray-500 bg-gray-500/10',
};

const severityConfig = {
  critical: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/30' },
  warning: { icon: AlertTriangle, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/30' },
  info: { icon: Info, color: 'text-blue-500', bg: 'bg-blue-500/10', border: 'border-blue-500/30' },
};

const categoryIcons = {
  file_system: HardDrive,
  dependencies: FileText,
  database: Database,
  network: Globe,
  performance: TrendingUp,
  code_integrity: Shield,
  configuration: Settings,
  security: Shield,
  environment: Activity,
  service: Zap,
  unknown: Info,
};

export default function Troubleshooter() {
  const {
    report,
    loading,
    error,
    autoRepairResults,
    runScan,
    loadReport,
    autoRepair,
  } = useTroubleshooterStore();

  const [selectedIssues, setSelectedIssues] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!report) {
      loadReport();
    }
  }, [report, loadReport]);

  const handleAutoRepair = async (issues?: DiagnosticIssue[]) => {
    const issuesToRepair = issues || (
      report?.issues.filter(issue => selectedIssues.has(issue.id)) ?? []
    );
    
    if (issuesToRepair.length === 0) return;
    await autoRepair(issuesToRepair);
    setSelectedIssues(new Set());
  };

  const toggleIssueSelection = (issueId: string) => {
    setSelectedIssues(prev => {
      const next = new Set(prev);
      if (next.has(issueId)) {
        next.delete(issueId);
      } else {
        next.add(issueId);
      }
      return next;
    });
  };

  const autoRepairableIssues = report?.issues.filter(i => i.auto_repair_available) ?? [];
  const manualIssues = report?.issues.filter(i => !i.auto_repair_available) ?? [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2">System Troubleshooter</h1>
            <p className="text-slate-400">Auto-detect, diagnose, and repair common issues</p>
          </div>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={runScan}
            disabled={loading}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
          >
            <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Scanning...' : 'Run Diagnostics'}
          </motion.button>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-start gap-3"
          >
            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
            <div>
              <p className="text-red-500 font-medium">Error</p>
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {/* Health Score */}
        {report && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold text-white mb-1">System Health Score</h2>
                <p className="text-slate-400 text-sm">
                  Last scanned: {new Date(report.generated_at).toLocaleString()}
                </p>
              </div>
              <div className="relative w-32 h-32">
                <svg className="transform -rotate-90 w-32 h-32">
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    className="text-slate-700"
                  />
                  <circle
                    cx="64"
                    cy="64"
                    r="56"
                    stroke="currentColor"
                    strokeWidth="8"
                    fill="none"
                    strokeDasharray={`${2 * Math.PI * 56}`}
                    strokeDashoffset={`${2 * Math.PI * 56 * (1 - report.health_score / 100)}`}
                    className={`${
                      report.health_score >= 80
                        ? 'text-green-500'
                        : report.health_score >= 60
                        ? 'text-yellow-500'
                        : 'text-red-500'
                    } transition-all duration-1000`}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-bold text-white">{report.health_score}</span>
                  <span className="text-xs text-slate-400">/ 100</span>
                </div>
              </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4">
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Issues Found</p>
                <p className="text-2xl font-bold text-white">{report.summary.issues_found}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Auto-Fixed</p>
                <p className="text-2xl font-bold text-green-500">{report.summary.auto_fixed}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Manual Needed</p>
                <p className="text-2xl font-bold text-yellow-500">{report.summary.manual_needed}</p>
              </div>
              <div className="bg-slate-900/50 rounded-lg p-4">
                <p className="text-slate-400 text-sm mb-1">Ignored</p>
                <p className="text-2xl font-bold text-gray-500">{report.summary.ignored}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* System Status Panels */}
        {report && Object.entries(report.panels).length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Object.entries(report.panels).map(([key, panel]) => (
              <SystemStatusCard key={key} panel={panel} />
            ))}
          </div>
        )}

        {/* Auto-Repairable Issues */}
        {autoRepairableIssues.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Wrench className="h-5 w-5 text-blue-500" />
                  Auto-Repairable Issues
                </h2>
                <p className="text-slate-400 text-sm mt-1">
                  These issues can be automatically fixed with one click
                </p>
              </div>
              {selectedIssues.size > 0 && (
                <button
                  onClick={() => handleAutoRepair()}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium flex items-center gap-2"
                >
                  <Play className="h-4 w-4" />
                  Fix Selected ({selectedIssues.size})
                </button>
              )}
            </div>
            <div className="space-y-4">
              {autoRepairableIssues.map(issue => (
                <IssueCard
                  key={issue.id}
                  issue={issue}
                  selected={selectedIssues.has(issue.id)}
                  onToggle={() => toggleIssueSelection(issue.id)}
                  onAutoRepair={() => handleAutoRepair([issue])}
                />
              ))}
            </div>
          </div>
        )}

        {/* Manual Issues */}
        {manualIssues.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <FileText className="h-5 w-5 text-yellow-500" />
              Manual Intervention Required
            </h2>
            <div className="space-y-4">
              {manualIssues.map(issue => (
                <IssueCard key={issue.id} issue={issue} />
              ))}
            </div>
          </div>
        )}

        {/* Auto-Repair Results */}
        {autoRepairResults.length > 0 && (
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-6">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Repair Results
            </h2>
            <div className="space-y-4">
              {autoRepairResults.map((result, idx) => (
                <div
                  key={idx}
                  className={`border rounded-lg p-4 ${
                    result.status === 'completed'
                      ? 'bg-green-500/5 border-green-500/30'
                      : result.status === 'failed'
                      ? 'bg-red-500/5 border-red-500/30'
                      : 'bg-yellow-500/5 border-yellow-500/30'
                  }`}
                >
                  <p
                    className={`font-medium ${
                      result.status === 'completed'
                        ? 'text-green-400'
                        : result.status === 'failed'
                        ? 'text-red-400'
                        : 'text-yellow-400'
                    }`}
                  >
                    {result.message}
                  </p>
                  {result.actions.length > 0 && (
                    <ul className="mt-2 space-y-1 text-sm text-slate-400">
                      {result.actions.map((action, actionIdx) => (
                        <li key={actionIdx} className="flex items-start gap-2">
                          <CheckCircle className="h-4 w-4 mt-0.5" />
                          <span>{action.description}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* No Issues */}
        {report && report.issues.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="bg-green-500/10 border border-green-500/30 rounded-xl p-12 text-center"
          >
            <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
            <h3 className="text-2xl font-bold text-white mb-2">All Systems Operational</h3>
            <p className="text-green-400">No issues detected. Your system is running smoothly!</p>
          </motion.div>
        )}
      </div>
    </div>
  );
}

function SystemStatusCard({ panel }: { panel: PanelStatus }) {
  const healthColor = healthColors[panel.level];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-xl p-6 hover:border-slate-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-white">{panel.title}</h3>
          <p className="text-sm text-slate-400 mt-1">{panel.summary}</p>
        </div>
        <div className={`px-3 py-1 rounded-full text-xs font-medium ${healthColor}`}>
          {panel.level}
        </div>
      </div>
      <div className="space-y-3">
        {panel.metrics.map((metric, idx) => (
          <div key={idx} className="flex items-center justify-between">
            <span className="text-sm text-slate-400">{metric.label}</span>
            <span className={`text-sm font-medium ${metric.level ? healthColors[metric.level].split(' ')[0] : 'text-white'}`}>
              {metric.value}
            </span>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

function IssueCard({
  issue,
  selected,
  onToggle,
  onAutoRepair,
}: {
  issue: DiagnosticIssue;
  selected?: boolean;
  onToggle?: () => void;
  onAutoRepair?: () => void;
}) {
  const config = severityConfig[issue.severity];
  const CategoryIcon = categoryIcons[issue.category];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={`border rounded-lg p-4 ${config.bg} ${config.border} ${
        selected ? 'ring-2 ring-blue-500' : ''
      }`}
    >
      <div className="flex items-start gap-4">
        {issue.auto_repair_available && onToggle && (
          <input
            type="checkbox"
            checked={selected}
            onChange={onToggle}
            className="mt-1 h-5 w-5 rounded border-slate-600 bg-slate-900 text-blue-600 focus:ring-blue-500"
          />
        )}
        <CategoryIcon className={`h-5 w-5 mt-0.5 ${config.color}`} />
        <div className="flex-1">
          <div className="flex items-start justify-between mb-2">
            <div>
              <h4 className={`font-semibold ${config.color}`}>{issue.title}</h4>
              <p className="text-sm text-slate-400 mt-1">{issue.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <span className={`px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.color}`}>
                {issue.severity}
              </span>
              <span className="px-2 py-1 rounded text-xs font-medium bg-slate-700 text-slate-300">
                {issue.repair_level}
              </span>
            </div>
          </div>
          <div className="bg-slate-900/50 rounded p-3 mb-3">
            <p className="text-sm text-slate-300">
              <strong>Recommended Action:</strong> {issue.recommended_action}
            </p>
          </div>
          {issue.auto_repair_available && onAutoRepair && (
            <button
              onClick={onAutoRepair}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm font-medium flex items-center gap-2"
            >
              <Wrench className="h-4 w-4" />
              Auto-Repair
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
