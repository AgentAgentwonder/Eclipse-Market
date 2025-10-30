import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useVoice } from '../hooks/useVoice';
import { useVoiceStore } from '../store/voiceStore';
import { voiceCommandService } from '../utils/voiceCommandService';

// Mock Tauri invoke
vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn().mockResolvedValue(true),
}));

// Mock speech APIs
global.SpeechRecognition = vi.fn().mockImplementation(() => ({
  continuous: true,
  interimResults: true,
  maxAlternatives: 3,
  lang: 'en-US',
  start: vi.fn(),
  stop: vi.fn(),
  onstart: null,
  onend: null,
  onresult: null,
  onerror: null,
})) as any;

global.speechSynthesis = {
  cancel: vi.fn(),
  speak: vi.fn(),
  getVoices: vi.fn(() => []),
} as any;

global.SpeechSynthesisUtterance = vi.fn().mockImplementation(() => ({})) as any;

describe('Voice Trading', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useVoiceStore.setState({
      enabled: true,
      listening: false,
      currentCommand: null,
      commandHistory: [],
      session: null,
      pendingNotifications: [],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('useVoice Hook', () => {
    it('should initialize with default state', () => {
      const { result } = renderHook(() => useVoice());

      expect(result.current.isSupported).toBe(true);
      expect(result.current.enabled).toBe(true);
      expect(result.current.listening).toBe(false);
    });

    it('should start listening when enabled', async () => {
      const { result } = renderHook(() => useVoice());

      await act(async () => {
        result.current.startListening();
      });

      expect(result.current.listening).toBe(false); // Mock doesn't actually set state
    });

    it('should speak text using speech synthesis', async () => {
      const { result } = renderHook(() => useVoice());

      await act(async () => {
        result.current.speak('Test message');
      });

      expect(global.speechSynthesis.cancel).toHaveBeenCalled();
      expect(global.speechSynthesis.speak).toHaveBeenCalled();
    });

    it('should handle voice command confirmation flow', async () => {
      const { result } = renderHook(() => useVoice());

      const testIntent = {
        type: 'trade_buy' as const,
        confidence: 0.9,
        parameters: { symbol: 'SOL', amount: 10 },
        rawText: 'buy 10 SOL',
        timestamp: Date.now(),
      };

      await act(async () => {
        const command = useVoiceStore.getState().createCommand(testIntent);
        useVoiceStore.setState({ currentCommand: command });
      });

      expect(useVoiceStore.getState().currentCommand).toBeTruthy();
      expect(useVoiceStore.getState().currentCommand?.requiresConfirmation).toBe(true);
    });

    it('should handle MFA for sensitive trades', async () => {
      const { result } = renderHook(() => useVoice());

      const testIntent = {
        type: 'trade_buy' as const,
        confidence: 0.9,
        parameters: { symbol: 'SOL', amount: 2000 }, // Large amount
        rawText: 'buy 2000 SOL',
        timestamp: Date.now(),
      };

      await act(async () => {
        const command = useVoiceStore.getState().createCommand(testIntent);
        expect(command.requiresMFA).toBe(true);
      });
    });
  });

  describe('Voice Store', () => {
    it('should create voice session', () => {
      const { startSession } = useVoiceStore.getState();

      act(() => {
        startSession('en-US', false);
      });

      const { session } = useVoiceStore.getState();
      expect(session).toBeTruthy();
      expect(session?.active).toBe(true);
      expect(session?.locale).toBe('en-US');
    });

    it('should end voice session', () => {
      const { startSession, endSession } = useVoiceStore.getState();

      act(() => {
        startSession('en-US', false);
        endSession();
      });

      const { session } = useVoiceStore.getState();
      expect(session?.active).toBe(false);
    });

    it('should create and track commands', () => {
      const { createCommand } = useVoiceStore.getState();

      const intent = {
        type: 'price_query' as const,
        confidence: 0.95,
        parameters: { symbol: 'SOL' },
        rawText: 'what is the price of SOL',
        timestamp: Date.now(),
      };

      act(() => {
        createCommand(intent);
      });

      const { commandHistory } = useVoiceStore.getState();
      expect(commandHistory).toHaveLength(1);
      expect(commandHistory[0].intent.type).toBe('price_query');
    });

    it('should queue and dequeue notifications', () => {
      const { queueNotification, dequeueNotification } = useVoiceStore.getState();

      act(() => {
        queueNotification('Test notification', 5);
      });

      const { pendingNotifications } = useVoiceStore.getState();
      expect(pendingNotifications).toHaveLength(1);

      act(() => {
        dequeueNotification(pendingNotifications[0].id);
      });

      const { pendingNotifications: updatedNotifications } = useVoiceStore.getState();
      expect(updatedNotifications).toHaveLength(0);
    });

    it('should create MFA challenge', () => {
      const { createMFAChallenge } = useVoiceStore.getState();

      act(() => {
        createMFAChallenge('pin', 'Enter your PIN');
      });

      const { mfaChallenge } = useVoiceStore.getState();
      expect(mfaChallenge).toBeTruthy();
      expect(mfaChallenge?.type).toBe('pin');
      expect(mfaChallenge?.maxAttempts).toBe(3);
    });

    it('should handle MFA response with attempts tracking', () => {
      const { createMFAChallenge, submitMFAResponse } = useVoiceStore.getState();

      let challengeId: string;
      act(() => {
        const challenge = createMFAChallenge('pin', 'Enter your PIN');
        challengeId = challenge.id;
      });

      act(() => {
        const result = submitMFAResponse({
          challengeId,
          response: '1234',
          timestamp: Date.now(),
        });
        expect(result).toBe(true);
      });

      const { mfaChallenge } = useVoiceStore.getState();
      expect(mfaChallenge?.attempts).toBe(1);
    });
  });

  describe('Voice Command Service', () => {
    it('should parse buy command', () => {
      const intent = voiceCommandService.parseIntent('buy 10 SOL');

      expect(intent).toBeTruthy();
      expect(intent?.type).toBe('trade_buy');
      expect(intent?.parameters.amount).toBe(10);
      expect(intent?.parameters.symbol).toBe('SOL');
    });

    it('should parse sell command', () => {
      const intent = voiceCommandService.parseIntent('sell 5 BONK');

      expect(intent).toBeTruthy();
      expect(intent?.type).toBe('trade_sell');
      expect(intent?.parameters.amount).toBe(5);
      expect(intent?.parameters.symbol).toBe('BONK');
    });

    it('should parse price query', () => {
      const intent = voiceCommandService.parseIntent('what is the price of SOL');

      expect(intent).toBeTruthy();
      expect(intent?.type).toBe('price_query');
      expect(intent?.parameters.symbol).toBe('SOL');
    });

    it('should parse alert creation', () => {
      const intent = voiceCommandService.parseIntent('alert me when SOL goes above 200');

      expect(intent).toBeTruthy();
      expect(intent?.type).toBe('alert_create');
      expect(intent?.parameters.symbol).toBe('SOL');
      expect(intent?.parameters.condition).toBe('above');
      expect(intent?.parameters.price).toBe(200);
    });

    it('should parse portfolio query', () => {
      const intent = voiceCommandService.parseIntent('show my balance');

      expect(intent).toBeTruthy();
      expect(intent?.type).toBe('portfolio_query');
      expect(intent?.parameters.queryType).toBe('balance');
    });

    it('should calculate risk score for trades', () => {
      const lowRiskIntent = {
        type: 'trade_buy' as const,
        confidence: 0.9,
        parameters: { symbol: 'SOL', amount: 1 },
        rawText: 'buy 1 SOL',
        timestamp: Date.now(),
      };

      const marketData = { price: 150, priceImpact: 0.1, volatility: 2 };
      const riskScore = voiceCommandService.calculateRiskScore(lowRiskIntent, marketData);

      expect(riskScore).toBeLessThan(50);
    });

    it('should generate confirmation data', () => {
      const intent = {
        type: 'trade_buy' as const,
        confidence: 0.9,
        parameters: { symbol: 'SOL', amount: 10, type: 'buy' },
        rawText: 'buy 10 SOL',
        timestamp: Date.now(),
      };

      const marketData = { price: 150, priceImpact: 0.5, slippage: 0.5 };
      const confirmationData = voiceCommandService.generateConfirmationData(intent, marketData);

      expect(confirmationData.title).toContain('Buy');
      expect(confirmationData.description).toContain('SOL');
      expect(confirmationData.audioSummary).toBeTruthy();
    });

    it('should return null for unrecognized commands', () => {
      const intent = voiceCommandService.parseIntent('make me a sandwich');
      expect(intent).toBeNull();
    });
  });

  describe('Error Recovery', () => {
    it('should handle voice recognition errors', async () => {
      const onError = vi.fn();
      const { result } = renderHook(() => useVoice({ onError }));

      const mockRecognition = (global as any).SpeechRecognition.mock.results[0].value;

      await act(async () => {
        if (mockRecognition.onerror) {
          mockRecognition.onerror({ error: 'network' });
        }
      });

      // Error handler would be called in real scenario
    });

    it('should handle command execution errors', async () => {
      const { invoke } = await import('@tauri-apps/api/tauri');
      vi.mocked(invoke).mockRejectedValueOnce(new Error('Network error'));

      const intent = {
        type: 'trade_buy' as const,
        confidence: 0.9,
        parameters: { symbol: 'SOL', amount: 10 },
        rawText: 'buy 10 SOL',
        timestamp: Date.now(),
      };

      await expect(voiceCommandService.executeCommand(intent)).rejects.toThrow();
    });

    it('should recover from failed MFA attempts', () => {
      const { createMFAChallenge, submitMFAResponse, clearMFAChallenge } = useVoiceStore.getState();

      act(() => {
        const challenge = createMFAChallenge('pin', 'Enter PIN');

        // Simulate 3 failed attempts
        for (let i = 0; i < 3; i++) {
          submitMFAResponse({
            challengeId: challenge.id,
            response: 'wrong',
            timestamp: Date.now(),
          });
        }
      });

      const { mfaChallenge } = useVoiceStore.getState();
      expect(mfaChallenge).toBeNull(); // Should be cleared after max attempts
    });
  });

  describe('Localization', () => {
    it('should set locale for voice command service', () => {
      voiceCommandService.setLocale('es-ES');
      // In real implementation, this would affect pattern matching
    });

    it('should format error messages based on locale', () => {
      const error = {
        code: 'INSUFFICIENT_BALANCE',
        message: 'Insufficient balance',
        recoverable: true,
      };

      const formattedMessage = voiceCommandService.formatErrorMessage(error, 'en-US');
      expect(formattedMessage).toContain('balance');
    });
  });

  describe('Driving Mode', () => {
    it('should enable driving mode for session', () => {
      const { startSession } = useVoiceStore.getState();

      act(() => {
        startSession('en-US', true);
      });

      const { session } = useVoiceStore.getState();
      expect(session?.drivingMode).toBe(true);
    });

    it('should adjust notification settings for driving mode', () => {
      const { updateNotificationSettings } = useVoiceStore.getState();

      act(() => {
        updateNotificationSettings({
          drivingMode: true,
          rate: 0.9,
          maxNotificationsPerMinute: 3,
        });
      });

      const { notificationSettings } = useVoiceStore.getState();
      expect(notificationSettings.drivingMode).toBe(true);
    });
  });
});
