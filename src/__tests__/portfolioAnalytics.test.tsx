import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import PortfolioAnalytics from '../pages/PortfolioAnalytics';
import { invoke } from '@tauri-apps/api/tauri';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

// Mock framer-motion to avoid animation issues in tests
vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    td: ({ children, ...props }: any) => <td {...props}>{children}</td>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

describe('Portfolio Analytics', () => {
  const mockPositions = [
    {
      symbol: 'SOL',
      mint: 'So11111111111111111111111111111111111111112',
      amount: 100,
      currentPrice: 100,
      avgEntryPrice: 90,
      totalValue: 10000,
      unrealizedPnl: 1000,
      unrealizedPnlPercent: 11.11,
      allocation: 50,
    },
    {
      symbol: 'JUP',
      mint: 'JUPyiwrYJFskUPiHa7hkeR8VUtAeFoSYbKedZNsDvCN',
      amount: 5000,
      currentPrice: 1.5,
      avgEntryPrice: 1.0,
      totalValue: 7500,
      unrealizedPnl: 2500,
      unrealizedPnlPercent: 50,
      allocation: 37.5,
    },
    {
      symbol: 'BONK',
      mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
      amount: 1000000,
      currentPrice: 0.0025,
      avgEntryPrice: 0.002,
      totalValue: 2500,
      unrealizedPnl: 500,
      unrealizedPnlPercent: 25,
      allocation: 12.5,
    },
  ];

  const mockPriceHistory = Array.from({ length: 24 }, (_, i) => ({
    timestamp: Date.now() - (23 - i) * 3600000,
    open: 100 + Math.random() * 10,
    high: 105 + Math.random() * 10,
    low: 95 + Math.random() * 10,
    close: 100 + Math.random() * 10,
    volume: 1000000 + Math.random() * 100000,
  }));

  const mockAnalytics = {
    correlation: {
      symbols: ['SOL', 'JUP', 'BONK'],
      matrix: [
        [1.0, 0.75, 0.25],
        [0.75, 1.0, 0.15],
        [0.25, 0.15, 1.0],
      ],
      calculatedAt: new Date().toISOString(),
    },
    diversification: {
      score: 65.5,
      effectiveN: 2.3,
      avgCorrelation: 0.38,
      concentrationRisk: 0.43,
    },
    concentration: [
      {
        symbol: 'SOL',
        allocation: 50,
        riskLevel: 'critical',
        recommendation: 'Critically high concentration. Consider immediate rebalancing.',
      },
      {
        symbol: 'JUP',
        allocation: 37.5,
        riskLevel: 'high',
        recommendation: 'High concentration risk. Recommend diversifying into other assets.',
      },
      {
        symbol: 'BONK',
        allocation: 12.5,
        riskLevel: 'low',
        recommendation: 'Healthy allocation level.',
      },
    ],
    sharpe: {
      sharpeRatio: 1.25,
      annualizedReturn: 0.15,
      annualizedVolatility: 0.12,
      riskFreeRate: 0.03,
    },
    factors: {
      factors: [
        { name: 'Market', beta: 1.2, exposure: 1.2 },
        { name: 'Size', beta: 0.5, exposure: 0.6 },
        { name: 'Momentum', beta: 0.03, exposure: 0.3 },
      ],
      marketBeta: 1.2,
      systematicRisk: 0.08,
      specificRisk: 0.04,
    },
    calculatedAt: new Date().toISOString(),
  };

  const mockSectors = [
    {
      sector: 'Layer 1',
      allocation: 50,
      value: 10000,
      symbols: ['SOL'],
    },
    {
      sector: 'DeFi',
      allocation: 37.5,
      value: 7500,
      symbols: ['JUP'],
    },
    {
      sector: 'Meme',
      allocation: 12.5,
      value: 2500,
      symbols: ['BONK'],
    },
  ];

  const mockAlerts = [
    {
      id: 'alert-1',
      symbol: 'SOL',
      allocation: 50,
      severity: 'critical',
      message: 'SOL represents 50.0% of your portfolio. Critical concentration risk detected.',
      threshold: 40,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'alert-2',
      symbol: 'JUP',
      allocation: 37.5,
      severity: 'warning',
      message: 'JUP represents 37.5% of your portfolio. Consider diversifying.',
      threshold: 30,
      createdAt: new Date().toISOString(),
    },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    (invoke as any).mockImplementation((cmd: string) => {
      switch (cmd) {
        case 'get_positions':
          return Promise.resolve(mockPositions);
        case 'get_price_history':
          return Promise.resolve(mockPriceHistory);
        case 'calculate_portfolio_analytics':
          return Promise.resolve(mockAnalytics);
        case 'get_sector_allocation':
          return Promise.resolve(mockSectors);
        case 'get_concentration_alerts':
          return Promise.resolve(mockAlerts);
        case 'clear_portfolio_cache':
          return Promise.resolve();
        default:
          return Promise.reject(new Error(`Unknown command: ${cmd}`));
      }
    });
  });

  it('renders loading state initially', () => {
    render(<PortfolioAnalytics />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });

  it('renders analytics data after loading', async () => {
    render(<PortfolioAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Portfolio Analytics')).toBeInTheDocument();
    });

    expect(screen.getByText('Diversification Score')).toBeInTheDocument();
    expect(screen.getByText('Sharpe Ratio')).toBeInTheDocument();
    expect(screen.getByText('Factor Exposure')).toBeInTheDocument();
  });

  it('displays concentration alerts', async () => {
    render(<PortfolioAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Concentration Risk Alerts')).toBeInTheDocument();
    });

    expect(screen.getByText(/SOL represents 50\.0% of your portfolio/)).toBeInTheDocument();
    expect(screen.getByText('CRITICAL')).toBeInTheDocument();
    expect(screen.getByText('WARNING')).toBeInTheDocument();
  });

  it('displays correlation matrix', async () => {
    render(<PortfolioAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Correlation Matrix')).toBeInTheDocument();
    });

    // Check for correlation values
    expect(screen.getByText('1.00')).toBeInTheDocument(); // Perfect self-correlation
    expect(screen.getByText('0.75')).toBeInTheDocument();
  });

  it('displays sector allocation', async () => {
    render(<PortfolioAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Sector Allocation')).toBeInTheDocument();
    });

    expect(screen.getByText('Layer 1')).toBeInTheDocument();
    expect(screen.getByText('DeFi')).toBeInTheDocument();
    expect(screen.getByText('Meme')).toBeInTheDocument();
  });

  it('handles refresh button click', async () => {
    render(<PortfolioAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Portfolio Analytics')).toBeInTheDocument();
    });

    const refreshButton = screen.getByRole('button', { name: /Refresh/i });
    fireEvent.click(refreshButton);

    await waitFor(() => {
      expect(invoke).toHaveBeenCalledWith('clear_portfolio_cache');
    });
  });

  it('handles export report', async () => {
    const mockCreateElement = vi.spyOn(document, 'createElement');
    const mockClick = vi.fn();
    mockCreateElement.mockReturnValue({
      click: mockClick,
      setAttribute: vi.fn(),
      style: {},
    } as any);

    render(<PortfolioAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Portfolio Analytics')).toBeInTheDocument();
    });

    const exportButton = screen.getByRole('button', { name: /Export Report/i });
    fireEvent.click(exportButton);

    await waitFor(() => {
      expect(mockClick).toHaveBeenCalled();
    });
  });

  it('displays risk metrics correctly', async () => {
    render(<PortfolioAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('65.5')).toBeInTheDocument(); // Diversification score
      expect(screen.getByText('1.25')).toBeInTheDocument(); // Sharpe ratio
    });

    // Check for effective N
    expect(screen.getByText(/Effective N: 2\.3/)).toBeInTheDocument();
  });

  it('handles empty positions', async () => {
    (invoke as any).mockImplementation((cmd: string) => {
      if (cmd === 'get_positions') {
        return Promise.resolve([]);
      }
      return Promise.resolve([]);
    });

    render(<PortfolioAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('No positions found')).toBeInTheDocument();
    });
  });

  it('handles API errors gracefully', async () => {
    (invoke as any).mockRejectedValue(new Error('API Error'));

    render(<PortfolioAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Failed to Load Analytics')).toBeInTheDocument();
    });
  });

  it('displays concentration risk breakdown', async () => {
    render(<PortfolioAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Concentration Risk Breakdown')).toBeInTheDocument();
    });

    expect(screen.getByText('CRITICAL RISK')).toBeInTheDocument();
    expect(screen.getByText('HIGH RISK')).toBeInTheDocument();
    expect(screen.getByText('LOW RISK')).toBeInTheDocument();
  });

  it('displays Sharpe ratio status correctly', async () => {
    render(<PortfolioAnalytics />);

    await waitFor(() => {
      expect(screen.getByText('Good risk-adjusted performance')).toBeInTheDocument();
    });
  });
});
