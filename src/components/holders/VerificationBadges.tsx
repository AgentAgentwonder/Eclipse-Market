import { ShieldCheck, ShieldAlert, CheckCircle2, XCircle } from 'lucide-react';
import { VerificationStatus } from '../../types/holders';

interface Props {
  verification: VerificationStatus | null;
}

export function VerificationBadges({ verification }: Props) {
  if (!verification) {
    return null;
  }

  return (
    <div className="flex items-center gap-2">
      <span
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
          verification.verified ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
        }`}
      >
        {verification.verified ? <ShieldCheck className="w-4 h-4" /> : <ShieldAlert className="w-4 h-4" />}
        {verification.verified ? 'Verified' : 'Unverified'}
      </span>
      <span
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
          verification.verifiedOnSolanaExplorer
            ? 'bg-blue-500/20 text-blue-300'
            : 'bg-slate-700/50 text-gray-300'
        }`}
      >
        {verification.verifiedOnSolanaExplorer ? (
          <CheckCircle2 className="w-4 h-4" />
        ) : (
          <XCircle className="w-4 h-4" />
        )}
        Explorer
      </span>
      <span
        className={`flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${
          verification.auditStatus === 'Audited'
            ? 'bg-purple-500/20 text-purple-300'
            : 'bg-slate-700/50 text-gray-300'
        }`}
      >
        {verification.auditStatus === 'Audited' ? 'Audited' : 'Not Audited'}
      </span>
    </div>
  );
}
