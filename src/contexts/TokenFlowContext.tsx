import { createContext, useContext, useEffect, useMemo, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import {
  FlowAnalysis,
  FlowExportData,
  FlowExportFormat,
  TokenTransaction,
  TimelineFrame,
  ClusterSubscription,
} from '../types/tokenFlow';
import { createMockTransactions } from '../utils/tokenFlowMocks';

type TokenFlowContextValue = {
  analysis: FlowAnalysis | null;
  loading: boolean;
  error: string | null;
  tokenAddress: string;
  setTokenAddress: (address: string) => void;
  refresh: () => Promise<void>;
  timelineIndex: number;
  setTimelineIndex: (index: number) => void;
  playing: boolean;
  setPlaying: (value: boolean) => void;
  currentFrame: TimelineFrame | null;
  exportAnalysis: (format: FlowExportFormat, filters?: Record<string, unknown>) => Promise<FlowExportData | null>;
  exporting: boolean;
  exportData: FlowExportData | null;
  subscriptions: ClusterSubscription[];
  upsertSubscription: (subscription: ClusterSubscription) => Promise<void>;
  removeSubscription: (subscriptionId: string) => Promise<void>;
};

const TokenFlowContext = createContext<TokenFlowContextValue | undefined>(undefined);

interface TokenFlowProviderProps {
  children: React.ReactNode;
  defaultTokenAddress?: string;
}

export function TokenFlowProvider({ children, defaultTokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' }: TokenFlowProviderProps) {
  const [analysis, setAnalysis] = useState<FlowAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tokenAddress, setTokenAddressState] = useState(defaultTokenAddress);
  const [timelineIndex, setTimelineIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportData, setExportData] = useState<FlowExportData | null>(null);
  const [subscriptions, setSubscriptions] = useState<ClusterSubscription[]>([]);

  const fetchAnalysis = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const now = Math.floor(Date.now() / 1000);
      const transactions: TokenTransaction[] = createMockTransactions({
        tokenAddress,
        startTimestamp: now - 60 * 60 * 3,
        intervals: 90,
      });

      const result = await invoke<FlowAnalysis>('analyze_token_flows', {
        request: {
          tokenAddress,
          transactions,
        },
      });

      setAnalysis(result);
      setTimelineIndex(0);
    } catch (err) {
      console.error('Failed to analyze token flows', err);
      setError(err instanceof Error ? err.message : 'Failed to analyze token flows');
      setAnalysis(null);
    } finally {
      setLoading(false);
    }
  }, [tokenAddress]);

  useEffect(() => {
    fetchAnalysis();
  }, [fetchAnalysis]);

  useEffect(() => {
    if (!analysis) return;

    const loadSubscriptions = async () => {
      try {
        const result = await invoke<ClusterSubscription[]>('list_cluster_subscriptions');
        setSubscriptions(result);
      } catch (err) {
        console.error('Failed to load cluster subscriptions', err);
      }
    };

    loadSubscriptions();
  }, [analysis]);

  useEffect(() => {
    if (!playing || !analysis) return;

    const interval = setInterval(() => {
      setTimelineIndex(prev => {
        if (!analysis.timeline.length) {
          return prev;
        }
        const next = prev + 1;
        if (next >= analysis.timeline.length) {
          setPlaying(false);
          return prev;
        }
        return next;
      });
    }, 1200);

    return () => clearInterval(interval);
  }, [playing, analysis]);

  const currentFrame = useMemo(() => {
    if (!analysis || !analysis.timeline.length) {
      return null;
    }
    return analysis.timeline[Math.min(timelineIndex, analysis.timeline.length - 1)];
  }, [analysis, timelineIndex]);

  const handleExport = useCallback(
    async (format: FlowExportFormat, filters: Record<string, unknown> = {}) => {
      if (!analysis) return null;

      setExporting(true);
      setExportData(null);

      try {
        const response = await invoke<{ export: FlowExportData }>('export_flow_analysis', {
          request: {
            analysis,
            format,
            filters,
          },
        });

        setExportData(response.export);
        return response.export;
      } catch (err) {
        console.error('Failed to export flow analysis', err);
        setError(err instanceof Error ? err.message : 'Failed to export flow analysis');
        return null;
      } finally {
        setExporting(false);
      }
    },
    [analysis],
  );

  const upsertSubscription = useCallback(async (subscription: ClusterSubscription) => {
    try {
      await invoke('upsert_cluster_subscription', { subscription });
      setSubscriptions(prev => {
        const existingIndex = prev.findIndex(sub => sub.id === subscription.id);
        if (existingIndex >= 0) {
          const next = [...prev];
          next[existingIndex] = subscription;
          return next;
        }
        return [...prev, subscription];
      });
    } catch (err) {
      console.error('Failed to upsert subscription', err);
      setError(err instanceof Error ? err.message : 'Failed to update subscription');
    }
  }, []);

  const removeSubscription = useCallback(async (subscriptionId: string) => {
    try {
      await invoke('remove_cluster_subscription', { subscriptionId });
      setSubscriptions(prev => prev.filter(sub => sub.id !== subscriptionId));
    } catch (err) {
      console.error('Failed to remove subscription', err);
      setError(err instanceof Error ? err.message : 'Failed to remove subscription');
    }
  }, []);

  const setTokenAddress = useCallback((address: string) => {
    setTokenAddressState(address);
    setPlaying(false);
  }, []);

  const value: TokenFlowContextValue = {
    analysis,
    loading,
    error,
    tokenAddress,
    setTokenAddress,
    refresh: fetchAnalysis,
    timelineIndex,
    setTimelineIndex,
    playing,
    setPlaying,
    currentFrame,
    exportAnalysis: handleExport,
    exporting,
    exportData,
    subscriptions,
    upsertSubscription,
    removeSubscription,
  };

  return <TokenFlowContext.Provider value={value}>{children}</TokenFlowContext.Provider>;
}

export function useTokenFlowContext() {
  const context = useContext(TokenFlowContext);
  if (!context) {
    throw new Error('useTokenFlowContext must be used within a TokenFlowProvider');
  }
  return context;
}
