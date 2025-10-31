import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { LaunchPredictorPanel } from '../components/launchPredictor/LaunchPredictorPanel';
import { vi, describe, it, expect, beforeEach } from 'vitest';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

const { invoke } = await import('@tauri-apps/api/tauri');

describe('LaunchPredictorPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders launch predictor panel', () => {
    render(<LaunchPredictorPanel />);
    expect(screen.getByText('Launch Predictor AI')).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/enter token address/i)).toBeInTheDocument();
  });

  it('handles token analysis', async () => {
    const mockFeatures = {
      tokenAddress: 'test123',
      developerReputation: 0.75,
      developerLaunchCount: 5,
      developerSuccessRate: 0.80,
      developerCategory: 'experienced',
      contractComplexity: 0.45,
      proxyPatternDetected: false,
      upgradeableContract: false,
      liquidityUsd: 150000,
      liquidityRatio: 0.18,
      liquidityChange24h: 8.5,
      initialMarketCap: 750000,
      marketingHype: 0.55,
      marketingSpendUsd: 12000,
      socialFollowersGrowth: 0.45,
      communityEngagement: 0.72,
      influencerSentiment: 0.60,
      securityAuditScore: 0.85,
      dexDepthScore: 0.78,
      watchlistInterest: 0.65,
      retentionScore: 0.70,
      launchTimestamp: new Date().toISOString(),
    };

    const mockPrediction = {
      tokenAddress: 'test123',
      successProbability: 72.5,
      riskLevel: 'Low',
      confidence: 0.85,
      predictedPeakTimeframe: '3-7 days',
      featureScores: [
        {
          featureName: 'Developer Success Rate',
          value: 0.80,
          importance: 0.20,
          impact: 'Positive',
          description: 'Historical success rate: 80%',
        },
      ],
      earlyWarnings: [],
      timestamp: new Date().toISOString(),
    };

    (invoke as any)
      .mockResolvedValueOnce(mockFeatures)
      .mockResolvedValueOnce(mockPrediction)
      .mockResolvedValueOnce({ tokenAddress: 'test123', predictions: [] });

    render(<LaunchPredictorPanel />);

    const input = screen.getByPlaceholderText(/enter token address/i);
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });

    fireEvent.change(input, { target: { value: 'test123' } });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText('72.5%')).toBeInTheDocument();
    });

    expect(screen.getByText('Low Risk')).toBeInTheDocument();
    expect(screen.getByText('85% Confidence')).toBeInTheDocument();
  });

  it('displays error on failed analysis', async () => {
    (invoke as any).mockRejectedValueOnce(new Error('Network error'));

    render(<LaunchPredictorPanel />);

    const input = screen.getByPlaceholderText(/enter token address/i);
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });

    fireEvent.change(input, { target: { value: 'invalid' } });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/network error/i)).toBeInTheDocument();
    });
  });

  it('shows loading state during analysis', async () => {
    (invoke as any).mockImplementationOnce(
      () => new Promise(resolve => setTimeout(() => resolve({}), 100))
    );

    render(<LaunchPredictorPanel />);

    const input = screen.getByPlaceholderText(/enter token address/i);
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });

    fireEvent.change(input, { target: { value: 'test' } });
    fireEvent.click(analyzeButton);

    expect(screen.getByText(/analyzing/i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.queryByText(/analyzing/i)).not.toBeInTheDocument();
    });
  });

  it('displays early warnings', async () => {
    const mockPrediction = {
      tokenAddress: 'test123',
      successProbability: 35.0,
      riskLevel: 'High',
      confidence: 0.60,
      featureScores: [],
      earlyWarnings: [
        {
          warningType: 'shallowLiquidity',
          severity: 'Critical',
          message: 'Liquidity backing is low',
          detectedAt: new Date().toISOString(),
        },
        {
          warningType: 'lowDeveloperReputation',
          severity: 'High',
          message: 'Developer reputation is below threshold',
          detectedAt: new Date().toISOString(),
        },
      ],
      timestamp: new Date().toISOString(),
    };

    (invoke as any)
      .mockResolvedValueOnce({})
      .mockResolvedValueOnce(mockPrediction)
      .mockResolvedValueOnce({ tokenAddress: 'test123', predictions: [] });

    render(<LaunchPredictorPanel />);

    const input = screen.getByPlaceholderText(/enter token address/i);
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });

    fireEvent.change(input, { target: { value: 'test123' } });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/liquidity backing is low/i)).toBeInTheDocument();
      expect(screen.getByText(/developer reputation is below threshold/i)).toBeInTheDocument();
    });
  });

  it('handles empty token address', () => {
    render(<LaunchPredictorPanel />);

    const analyzeButton = screen.getByRole('button', { name: /analyze/i });
    expect(analyzeButton).toBeDisabled();
  });
});

describe('Launch Predictor Bias Tests', () => {
  it('detects low liquidity bias', async () => {
    const mockFeatures = {
      tokenAddress: 'lowliq',
      liquidityUsd: 5000,
      developerReputation: 0.8,
      developerLaunchCount: 10,
      developerSuccessRate: 0.9,
    };

    const mockPrediction = {
      tokenAddress: 'lowliq',
      successProbability: 45.0,
      riskLevel: 'High',
      confidence: 0.55,
      featureScores: [],
      earlyWarnings: [
        {
          warningType: 'shallowLiquidity',
          severity: 'Critical',
          message: 'Liquidity backing is low',
          detectedAt: new Date().toISOString(),
        },
      ],
      timestamp: new Date().toISOString(),
    };

    (invoke as any)
      .mockResolvedValueOnce(mockFeatures)
      .mockResolvedValueOnce(mockPrediction)
      .mockResolvedValueOnce({ tokenAddress: 'lowliq', predictions: [] });

    render(<LaunchPredictorPanel />);

    const input = screen.getByPlaceholderText(/enter token address/i);
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });

    fireEvent.change(input, { target: { value: 'lowliq' } });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/liquidity backing is low/i)).toBeInTheDocument();
    });
  });

  it('detects marketing-engagement mismatch', async () => {
    const mockFeatures = {
      tokenAddress: 'hype',
      marketingHype: 0.90,
      communityEngagement: 0.25,
    };

    const mockPrediction = {
      tokenAddress: 'hype',
      successProbability: 40.0,
      riskLevel: 'High',
      confidence: 0.60,
      featureScores: [],
      earlyWarnings: [
        {
          warningType: 'marketingMismatch',
          severity: 'Medium',
          message: 'Marketing hype exceeds organic engagement',
          detectedAt: new Date().toISOString(),
        },
      ],
      timestamp: new Date().toISOString(),
    };

    (invoke as any)
      .mockResolvedValueOnce(mockFeatures)
      .mockResolvedValueOnce(mockPrediction)
      .mockResolvedValueOnce({ tokenAddress: 'hype', predictions: [] });

    render(<LaunchPredictorPanel />);

    const input = screen.getByPlaceholderText(/enter token address/i);
    const analyzeButton = screen.getByRole('button', { name: /analyze/i });

    fireEvent.change(input, { target: { value: 'hype' } });
    fireEvent.click(analyzeButton);

    await waitFor(() => {
      expect(screen.getByText(/marketing hype exceeds organic engagement/i)).toBeInTheDocument();
    });
  });
});
