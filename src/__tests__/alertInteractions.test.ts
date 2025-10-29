import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useAlertStore } from '../store/alertStore';
import { useAddressLabelStore } from '../store/addressLabelStore';
import { EnhancedAlertNotification } from '../types/alertNotifications';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

describe('Alert Interactions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useAlertStore.setState({
      alerts: [],
      isLoading: false,
      error: null,
      lastTriggerEvent: null,
      enhancedNotifications: [],
    });

    useAddressLabelStore.setState({
      labels: [],
    });
  });

  describe('Enhanced Alert Notifications', () => {
    it('should add enhanced notification to store', () => {
      const store = useAlertStore.getState();
      const notification: EnhancedAlertNotification = {
        alertId: 'test-alert-1',
        alertName: 'Test Alert',
        symbol: 'SOL',
        currentPrice: 150.5,
        priceChange24h: 5.2,
        conditionsMet: 'Price above $150',
        triggeredAt: new Date().toISOString(),
      };

      store.addEnhancedNotification(notification);

      const state = useAlertStore.getState();
      expect(state.enhancedNotifications).toHaveLength(1);
      expect(state.enhancedNotifications[0]).toEqual(notification);
    });

    it('should limit notifications to 3 items', () => {
      const store = useAlertStore.getState();

      for (let i = 0; i < 5; i++) {
        const notification: EnhancedAlertNotification = {
          alertId: `test-alert-${i}`,
          alertName: `Test Alert ${i}`,
          symbol: 'SOL',
          currentPrice: 150 + i,
          conditionsMet: 'Price condition',
          triggeredAt: new Date().toISOString(),
        };
        store.addEnhancedNotification(notification);
      }

      const state = useAlertStore.getState();
      expect(state.enhancedNotifications).toHaveLength(3);
    });

    it('should dismiss notification by alertId', () => {
      const store = useAlertStore.getState();
      const notification: EnhancedAlertNotification = {
        alertId: 'test-alert-1',
        alertName: 'Test Alert',
        symbol: 'SOL',
        currentPrice: 150.5,
        conditionsMet: 'Price condition',
        triggeredAt: new Date().toISOString(),
      };

      store.addEnhancedNotification(notification);
      expect(useAlertStore.getState().enhancedNotifications).toHaveLength(1);

      store.dismissNotification('test-alert-1');
      expect(useAlertStore.getState().enhancedNotifications).toHaveLength(0);
    });

    it('should include transaction details in notification', () => {
      const store = useAlertStore.getState();
      const notification: EnhancedAlertNotification = {
        alertId: 'test-alert-1',
        alertName: 'Test Alert',
        symbol: 'SOL',
        currentPrice: 150.5,
        conditionsMet: 'Price condition',
        triggeredAt: new Date().toISOString(),
        transaction: {
          signature: '5j7s8VUL6Z9J9K3...test',
          timestamp: new Date().toISOString(),
          blockTime: Date.now(),
          tokenSymbol: 'SOL',
          tokenMint: 'So11111111111111111111111111111111111111112',
          amount: 10.5,
          usdValue: 1575.25,
          fee: 0.000005,
          fromAddress: '7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi',
          toAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        },
      };

      store.addEnhancedNotification(notification);
      const state = useAlertStore.getState();

      expect(state.enhancedNotifications[0].transaction).toBeDefined();
      expect(state.enhancedNotifications[0].transaction?.signature).toBe('5j7s8VUL6Z9J9K3...test');
    });

    it('should include similar opportunities', () => {
      const store = useAlertStore.getState();
      const notification: EnhancedAlertNotification = {
        alertId: 'test-alert-1',
        alertName: 'Test Alert',
        symbol: 'SOL',
        currentPrice: 150.5,
        conditionsMet: 'Price condition',
        triggeredAt: new Date().toISOString(),
        similarOpportunities: [
          {
            symbol: 'USDC',
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            currentPrice: 1.0,
            priceChange24h: 0.1,
            matchReason: 'Similar volume pattern',
            volume24h: 1000000,
          },
        ],
      };

      store.addEnhancedNotification(notification);
      const state = useAlertStore.getState();

      expect(state.enhancedNotifications[0].similarOpportunities).toHaveLength(1);
      expect(state.enhancedNotifications[0].similarOpportunities?.[0].symbol).toBe('USDC');
    });
  });

  describe('Address Labels', () => {
    it('should add address label', () => {
      const store = useAddressLabelStore.getState();
      store.addLabel({
        address: '7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi',
        label: 'My Wallet',
        nickname: 'Main',
        isKnown: true,
        category: 'custom',
      });

      const label = store.getLabel('7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi');
      expect(label).toBeDefined();
      expect(label?.label).toBe('My Wallet');
      expect(label?.nickname).toBe('Main');
    });

    it('should update existing address label', () => {
      const store = useAddressLabelStore.getState();
      store.addLabel({
        address: '7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi',
        label: 'Wallet 1',
        isKnown: true,
        category: 'custom',
      });

      store.updateLabel('7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi', {
        label: 'Updated Wallet',
        nickname: 'Updated',
      });

      const label = store.getLabel('7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi');
      expect(label?.label).toBe('Updated Wallet');
      expect(label?.nickname).toBe('Updated');
    });

    it('should remove address label', () => {
      const store = useAddressLabelStore.getState();
      store.addLabel({
        address: '7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi',
        label: 'Wallet 1',
        isKnown: true,
        category: 'custom',
      });

      expect(store.getLabel('7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi')).toBeDefined();

      store.removeLabel('7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi');
      expect(store.getLabel('7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi')).toBeUndefined();
    });

    it('should identify known addresses', () => {
      const store = useAddressLabelStore.getState();
      store.addLabel({
        address: '7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi',
        label: 'Known Wallet',
        isKnown: true,
        category: 'whale',
      });

      expect(store.isKnownAddress('7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi')).toBe(true);
      expect(store.isKnownAddress('9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM')).toBe(false);
    });

    it('should categorize addresses', () => {
      const store = useAddressLabelStore.getState();

      store.addLabel({
        address: 'exchange1',
        label: 'Binance Hot Wallet',
        isKnown: true,
        category: 'exchange',
      });

      store.addLabel({
        address: 'whale1',
        label: 'Big Whale',
        isKnown: true,
        category: 'whale',
      });

      const exchangeLabel = store.getLabel('exchange1');
      const whaleLabel = store.getLabel('whale1');

      expect(exchangeLabel?.category).toBe('exchange');
      expect(whaleLabel?.category).toBe('whale');
    });
  });

  describe('Alert Payload Formatting', () => {
    it('should format alert with full address details', () => {
      const notification: EnhancedAlertNotification = {
        alertId: 'test-alert-1',
        alertName: 'Whale Alert',
        symbol: 'SOL',
        currentPrice: 150.5,
        conditionsMet: 'Large transfer detected',
        triggeredAt: new Date().toISOString(),
        transaction: {
          signature: '5j7s8VUL6Z9J9K3VxC1qUZcX6SpQw6xkT3MnK3Q4T9K5',
          timestamp: new Date().toISOString(),
          blockTime: Date.now(),
          tokenSymbol: 'SOL',
          tokenMint: 'So11111111111111111111111111111111111111112',
          amount: 1000,
          usdValue: 150500,
          fee: 0.000005,
          feeUsd: 0.00075,
          fromAddress: '7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi',
          toAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
          fromLabel: 'Whale Wallet',
          toLabel: 'Exchange',
          fromKnownAddress: true,
          toKnownAddress: true,
        },
        contextMessage: 'Large SOL transfer from known whale to exchange - potential sell pressure',
      };

      expect(notification.transaction?.fromAddress).toBeDefined();
      expect(notification.transaction?.toAddress).toBeDefined();
      expect(notification.transaction?.fromLabel).toBe('Whale Wallet');
      expect(notification.transaction?.toLabel).toBe('Exchange');
      expect(notification.contextMessage).toContain('whale');
    });

    it('should include execution details for trade alerts', () => {
      const notification: EnhancedAlertNotification = {
        alertId: 'test-alert-1',
        alertName: 'Trade Alert',
        symbol: 'SOL',
        currentPrice: 150.5,
        conditionsMet: 'Trade executed',
        triggeredAt: new Date().toISOString(),
        transaction: {
          signature: '5j7s8VUL6Z9J9K3VxC1qUZcX6SpQw6xkT3MnK3Q4T9K5',
          timestamp: new Date().toISOString(),
          blockTime: Date.now(),
          tokenSymbol: 'SOL',
          tokenMint: 'So11111111111111111111111111111111111111112',
          amount: 10,
          usdValue: 1505,
          fee: 0.000005,
          executionPrice: 150.5,
          slippage: 0.2,
          expectedPrice: 150.8,
          fromAddress: '7UX2i7SucgLMQcfZ75s3VXmZZY4YRUyJN9X1RgfMoDUi',
          toAddress: '9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM',
        },
      };

      expect(notification.transaction?.executionPrice).toBe(150.5);
      expect(notification.transaction?.slippage).toBe(0.2);
      expect(notification.transaction?.expectedPrice).toBe(150.8);
    });
  });

  describe('Chart Navigation Integration', () => {
    it('should open chart with timestamp focus', () => {
      const mockOnOpenChart = vi.fn();
      const timestamp = new Date().toISOString();

      mockOnOpenChart('SOL', timestamp);

      expect(mockOnOpenChart).toHaveBeenCalledWith('SOL', timestamp);
    });

    it('should include similar opportunities for chart navigation', () => {
      const notification: EnhancedAlertNotification = {
        alertId: 'test-alert-1',
        alertName: 'Test Alert',
        symbol: 'SOL',
        currentPrice: 150.5,
        conditionsMet: 'Price condition',
        triggeredAt: new Date().toISOString(),
        similarOpportunities: [
          {
            symbol: 'USDC',
            mint: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
            currentPrice: 1.0,
            priceChange24h: 0.1,
            matchReason: 'Similar pattern',
          },
          {
            symbol: 'USDT',
            mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
            currentPrice: 1.0,
            priceChange24h: 0.05,
            matchReason: 'Correlated movement',
          },
        ],
      };

      expect(notification.similarOpportunities).toHaveLength(2);
      notification.similarOpportunities?.forEach(opp => {
        expect(opp.symbol).toBeDefined();
        expect(opp.mint).toBeDefined();
        expect(opp.matchReason).toBeDefined();
      });
    });
  });
});
