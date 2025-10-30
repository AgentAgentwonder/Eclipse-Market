import { useCallback, useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import type { AuditResult, RiskLevel } from '../types/audit';

interface UseSecurityAuditOptions {
  contractAddress?: string;
  autoFetch?: boolean;
}

interface UseSecurityAuditReturn {
  loading: boolean;
  error: string | null;
  audit: AuditResult | null;
  riskLevel: RiskLevel | null;
  refresh: () => Promise<void>;
}

export function useSecurityAudit({
  contractAddress,
  autoFetch = true,
}: UseSecurityAuditOptions): UseSecurityAuditReturn {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [audit, setAudit] = useState<AuditResult | null>(null);

  const refresh = useCallback(async () => {
    if (!contractAddress) return;

    setLoading(true);
    setError(null);

    try {
      const result = await invoke<AuditResult>('scan_contract', {
        contractAddress,
      });
      setAudit(result);
    } catch (err) {
      console.error('Failed to fetch security audit:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch security audit');
    } finally {
      setLoading(false);
    }
  }, [contractAddress]);

  useEffect(() => {
    if (!contractAddress || !autoFetch) return;
    void refresh();
  }, [contractAddress, autoFetch, refresh]);

  return {
    loading,
    error,
    audit,
    riskLevel: audit?.riskLevel ?? null,
    refresh,
  };
}
