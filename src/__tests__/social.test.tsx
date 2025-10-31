import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import { SocialMomentum } from '../pages/SocialMomentum';
import { useSocialStore } from '../store/socialStore';
import type { SocialDashboardSnapshot } from '../types/social';

const mockSnapshot: SocialDashboardSnapshot = {
  generatedAt: Date.now() / 1000,
  mentions: [
    {
      id: '1',
      platform: 'twitter',
      author: 'test-user',
      authorId: 'user1',
      content: 'SOL to the moon!',
      tokenAddress: 'So11111111111111111111111111111111111111112',
      tokenSymbol: 'SOL',
      timestamp: Math.floor(Date.now() / 1000),
      engagement: {
        likes: 120,
        retweets: 30,
        replies: 10,
        views: 5000,
      },
      sentimentScore: 0.8,
      sentimentLabel: 'positive',
      influencerId: 'inf-1',
      url: 'https://twitter.com/test/status/1',
    },
  ],
  topInfluencers: [
    {
      id: 'inf-1',
      name: 'Crypto Analyst',
      platform: 'twitter',
      handle: '@cryptoanalyst',
      followerCount: 100_000,
      verified: true,
      influenceScore: 0.85,
      active: true,
      tags: ['solana'],
      addedAt: Math.floor(Date.now() / 1000),
    },
  ],
  sentimentGauges: [
    {
      tokenAddress: 'So11111111111111111111111111111111111111112',
      tokenSymbol: 'SOL',
      fomoScore: 0.75,
      fudScore: 0.2,
      netSentiment: 0.55,
      confidence: 0.8,
      contributingFactors: [],
      lastUpdated: Math.floor(Date.now() / 1000),
    },
  ],
  momentum: [
    {
      tokenAddress: 'So11111111111111111111111111111111111111112',
      tokenSymbol: 'SOL',
      momentumScore: 0.82,
      sentimentScore: 0.72,
      volumeScore: 0.65,
      influencerScore: 0.7,
      whaleScore: 0.6,
      trendingRank: 1,
      timestamp: Math.floor(Date.now() / 1000),
    },
  ],
  trendData: [
    {
      tokenAddress: 'So11111111111111111111111111111111111111112',
      tokenSymbol: 'SOL',
      mentionCount: 120,
      velocity: 1.5,
      acceleration: 0.2,
      sentimentTrend: [],
      volumeTrend: [],
      peakTime: Math.floor(Date.now() / 1000),
      currentRank: 1,
      rankChange: 1,
      detectedAt: Math.floor(Date.now() / 1000),
    },
  ],
  whaleMovements: [
    {
      id: 'whale-move-1',
      walletAddress: 'WhaleAddr111',
      transactionHash: 'tx1',
      tokenAddress: 'So11111111111111111111111111111111111111112',
      tokenSymbol: 'SOL',
      amount: 5000,
      valueUsd: 650_000,
      movementType: 'buy',
      fromAddress: 'ExchangeA',
      toAddress: 'WhaleAddr111',
      timestamp: Math.floor(Date.now() / 1000),
      impactScore: 0.75,
      sentimentShift: 0.2,
    },
  ],
  whaleInsights: [
    {
      walletAddress: 'WhaleAddr111',
      insightType: 'accumulation_phase',
      title: 'Accumulating SOL',
      description: 'Large accumulation detected across multiple exchanges.',
      confidence: 0.8,
      supportingData: ['5000 SOL buy'],
      timestamp: Math.floor(Date.now() / 1000),
    },
  ],
  walletsYouFollow: [
    {
      walletAddress: 'WhaleAddr111',
      title: 'Bought 5,000 SOL',
      description: 'Impactful whale purchase detected.',
      impact: 0.8,
      timestamp: Math.floor(Date.now() / 1000),
      tokens: ['So11111111111111111111111111111111111111112'],
      action: 'buy',
    },
  ],
  alerts: [
    {
      id: 'alert-1',
      alertType: 'fomo_alert',
      severity: 'high',
      title: 'FOMO building in SOL',
      message: 'Elevated FOMO score detected (75%)',
      tokenAddress: 'So11111111111111111111111111111111111111112',
      tokenSymbol: 'SOL',
      influencerId: 'inf-1',
      whaleAddress: 'WhaleAddr111',
      metadata: {},
      timestamp: Math.floor(Date.now() / 1000),
      acknowledged: false,
    },
  ],
  rateLimitStatus: [
    {
      source: 'twitter',
      limit: 15,
      remaining: 12,
      resetAt: Math.floor(Date.now() / 1000) + 900,
      lastError: undefined,
    },
  ],
};

describe('SocialMomentum Page', () => {
  beforeEach(() => {
    const state = useSocialStore.getState();
    useSocialStore.setState({
      ...state,
      snapshot: mockSnapshot,
      loading: false,
      error: null,
      refreshing: false,
      fetchDashboard: jest.fn(),
      refreshData: jest.fn(),
    });
  });

  it('renders social momentum dashboard', () => {
    render(<SocialMomentum />);
    expect(screen.getByText('Social Momentum')).toBeInTheDocument();
    expect(screen.getByText('FOMO/FUD Gauges')).toBeInTheDocument();
    expect(screen.getByText('Token Momentum')).toBeInTheDocument();
  });

  it('shows whale activity and influencers', () => {
    render(<SocialMomentum />);
    expect(screen.getByText('Whale Activity')).toBeInTheDocument();
    expect(screen.getByText('Tracked Influencers')).toBeInTheDocument();
    expect(screen.getByText('Crypto Analyst')).toBeInTheDocument();
  });
});
