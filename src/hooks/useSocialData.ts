import { useState, useEffect, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';

export interface SentimentSnapshot {
  token: string;
  avg_score: number;
  momentum: number;
  mention_count: number;
  positive_mentions: number;
  negative_mentions: number;
  neutral_mentions: number;
  confidence: number;
  dominant_label: string;
  last_post_timestamp: number;
  updated_at: number;
}

export interface TrendRecord {
  token: string;
  window_minutes: number;
  mentions: number;
  velocity: number;
  acceleration: number;
  volume_spike: number;
  sentiment_avg: number;
  engagement_total: number;
  updated_at: number;
}

export interface InfluencerScore {
  author: string;
  source: string;
  token: string | null;
  post_count: number;
  total_engagement: number;
  avg_sentiment: number;
  impact_score: number;
  computed_at: number;
}

export interface GaugeReading {
  token: string;
  fomo_score: number;
  fomo_level: string;
  fud_score: number;
  fud_level: string;
  drivers: Record<string, number>;
  updated_at: number;
}

export interface SocialPost {
  id: string;
  source: string;
  author: string;
  text: string;
  timestamp: number;
  engagement: number;
  token: string | null;
}

export interface MentionAggregate {
  token: string;
  total_count: number;
  sources: string[];
  first_seen: number;
  last_seen: number;
}

export function useSocialData(token?: string, autoRefresh = false, refreshInterval = 30000) {
  const [sentimentSnapshots, setSentimentSnapshots] = useState<SentimentSnapshot[]>([]);
  const [trendingTokens, setTrendingTokens] = useState<TrendRecord[]>([]);
  const [influencers, setInfluencers] = useState<InfluencerScore[]>([]);
  const [fomoFudGauges, setFomoFudGauges] = useState<GaugeReading[]>([]);
  const [mentions, setMentions] = useState<SocialPost[]>([]);
  const [mentionAggregates, setMentionAggregates] = useState<MentionAggregate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSentimentData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      if (token) {
        const snapshot = await invoke<SentimentSnapshot | null>('social_get_sentiment_snapshot', { token });
        setSentimentSnapshots(snapshot ? [snapshot] : []);
      } else {
        const snapshots = await invoke<SentimentSnapshot[]>('social_get_sentiment_snapshots', { token: null });
        setSentimentSnapshots(snapshots);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Failed to fetch sentiment data:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchTrendingTokens = useCallback(async (window?: number) => {
    try {
      setLoading(true);
      setError(null);

      const trends = await invoke<TrendRecord[]>('social_get_trending_tokens', { 
        window: window ?? null 
      });
      setTrendingTokens(trends);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Failed to fetch trending tokens:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchInfluencers = useCallback(async (minImpact?: number) => {
    try {
      setLoading(true);
      setError(null);

      const scores = await invoke<InfluencerScore[]>('social_get_influencer_scores', {
        token: token ?? null,
        minImpact: minImpact ?? null,
      });
      setInfluencers(scores);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Failed to fetch influencers:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchFomoFudGauges = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const gauges = await invoke<GaugeReading[]>('social_get_fomo_fud', {
        token: token ?? null,
      });
      setFomoFudGauges(gauges);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Failed to fetch FOMO/FUD gauges:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMentions = useCallback(async (source?: string, limit?: number) => {
    try {
      setLoading(true);
      setError(null);

      const posts = await invoke<SocialPost[]>('social_get_cached_mentions', {
        source: source ?? null,
        token: token ?? null,
        limit: limit ?? null,
      });
      setMentions(posts);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Failed to fetch mentions:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const fetchMentionAggregates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const aggregates = await invoke<MentionAggregate[]>('social_get_mention_aggregates', {
        token: token ?? null,
      });
      setMentionAggregates(aggregates);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Failed to fetch mention aggregates:', err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  const runAnalysis = useCallback(async (targetToken?: string) => {
    try {
      setLoading(true);
      setError(null);

      if (targetToken || token) {
        await invoke('social_run_sentiment_analysis', { token: targetToken || token });
      } else {
        await invoke('social_run_full_analysis_all', {});
      }

      await Promise.all([
        fetchSentimentData(),
        fetchTrendingTokens(),
        fetchInfluencers(),
        fetchFomoFudGauges(),
      ]);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error('Failed to run analysis:', err);
    } finally {
      setLoading(false);
    }
  }, [token, fetchSentimentData, fetchTrendingTokens, fetchInfluencers, fetchFomoFudGauges]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      fetchSentimentData(),
      fetchTrendingTokens(),
      fetchInfluencers(),
      fetchFomoFudGauges(),
      fetchMentions(),
      fetchMentionAggregates(),
    ]);
  }, [
    fetchSentimentData,
    fetchTrendingTokens,
    fetchInfluencers,
    fetchFomoFudGauges,
    fetchMentions,
    fetchMentionAggregates,
  ]);

  useEffect(() => {
    refreshAll();
  }, [token]);

  useEffect(() => {
    if (autoRefresh) {
      const interval = setInterval(() => {
        refreshAll();
      }, refreshInterval);

      return () => clearInterval(interval);
    }
  }, [autoRefresh, refreshInterval, refreshAll]);

  return {
    sentimentSnapshots,
    trendingTokens,
    influencers,
    fomoFudGauges,
    mentions,
    mentionAggregates,
    loading,
    error,
    fetchSentimentData,
    fetchTrendingTokens,
    fetchInfluencers,
    fetchFomoFudGauges,
    fetchMentions,
    fetchMentionAggregates,
    runAnalysis,
    refreshAll,
  };
}
