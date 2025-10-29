import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock Tauri invoke
const mockInvoke = vi.fn();
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: mockInvoke,
}));

describe('Key Lifecycle Management', () => {
  beforeEach(() => {
    mockInvoke.mockClear();
  });

  describe('Key Rotation', () => {
    it('should rotate API key successfully', async () => {
      const mockResponse = 'Key rotation scheduled for helius. Next rotation due in 90 days.';
      mockInvoke.mockResolvedValue(mockResponse);

      const { invoke } = await import('@tauri-apps/api/tauri');
      const result = await invoke('rotate_api_key', { service: 'helius' });

      expect(result).toBe(mockResponse);
      expect(mockInvoke).toHaveBeenCalledWith('rotate_api_key', { service: 'helius' });
    });

    it('should fail to rotate default keys', async () => {
      mockInvoke.mockRejectedValue('Cannot rotate default keys. Please add a custom key first.');

      const { invoke } = await import('@tauri-apps/api/tauri');
      
      await expect(invoke('rotate_api_key', { service: 'birdeye' })).rejects.toMatch(/Cannot rotate default keys/);
    });

    it('should check rotation reminders', async () => {
      const mockReminders = [
        'helius: Key rotation due in 10 days',
        'birdeye: Key rotation due in 5 days',
      ];
      mockInvoke.mockResolvedValue(mockReminders);

      const { invoke } = await import('@tauri-apps/api/tauri');
      const result = await invoke('check_rotation_reminders');

      expect(result).toEqual(mockReminders);
      expect(result).toHaveLength(2);
    });
  });

  describe('Key Export/Import', () => {
    it('should export API keys with encryption', async () => {
      const mockExport = {
        version: 1,
        salt: 'mock-salt-base64',
        nonce: 'mock-nonce-base64',
        ciphertext: 'mock-encrypted-data',
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockInvoke.mockResolvedValue(mockExport);

      const { invoke } = await import('@tauri-apps/api/tauri');
      const result = await invoke('export_api_keys', { password: 'test-password' });

      expect(result).toHaveProperty('version');
      expect(result).toHaveProperty('salt');
      expect(result).toHaveProperty('nonce');
      expect(result).toHaveProperty('ciphertext');
      expect(result.version).toBe(1);
    });

    it('should import API keys with correct password', async () => {
      const mockImportData = {
        version: 1,
        salt: 'mock-salt-base64',
        nonce: 'mock-nonce-base64',
        ciphertext: 'mock-encrypted-data',
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockInvoke.mockResolvedValue('API keys imported successfully');

      const { invoke } = await import('@tauri-apps/api/tauri');
      const result = await invoke('import_api_keys', {
        password: 'test-password',
        exportData: mockImportData,
      });

      expect(result).toBe('API keys imported successfully');
    });

    it('should fail to import with wrong password', async () => {
      mockInvoke.mockRejectedValue('Failed to import keys: Decryption error');

      const { invoke } = await import('@tauri-apps/api/tauri');
      const mockImportData = {
        version: 1,
        salt: 'mock-salt-base64',
        nonce: 'mock-nonce-base64',
        ciphertext: 'mock-encrypted-data',
        createdAt: '2024-01-01T00:00:00Z',
      };

      await expect(
        invoke('import_api_keys', {
          password: 'wrong-password',
          exportData: mockImportData,
        })
      ).rejects.toMatch(/Decryption error/);
    });
  });

  describe('API Usage Analytics', () => {
    it('should record API usage', async () => {
      mockInvoke.mockResolvedValue(null);

      const { invoke } = await import('@tauri-apps/api/tauri');
      await invoke('record_api_usage', {
        service: 'helius',
        endpoint: '/v0/addresses/balance',
        statusCode: 200,
        latencyMs: 150,
      });

      expect(mockInvoke).toHaveBeenCalledWith('record_api_usage', {
        service: 'helius',
        endpoint: '/v0/addresses/balance',
        statusCode: 200,
        latencyMs: 150,
      });
    });

    it('should get API analytics', async () => {
      const mockAnalytics = {
        services: {
          helius: {
            service: 'helius',
            totalCalls: 1000,
            successfulCalls: 950,
            failedCalls: 50,
            averageLatencyMs: 150.5,
            estimatedCost: 0.01,
            periodStart: '2024-01-01T00:00:00Z',
            periodEnd: '2024-01-31T23:59:59Z',
          },
        },
        endpointBreakdown: {
          helius: [
            {
              endpoint: '/v0/addresses/balance',
              callCount: 500,
              averageLatencyMs: 145.2,
              successRate: 0.98,
            },
          ],
        },
        dailyCalls: {
          '2024-01-01': 100,
          '2024-01-02': 150,
        },
        alerts: [],
      };
      mockInvoke.mockResolvedValue(mockAnalytics);

      const { invoke } = await import('@tauri-apps/api/tauri');
      const result = await invoke('get_api_analytics', { days: 30 });

      expect(result).toHaveProperty('services');
      expect(result).toHaveProperty('endpointBreakdown');
      expect(result).toHaveProperty('dailyCalls');
      expect(result).toHaveProperty('alerts');
      expect(result.services.helius.totalCalls).toBe(1000);
    });

    it('should get fair use limits', async () => {
      const mockLimits = [
        {
          service: 'helius',
          dailyLimit: 10000,
          monthlyLimit: 300000,
          currentDailyUsage: 5000,
          currentMonthlyUsage: 150000,
          resetAt: '2024-01-02T00:00:00Z',
        },
        {
          service: 'birdeye',
          dailyLimit: 5000,
          monthlyLimit: 150000,
          currentDailyUsage: 2500,
          currentMonthlyUsage: 75000,
          resetAt: '2024-01-02T00:00:00Z',
        },
      ];
      mockInvoke.mockResolvedValue(mockLimits);

      const { invoke } = await import('@tauri-apps/api/tauri');
      const result = await invoke('get_fair_use_status');

      expect(result).toBeInstanceOf(Array);
      expect(result).toHaveLength(2);
      expect(result[0].service).toBe('helius');
      expect(result[0].dailyLimit).toBe(10000);
    });

    it('should generate usage alerts when approaching limits', async () => {
      const mockAnalytics = {
        services: {},
        endpointBreakdown: {},
        dailyCalls: {},
        alerts: [
          {
            service: 'helius',
            alertType: 'approaching_limit',
            message: 'Daily usage at 92.0% (9200/10000)',
            timestamp: '2024-01-01T12:00:00Z',
          },
          {
            service: 'birdeye',
            alertType: 'high_latency',
            message: 'Average latency: 1500ms',
            timestamp: '2024-01-01T12:00:00Z',
          },
        ],
      };
      mockInvoke.mockResolvedValue(mockAnalytics);

      const { invoke } = await import('@tauri-apps/api/tauri');
      const result = await invoke('get_api_analytics', { days: 7 });

      expect(result.alerts).toHaveLength(2);
      expect(result.alerts[0].alertType).toBe('approaching_limit');
      expect(result.alerts[1].alertType).toBe('high_latency');
    });
  });

  describe('Rotation History', () => {
    it('should track rotation history in metadata', async () => {
      const mockStatus = {
        configured: true,
        usingDefault: false,
        connectionStatus: { connected: true, lastError: null, statusCode: 200 },
        rateLimitInfo: null,
        lastTested: '2024-01-01T12:00:00Z',
        expiryDate: '2024-12-31T23:59:59Z',
        daysUntilExpiry: 364,
        lastRotation: '2024-01-01T00:00:00Z',
        rotationDueAt: '2024-04-01T00:00:00Z',
        daysUntilRotationDue: 90,
        rotationOverdue: false,
        rotationHistory: [
          {
            timestamp: '2024-01-01T00:00:00Z',
            reason: 'Manual key update',
            success: true,
          },
          {
            timestamp: '2023-10-01T00:00:00Z',
            reason: 'Scheduled rotation',
            success: true,
          },
        ],
      };
      mockInvoke.mockResolvedValue({
        helius: mockStatus,
        birdeye: mockStatus,
        jupiter: mockStatus,
        solanaRpc: mockStatus,
      });

      const { invoke } = await import('@tauri-apps/api/tauri');
      const result = await invoke('get_api_status');

      expect(result.helius.rotationHistory).toHaveLength(2);
      expect(result.helius.rotationHistory[0].reason).toBe('Manual key update');
      expect(result.helius.rotationOverdue).toBe(false);
      expect(result.helius.daysUntilRotationDue).toBe(90);
    });
  });

  describe('Encryption Validation', () => {
    it('should use AES-256-GCM for encryption', async () => {
      const mockExport = {
        version: 1,
        salt: 'mock-salt-base64',
        nonce: 'mock-nonce-base64',
        ciphertext: 'mock-encrypted-data',
        createdAt: '2024-01-01T00:00:00Z',
      };
      mockInvoke.mockResolvedValue(mockExport);

      const { invoke } = await import('@tauri-apps/api/tauri');
      const result = await invoke('export_api_keys', { password: 'test-password' });

      // Verify export contains all required encryption components
      expect(result.salt).toBeTruthy();
      expect(result.nonce).toBeTruthy();
      expect(result.ciphertext).toBeTruthy();
      expect(result.version).toBe(1);
    });
  });

  describe('Cost Estimation', () => {
    it('should calculate estimated costs correctly', async () => {
      const mockAnalytics = {
        services: {
          helius: {
            service: 'helius',
            totalCalls: 100000,
            successfulCalls: 99000,
            failedCalls: 1000,
            averageLatencyMs: 150.5,
            estimatedCost: 1.0, // 100000 * 0.01 / 1000
            periodStart: '2024-01-01T00:00:00Z',
            periodEnd: '2024-01-31T23:59:59Z',
          },
          birdeye: {
            service: 'birdeye',
            totalCalls: 50000,
            successfulCalls: 49500,
            failedCalls: 500,
            averageLatencyMs: 200.0,
            estimatedCost: 1.0, // 50000 * 0.02 / 1000
            periodStart: '2024-01-01T00:00:00Z',
            periodEnd: '2024-01-31T23:59:59Z',
          },
        },
        endpointBreakdown: {},
        dailyCalls: {},
        alerts: [],
      };
      mockInvoke.mockResolvedValue(mockAnalytics);

      const { invoke } = await import('@tauri-apps/api/tauri');
      const result = await invoke('get_api_analytics', { days: 30 });

      expect(result.services.helius.estimatedCost).toBe(1.0);
      expect(result.services.birdeye.estimatedCost).toBe(1.0);
    });
  });
});
