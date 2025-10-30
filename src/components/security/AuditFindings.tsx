import { ShieldAlert } from 'lucide-react';
import type { Finding, Severity } from '../../types/audit';

interface AuditFindingsProps {
  findings: Finding[];
}

const severityStyles: Record<Severity, string> = {
  critical: 'bg-red-500/10 border-red-500/30 text-red-300',
  high: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  medium: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
  low: 'bg-blue-500/10 border-blue-500/30 text-blue-300',
  info: 'bg-slate-500/10 border-slate-500/30 text-slate-300',
};

const severityLabel: Record<Severity, string> = {
  critical: 'Critical',
  high: 'High',
  medium: 'Medium',
  low: 'Low',
  info: 'Info',
};

export function AuditFindings({ findings }: AuditFindingsProps) {
  if (!findings.length) {
    return (
      <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
        <div className="flex items-center gap-3">
          <ShieldAlert className="h-5 w-5 text-emerald-300" />
          <div>
            <p className="text-sm font-medium text-emerald-100">No Issues Detected</p>
            <p className="text-xs text-emerald-300/80">
              This contract passed all heuristic checks. Continue monitoring for updates.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {findings.map((finding, idx) => (
        <div
          key={`${finding.title}-${idx}`}
          className={`rounded-xl border p-4 transition-colors ${severityStyles[finding.severity]}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-white/60">
                {finding.category}
              </div>
              <div className="text-lg font-semibold text-white">{finding.title}</div>
            </div>
            <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80">
              {severityLabel[finding.severity]}
            </div>
          </div>
          <p className="mt-3 text-sm text-white/80">{finding.description}</p>
          {finding.recommendation && (
            <p className="mt-2 text-sm text-white/60">
              Recommendation: <span className="font-medium text-white/80">{finding.recommendation}</span>
            </p>
          )}
          <div className="mt-3 flex items-center justify-between text-xs text-white/40">
            <span>Source: {finding.source}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
