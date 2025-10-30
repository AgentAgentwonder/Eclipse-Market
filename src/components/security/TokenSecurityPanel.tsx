import { motion } from 'framer-motion';
import { Shield, ExternalLink, RefreshCw, AlertTriangle, CheckCircle, XCircle } from 'lucide-react';
import { useSecurityAudit } from '../../hooks/useSecurityAudit';
import { SecurityScoreBadge } from './SecurityScoreBadge';
import { AuditFindings } from './AuditFindings';

interface TokenSecurityPanelProps {
  contractAddress: string;
}

export function TokenSecurityPanel({ contractAddress }: TokenSecurityPanelProps) {
  const { loading, audit, error, refresh } = useSecurityAudit({ contractAddress, autoFetch: true });

  if (loading && !audit) {
    return (
      <div className="rounded-2xl border border-purple-500/20 bg-slate-800/50 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-400/30 border-t-purple-400" />
          <span className="text-white/60">Scanning contract security...</span>
        </div>
      </div>
    );
  }

  if (error && !audit) {
    return (
      <div className="rounded-2xl border border-red-500/20 bg-red-500/10 p-6">
        <div className="flex items-center gap-3">
          <XCircle className="h-5 w-5 text-red-400" />
          <div>
            <p className="font-semibold text-red-100">Failed to scan contract</p>
            <p className="text-sm text-red-300/80">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!audit) {
    return null;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-purple-500/20 bg-slate-800/50 p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Shield className="h-6 w-6 text-purple-400" />
          <h3 className="text-xl font-bold text-white">Security Analysis</h3>
        </div>
        <button
          onClick={refresh}
          disabled={loading}
          className="rounded-lg p-2 hover:bg-white/5 transition-colors disabled:opacity-50"
          title="Refresh"
        >
          <RefreshCw className={`h-5 w-5 text-white/60 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Security Score */}
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-white/60">Security Score</div>
          <div className="mt-2">
            <SecurityScoreBadge score={audit.securityScore} riskLevel={audit.riskLevel} size="lg" />
          </div>
        </div>
      </div>

      {/* Metadata Summary */}
      <div className="grid grid-cols-2 gap-4 rounded-xl border border-slate-700 bg-slate-900/50 p-4">
        <div className="flex items-center gap-2">
          {audit.metadata.isMintable ? (
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-400" />
          )}
          <span className="text-sm text-white/80">
            {audit.metadata.isMintable ? 'Mintable' : 'Fixed Supply'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {audit.metadata.hasFreezeAuthority ? (
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-400" />
          )}
          <span className="text-sm text-white/80">
            {audit.metadata.hasFreezeAuthority ? 'Has Freeze Authority' : 'No Freeze Authority'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {audit.metadata.hasBlacklist ? (
            <AlertTriangle className="h-4 w-4 text-yellow-400" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-400" />
          )}
          <span className="text-sm text-white/80">
            {audit.metadata.hasBlacklist ? 'Has Blacklist' : 'No Blacklist'}
          </span>
        </div>

        <div className="flex items-center gap-2">
          {audit.metadata.isHoneypot ? (
            <XCircle className="h-4 w-4 text-red-400" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-400" />
          )}
          <span className="text-sm text-white/80">
            {audit.metadata.isHoneypot ? 'Potential Honeypot' : 'No Honeypot Detected'}
          </span>
        </div>
      </div>

      {/* Audit Sources */}
      {audit.auditSources.length > 0 && (
        <div>
          <div className="mb-3 text-sm font-semibold text-white">External Audits</div>
          <div className="space-y-2">
            {audit.auditSources.map((source, idx) => (
              <div
                key={`${source.name}-${idx}`}
                className="flex items-center justify-between rounded-xl border border-slate-700 bg-slate-900/50 p-3"
              >
                <div className="flex items-center gap-3">
                  <div className="text-sm font-medium text-white">{source.name}</div>
                  {source.score && (
                    <div className="rounded-full bg-purple-500/20 px-2 py-0.5 text-xs font-semibold text-purple-300">
                      {source.score}
                    </div>
                  )}
                </div>
                {source.reportUrl && (
                  <a
                    href={source.reportUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Findings */}
      <div>
        <div className="mb-3 text-sm font-semibold text-white">Detected Issues</div>
        <AuditFindings findings={audit.findings} />
      </div>

      {/* Timestamp */}
      <div className="text-xs text-white/40">
        Last scanned: {new Date(audit.timestamp).toLocaleString()}
      </div>
    </motion.div>
  );
}
