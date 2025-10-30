import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Mic,
  Shield,
  Volume2,
} from 'lucide-react';
import { VoiceCommand } from '../../types/voice';

interface VoiceConfirmationModalProps {
  command: VoiceCommand;
  onConfirm: () => void;
  onCancel: () => void;
  onMFASubmit?: (pin: string) => Promise<boolean>;
}

export function VoiceConfirmationModal({
  command,
  onConfirm,
  onCancel,
  onMFASubmit,
}: VoiceConfirmationModalProps) {
  const [mfaPin, setMfaPin] = useState('');
  const [mfaError, setMfaError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const confirmationData = command.confirmationData;

  const speak = useCallback((text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      window.speechSynthesis.speak(utterance);
    }
  }, []);

  useEffect(() => {
    // Listen for voice confirmation
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.key === 'y' || e.key === 'Y') {
        if (command.requiresMFA) {
          speak('Please enter your PIN for authentication');
        } else {
          onConfirm();
        }
      } else if (e.key === 'n' || e.key === 'N' || e.key === 'Escape') {
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [command.requiresMFA, onConfirm, onCancel, speak]);

  const handleMFASubmit = async () => {
    if (!onMFASubmit || !mfaPin) return;

    setIsSubmitting(true);
    setMfaError('');

    try {
      const isValid = await onMFASubmit(mfaPin);
      if (isValid) {
        onConfirm();
      } else {
        setMfaError('Invalid PIN. Please try again.');
        setMfaPin('');
        speak('Invalid PIN. Please try again.');
      }
    } catch (error: any) {
      setMfaError(error.message || 'Authentication failed');
      speak('Authentication failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!confirmationData) return null;

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical':
        return 'text-red-500';
      case 'high':
        return 'text-orange-500';
      case 'medium':
        return 'text-yellow-500';
      default:
        return 'text-green-500';
    }
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative max-w-lg w-full mx-4 bg-gray-900 rounded-2xl shadow-2xl border border-gray-700"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-500/20 rounded-lg">
                <Mic className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">
                  {confirmationData.title}
                </h3>
                <p className="text-sm text-gray-400">{command.intent.type}</p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Description */}
            <div className="p-4 bg-gray-800/50 rounded-lg">
              <p className="text-white font-medium">{confirmationData.description}</p>
              {confirmationData.summary && (
                <p className="text-sm text-gray-400 mt-2">{confirmationData.summary}</p>
              )}
            </div>

            {/* Risk Warnings */}
            {confirmationData.riskWarnings.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-orange-400">
                  <AlertTriangle className="w-4 h-4" />
                  <span className="text-sm font-medium">Risk Warnings</span>
                </div>
                <div className="space-y-2">
                  {confirmationData.riskWarnings.map((warning, idx) => (
                    <div
                      key={idx}
                      className="flex items-start space-x-2 text-sm text-gray-300 p-2 bg-orange-500/10 rounded"
                    >
                      <span className="text-orange-400 mt-0.5">•</span>
                      <span>{warning}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Estimated Costs */}
            <div className="grid grid-cols-2 gap-3">
              {confirmationData.estimatedCost && (
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Estimated Cost</div>
                  <div className="text-white font-medium">
                    ${confirmationData.estimatedCost.amount.toFixed(2)}
                  </div>
                </div>
              )}
              {confirmationData.estimatedGas && (
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Network Fee</div>
                  <div className="text-white font-medium">
                    {confirmationData.estimatedGas.amount} {confirmationData.estimatedGas.currency}
                  </div>
                </div>
              )}
              {confirmationData.priceImpact !== undefined && (
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Price Impact</div>
                  <div
                    className={`font-medium ${
                      confirmationData.priceImpact > 2 ? 'text-red-400' : 'text-green-400'
                    }`}
                  >
                    {confirmationData.priceImpact.toFixed(2)}%
                  </div>
                </div>
              )}
              {confirmationData.slippage !== undefined && (
                <div className="p-3 bg-gray-800/50 rounded-lg">
                  <div className="text-xs text-gray-400 mb-1">Slippage</div>
                  <div className="text-white font-medium">{confirmationData.slippage}%</div>
                </div>
              )}
            </div>

            {/* Risk Level Indicator */}
            {command.riskScore !== undefined && (
              <div className="p-4 bg-gray-800/50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-400">Risk Level</span>
                  <span className={`text-sm font-medium ${getRiskColor(command.sensitivityLevel)}`}>
                    {command.sensitivityLevel.toUpperCase()}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all ${
                      command.riskScore > 70
                        ? 'bg-red-500'
                        : command.riskScore > 40
                        ? 'bg-yellow-500'
                        : 'bg-green-500'
                    }`}
                    style={{ width: `${command.riskScore}%` }}
                  />
                </div>
              </div>
            )}

            {/* MFA Input */}
            {command.requiresMFA && (
              <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg space-y-3">
                <div className="flex items-center space-x-2 text-purple-400">
                  <Shield className="w-4 h-4" />
                  <span className="text-sm font-medium">Multi-Factor Authentication Required</span>
                </div>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={mfaPin}
                  onChange={e => setMfaPin(e.target.value.replace(/\D/g, ''))}
                  onKeyPress={e => e.key === 'Enter' && handleMFASubmit()}
                  placeholder="Enter 4-6 digit PIN"
                  className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-purple-500"
                  autoFocus
                />
                {mfaError && (
                  <p className="text-sm text-red-400 flex items-center space-x-1">
                    <XCircle className="w-4 h-4" />
                    <span>{mfaError}</span>
                  </p>
                )}
              </div>
            )}

            {/* Voice Prompt */}
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-400">
              <Volume2 className="w-4 h-4" />
              <span>Say "yes" to confirm or "no" to cancel</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex space-x-3 p-6 border-t border-gray-700">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-3 bg-gray-800 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              Cancel (No)
            </button>
            <button
              onClick={command.requiresMFA ? handleMFASubmit : onConfirm}
              disabled={command.requiresMFA && (!mfaPin || isSubmitting)}
              className="flex-1 px-4 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isSubmitting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  <span>Confirm (Yes)</span>
                </>
              )}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
