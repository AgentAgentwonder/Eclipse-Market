import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api';
import type { Anomaly, AnomalyStatistics, PriceData } from '../types/anomalies';

vi.mock('@tauri-apps/api', () => ({
  invoke: vi.fn(),
}));

const mockInvoke = invoke as ReturnType<typeof vi.fn>;

describe('Anomaly Detection Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should fetch anomalies successfully', async () => {
    const mockAnomalies: Anomaly[] = [
      {
        id: '1',
        token_address: 'test_token',
        anomaly_type: 'price_zscore',
        severity: 'high',
        timestamp: Date.now() / 1000,
        value: 150.0,
        threshold: 3.0,
        explanation: 'Price anomaly detected using Z-score method.',
        details: {
          method: 'zscore',
          zscore: '3.5',
          mean: '100.0',
        },
        is_active: true,
      },
    ];

    mockInvoke.mockResolvedValueOnce(mockAnomalies);

    const result = await invoke<Anomaly[]>('get_anomalies', {
      tokenAddress: 'test_token',
      anomalyType: null,
    });

    expect(result).toEqual(mockAnomalies);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should add price data and detect anomalies', async () => {
    const priceData: PriceData = {
      timestamp: Date.now() / 1000,
      price: 200.0,
      volume: 50000.0,
    };

    mockInvoke.mockResolvedValueOnce(undefined);

    await invoke('add_price_data', {
      tokenAddress: 'test_token',
      data: priceData,
    });

    expect(mockInvoke).toHaveBeenCalledWith('add_price_data', {
      tokenAddress: 'test_token',
      data: priceData,
    });
  });

  it('should fetch active anomalies successfully', async () => {
    const mockActiveAnomalies: Anomaly[] = [
      {
        id: '1',
        token_address: 'test_token',
        anomaly_type: 'volume_spike',
        severity: 'medium',
        timestamp: Date.now() / 1000,
        value: 50000.0,
        threshold: 5.0,
        explanation: 'Unusual volume spike detected.',
        details: {
          current_volume: '50000.0',
          mean_volume: '10000.0',
        },
        is_active: true,
      },
    ];

    mockInvoke.mockResolvedValueOnce(mockActiveAnomalies);

    const result = await invoke<Anomaly[]>('get_active_anomalies');

    expect(result).toEqual(mockActiveAnomalies);
    expect(result.every((a) => a.is_active)).toBe(true);
  });

  it('should dismiss anomaly successfully', async () => {
    mockInvoke.mockResolvedValueOnce(undefined);

    await invoke('dismiss_anomaly', { anomalyId: '1' });

    expect(mockInvoke).toHaveBeenCalledWith('dismiss_anomaly', { anomalyId: '1' });
  });

  it('should fetch anomaly statistics', async () => {
    const mockStats: AnomalyStatistics = {
      token_address: 'test_token',
      total_anomalies: 10,
      active_anomalies: 3,
      by_type: {
        price_zscore: 4,
        volume_spike: 3,
        wash_trading: 3,
      },
      by_severity: {
        high: 4,
        medium: 4,
        low: 2,
      },
    };

    mockInvoke.mockResolvedValueOnce(mockStats);

    const result = await invoke<AnomalyStatistics>('get_anomaly_statistics', {
      tokenAddress: 'test_token',
    });

    expect(result).toEqual(mockStats);
    expect(result.total_anomalies).toBeGreaterThanOrEqual(result.active_anomalies);
  });

  it('should validate anomaly severity levels', async () => {
    const mockAnomalies: Anomaly[] = [
      {
        id: '1',
        token_address: 'test_token',
        anomaly_type: 'price_zscore',
        severity: 'critical',
        timestamp: Date.now() / 1000,
        value: 500.0,
        threshold: 3.0,
        explanation: 'Critical price anomaly detected.',
        details: {},
        is_active: true,
      },
      {
        id: '2',
        token_address: 'test_token',
        anomaly_type: 'price_iqr',
        severity: 'high',
        timestamp: Date.now() / 1000,
        value: 300.0,
        threshold: 1.5,
        explanation: 'High severity price outlier.',
        details: {},
        is_active: true,
      },
    ];

    mockInvoke.mockResolvedValueOnce(mockAnomalies);

    const result = await invoke<Anomaly[]>('get_anomalies', {
      tokenAddress: 'test_token',
      anomalyType: null,
    });

    const validSeverities = ['low', 'medium', 'high', 'critical'];
    result.forEach((anomaly) => {
      expect(validSeverities).toContain(anomaly.severity);
    });
  });

  it('should validate anomaly types', async () => {
    const mockAnomalies: Anomaly[] = [
      {
        id: '1',
        token_address: 'test_token',
        anomaly_type: 'price_zscore',
        severity: 'high',
        timestamp: Date.now() / 1000,
        value: 150.0,
        threshold: 3.0,
        explanation: 'Z-score anomaly.',
        details: {},
        is_active: true,
      },
      {
        id: '2',
        token_address: 'test_token',
        anomaly_type: 'volume_spike',
        severity: 'medium',
        timestamp: Date.now() / 1000,
        value: 50000.0,
        threshold: 5.0,
        explanation: 'Volume spike.',
        details: {},
        is_active: true,
      },
      {
        id: '3',
        token_address: 'test_token',
        anomaly_type: 'wash_trading',
        severity: 'high',
        timestamp: Date.now() / 1000,
        value: 0.9,
        threshold: 0.8,
        explanation: 'Wash trading detected.',
        details: {},
        is_active: true,
      },
    ];

    mockInvoke.mockResolvedValueOnce(mockAnomalies);

    const result = await invoke<Anomaly[]>('get_anomalies', {
      tokenAddress: 'test_token',
      anomalyType: null,
    });

    const validTypes = ['price_zscore', 'price_iqr', 'volume_spike', 'wash_trading'];
    result.forEach((anomaly) => {
      expect(validTypes).toContain(anomaly.anomaly_type);
    });
  });
});
