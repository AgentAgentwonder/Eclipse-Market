import { useEffect, useMemo, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { AlertTriangle, RefreshCcw, ShieldAlert } from 'lucide-react';
import { RiskHistory, RiskScore } from '../../types/risk';
import { RiskScoreBadge } from './RiskScoreBadge';
import { RiskFactorsList } from './RiskFactorsList';
import { RiskHistoryChart } from './RiskHistoryChart';

interface RiskAnalysisPanelProps {
  tokenAddress: string;
}

export function RiskAnalysisPanel({ tokenAddress }: RiskAnalysisPanelProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [score, setScore] = useState<RiskScore | null>(null);
  const [history, setHistory] = useState<RiskHistory | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchRiskData = async (showLoading = true) => {
    if (showLoading) {
      setLoading(true);
    }
    setError(null);

    try {
      const [riskScore, riskHistory] = await Promise.all([
        invoke<RiskScore>('get_token_risk_score', { tokenAddress }),
        invoke<RiskHistory>('get_risk_history', { tokenAddress, days: 30 }),
      ]);

      setScore(riskScore);
      setHistory(riskHistory);
    } catch (err) {
      console.error('Failed to load risk data', err);
      setError(err instanceof Error ? err.message : 'Failed to load risk score.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRiskData();
    const interval = setInterval(() => fetchRiskData(false), 60_000);
    return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tokenAddress]);

  const summary = useMemo(() => {
    if (!score) return null;

    const summaryItems = [
      {
        label: 'Risk Score',
        value: score.score.toFixed(1),
        description: 'Overall model output (0 = safe, 100 = high risk)',
      },
      {
        label: 'Data Freshness',
        value: new Date(score.timestamp).toLocaleTimeString(),
        description: 'Last time the score was computed',
      },
      {
        label: 'Contributing Factors',
        value: score.contributingFactors.length.toString(),
        description: 'Top signals driving the current assessment',
      },
    ];

    return summaryItems;
  }, [score]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchRiskData(false);
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-purple-500/10 bg-slate-900/40 p-6">
        <div className="flex items-center gap-3">
          <div className="h-5 w-5 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          <p className="text-sm text-gray-400">Calculating machine learning based risk assessment...</p>
        </div>
      </div>
    );
  }

  if (error || !score || !history) {
    return (
      <div className="rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-sm text-red-200">
        <div className="flex items-center gap-2">
          <AlertTriangle className="h-4 w-4" />
          <span>{error || 'Unable to compute risk score for this token.'}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <RiskScoreBadge score={score.score} riskLevel={score.riskLevel} size="lg" />
          <div>
            <p className="text-xs uppercase tracking-wide text-gray-400">Machine Learning Risk Score</p>
            <p className="text-xl font-semibold text-white/90">{score.riskLevel} Risk</p>
          </div>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="inline-flex items-center gap-2 rounded-lg border border-purple-500/40 bg-purple-500/10 px-3 py-2 text-sm font-medium text-purple-200 transition-all hover:border-purple-400 hover:bg-purple-500/20 disabled:opacity-50"
        >
          <RefreshCcw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh Score
        </button>
      </div>

      {summary && (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          {summary.map(item => (
            <div key={item.label} className="rounded-xl border border-purple-500/20 bg-slate-800/40 p-4">
              <p className="text-xs uppercase tracking-wide text-gray-400">{item.label}</p>
              <p className="text-2xl font-semibold text-white/90">{item.value}</p>
              <p className="text-xs text-white/50">{item.description}</p>
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
        <div className="space-y-4 lg:col-span-2">
          <div className="flex items-center gap-2 text-sm font-semibold text-white/90">
            <ShieldAlert className="h-4 w-4 text-purple-300" />
            Key Risk Drivers
          </div>
          <RiskFactorsList factors={score.contributingFactors} />
        </div>
        <div className="lg:col-span-3">
          <RiskHistoryChart history={history} />
        </div>
      </div>
    </div>
  );
}
