import { useEffect, useState, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bot,
  Send,
  Plus,
  Trash2,
  ThumbsUp,
  ThumbsDown,
  MessageSquare,
  Settings,
  Download,
  Zap,
  AlertTriangle,
  TrendingUp,
  Shield,
  Target,
  ChevronDown,
  ChevronUp,
  Sparkles,
  PlayCircle,
  PauseCircle,
  X,
} from 'lucide-react';
import { useAIChatStore, type CommandType } from '../store/aiChatStore';
import { RiskIndicator } from '../components/RiskIndicator';
import { Sentiment } from '../components/Sentiment';

export function AIAnalysis() {
  const {
    conversations,
    activeConversationId,
    isStreaming,
    quickActions,
    latestOptimization,
    patternWarnings,
    loading,
    error,
    createConversation,
    switchConversation,
    deleteConversation,
    sendMessage,
    streamMessage,
    addFeedback,
    addQuickAction,
    toggleQuickAction,
    deleteQuickAction,
    executeQuickAction,
    requestPortfolioOptimization,
    fetchPatternWarnings,
    dismissPatternWarning,
    getActiveConversation,
    exportConversation,
  } = useAIChatStore();

  const [inputMessage, setInputMessage] = useState('');
  const [selectedCommandType, setSelectedCommandType] = useState<CommandType | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(true);
  const [showPatternWarnings, setShowPatternWarnings] = useState(true);
  const [showOptimization, setShowOptimization] = useState(true);
  const [newQuickActionOpen, setNewQuickActionOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConversation = getActiveConversation();

  useEffect(() => {
    if (!activeConversationId && conversations.length === 0) {
      createConversation('AI Trading Assistant');
    }
  }, []);

  useEffect(() => {
    fetchPatternWarnings();
    const interval = setInterval(() => {
      fetchPatternWarnings();
    }, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, [fetchPatternWarnings]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation?.messages]);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isStreaming) return;

    const message = inputMessage;
    setInputMessage('');
    setShowSuggestions(false);

    await streamMessage(message, selectedCommandType || undefined);
    setSelectedCommandType(null);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const commandSuggestions: Array<{
    type: CommandType;
    label: string;
    icon: React.ReactNode;
    prompt: string;
  }> = [
    {
      type: 'analyze_risk',
      label: 'Analyze Risk',
      icon: <Shield className="w-4 h-4" />,
      prompt: 'Analyze the risk profile of my portfolio',
    },
    {
      type: 'optimize_portfolio',
      label: 'Optimize Portfolio',
      icon: <TrendingUp className="w-4 h-4" />,
      prompt: 'Suggest portfolio optimization strategies',
    },
    {
      type: 'pattern_recognition',
      label: 'Detect Patterns',
      icon: <Sparkles className="w-4 h-4" />,
      prompt: 'Detect trading patterns and anomalies',
    },
    {
      type: 'market_analysis',
      label: 'Market Analysis',
      icon: <TrendingUp className="w-4 h-4" />,
      prompt: 'Analyze current market conditions',
    },
    {
      type: 'trade_suggestion',
      label: 'Trade Ideas',
      icon: <Target className="w-4 h-4" />,
      prompt: 'Suggest profitable trading opportunities',
    },
    {
      type: 'set_quick_action',
      label: 'Quick Action',
      icon: <Zap className="w-4 h-4" />,
      prompt: 'Create a quick action rule',
    },
  ];

  const handleSuggestionClick = (suggestion: typeof commandSuggestions[0]) => {
    setInputMessage(suggestion.prompt);
    setSelectedCommandType(suggestion.type);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleFeedback = (messageId: string, score: number) => {
    addFeedback(messageId, score);
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-500/20 border-red-500 text-red-400';
      case 'high':
        return 'bg-orange-500/20 border-orange-500 text-orange-400';
      case 'medium':
        return 'bg-yellow-500/20 border-yellow-500 text-yellow-400';
      case 'low':
        return 'bg-blue-500/20 border-blue-500 text-blue-400';
      default:
        return 'bg-gray-500/20 border-gray-500 text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col lg:flex-row gap-4 p-4 overflow-hidden">
      {/* Main chat area */}
      <div className="flex-1 flex flex-col bg-gray-800 rounded-lg overflow-hidden">
        {/* Header */}
        <div className="bg-gray-900 p-4 flex items-center justify-between border-b border-gray-700">
          <div className="flex items-center gap-3">
            <Bot className="w-6 h-6 text-blue-400" />
            <div>
              <h2 className="text-lg font-semibold text-white">
                {activeConversation?.title || 'AI Assistant'}
              </h2>
              <p className="text-sm text-gray-400">
                {isStreaming ? 'Thinking...' : 'Ready to help'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSuggestions(!showSuggestions)}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="Show command suggestions"
            >
              <Sparkles className="w-5 h-5 text-purple-400" />
            </button>
            <button
              onClick={() => createConversation()}
              className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
              title="New conversation"
            >
              <Plus className="w-5 h-5 text-gray-400" />
            </button>
            {activeConversation && (
              <button
                onClick={() => {
                  const json = exportConversation(activeConversation.conversationId);
                  const blob = new Blob([json], { type: 'application/json' });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement('a');
                  a.href = url;
                  a.download = `conversation-${Date.now()}.json`;
                  a.click();
                }}
                className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                title="Export conversation"
              >
                <Download className="w-5 h-5 text-gray-400" />
              </button>
            )}
          </div>
        </div>

        {/* Command suggestions */}
        <AnimatePresence>
          {showSuggestions && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="bg-gray-900 border-b border-gray-700 overflow-hidden"
            >
              <div className="p-4">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Quick Commands</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {commandSuggestions.map(suggestion => (
                    <button
                      key={suggestion.type}
                      onClick={() => handleSuggestionClick(suggestion)}
                      className="flex items-center gap-2 p-3 bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors text-left"
                    >
                      <div className="text-blue-400">{suggestion.icon}</div>
                      <span className="text-sm text-gray-300">{suggestion.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {!activeConversation || activeConversation.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-md">
                <Bot className="w-16 h-16 text-blue-400 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-white mb-2">
                  Welcome to AI Trading Assistant
                </h3>
                <p className="text-gray-400 mb-6">
                  Ask me about market analysis, risk assessment, portfolio optimization, or set up
                  quick actions for automated trading.
                </p>
                <button
                  onClick={() => setShowSuggestions(true)}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  View Command Suggestions
                </button>
              </div>
            </div>
          ) : (
            <>
              {activeConversation.messages.map(message => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
                >
                  <div
                    className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      message.role === 'user'
                        ? 'bg-blue-600'
                        : 'bg-gradient-to-br from-purple-600 to-blue-600'
                    }`}
                  >
                    {message.role === 'user' ? (
                      <span className="text-sm font-medium">U</span>
                    ) : (
                      <Bot className="w-5 h-5" />
                    )}
                  </div>
                  <div className={`flex-1 ${message.role === 'user' ? 'flex justify-end' : ''}`}>
                    <div
                      className={`inline-block max-w-[80%] rounded-lg p-4 ${
                        message.role === 'user'
                          ? 'bg-blue-600 text-white'
                          : 'bg-gray-700 text-gray-100'
                      }`}
                    >
                      <div className="whitespace-pre-wrap">{message.content}</div>

                      {message.reasoning && message.reasoning.length > 0 && (
                        <details className="mt-3 pt-3 border-t border-gray-600">
                          <summary className="cursor-pointer text-sm text-gray-400 hover:text-gray-300 mb-2">
                            View reasoning ({message.reasoning.length} steps)
                          </summary>
                          <div className="space-y-2 mt-2">
                            {message.reasoning.map(step => (
                              <div key={step.step} className="text-sm">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="font-medium text-blue-400">
                                    Step {step.step}
                                  </span>
                                  <span className="text-xs text-gray-500">
                                    Confidence: {(step.confidence * 100).toFixed(0)}%
                                  </span>
                                </div>
                                <p className="text-gray-300">{step.description}</p>
                              </div>
                            ))}
                          </div>
                        </details>
                      )}

                      {message.role === 'assistant' && (
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-600">
                          <span className="text-xs text-gray-400">Was this helpful?</span>
                          <button
                            onClick={() => handleFeedback(message.id, 1)}
                            className={`p-1 rounded transition-colors ${
                              message.feedbackScore === 1
                                ? 'bg-green-600 text-white'
                                : 'hover:bg-gray-600 text-gray-400'
                            }`}
                          >
                            <ThumbsUp className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleFeedback(message.id, -1)}
                            className={`p-1 rounded transition-colors ${
                              message.feedbackScore === -1
                                ? 'bg-red-600 text-white'
                                : 'hover:bg-gray-600 text-gray-400'
                            }`}
                          >
                            <ThumbsDown className="w-4 h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </>
          )}
        </div>

        {/* Input area */}
        <div className="bg-gray-900 p-4 border-t border-gray-700">
          {selectedCommandType && (
            <div className="mb-2 flex items-center gap-2">
              <span className="text-xs text-gray-400">Command:</span>
              <span className="text-xs bg-blue-600 px-2 py-1 rounded">
                {commandSuggestions.find(s => s.type === selectedCommandType)?.label}
              </span>
              <button
                onClick={() => setSelectedCommandType(null)}
                className="text-xs text-gray-400 hover:text-gray-300"
              >
                ×
              </button>
            </div>
          )}
          {error && (
            <div className="mb-2 p-2 bg-red-500/20 border border-red-500 rounded text-sm text-red-400">
              {error}
            </div>
          )}
          <div className="flex gap-2">
            <textarea
              ref={inputRef}
              value={inputMessage}
              onChange={e => setInputMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask me anything about your portfolio, market trends, or trading strategies..."
              className="flex-1 bg-gray-800 text-white rounded-lg px-4 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={2}
              disabled={isStreaming}
            />
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || isStreaming}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-700 disabled:cursor-not-allowed rounded-lg transition-colors"
            >
              {isStreaming ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <Bot className="w-5 h-5" />
                </motion.div>
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Sidebar - Quick Actions, Pattern Warnings, Risk */}
      <div className="w-full lg:w-96 flex flex-col gap-4 overflow-y-auto">
        {/* Quick Actions */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div
            className="bg-gray-900 p-4 flex items-center justify-between cursor-pointer"
            onClick={() => setShowQuickActions(!showQuickActions)}
          >
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-white">Quick Actions</h3>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">{quickActions.length}</span>
            </div>
            {showQuickActions ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <AnimatePresence>
            {showQuickActions && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-2">
                  {quickActions.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No quick actions set. Ask the AI to create one!
                    </p>
                  ) : (
                    quickActions.map(action => (
                      <div
                        key={action.id}
                        className="bg-gray-700 p-3 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span
                              className={`text-xs px-2 py-1 rounded ${
                                action.type === 'buy'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {action.type.toUpperCase()}
                            </span>
                            <span className="text-sm font-medium text-white">{action.token}</span>
                          </div>
                          <p className="text-xs text-gray-400">{action.condition}</p>
                        </div>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => toggleQuickAction(action.id)}
                            className={`p-1 rounded transition-colors ${
                              action.enabled
                                ? 'text-green-400 hover:bg-gray-600'
                                : 'text-gray-500 hover:bg-gray-600'
                            }`}
                            title={action.enabled ? 'Enabled' : 'Disabled'}
                          >
                            {action.enabled ? (
                              <PlayCircle className="w-4 h-4" />
                            ) : (
                              <PauseCircle className="w-4 h-4" />
                            )}
                          </button>
                          <button
                            onClick={() => deleteQuickAction(action.id)}
                            className="p-1 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Pattern Warnings */}
        <div className="bg-gray-800 rounded-lg overflow-hidden">
          <div
            className="bg-gray-900 p-4 flex items-center justify-between cursor-pointer"
            onClick={() => setShowPatternWarnings(!showPatternWarnings)}
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-orange-400" />
              <h3 className="font-semibold text-white">Pattern Warnings</h3>
              <span className="text-xs bg-gray-700 px-2 py-1 rounded">
                {patternWarnings.length}
              </span>
            </div>
            {showPatternWarnings ? (
              <ChevronUp className="w-5 h-5 text-gray-400" />
            ) : (
              <ChevronDown className="w-5 h-5 text-gray-400" />
            )}
          </div>
          <AnimatePresence>
            {showPatternWarnings && (
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: 'auto' }}
                exit={{ height: 0 }}
                className="overflow-hidden"
              >
                <div className="p-4 space-y-2">
                  {patternWarnings.length === 0 ? (
                    <p className="text-sm text-gray-400 text-center py-4">
                      No pattern warnings detected
                    </p>
                  ) : (
                    patternWarnings.map(warning => (
                      <div
                        key={warning.id}
                        className={`border-l-4 p-3 rounded-r-lg ${getSeverityColor(
                          warning.severity
                        )}`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <h4 className="font-medium text-sm">{warning.pattern}</h4>
                          <button
                            onClick={() => dismissPatternWarning(warning.id)}
                            className="text-gray-400 hover:text-white"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                        <p className="text-xs mb-2">{warning.description}</p>
                        <div className="text-xs opacity-80">
                          <strong>Recommendation:</strong> {warning.recommendation}
                        </div>
                        {warning.tokens.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {warning.tokens.map(token => (
                              <span
                                key={token}
                                className="text-xs px-2 py-1 bg-gray-700 rounded"
                              >
                                {token}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Portfolio Optimization */}
        {latestOptimization && (
          <div className="bg-gray-800 rounded-lg overflow-hidden">
            <div
              className="bg-gray-900 p-4 flex items-center justify-between cursor-pointer"
              onClick={() => setShowOptimization(!showOptimization)}
            >
              <div className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-green-400" />
                <h3 className="font-semibold text-white">Portfolio Optimization</h3>
              </div>
              {showOptimization ? (
                <ChevronUp className="w-5 h-5 text-gray-400" />
              ) : (
                <ChevronDown className="w-5 h-5 text-gray-400" />
              )}
            </div>
            <AnimatePresence>
              {showOptimization && (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: 'auto' }}
                  exit={{ height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="p-4">
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div>
                        <p className="text-xs text-gray-400">Expected Return</p>
                        <p className="text-lg font-semibold text-green-400">
                          +{latestOptimization.expectedReturn.toFixed(2)}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Risk Score</p>
                        <p className="text-lg font-semibold text-orange-400">
                          {latestOptimization.riskScore.toFixed(1)}
                        </p>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium text-gray-300">Suggested Actions</h4>
                      {latestOptimization.actions.map((action, idx) => (
                        <div key={idx} className="bg-gray-700 p-2 rounded text-xs">
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`px-2 py-1 rounded ${
                                action.type === 'buy'
                                  ? 'bg-green-500/20 text-green-400'
                                  : 'bg-red-500/20 text-red-400'
                              }`}
                            >
                              {action.type.toUpperCase()}
                            </span>
                            <span className="text-white font-medium">
                              {action.token} ({action.amount})
                            </span>
                          </div>
                          <p className="text-gray-400">{action.reason}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Risk & Sentiment */}
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm font-semibold text-white mb-3 flex items-center gap-2">
            <Shield className="w-4 h-4 text-blue-400" />
            Risk Analysis
          </h3>
          <RiskIndicator />
        </div>

        <div className="bg-gray-800 rounded-lg">
          <Sentiment />
        </div>
      </div>
    </div>
  );
}
