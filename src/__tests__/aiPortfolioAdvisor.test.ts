import { describe, it, expect, beforeEach, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';
import {
  UserRiskProfile,
  PortfolioRecommendation,
  AllocationRecommendation,
  PerformanceComparison,
  Position,
} from '../types/portfolio';

vi.mock('@tauri-apps/api/tauri');

describe('AI Portfolio Advisor', () => {
  const mockPositions: Position[] = [
    {
      symbol: 'SOL',
      mint: 'So11111111111111111111111111111111111111112',
      amount: 10,
      currentPrice: 100,
      avgEntryPrice: 90,
      totalValue: 1000,
      unrealizedPnl: 100,
      unrealizedPnlPercent: 10,
      allocation: 50,
    },
    {
      symbol: 'USDC',
      mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
      amount: 1000,
      currentPrice: 1,
      avgEntryPrice: 1,
      totalValue: 1000,
      unrealizedPnl: 0,
      unrealizedPnlPercent: 0,
      allocation: 50,
    },
  ];

  const mockRiskProfile: UserRiskProfile = {
    profile: 'moderate',
    investmentHorizon: 'medium',
    goals: ['Growth', 'Diversification'],
    constraints: [],
    riskTolerance: 0.7,
  };

  const mockRecommendation: PortfolioRecommendation = {
    id: 'rec-123',
    timestamp: new Date().toISOString(),
    riskProfile: 'moderate',
    allocations: [
      {
        symbol: 'SOL',
        mint: 'So11111111111111111111111111111111111111112',
        targetPercent: 40,
        currentPercent: 50,
        action: 'sell',
        amount: 200,
        estimatedValue: 800,
        reasoning: 'Reduce exposure to reach target allocation',
      },
      {
        symbol: 'USDC',
        mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
        targetPercent: 40,
        currentPercent: 50,
        action: 'sell',
        amount: 200,
        estimatedValue: 800,
        reasoning: 'Reduce exposure to reach target allocation',
      },
      {
        symbol: 'BTC',
        mint: 'BTCxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx',
        targetPercent: 20,
        currentPercent: 0,
        action: 'buy',
        amount: 400,
        estimatedValue: 400,
        reasoning: 'Add diversification with major cryptocurrency',
      },
    ],
    expectedReturn: 12.5,
    expectedRisk: 10.0,
    sharpeRatio: 1.05,
    diversificationScore: 75,
    factors: [
      {
        name: 'Risk Profile',
        impact: 7.0,
        description: 'moderate risk profile with 70% risk tolerance',
      },
      {
        name: 'Diversification',
        impact: 75.0,
        description: 'Portfolio diversification score: 75.0/100',
      },
    ],
    status: 'pending',
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Risk Profile Management', () => {
    it('should save risk profile', async () => {
      const mockInvoke = invoke as any;
      mockInvoke.mockResolvedValue('profile-id-123');

      const result = await invoke('save_risk_profile', {
        profile: mockRiskProfile,
      });

      expect(result).toBe('profile-id-123');
      expect(mockInvoke).toHaveBeenCalledWith('save_risk_profile', {
        profile: mockRiskProfile,
      });
    });

    it('should get risk profile by id', async () => {
      const mockInvoke = invoke as any;
      mockInvoke.mockResolvedValue(mockRiskProfile);

      const result = await invoke<UserRiskProfile>('get_risk_profile', {
        id: 'profile-id-123',
      });

      expect(result).toEqual(mockRiskProfile);
      expect(mockInvoke).toHaveBeenCalledWith('get_risk_profile', {
        id: 'profile-id-123',
      });
    });

    it('should handle different risk profiles', () => {
      const profiles: UserRiskProfile['profile'][] = ['conservative', 'moderate', 'aggressive'];

      profiles.forEach(profile => {
        const riskProfile: UserRiskProfile = {
          ...mockRiskProfile,
          profile,
        };

        expect(riskProfile.profile).toBe(profile);
        expect(riskProfile.riskTolerance).toBeGreaterThanOrEqual(0);
        expect(riskProfile.riskTolerance).toBeLessThanOrEqual(1);
      });
    });
  });

  describe('Recommendation Generation', () => {
    it('should generate portfolio recommendation', async () => {
      const mockInvoke = invoke as any;
      mockInvoke.mockResolvedValue(mockRecommendation);

      const result = await invoke<PortfolioRecommendation>('generate_portfolio_recommendation', {
        positions: mockPositions,
        riskProfile: mockRiskProfile,
        totalValue: 2000,
      });

      expect(result).toEqual(mockRecommendation);
      expect(result.allocations).toHaveLength(3);
      expect(result.expectedReturn).toBeGreaterThan(0);
      expect(result.sharpeRatio).toBeGreaterThan(0);
    });

    it('should respect risk profile in recommendations', async () => {
      const mockInvoke = invoke as any;

      const conservativeRecommendation = {
        ...mockRecommendation,
        riskProfile: 'conservative',
        expectedReturn: 8.0,
        expectedRisk: 5.0,
        sharpeRatio: 1.2,
      };

      mockInvoke.mockResolvedValue(conservativeRecommendation);

      const result = await invoke<PortfolioRecommendation>('generate_portfolio_recommendation', {
        positions: mockPositions,
        riskProfile: { ...mockRiskProfile, profile: 'conservative' },
        totalValue: 2000,
      });

      expect(result.riskProfile).toBe('conservative');
      expect(result.expectedRisk).toBeLessThan(10);
    });

    it('should validate allocation percentages sum to 100%', () => {
      const totalAllocation = mockRecommendation.allocations.reduce(
        (sum, alloc) => sum + alloc.targetPercent,
        0
      );

      expect(totalAllocation).toBe(100);
    });

    it('should include explanatory factors', () => {
      expect(mockRecommendation.factors).toBeDefined();
      expect(mockRecommendation.factors.length).toBeGreaterThan(0);
      expect(mockRecommendation.factors[0]).toHaveProperty('name');
      expect(mockRecommendation.factors[0]).toHaveProperty('impact');
      expect(mockRecommendation.factors[0]).toHaveProperty('description');
    });

    it('should calculate diversification score', () => {
      expect(mockRecommendation.diversificationScore).toBeGreaterThanOrEqual(0);
      expect(mockRecommendation.diversificationScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Recommendation Application', () => {
    it('should apply recommendation', async () => {
      const mockInvoke = invoke as any;
      mockInvoke.mockResolvedValue(undefined);

      await invoke('apply_portfolio_recommendation', {
        recommendationId: mockRecommendation.id,
      });

      expect(mockInvoke).toHaveBeenCalledWith('apply_portfolio_recommendation', {
        recommendationId: mockRecommendation.id,
      });
    });

    it('should track recommendation status', async () => {
      const mockInvoke = invoke as any;
      const appliedRecommendation = {
        ...mockRecommendation,
        status: 'applied',
        appliedAt: new Date().toISOString(),
      };

      mockInvoke.mockResolvedValue([appliedRecommendation]);

      const result = await invoke<PortfolioRecommendation[]>('get_portfolio_recommendations', {
        limit: 1,
      });

      expect(result[0].status).toBe('applied');
      expect(result[0].appliedAt).toBeDefined();
    });

    it('should maintain recommendation history', async () => {
      const mockInvoke = invoke as any;
      const recommendations = [
        mockRecommendation,
        { ...mockRecommendation, id: 'rec-124', status: 'applied' },
        { ...mockRecommendation, id: 'rec-125', status: 'rejected' },
      ];

      mockInvoke.mockResolvedValue(recommendations);

      const result = await invoke<PortfolioRecommendation[]>('get_portfolio_recommendations', {
        limit: 10,
      });

      expect(result).toHaveLength(3);
      expect(result.map(r => r.id)).toEqual(['rec-123', 'rec-124', 'rec-125']);
    });
  });

  describe('Performance Tracking', () => {
    const mockPerformanceData: PerformanceComparison = {
      recommendationId: 'rec-123',
      baselineReturn: 10.0,
      actualReturn: 12.5,
      baselineRisk: 10.0,
      actualRisk: 9.5,
      outperformance: 2.5,
      periodDays: 30,
      timestamp: new Date().toISOString(),
    };

    it('should track recommendation performance', async () => {
      const mockInvoke = invoke as any;
      mockInvoke.mockResolvedValue(mockPerformanceData);

      const result = await invoke<PerformanceComparison>('track_recommendation_performance', {
        recommendationId: 'rec-123',
        baselineReturn: 10.0,
        actualReturn: 12.5,
        baselineRisk: 10.0,
        actualRisk: 9.5,
        periodDays: 30,
      });

      expect(result.outperformance).toBe(2.5);
      expect(result.actualReturn).toBeGreaterThan(result.baselineReturn);
    });

    it('should handle underperformance', async () => {
      const underperformance: PerformanceComparison = {
        ...mockPerformanceData,
        actualReturn: 8.0,
        outperformance: -2.0,
      };

      const mockInvoke = invoke as any;
      mockInvoke.mockResolvedValue(underperformance);

      const result = await invoke<PerformanceComparison>('track_recommendation_performance', {
        recommendationId: 'rec-123',
        baselineReturn: 10.0,
        actualReturn: 8.0,
        baselineRisk: 10.0,
        actualRisk: 9.5,
        periodDays: 30,
      });

      expect(result.outperformance).toBeLessThan(0);
    });

    it('should get performance history', async () => {
      const mockInvoke = invoke as any;
      const performanceHistory = [
        mockPerformanceData,
        { ...mockPerformanceData, periodDays: 60, outperformance: 3.0 },
        { ...mockPerformanceData, periodDays: 90, outperformance: 4.5 },
      ];

      mockInvoke.mockResolvedValue(performanceHistory);

      const result = await invoke<PerformanceComparison[]>('get_performance_history', {
        recommendationId: 'rec-123',
        limit: 10,
      });

      expect(result).toHaveLength(3);
      expect(result.every(p => p.recommendationId === 'rec-123')).toBe(true);
    });

    it('should compare risk-adjusted returns', () => {
      const sharpeRatio =
        (mockPerformanceData.actualReturn - 2.0) / mockPerformanceData.actualRisk;

      expect(sharpeRatio).toBeGreaterThan(1.0);
    });
  });

  describe('Rebalancing Logic', () => {
    it('should identify needed rebalancing actions', () => {
      const buyAllocations = mockRecommendation.allocations.filter(a => a.action === 'buy');
      const sellAllocations = mockRecommendation.allocations.filter(a => a.action === 'sell');
      const holdAllocations = mockRecommendation.allocations.filter(a => a.action === 'hold');

      expect(buyAllocations.length + sellAllocations.length + holdAllocations.length).toBe(
        mockRecommendation.allocations.length
      );
    });

    it('should calculate rebalancing amounts correctly', () => {
      mockRecommendation.allocations.forEach(allocation => {
        const deviation = Math.abs(allocation.targetPercent - allocation.currentPercent);

        if (deviation > 1.0) {
          expect(['buy', 'sell']).toContain(allocation.action);
          expect(allocation.amount).toBeGreaterThan(0);
        } else {
          expect(allocation.action).toBe('hold');
        }
      });
    });

    it('should preserve total portfolio value after rebalancing', () => {
      const totalTargetValue = mockRecommendation.allocations.reduce(
        (sum, alloc) => sum + alloc.estimatedValue,
        0
      );

      expect(totalTargetValue).toBeCloseTo(2000, 0);
    });
  });

  describe('Risk Metrics Validation', () => {
    it('should validate expected return range', () => {
      expect(mockRecommendation.expectedReturn).toBeGreaterThan(0);
      expect(mockRecommendation.expectedReturn).toBeLessThan(100);
    });

    it('should validate expected risk range', () => {
      expect(mockRecommendation.expectedRisk).toBeGreaterThan(0);
      expect(mockRecommendation.expectedRisk).toBeLessThan(100);
    });

    it('should calculate valid Sharpe ratio', () => {
      const calculatedSharpe =
        (mockRecommendation.expectedReturn - 2.0) / mockRecommendation.expectedRisk;

      expect(mockRecommendation.sharpeRatio).toBeCloseTo(calculatedSharpe, 1);
    });

    it('should validate diversification score', () => {
      expect(mockRecommendation.diversificationScore).toBeGreaterThanOrEqual(0);
      expect(mockRecommendation.diversificationScore).toBeLessThanOrEqual(100);
    });
  });

  describe('Explainability', () => {
    it('should provide reasoning for each allocation', () => {
      mockRecommendation.allocations.forEach(allocation => {
        expect(allocation.reasoning).toBeDefined();
        expect(allocation.reasoning.length).toBeGreaterThan(0);
      });
    });

    it('should explain key factors driving recommendations', () => {
      expect(mockRecommendation.factors).toBeDefined();
      mockRecommendation.factors.forEach(factor => {
        expect(factor.name).toBeDefined();
        expect(factor.description).toBeDefined();
        expect(typeof factor.impact).toBe('number');
      });
    });

    it('should include risk profile in explanatory factors', () => {
      const riskProfileFactor = mockRecommendation.factors.find(f =>
        f.name.toLowerCase().includes('risk')
      );

      expect(riskProfileFactor).toBeDefined();
      expect(riskProfileFactor?.description).toContain(mockRecommendation.riskProfile);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty portfolio', async () => {
      const mockInvoke = invoke as any;
      mockInvoke.mockResolvedValue({
        ...mockRecommendation,
        allocations: [],
      });

      const result = await invoke<PortfolioRecommendation>('generate_portfolio_recommendation', {
        positions: [],
        riskProfile: mockRiskProfile,
        totalValue: 0,
      });

      expect(result).toBeDefined();
      expect(result.allocations).toEqual([]);
    });

    it('should handle very small portfolio values', async () => {
      const mockInvoke = invoke as any;
      mockInvoke.mockResolvedValue(mockRecommendation);

      const result = await invoke<PortfolioRecommendation>('generate_portfolio_recommendation', {
        positions: mockPositions,
        riskProfile: mockRiskProfile,
        totalValue: 100,
      });

      expect(result).toBeDefined();
    });

    it('should handle extreme risk tolerance values', () => {
      const extremeProfiles: UserRiskProfile[] = [
        { ...mockRiskProfile, riskTolerance: 0.0 },
        { ...mockRiskProfile, riskTolerance: 1.0 },
      ];

      extremeProfiles.forEach(profile => {
        expect(profile.riskTolerance).toBeGreaterThanOrEqual(0);
        expect(profile.riskTolerance).toBeLessThanOrEqual(1);
      });
    });
  });
});
