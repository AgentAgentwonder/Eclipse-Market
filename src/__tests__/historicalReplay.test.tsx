import { describe, it, expect, beforeEach } from 'vitest';
import { useHistoricalReplayStore } from '../store/historicalReplayStore';
import type { HistoricalDataSet, SimulationResult, CounterfactualResult } from '../store/historicalReplayStore';

describe('Historical Replay Store', () => {
  beforeEach(() => {
    useHistoricalReplayStore.getState().reset();
  });

  it('should initialize with empty state', () => {
    const state = useHistoricalReplayStore.getState();
    expect(state.datasets).toEqual({});
    expect(state.currentDataset).toBeNull();
    expect(state.simulationResult).toBeNull();
    expect(state.counterfactuals).toEqual([]);
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should set a dataset', () => {
    const dataset: HistoricalDataSet = {
      symbol: 'SOL',
      interval: '1h',
      data: [
        { timestamp: 1, open: 100, high: 105, low: 95, close: 102, volume: 1000 },
        { timestamp: 2, open: 102, high: 108, low: 100, close: 106, volume: 1200 },
      ],
      fetched_at: new Date().toISOString(),
    };

    useHistoricalReplayStore.getState().setDataset('SOL', dataset);

    const state = useHistoricalReplayStore.getState();
    expect(state.datasets['SOL']).toEqual(dataset);
  });

  it('should set current dataset', () => {
    const dataset: HistoricalDataSet = {
      symbol: 'SOL',
      interval: '1h',
      data: [],
      fetched_at: new Date().toISOString(),
    };

    useHistoricalReplayStore.getState().setCurrentDataset(dataset);

    const state = useHistoricalReplayStore.getState();
    expect(state.currentDataset).toEqual(dataset);
  });

  it('should set simulation result', () => {
    const result: SimulationResult = {
      config: {
        start_time: 1,
        end_time: 2,
        initial_capital: 10000,
        commission_rate: 0.1,
        slippage_rate: 0.05,
      },
      snapshots: [],
      final_value: 11000,
      total_return: 1000,
      total_return_percent: 10,
      max_drawdown: 5,
      sharpe_ratio: 1.5,
      num_trades: 5,
      total_fees: 50,
    };

    useHistoricalReplayStore.getState().setSimulationResult(result);

    const state = useHistoricalReplayStore.getState();
    expect(state.simulationResult).toEqual(result);
  });

  it('should add counterfactual result', () => {
    const counterfactual: CounterfactualResult = {
      symbol: 'SOL',
      quantity: 100,
      start_price: 50,
      end_price: 100,
      start_value: 5000,
      final_value: 10000,
      absolute_return: 5000,
      percent_return: 100,
      max_drawdown: 10,
      annualized_return: 150,
      volatility: 20,
      points: [],
    };

    useHistoricalReplayStore.getState().addCounterfactual(counterfactual);

    const state = useHistoricalReplayStore.getState();
    expect(state.counterfactuals).toHaveLength(1);
    expect(state.counterfactuals[0]).toEqual(counterfactual);
  });

  it('should clear counterfactuals', () => {
    const counterfactual: CounterfactualResult = {
      symbol: 'SOL',
      quantity: 100,
      start_price: 50,
      end_price: 100,
      start_value: 5000,
      final_value: 10000,
      absolute_return: 5000,
      percent_return: 100,
      max_drawdown: 10,
      annualized_return: 150,
      volatility: 20,
      points: [],
    };

    useHistoricalReplayStore.getState().addCounterfactual(counterfactual);
    useHistoricalReplayStore.getState().clearCounterfactuals();

    const state = useHistoricalReplayStore.getState();
    expect(state.counterfactuals).toEqual([]);
  });

  it('should update playback state', () => {
    useHistoricalReplayStore.getState().setPlaybackState({
      isPlaying: true,
      currentTime: 1000,
    });

    const state = useHistoricalReplayStore.getState();
    expect(state.playbackState.isPlaying).toBe(true);
    expect(state.playbackState.currentTime).toBe(1000);
    expect(state.playbackState.speed).toBe(1); // unchanged
  });

  it('should set loading state', () => {
    useHistoricalReplayStore.getState().setLoading(true);

    const state = useHistoricalReplayStore.getState();
    expect(state.isLoading).toBe(true);
  });

  it('should set error', () => {
    const error = 'Test error message';
    useHistoricalReplayStore.getState().setError(error);

    const state = useHistoricalReplayStore.getState();
    expect(state.error).toBe(error);
  });

  it('should reset state', () => {
    const dataset: HistoricalDataSet = {
      symbol: 'SOL',
      interval: '1h',
      data: [],
      fetched_at: new Date().toISOString(),
    };

    useHistoricalReplayStore.getState().setDataset('SOL', dataset);
    useHistoricalReplayStore.getState().setLoading(true);
    useHistoricalReplayStore.getState().setError('test error');
    useHistoricalReplayStore.getState().reset();

    const state = useHistoricalReplayStore.getState();
    expect(state.datasets).toEqual({});
    expect(state.currentDataset).toBeNull();
    expect(state.isLoading).toBe(false);
    expect(state.error).toBeNull();
  });
});
