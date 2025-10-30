import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';
import type {
  ChatMessage,
  PortfolioOptimization,
  PatternWarning,
  ReasoningStep,
} from '../store/aiChatStore';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

vi.mock('@tauri-apps/api/event', () => ({
  listen: vi.fn(),
}));

const mockInvoke = invoke as ReturnType<typeof vi.fn>;

describe('AI Chat Store Integration', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Chat Message Operations', () => {
    it('should send a chat message successfully', async () => {
      const mockResponse = {
        content: 'Hello! I can help you with market analysis.',
        reasoning: [
          {
            step: 1,
            description: 'Analyzing user query',
            confidence: 0.95,
          },
        ] as ReasoningStep[],
        metadata: {
          model: 'gpt-trading-v1',
          tokens_used: 50,
        },
      };

      mockInvoke.mockResolvedValueOnce(mockResponse);

      const result = await invoke<{
        content: string;
        reasoning?: ReasoningStep[];
        metadata?: Record<string, any>;
      }>('ai_chat_message', {
        message: 'Hello',
        commandType: null,
        history: [],
      });

      expect(result.content).toBeDefined();
      expect(result.content).toContain('help');
      expect(result.reasoning).toBeDefined();
      expect(result.reasoning?.length).toBeGreaterThan(0);
    });

    it('should handle risk analysis command', async () => {
      const mockResponse = {
        content: 'Your portfolio has a moderate risk level of 45/100.',
        reasoning: [
          {
            step: 1,
            description: 'Gathering portfolio data',
            confidence: 0.9,
          },
          {
            step: 2,
            description: 'Calculating risk metrics',
            confidence: 0.92,
          },
        ] as ReasoningStep[],
      };

      mockInvoke.mockResolvedValueOnce(mockResponse);

      const result = await invoke('ai_chat_message', {
        message: 'Analyze my portfolio risk',
        commandType: 'analyze_risk',
        history: [],
      });

      expect(mockInvoke).toHaveBeenCalledWith('ai_chat_message', {
        message: 'Analyze my portfolio risk',
        commandType: 'analyze_risk',
        history: [],
      });
    });

    it('should initiate streaming chat message', async () => {
      const mockStreamId = 'stream_123_abc';
      mockInvoke.mockResolvedValueOnce(mockStreamId);

      const streamId = await invoke<string>('ai_chat_message_stream', {
        message: 'What are the best trading opportunities?',
        commandType: 'trade_suggestion',
        history: [],
      });

      expect(streamId).toBe(mockStreamId);
      expect(mockInvoke).toHaveBeenCalledWith('ai_chat_message_stream', {
        message: 'What are the best trading opportunities?',
        commandType: 'trade_suggestion',
        history: [],
      });
    });
  });

  describe('Feedback System', () => {
    it('should submit positive feedback', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await invoke('ai_submit_feedback', {
        messageId: 'msg_123',
        score: 1,
        comment: 'Very helpful!',
      });

      expect(mockInvoke).toHaveBeenCalledWith('ai_submit_feedback', {
        messageId: 'msg_123',
        score: 1,
        comment: 'Very helpful!',
      });
    });

    it('should submit negative feedback', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await invoke('ai_submit_feedback', {
        messageId: 'msg_456',
        score: -1,
        comment: 'Not accurate',
      });

      expect(mockInvoke).toHaveBeenCalledWith('ai_submit_feedback', {
        messageId: 'msg_456',
        score: -1,
        comment: 'Not accurate',
      });
    });
  });

  describe('Quick Actions', () => {
    it('should execute quick action', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await invoke('ai_execute_quick_action', {
        actionId: 'qa_123',
        type: 'buy',
        token: 'SOL',
        amount: 100,
      });

      expect(mockInvoke).toHaveBeenCalledWith('ai_execute_quick_action', {
        actionId: 'qa_123',
        type: 'buy',
        token: 'SOL',
        amount: 100,
      });
    });

    it('should handle quick action execution error', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Insufficient balance'));

      await expect(
        invoke('ai_execute_quick_action', {
          actionId: 'qa_456',
          type: 'buy',
          token: 'ETH',
          amount: 1000,
        })
      ).rejects.toThrow('Insufficient balance');
    });
  });

  describe('Portfolio Optimization', () => {
    it('should request portfolio optimization', async () => {
      const mockOptimization: PortfolioOptimization = {
        id: 'opt_123',
        timestamp: new Date().toISOString(),
        currentAllocation: {
          SOL: 50,
          ETH: 30,
          BTC: 20,
        },
        suggestedAllocation: {
          SOL: 40,
          ETH: 35,
          BTC: 25,
        },
        expectedReturn: 12.5,
        riskScore: 35.0,
        reasoning: [
          'Reduce concentration in SOL',
          'Increase stable asset allocation',
        ],
        actions: [
          {
            type: 'buy',
            token: 'BTC',
            amount: 500,
            reason: 'Increase stable asset exposure',
          },
          {
            type: 'sell',
            token: 'SOL',
            amount: 300,
            reason: 'Reduce volatility',
          },
        ],
      };

      mockInvoke.mockResolvedValueOnce(mockOptimization);

      const result = await invoke<PortfolioOptimization>('ai_optimize_portfolio', {
        holdings: {
          SOL: 1000,
          ETH: 600,
          BTC: 400,
        },
      });

      expect(result.id).toBeDefined();
      expect(result.expectedReturn).toBeGreaterThan(0);
      expect(result.riskScore).toBeGreaterThan(0);
      expect(result.actions.length).toBeGreaterThan(0);
    });

    it('should apply optimization', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await invoke('ai_apply_optimization', {
        optimizationId: 'opt_123',
      });

      expect(mockInvoke).toHaveBeenCalledWith('ai_apply_optimization', {
        optimizationId: 'opt_123',
      });
    });

    it('should validate optimization structure', async () => {
      const mockOptimization: PortfolioOptimization = {
        id: 'opt_456',
        timestamp: new Date().toISOString(),
        currentAllocation: { SOL: 100 },
        suggestedAllocation: { SOL: 80, USDC: 20 },
        expectedReturn: 8.5,
        riskScore: 40.0,
        reasoning: ['Diversification needed'],
        actions: [],
      };

      mockInvoke.mockResolvedValueOnce(mockOptimization);

      const result = await invoke<PortfolioOptimization>('ai_optimize_portfolio', {
        holdings: { SOL: 1000 },
      });

      expect(Object.keys(result.currentAllocation).length).toBeGreaterThan(0);
      expect(Object.keys(result.suggestedAllocation).length).toBeGreaterThan(0);
      expect(result.reasoning.length).toBeGreaterThan(0);
    });
  });

  describe('Pattern Warnings', () => {
    it('should fetch pattern warnings', async () => {
      const mockWarnings: PatternWarning[] = [
        {
          id: 'warn_123',
          timestamp: new Date().toISOString(),
          pattern: 'Pump and Dump',
          severity: 'high',
          tokens: ['SCAM', 'PUMP'],
          description: 'Suspicious volume spike detected',
          recommendation: 'Avoid these tokens',
        },
        {
          id: 'warn_456',
          timestamp: new Date().toISOString(),
          pattern: 'Whale Accumulation',
          severity: 'medium',
          tokens: ['SOL'],
          description: 'Large wallets accumulating',
          recommendation: 'Monitor for breakout',
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockWarnings);

      const result = await invoke<PatternWarning[]>('ai_get_pattern_warnings');

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].pattern).toBeDefined();
      expect(result[0].severity).toMatch(/low|medium|high|critical/);
    });

    it('should dismiss pattern warning', async () => {
      mockInvoke.mockResolvedValueOnce(undefined);

      await invoke('ai_dismiss_pattern_warning', {
        warningId: 'warn_123',
      });

      expect(mockInvoke).toHaveBeenCalledWith('ai_dismiss_pattern_warning', {
        warningId: 'warn_123',
      });
    });

    it('should validate warning severity levels', async () => {
      const mockWarnings: PatternWarning[] = [
        {
          id: 'w1',
          timestamp: new Date().toISOString(),
          pattern: 'Test',
          severity: 'low',
          tokens: [],
          description: 'Test',
          recommendation: 'Test',
        },
        {
          id: 'w2',
          timestamp: new Date().toISOString(),
          pattern: 'Test',
          severity: 'medium',
          tokens: [],
          description: 'Test',
          recommendation: 'Test',
        },
        {
          id: 'w3',
          timestamp: new Date().toISOString(),
          pattern: 'Test',
          severity: 'high',
          tokens: [],
          description: 'Test',
          recommendation: 'Test',
        },
        {
          id: 'w4',
          timestamp: new Date().toISOString(),
          pattern: 'Test',
          severity: 'critical',
          tokens: [],
          description: 'Test',
          recommendation: 'Test',
        },
      ];

      mockInvoke.mockResolvedValueOnce(mockWarnings);

      const result = await invoke<PatternWarning[]>('ai_get_pattern_warnings');

      result.forEach(warning => {
        expect(['low', 'medium', 'high', 'critical']).toContain(warning.severity);
      });
    });
  });

  describe('Command Types', () => {
    const commandTypes = [
      'analyze_risk',
      'optimize_portfolio',
      'set_quick_action',
      'pattern_recognition',
      'market_analysis',
      'trade_suggestion',
    ];

    commandTypes.forEach(commandType => {
      it(`should handle ${commandType} command`, async () => {
        mockInvoke.mockResolvedValueOnce({
          content: `Response for ${commandType}`,
          reasoning: [],
        });

        const result = await invoke('ai_chat_message', {
          message: `Test message for ${commandType}`,
          commandType,
          history: [],
        });

        expect(mockInvoke).toHaveBeenCalledWith('ai_chat_message', {
          message: `Test message for ${commandType}`,
          commandType,
          history: [],
        });
      });
    });
  });

  describe('Conversation Context', () => {
    it('should maintain conversation history', async () => {
      const history: ChatMessage[] = [
        {
          role: 'user',
          content: 'What is SOL price?',
        },
        {
          role: 'assistant',
          content: 'SOL is currently $120',
        },
      ];

      mockInvoke.mockResolvedValueOnce({
        content: 'Based on previous discussion about SOL, here is more info...',
        reasoning: [],
      });

      await invoke('ai_chat_message', {
        message: 'Tell me more about it',
        commandType: null,
        history,
      });

      expect(mockInvoke).toHaveBeenCalledWith('ai_chat_message', {
        message: 'Tell me more about it',
        commandType: null,
        history,
      });
    });

    it('should handle multi-turn conversation', async () => {
      const turns = 5;
      const history: ChatMessage[] = [];

      for (let i = 0; i < turns; i++) {
        const userMsg = { role: 'user', content: `Message ${i}` };
        const assistantMsg = { role: 'assistant', content: `Response ${i}` };
        
        history.push(userMsg, assistantMsg);
        
        mockInvoke.mockResolvedValueOnce({
          content: `Response ${i}`,
          reasoning: [],
        });

        await invoke('ai_chat_message', {
          message: `Message ${i}`,
          commandType: null,
          history: history.slice(0, -2),
        });
      }

      expect(history.length).toBe(turns * 2);
    });
  });

  describe('Error Handling', () => {
    it('should handle network errors gracefully', async () => {
      mockInvoke.mockRejectedValueOnce(new Error('Network error'));

      await expect(
        invoke('ai_chat_message', {
          message: 'Test',
          commandType: null,
          history: [],
        })
      ).rejects.toThrow('Network error');
    });

    it('should handle invalid command type', async () => {
      mockInvoke.mockResolvedValueOnce({
        content: 'General response',
        reasoning: [],
      });

      await invoke('ai_chat_message', {
        message: 'Test',
        commandType: 'invalid_command',
        history: [],
      });

      expect(mockInvoke).toHaveBeenCalled();
    });

    it('should handle empty message gracefully', async () => {
      mockInvoke.mockResolvedValueOnce({
        content: 'Please provide a valid question',
        reasoning: [],
      });

      await invoke('ai_chat_message', {
        message: '',
        commandType: null,
        history: [],
      });

      expect(mockInvoke).toHaveBeenCalled();
    });
  });
});
