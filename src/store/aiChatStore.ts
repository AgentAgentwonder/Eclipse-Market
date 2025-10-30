import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { invoke } from '@tauri-apps/api/tauri';
import { listen } from '@tauri-apps/api/event';

export type MessageRole = 'user' | 'assistant' | 'system';

export type CommandType = 
  | 'analyze_risk'
  | 'optimize_portfolio'
  | 'set_quick_action'
  | 'pattern_recognition'
  | 'market_analysis'
  | 'trade_suggestion';

export interface QuickAction {
  id: string;
  type: 'buy' | 'sell';
  condition: string;
  token: string;
  amount?: number;
  enabled: boolean;
  createdAt: string;
}

export interface ReasoningStep {
  step: number;
  description: string;
  confidence: number;
}

export interface ChatMessage {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: string;
  commandType?: CommandType;
  reasoning?: ReasoningStep[];
  metadata?: Record<string, any>;
  feedbackScore?: number; // -1 (negative), 0 (neutral), 1 (positive)
  feedbackComment?: string;
}

export interface ConversationContext {
  conversationId: string;
  messages: ChatMessage[];
  createdAt: string;
  lastActivity: string;
  title: string;
}

export interface PortfolioOptimization {
  id: string;
  timestamp: string;
  currentAllocation: Record<string, number>;
  suggestedAllocation: Record<string, number>;
  expectedReturn: number;
  riskScore: number;
  reasoning: string[];
  actions: Array<{
    type: 'buy' | 'sell';
    token: string;
    amount: number;
    reason: string;
  }>;
}

export interface PatternWarning {
  id: string;
  timestamp: string;
  pattern: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  tokens: string[];
  description: string;
  recommendation: string;
}

interface AIChatState {
  // Conversation management
  conversations: ConversationContext[];
  activeConversationId: string | null;
  isStreaming: boolean;
  streamingMessageId: string | null;

  // Quick actions
  quickActions: QuickAction[];

  // Portfolio optimization
  latestOptimization: PortfolioOptimization | null;
  optimizationHistory: PortfolioOptimization[];

  // Pattern warnings
  patternWarnings: PatternWarning[];

  // Loading/error states
  loading: boolean;
  error: string | null;

  // Actions
  createConversation: (title?: string) => string;
  switchConversation: (conversationId: string) => void;
  deleteConversation: (conversationId: string) => void;
  sendMessage: (content: string, commandType?: CommandType) => Promise<void>;
  streamMessage: (content: string, commandType?: CommandType) => Promise<void>;
  addFeedback: (messageId: string, score: number, comment?: string) => void;
  clearConversations: () => void;
  
  // Quick actions
  addQuickAction: (action: Omit<QuickAction, 'id' | 'createdAt'>) => void;
  toggleQuickAction: (actionId: string) => void;
  deleteQuickAction: (actionId: string) => void;
  executeQuickAction: (actionId: string) => Promise<void>;

  // Portfolio optimization
  requestPortfolioOptimization: (holdings: Record<string, number>) => Promise<void>;
  applyOptimization: (optimizationId: string) => Promise<void>;

  // Pattern recognition
  fetchPatternWarnings: () => Promise<void>;
  dismissPatternWarning: (warningId: string) => void;

  // Utility
  getActiveConversation: () => ConversationContext | null;
  exportConversation: (conversationId: string) => string;
}

