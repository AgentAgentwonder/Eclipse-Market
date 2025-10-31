import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { DeFiHub } from '../components/defi/DeFiHub';
import { invoke } from '@tauri-apps/api/tauri';

vi.mock('@tauri-apps/api/tauri');

const mockPortfolioSummary = {
  totalValueUsd: 50000,
  lendingValue: 20000,
  borrowingValue: 5000,
  lpValue: 15000,
  stakingValue: 5000,
  farmingValue: 5000,
  totalEarnings24h: 27.5,
  averageApy: 12.5,
  positions: [
    {
      id: 'test-position-1',
      protocol: 'solend',
      positionType: 'lending',
      asset: 'USDC',
      amount: 20000,
      valueUsd: 20000,
      apy: 7.5,
      rewards: [],
      healthFactor: null,
      createdAt: Date.now(),
      lastUpdated: Date.now(),
    },
  ],
};

const mockRiskMetrics = [
  {
    positionId: 'test-position-1',
    riskLevel: 'low' as const,
    liquidationPrice: null,
    healthFactor: null,
    collateralRatio: null,
    warnings: [],
  },
];

describe('DeFi Hub', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(invoke).mockImplementation((cmd: string) => {
      if (cmd === 'get_defi_portfolio_summary') {
        return Promise.resolve(mockPortfolioSummary);
      }
      if (cmd === 'get_defi_risk_metrics') {
        return Promise.resolve(mockRiskMetrics);
      }
      return Promise.resolve(null);
    });
  });

  it('renders total value correctly', async () => {
    render(<DeFiHub wallet="test-wallet" />);
    await waitFor(() => {
      expect(screen.getByText('DeFi Control Center')).toBeInTheDocument();
    });
    expect(screen.getByText('$50,000.00')).toBeInTheDocument();
  });

  it('displays average APY', async () => {
    render(<DeFiHub wallet="test-wallet" />);
    await waitFor(() => {
      expect(screen.getByText('12.50%')).toBeInTheDocument();
    });
  });

  it('renders tabs correctly', async () => {
    render(<DeFiHub wallet="test-wallet" />);
    await waitFor(() => {
      expect(screen.getByText('Overview')).toBeInTheDocument();
      expect(screen.getByText('Lending')).toBeInTheDocument();
      expect(screen.getByText('Yield Farming')).toBeInTheDocument();
      expect(screen.getByText('Positions')).toBeInTheDocument();
      expect(screen.getByText('Governance')).toBeInTheDocument();
    });
  });

  it('loads data from backend', async () => {
    render(<DeFiHub wallet="test-wallet" />);
    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('get_defi_portfolio_summary', {
        wallet: 'test-wallet',
      });
      expect(invoke).toHaveBeenCalledWith('get_defi_risk_metrics', {
        wallet: 'test-wallet',
      });
    });
  });
});

describe('Risk Warnings', () => {
  it('displays risk warnings for high-risk positions', async () => {
    const highRiskMetrics = [
      {
        positionId: 'risky-position',
        riskLevel: 'high' as const,
        liquidationPrice: 95.0,
        healthFactor: 1.2,
        collateralRatio: 0.6,
        warnings: ['Position health requires attention'],
      },
    ];

    vi.mocked(invoke).mockImplementation((cmd: string) => {
      if (cmd === 'get_defi_portfolio_summary') {
        return Promise.resolve(mockPortfolioSummary);
      }
      if (cmd === 'get_defi_risk_metrics') {
        return Promise.resolve(highRiskMetrics);
      }
      return Promise.resolve(null);
    });

    render(<DeFiHub wallet="test-wallet" />);
    await waitFor(() => {
      expect(screen.getByText('Risk Alert')).toBeInTheDocument();
      expect(screen.getByText('HIGH')).toBeInTheDocument();
    });
  });
});
