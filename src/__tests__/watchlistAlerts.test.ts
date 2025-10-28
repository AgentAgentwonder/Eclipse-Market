import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useWatchlistStore } from '../store/watchlistStore';
import { useAlertStore } from '../store/alertStore';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

describe('Watchlist Store', () => {
  beforeEach(() => {
    const { invoke } = require('@tauri-apps/api/tauri');
    vi.clearAllMocks();
  });

  it('should initialize with empty watchlists', () => {
    const store = useWatchlistStore.getState();
    expect(store.watchlists).toEqual([]);
    expect(store.selectedWatchlistId).toBeNull();
    expect(store.isLoading).toBe(false);
  });

  it('should create a watchlist', async () => {
    const { invoke } = require('@tauri-apps/api/tauri');
    const mockWatchlist = {
      id: 'test-id',
      name: 'Test Watchlist',
      items: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    invoke.mockResolvedValueOnce(mockWatchlist);

    const store = useWatchlistStore.getState();
    const result = await store.createWatchlist('Test Watchlist');

    expect(invoke).toHaveBeenCalledWith('watchlist_create', { name: 'Test Watchlist' });
    expect(result).toEqual(mockWatchlist);
    expect(useWatchlistStore.getState().watchlists).toContainEqual(mockWatchlist);
  });

  it('should add item to watchlist', async () => {
    const { invoke } = require('@tauri-apps/api/tauri');
    const mockWatchlist = {
      id: 'test-id',
      name: 'Test Watchlist',
      items: [
        {
          symbol: 'SOL',
          mint: 'So11111111111111111111111111111111111111112',
          position: 0,
          addedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    invoke.mockResolvedValueOnce(mockWatchlist);

    const store = useWatchlistStore.getState();
    const result = await store.addItem(
      'test-id',
      'SOL',
      'So11111111111111111111111111111111111111112'
    );

    expect(invoke).toHaveBeenCalledWith('watchlist_add_item', {
      watchlistId: 'test-id',
      symbol: 'SOL',
      mint: 'So11111111111111111111111111111111111111112',
    });
    expect(result.items).toHaveLength(1);
  });

  it('should reorder items in watchlist', async () => {
    const { invoke } = require('@tauri-apps/api/tauri');
    const mockWatchlist = {
      id: 'test-id',
      name: 'Test Watchlist',
      items: [
        {
          symbol: 'SOL',
          mint: 'So11111111111111111111111111111111111111112',
          position: 1,
          addedAt: new Date().toISOString(),
        },
        {
          symbol: 'BTC',
          mint: '11111111111111111111111111111111',
          position: 0,
          addedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    invoke.mockResolvedValueOnce(mockWatchlist);

    const store = useWatchlistStore.getState();
    const result = await store.reorderItems('test-id', [
      { symbol: 'BTC', mint: '11111111111111111111111111111111', position: 0 },
      { symbol: 'SOL', mint: 'So11111111111111111111111111111111111111112', position: 1 },
    ]);

    expect(invoke).toHaveBeenCalledWith('watchlist_reorder_items', {
      watchlistId: 'test-id',
      items: expect.any(Array),
    });
    expect(result.items[0].position).toBeLessThan(result.items[1].position);
  });
});

describe('Alert Store', () => {
  beforeEach(() => {
    const { invoke } = require('@tauri-apps/api/tauri');
    vi.clearAllMocks();
  });

  it('should initialize with empty alerts', () => {
    const store = useAlertStore.getState();
    expect(store.alerts).toEqual([]);
    expect(store.isLoading).toBe(false);
    expect(store.lastTriggerEvent).toBeNull();
  });

  it('should create a price alert', async () => {
    const { invoke } = require('@tauri-apps/api/tauri');
    const mockAlert = {
      id: 'alert-id',
      name: 'SOL Price Alert',
      symbol: 'SOL',
      mint: 'So11111111111111111111111111111111111111112',
      watchlistId: null,
      compoundCondition: {
        conditions: [{ conditionType: 'above', value: 100, timeframeMinutes: null }],
        operator: 'and',
      },
      notificationChannels: ['in_app'],
      cooldownMinutes: 30,
      state: 'active',
      lastTriggeredAt: null,
      cooldownUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    invoke.mockResolvedValueOnce(mockAlert);

    const store = useAlertStore.getState();
    const result = await store.createAlert({
      id: '',
      name: 'SOL Price Alert',
      symbol: 'SOL',
      mint: 'So11111111111111111111111111111111111111112',
      watchlistId: null,
      compoundCondition: {
        conditions: [{ conditionType: 'above', value: 100, timeframeMinutes: null }],
        operator: 'and',
      },
      notificationChannels: ['in_app'],
      cooldownMinutes: 30,
      state: 'active',
      lastTriggeredAt: null,
      cooldownUntil: null,
      createdAt: '',
      updatedAt: '',
    } as never);

    expect(invoke).toHaveBeenCalledWith('alert_create', {
      req: expect.objectContaining({
        name: 'SOL Price Alert',
        symbol: 'SOL',
      }),
    });
    expect(result.id).toBe('alert-id');
  });

  it('should test alert conditions', async () => {
    const { invoke } = require('@tauri-apps/api/tauri');
    const mockTestResult = {
      alertId: 'alert-id',
      wouldTrigger: true,
      conditionsMet: [true],
      currentPrice: 105,
      message: 'Price above threshold $100.00',
    };

    invoke.mockResolvedValueOnce(mockTestResult);

    const store = useAlertStore.getState();
    const result = await store.testAlert('alert-id', 105, 100, 1000000);

    expect(invoke).toHaveBeenCalledWith('alert_test', {
      id: 'alert-id',
      currentPrice: 105,
      price24hAgo: 100,
      volume24h: 1000000,
    });
    expect(result.wouldTrigger).toBe(true);
  });

  it('should update alert state', async () => {
    const { invoke } = require('@tauri-apps/api/tauri');
    const mockAlert = {
      id: 'alert-id',
      name: 'SOL Price Alert',
      symbol: 'SOL',
      mint: 'So11111111111111111111111111111111111111112',
      watchlistId: null,
      compoundCondition: {
        conditions: [{ conditionType: 'above', value: 100, timeframeMinutes: null }],
        operator: 'and',
      },
      notificationChannels: ['in_app'],
      cooldownMinutes: 30,
      state: 'disabled',
      lastTriggeredAt: null,
      cooldownUntil: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    invoke.mockResolvedValueOnce(mockAlert);

    const store = useAlertStore.getState();
    const result = await store.updateAlert('alert-id', { state: 'disabled' });

    expect(invoke).toHaveBeenCalledWith('alert_update', {
      id: 'alert-id',
      req: expect.objectContaining({
        state: 'disabled',
      }),
    });
    expect(result.state).toBe('disabled');
  });
});

describe('Watchlist and Alert Integration', () => {
  it('should handle max watchlist limit', async () => {
    const { invoke } = require('@tauri-apps/api/tauri');
    invoke.mockRejectedValueOnce(new Error('maximum watchlists reached: 10'));

    const store = useWatchlistStore.getState();
    await expect(store.createWatchlist('Too Many')).rejects.toThrow();
  });

  it('should prevent duplicate items in watchlist', async () => {
    const { invoke } = require('@tauri-apps/api/tauri');
    invoke.mockRejectedValueOnce(new Error('duplicate item'));

    const store = useWatchlistStore.getState();
    await expect(
      store.addItem('test-id', 'SOL', 'So11111111111111111111111111111111111111112')
    ).rejects.toThrow();
  });
});
