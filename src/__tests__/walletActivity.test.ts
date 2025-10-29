import { describe, it, expect } from 'vitest';
import {
  parseWalletActivity,
  buildActivityFilter,
  calculateCopyTradeAmount,
} from '../utils/walletActivity';
import type { WalletActivity } from '../types/insiders';

describe('Wallet Activity Utils', () => {
  describe('parseWalletActivity', () => {
    it('should parse complete wallet activity event', () => {
      const event = {
        id: 'test-id',
        wallet_address: 'wallet123',
        wallet_label: 'Whale Wallet',
        tx_signature: 'sig123',
        type: 'buy',
        input_mint: 'SOL',
        output_mint: 'USDC',
        input_symbol: 'SOL',
        output_symbol: 'USDC',
        amount: 100,
        amount_usd: 2000,
        price: 20,
        is_whale: true,
        timestamp: '2024-01-01T00:00:00Z',
      };

      const result = parseWalletActivity(event);

      expect(result.id).toBe('test-id');
      expect(result.wallet_address).toBe('wallet123');
      expect(result.wallet_label).toBe('Whale Wallet');
      expect(result.tx_signature).toBe('sig123');
      expect(result.type).toBe('buy');
      expect(result.is_whale).toBe(true);
      expect(result.amount_usd).toBe(2000);
    });

    it('should handle partial event data', () => {
      const event = {
        wallet_address: 'wallet123',
        tx_signature: 'sig123',
        type: 'sell',
      };

      const result = parseWalletActivity(event);

      expect(result.wallet_address).toBe('wallet123');
      expect(result.tx_signature).toBe('sig123');
      expect(result.type).toBe('sell');
      expect(result.is_whale).toBe(false);
      expect(result.wallet_label).toBeUndefined();
    });

    it('should generate id if missing', () => {
      const event = {
        wallet_address: 'wallet123',
        tx_signature: 'sig123',
        type: 'transfer',
      };

      const result = parseWalletActivity(event);

      expect(result.id).toBeDefined();
      expect(result.id).toBe('sig123');
    });
  });

  describe('buildActivityFilter', () => {
    it('should build empty filter for null inputs', () => {
      const filter = buildActivityFilter(null, null, null);

      expect(filter.wallets).toBeUndefined();
      expect(filter.actions).toBeUndefined();
      expect(filter.min_amount_usd).toBeUndefined();
    });

    it('should build filter with wallet address', () => {
      const filter = buildActivityFilter('wallet123', null, null);

      expect(filter.wallets).toEqual(['wallet123']);
      expect(filter.actions).toBeUndefined();
    });

    it('should build filter with action', () => {
      const filter = buildActivityFilter(null, 'buy', null);

      expect(filter.wallets).toBeUndefined();
      expect(filter.actions).toEqual(['buy']);
    });

    it('should build filter with min amount', () => {
      const filter = buildActivityFilter(null, null, 1000);

      expect(filter.min_amount_usd).toBe(1000);
    });

    it('should build complete filter', () => {
      const filter = buildActivityFilter('wallet123', 'sell', 5000);

      expect(filter.wallets).toEqual(['wallet123']);
      expect(filter.actions).toEqual(['sell']);
      expect(filter.min_amount_usd).toBe(5000);
    });
  });

  describe('calculateCopyTradeAmount', () => {
    const mockActivity: WalletActivity = {
      id: '1',
      wallet_address: 'wallet123',
      tx_signature: 'sig123',
      type: 'buy',
      amount: 100,
      amount_usd: 2000,
      is_whale: false,
      timestamp: '2024-01-01T00:00:00Z',
    };

    it('should calculate amount with multiplier', () => {
      const result = calculateCopyTradeAmount(mockActivity, 1.5);

      expect(result).toBe(3000); // 2000 * 1.5
    });

    it('should use custom amount if provided', () => {
      const result = calculateCopyTradeAmount(mockActivity, 1.5, 5000);

      expect(result).toBe(5000);
    });

    it('should ignore null custom amount', () => {
      const result = calculateCopyTradeAmount(mockActivity, 2.0, null);

      expect(result).toBe(4000); // 2000 * 2.0
    });

    it('should handle missing amount_usd by falling back to amount', () => {
      const activity = { ...mockActivity, amount_usd: undefined };
      const result = calculateCopyTradeAmount(activity, 2.0);

      expect(result).toBe(200); // 100 * 2.0
    });

    it('should return 0 for missing amounts', () => {
      const activity = { ...mockActivity, amount: undefined, amount_usd: undefined };
      const result = calculateCopyTradeAmount(activity, 2.0);

      expect(result).toBe(0);
    });
  });
});