export const useAIChatStore = create<AIChatState>()(
  persist(
    (set, get) => ({
      conversations: [],
      activeConversationId: null,
      isStreaming: false,
      streamingMessageId: null,
      quickActions: [],
      latestOptimization: null,
      optimizationHistory: [],
      patternWarnings: [],
      loading: false,
      error: null,

      createConversation: (title = 'New Conversation') => {
        const conversationId = `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const newConversation: ConversationContext = {
          conversationId,
          messages: [],
          createdAt: new Date().toISOString(),
          lastActivity: new Date().toISOString(),
          title,
        };

        set(state => ({
          conversations: [...state.conversations, newConversation],
          activeConversationId: conversationId,
        }));

        return conversationId;
      },

      switchConversation: (conversationId: string) => {
        set({ activeConversationId: conversationId });
      },

      deleteConversation: (conversationId: string) => {
        set(state => {
          const filtered = state.conversations.filter(c => c.conversationId !== conversationId);
          const newActiveId = 
            state.activeConversationId === conversationId && filtered.length > 0
              ? filtered[filtered.length - 1].conversationId
              : state.activeConversationId;

          return {
            conversations: filtered,
            activeConversationId: newActiveId,
          };
        });
      },

      sendMessage: async (content: string, commandType?: CommandType) => {
        const state = get();
        let conversationId = state.activeConversationId;

        // Create conversation if none exists
        if (!conversationId) {
          conversationId = get().createConversation();
        }

        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
          commandType,
        };

        // Add user message
        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.conversationId === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, userMessage],
                  lastActivity: new Date().toISOString(),
                }
              : conv
          ),
          loading: true,
          error: null,
        }));

        try {
          // Get conversation history for context
          const conversation = get().conversations.find(c => c.conversationId === conversationId);
          const history = conversation?.messages.map(m => ({
            role: m.role,
            content: m.content,
          })) || [];

          // Call Tauri backend
          const response = await invoke<{
            content: string;
            reasoning?: ReasoningStep[];
            metadata?: Record<string, any>;
          }>('ai_chat_message', {
            message: content,
            commandType: commandType || null,
            history,
          });

          const assistantMessage: ChatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            role: 'assistant',
            content: response.content,
            timestamp: new Date().toISOString(),
            reasoning: response.reasoning,
            metadata: response.metadata,
          };

          set(state => ({
            conversations: state.conversations.map(conv =>
              conv.conversationId === conversationId
                ? {
                    ...conv,
                    messages: [...conv.messages, assistantMessage],
                    lastActivity: new Date().toISOString(),
                  }
                : conv
            ),
            loading: false,
          }));
        } catch (error) {
          set({ error: String(error), loading: false });
        }
      },

      streamMessage: async (content: string, commandType?: CommandType) => {
        const state = get();
        let conversationId = state.activeConversationId;

        if (!conversationId) {
          conversationId = get().createConversation();
        }

        const userMessage: ChatMessage = {
          id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          role: 'user',
          content,
          timestamp: new Date().toISOString(),
          commandType,
        };

        const assistantMessageId = `msg_${Date.now() + 1}_${Math.random().toString(36).substr(2, 9)}`;
        const assistantMessage: ChatMessage = {
          id: assistantMessageId,
          role: 'assistant',
          content: '',
          timestamp: new Date().toISOString(),
        };

        set(state => ({
          conversations: state.conversations.map(conv =>
            conv.conversationId === conversationId
              ? {
                  ...conv,
                  messages: [...conv.messages, userMessage, assistantMessage],
                  lastActivity: new Date().toISOString(),
                }
              : conv
          ),
          isStreaming: true,
          streamingMessageId: assistantMessageId,
          error: null,
        }));

        try {
          const conversation = get().conversations.find(c => c.conversationId === conversationId);
          const history = conversation?.messages
            .filter(m => m.id !== assistantMessageId)
            .map(m => ({ role: m.role, content: m.content })) || [];

          const streamId = await invoke<string>('ai_chat_message_stream', {
            message: content,
            commandType: commandType || null,
            history,
          });

          const unlisten = await listen<{
            chunk?: string;
            done?: boolean;
            error?: string;
            reasoning?: ReasoningStep[];
            metadata?: Record<string, any>;
          }>(`ai:chat:${streamId}`, event => {
            const payload = event.payload;
            if (payload.error) {
              set({ error: payload.error, isStreaming: false, streamingMessageId: null });
              unlisten();
              return;
            }

            if (payload.chunk) {
              set(state => ({
                conversations: state.conversations.map(conv =>
                  conv.conversationId === conversationId
                    ? {
                        ...conv,
                        messages: conv.messages.map(msg =>
                          msg.id === assistantMessageId
                            ? { ...msg, content: msg.content + payload.chunk }
                            : msg
                        ),
                      }
                    : conv
                ),
              }));
            }

            if (payload.done) {
              set(state => ({
                isStreaming: false,
                streamingMessageId: null,
                conversations: state.conversations.map(conv =>
                  conv.conversationId === conversationId
                    ? {
                        ...conv,
                        messages: conv.messages.map(msg =>
                          msg.id === assistantMessageId
                            ? {
                                ...msg,
                                reasoning: payload.reasoning ?? msg.reasoning,
                                metadata: payload.metadata ?? msg.metadata,
                              }
                            : msg
                        ),
                      }
                    : conv
                ),
              }));
              unlisten();
            }
          });
        } catch (error) {
          set({ error: String(error), isStreaming: false, streamingMessageId: null });
        }
      },

      addFeedback: (messageId: string, score: number, comment?: string) => {
        set(state => ({
          conversations: state.conversations.map(conv => ({
            ...conv,
            messages: conv.messages.map(msg =>
              msg.id === messageId
                ? { ...msg, feedbackScore: score, feedbackComment: comment }
                : msg
            ),
          })),
        }));

        // Send feedback to backend for learning
        invoke('ai_submit_feedback', {
          messageId,
          score,
          comment: comment || '',
        }).catch(err => console.error('Failed to submit feedback:', err));
      },

      clearConversations: () => {
        set({ conversations: [], activeConversationId: null });
      },

      addQuickAction: (action) => {
        const newAction: QuickAction = {
          ...action,
          id: `qa_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
        };

        set(state => ({
          quickActions: [...state.quickActions, newAction],
        }));
      },

      toggleQuickAction: (actionId: string) => {
        set(state => ({
          quickActions: state.quickActions.map(action =>
            action.id === actionId ? { ...action, enabled: !action.enabled } : action
          ),
        }));
      },

      deleteQuickAction: (actionId: string) => {
        set(state => ({
          quickActions: state.quickActions.filter(action => action.id !== actionId),
        }));
      },

      executeQuickAction: async (actionId: string) => {
        const action = get().quickActions.find(a => a.id === actionId);
        if (!action) return;

        try {
          await invoke('ai_execute_quick_action', {
            actionId: action.id,
            type: action.type,
            token: action.token,
            amount: action.amount || null,
          });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      requestPortfolioOptimization: async (holdings: Record<string, number>) => {
        set({ loading: true, error: null });

        try {
          const optimization = await invoke<PortfolioOptimization>(
            'ai_optimize_portfolio',
            { holdings }
          );

          set(state => ({
            latestOptimization: optimization,
            optimizationHistory: [optimization, ...state.optimizationHistory].slice(0, 10),
            loading: false,
          }));
        } catch (error) {
          set({ error: String(error), loading: false });
        }
      },

      applyOptimization: async (optimizationId: string) => {
        const optimization = get().optimizationHistory.find(opt => opt.id === optimizationId);
        if (!optimization) return;

        try {
          await invoke('ai_apply_optimization', { optimizationId });
        } catch (error) {
          set({ error: String(error) });
        }
      },

      fetchPatternWarnings: async () => {
        set({ loading: true, error: null });

        try {
          const warnings = await invoke<PatternWarning[]>('ai_get_pattern_warnings');
          set({ patternWarnings: warnings, loading: false });
        } catch (error) {
          set({ error: String(error), loading: false });
        }
      },

      dismissPatternWarning: (warningId: string) => {
        set(state => ({
          patternWarnings: state.patternWarnings.filter(w => w.id !== warningId),
        }));

        invoke('ai_dismiss_pattern_warning', { warningId }).catch(err =>
          console.error('Failed to dismiss warning:', err)
        );
      },

      getActiveConversation: () => {
        const state = get();
        return (
          state.conversations.find(c => c.conversationId === state.activeConversationId) || null
        );
      },

      exportConversation: (conversationId: string) => {
        const conversation = get().conversations.find(c => c.conversationId === conversationId);
        if (!conversation) return '';

        return JSON.stringify(conversation, null, 2);
      },
    }),
    {
      name: 'ai-chat-storage',
      version: 1,
      partialize: state => ({
        conversations: state.conversations,
        activeConversationId: state.activeConversationId,
        quickActions: state.quickActions,
        optimizationHistory: state.optimizationHistory.slice(0, 5),
      }),
    }
  )
);
