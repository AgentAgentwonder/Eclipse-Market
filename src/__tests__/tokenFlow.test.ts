import { describe, it, expect } from 'vitest';
import { createMockTransactions } from '../utils/tokenFlowMocks';

describe('Token Flow Intelligence', () => {
  describe('Mock Transaction Generation', () => {
    it('should generate transactions with correct structure', () => {
      const tokenAddress = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const startTimestamp = Math.floor(Date.now() / 1000);
      const transactions = createMockTransactions({
        tokenAddress,
        startTimestamp,
        intervals: 120,
      });

      expect(transactions).toBeDefined();
      expect(transactions.length).toBeGreaterThan(0);

      transactions.forEach(tx => {
        expect(tx).toHaveProperty('source');
        expect(tx).toHaveProperty('target');
        expect(tx).toHaveProperty('amount');
        expect(tx).toHaveProperty('timestamp');
        expect(tx).toHaveProperty('tokenAddress');
        expect(tx).toHaveProperty('transactionHash');
        expect(tx.tokenAddress).toBe(tokenAddress);
      });
    });

    it('should generate transactions with increasing timestamps', () => {
      const tokenAddress = 'TestToken';
      const startTimestamp = 1000000;
      const transactions = createMockTransactions({
        tokenAddress,
        startTimestamp,
        intervals: 100,
      });

      for (let i = 0; i < transactions.length - 1; i++) {
        expect(transactions[i + 1].timestamp).toBeGreaterThanOrEqual(transactions[i].timestamp);
      }
    });

    it('should generate unique transaction hashes', () => {
      const tokenAddress = 'TestToken';
      const startTimestamp = 1000000;
      const transactions = createMockTransactions({
        tokenAddress,
        startTimestamp,
      });

      const hashes = transactions.map(tx => tx.transactionHash);
      const uniqueHashes = new Set(hashes);
      expect(uniqueHashes.size).toBe(hashes.length);
    });
  });

  describe('Token Flow Types', () => {
    it('should properly handle wallet addresses', () => {
      const transactions = createMockTransactions({
        tokenAddress: 'TestToken',
        startTimestamp: 1000000,
      });

      const uniqueWallets = new Set<string>();
      transactions.forEach(tx => {
        uniqueWallets.add(tx.source);
        uniqueWallets.add(tx.target);
      });

      expect(uniqueWallets.size).toBeGreaterThan(0);
      expect(uniqueWallets.size).toBeGreaterThanOrEqual(2);
    });

    it('should have positive amounts', () => {
      const transactions = createMockTransactions({
        tokenAddress: 'TestToken',
        startTimestamp: 1000000,
      });

      transactions.forEach(tx => {
        expect(tx.amount).toBeGreaterThan(0);
      });
    });
  });

  describe('Circular Flow Patterns', () => {
    it('should generate cycles for testing', () => {
      const transactions = createMockTransactions({
        tokenAddress: 'TestToken',
        startTimestamp: 1000000,
      });

      const nodes = new Set<string>();
      const edges = transactions.map(tx => `${tx.source}->${tx.target}`);

      transactions.forEach(tx => {
        nodes.add(tx.source);
        nodes.add(tx.target);
      });

      expect(nodes.size).toBeGreaterThan(2);
      expect(edges.length).toBeGreaterThan(5);
    });
  });
});
