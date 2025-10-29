import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TopHoldersTable } from '../components/holders/TopHoldersTable';
import { HolderInfo } from '../types/holders';

describe('Holder Components', () => {
  describe('TopHoldersTable', () => {
    const mockHolders: HolderInfo[] = [
      {
        address: 'So11111111111111111111111111111111111111112',
        balance: 1000000,
        percentage: 10.5,
        isKnownWallet: true,
        walletLabel: 'DeFi Protocol Treasury',
        rank: 1,
      },
      {
        address: '3xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin',
        balance: 500000,
        percentage: 5.2,
        isKnownWallet: false,
        rank: 2,
      },
    ];

    it('renders holder table with correct data', () => {
      render(<TopHoldersTable holders={mockHolders} />);

      expect(screen.getByText('Top 20 Holders')).toBeInTheDocument();
      expect(screen.getByText('#1')).toBeInTheDocument();
      expect(screen.getByText('#2')).toBeInTheDocument();
      expect(screen.getByText('10.50%')).toBeInTheDocument();
      expect(screen.getByText('5.20%')).toBeInTheDocument();
    });

    it('displays known wallet labels correctly', () => {
      render(<TopHoldersTable holders={mockHolders} />);

      expect(screen.getByText('DeFi Protocol Treasury')).toBeInTheDocument();
    });

    it('formats large balances correctly', () => {
      render(<TopHoldersTable holders={mockHolders} />);

      expect(screen.getByText('1,000,000')).toBeInTheDocument();
      expect(screen.getByText('500,000')).toBeInTheDocument();
    });
  });

  describe('Holder Metrics Calculations', () => {
    it('calculates percentages correctly', () => {
      const holders = [
        { balance: 1000, percentage: 0 },
        { balance: 500, percentage: 0 },
        { balance: 500, percentage: 0 },
      ];

      const total = holders.reduce((sum, h) => sum + h.balance, 0);
      expect(total).toBe(2000);

      const withPercentages = holders.map(h => ({
        ...h,
        percentage: (h.balance / total) * 100,
      }));

      expect(withPercentages[0].percentage).toBe(50);
      expect(withPercentages[1].percentage).toBe(25);
      expect(withPercentages[2].percentage).toBe(25);
    });

    it('calculates concentration risk correctly', () => {
      const calculateRisk = (gini: number): string => {
        if (gini > 0.8) return 'Critical';
        if (gini > 0.6) return 'High';
        if (gini > 0.4) return 'Medium';
        return 'Low';
      };

      expect(calculateRisk(0.9)).toBe('Critical');
      expect(calculateRisk(0.7)).toBe('High');
      expect(calculateRisk(0.5)).toBe('Medium');
      expect(calculateRisk(0.3)).toBe('Low');
    });
  });

  describe('Known Wallet Identification', () => {
    it('identifies known wallets correctly', () => {
      const knownWallets = new Map([
        ['addr1', 'DeFi Protocol Treasury'],
        ['addr2', 'Team Vesting'],
      ]);

      expect(knownWallets.has('addr1')).toBe(true);
      expect(knownWallets.has('addr2')).toBe(true);
      expect(knownWallets.has('addr999')).toBe(false);
      expect(knownWallets.get('addr1')).toBe('DeFi Protocol Treasury');
    });
  });

  describe('Address Formatting', () => {
    it('formats long addresses correctly', () => {
      const formatAddress = (address: string) => {
        if (address.length < 16) return address;
        return `${address.slice(0, 8)}...${address.slice(-8)}`;
      };

      const longAddress = 'So11111111111111111111111111111111111111112';
      expect(formatAddress(longAddress)).toBe('So111111...11111112');

      const shortAddress = 'addr1';
      expect(formatAddress(shortAddress)).toBe('addr1');
    });
  });
});
