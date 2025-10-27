import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePaperTradingStore } from '../store/paperTradingStore';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

import { invoke } from '@tauri-apps/api/tauri';

describe('PaperTradingStore', () => {
  beforeEach(() => {
    // Reset store state
    usePaperTradingStore.setState({
      enabled: false,
      account: null,
      balances: [],
      positions: [],
      tradeHistory: [],
      leaderboard: [],
      loading: false,
      error: null,
    });
    
    // Clear mocks
    vi.clearAllMocks();
  });

  it('should initialize with default state', () => {
    const state = usePaperTradingStore.getState();
    expect(state.enabled).toBe(false);
    expect(state.account).toBeNull();
    expect(state.balances).toEqual([]);
    expect(state.positions).toEqual([]);
    expect(state.tradeHistory).toEqual([]);
  });

  it('should check paper trading status', async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValueOnce(true);

    await usePaperTradingStore.getState().checkStatus();

    expect(mockInvoke).toHaveBeenCalledWith('paper_get_status');
    expect(usePaperTradingStore.getState().enabled).toBe(true);
  });

  it('should set paper trading enabled', async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValueOnce(undefined); // paper_set_enabled
    mockInvoke.mockResolvedValueOnce({
      enabled: true,
      balances: { SOL: 10000 },
      initial_balance: 10000,
      current_value: 10000,
      total_pnl: 0,
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      created_at: new Date().toISOString(),
      reset_count: 0,
    }); // paper_get_account
    mockInvoke.mockResolvedValueOnce([]); // paper_get_balances
    mockInvoke.mockResolvedValueOnce([]); // paper_get_positions

    await usePaperTradingStore.getState().setEnabled(true);

    expect(mockInvoke).toHaveBeenCalledWith('paper_set_enabled', { enabled: true });
    expect(usePaperTradingStore.getState().enabled).toBe(true);
  });

  it('should load paper account', async () => {
    const mockAccount = {
      enabled: true,
      balances: { SOL: 10000 },
      initial_balance: 10000,
      current_value: 10000,
      total_pnl: 0,
      total_trades: 0,
      winning_trades: 0,
      losing_trades: 0,
      created_at: new Date().toISOString(),
      reset_count: 0,
    };

    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValueOnce(mockAccount);

    await usePaperTradingStore.getState().loadAccount();

    expect(mockInvoke).toHaveBeenCalledWith('paper_get_account');
    expect(usePaperTradingStore.getState().account).toEqual(mockAccount);
  });

  it('should execute a paper trade', async () => {
    const mockTrade = {
      id: 'trade-1',
      trade_type: 'buy',
      input_symbol: 'SOL',
      output_symbol: 'USDC',
      input_amount: 1.0,
      output_amount: 50.0,
      price: 50.0,
      fee: 0.025,
      slippage: 0.1,
      realized_pnl: 0,
      timestamp: new Date().toISOString(),
    };

    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValueOnce(mockTrade);
    mockInvoke.mockResolvedValueOnce(null); // loadAccount
    mockInvoke.mockResolvedValueOnce(null); // loadBalances
    mockInvoke.mockResolvedValueOnce(null); // loadPositions
    mockInvoke.mockResolvedValueOnce([]); // loadTradeHistory

    const trade = await usePaperTradingStore.getState().executeTrade(
      'buy',
      'SOL',
      'USDC',
      1.0,
      50.0
    );

    expect(mockInvoke).toHaveBeenCalledWith('paper_execute_trade', {
      tradeType: 'buy',
      inputSymbol: 'SOL',
      outputSymbol: 'USDC',
      inputAmount: 1.0,
      expectedOutputAmount: 50.0,
      orderId: undefined,
    });
    expect(trade).toEqual(mockTrade);
  });

  it('should reset paper account', async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValueOnce(undefined);
    mockInvoke.mockResolvedValueOnce(null); // loadAccount
    mockInvoke.mockResolvedValueOnce(null); // loadBalances
    mockInvoke.mockResolvedValueOnce(null); // loadPositions

    await usePaperTradingStore.getState().resetAccount(5000);

    expect(mockInvoke).toHaveBeenCalledWith('paper_reset_account', {
      initialBalance: 5000,
    });
  });

  it('should update config', async () => {
    const config = {
      slippage_percent: 0.2,
      fee_percent: 0.1,
      max_slippage_percent: 1.0,
      simulate_failures: false,
      failure_rate: 0.01,
    };

    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockResolvedValueOnce(undefined);

    await usePaperTradingStore.getState().updateConfig(config);

    expect(mockInvoke).toHaveBeenCalledWith('paper_update_config', { config });
    expect(usePaperTradingStore.getState().config).toEqual(config);
  });

  it('should handle errors', async () => {
    const mockInvoke = vi.mocked(invoke);
    mockInvoke.mockRejectedValueOnce(new Error('Test error'));

    await usePaperTradingStore.getState().checkStatus();

    expect(usePaperTradingStore.getState().error).toBe('Error: Test error');
  });

  it('should clear errors', () => {
    usePaperTradingStore.setState({ error: 'Some error' });
    expect(usePaperTradingStore.getState().error).toBe('Some error');

    usePaperTradingStore.getState().clearError();
    expect(usePaperTradingStore.getState().error).toBeNull();
  });
});
