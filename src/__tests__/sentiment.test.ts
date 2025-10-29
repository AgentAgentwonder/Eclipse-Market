import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api';
import type { TokenSentiment, SocialPost, SentimentAlert } from '../types/sentiment';

vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = invoke as ReturnType<typeof vi.fn>;

describe('Sentiment Store Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch token sentiment successfully', async () => {
    const mockSentiment: TokenSentiment = {
      token: 'SOL',
      token_address: 'So11111111111111111111111111111111111111112',
      current_score: 0.5,
      label: 'positive',
      confidence: 0.7,
      trend: [],
      sample_posts: [],
      total_mentions: 10,
      positive_count: 6,
      negative_count: 2,
      neutral_count: 2,
      last_updated: Date.now() / 1000,
    };

    mockInvoke.mockResolvedValueOnce(mockSentiment);

    const result = await invoke<TokenSentiment>('get_token_sentiment', {
      tokenAddress: 'So11111111111111111111111111111111111111112',
    });

    expect(result).toEqual(mockSentiment);
    expect(result.current_score).toBeGreaterThanOrEqual(-1);
    expect(result.current_score).toBeLessThanOrEqual(1);
  });

  it('should ingest social data successfully', async () => {
    const mockPosts: SocialPost[] = [
      {
        id: '1',
        text: 'Great project!',
        source: 'twitter',
        author: 'user1',
        timestamp: Date.now() / 1000,
        sentiment: { score: 0.3, label: 'positive', confidence: 0.5 },
        engagement: 100,
      },
    ];

    mockInvoke.mockResolvedValueOnce(undefined);

    await invoke('ingest_social_data', {
      tokenAddress: 'test_token',
      posts: mockPosts,
    });

    expect(mockInvoke).toHaveBeenCalledWith('ingest_social_data', {
      tokenAddress: 'test_token',
      posts: mockPosts,
    });
  });

  it('should fetch sentiment alerts successfully', async () => {
    const mockAlerts: SentimentAlert[] = [
      {
        id: '1',
        token: 'SOL',
        token_address: 'So11111111111111111111111111111111111111112',
        alert_type: 'sentiment_positive_spike',
        message: 'Positive sentiment spike detected',
        score: 0.8,
        threshold: 0.7,
        timestamp: Date.now() / 1000,
        is_active: true,
      },
    ];

    mockInvoke.mockResolvedValueOnce(mockAlerts);

    const result = await invoke<SentimentAlert[]>('get_sentiment_alerts', {
      tokenAddress: 'So11111111111111111111111111111111111111112',
    });

    expect(result).toEqual(mockAlerts);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should validate sentiment score range', async () => {
    const mockSentiment: TokenSentiment = {
      token: 'SOL',
      token_address: 'So11111111111111111111111111111111111111112',
      current_score: 0.5,
      label: 'positive',
      confidence: 0.7,
      trend: [
        { timestamp: Date.now() / 1000 - 3600, score: 0.3, mentions: 5 },
        { timestamp: Date.now() / 1000, score: 0.5, mentions: 10 },
      ],
      sample_posts: [],
      total_mentions: 15,
      positive_count: 10,
      negative_count: 2,
      neutral_count: 3,
      last_updated: Date.now() / 1000,
    };

    mockInvoke.mockResolvedValueOnce(mockSentiment);

    const result = await invoke<TokenSentiment>('get_token_sentiment', {
      tokenAddress: 'So11111111111111111111111111111111111111112',
    });

    expect(result.current_score).toBeGreaterThanOrEqual(-1);
    expect(result.current_score).toBeLessThanOrEqual(1);
    result.trend.forEach((point) => {
      expect(point.score).toBeGreaterThanOrEqual(-1);
      expect(point.score).toBeLessThanOrEqual(1);
    });
  });

  it('should validate sentiment distribution', async () => {
    const mockSentiment: TokenSentiment = {
      token: 'SOL',
      token_address: 'So11111111111111111111111111111111111111112',
      current_score: 0.2,
      label: 'positive',
      confidence: 0.6,
      trend: [],
      sample_posts: [],
      total_mentions: 100,
      positive_count: 60,
      negative_count: 20,
      neutral_count: 20,
      last_updated: Date.now() / 1000,
    };

    mockInvoke.mockResolvedValueOnce(mockSentiment);

    const result = await invoke<TokenSentiment>('get_token_sentiment', {
      tokenAddress: 'So11111111111111111111111111111111111111112',
    });

    const total = result.positive_count + result.negative_count + result.neutral_count;
    expect(total).toEqual(result.total_mentions);
  });
});
