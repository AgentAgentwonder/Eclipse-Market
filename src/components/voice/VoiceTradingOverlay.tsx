import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Volume2, VolumeX, Settings, X, Activity, Clock } from 'lucide-react';
import { useVoiceStore } from '../../store/voiceStore';
import { useVoice } from '../../hooks/useVoice';
import { VoiceConfirmationModal } from './VoiceConfirmationModal';

interface VoiceTradingOverlayProps {
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  drivingMode?: boolean;
}

export function VoiceTradingOverlay({
  position = 'bottom-right',
  drivingMode = false,
}: VoiceTradingOverlayProps) {
  const {
    enabled,
    listening,
    currentCommand,
    session,
    commandHistory,
    notificationSettings,
    setEnabled,
  } = useVoiceStore();

  const {
    isSupported,
    permissionGranted,
    startListening,
    stopListening,
    confirmCurrentCommand,
    cancelCurrentCommand,
    submitMFA,
    speak,
  } = useVoice({ drivingMode });

  const [isExpanded, setIsExpanded] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);

  useEffect(() => {
    if (currentCommand?.status === 'confirming') {
      setShowConfirmation(true);
    } else {
      setShowConfirmation(false);
    }
  }, [currentCommand]);

  const toggleVoice = () => {
    if (!isSupported) {
      speak('Voice recognition is not supported on this device');
      return;
    }

    if (!permissionGranted) {
      speak('Microphone permission is required. Please enable it in your browser settings.');
      return;
    }

    if (listening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const getPositionClasses = () => {
    switch (position) {
      case 'top-left':
        return 'top-4 left-4';
      case 'top-right':
        return 'top-4 right-4';
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'bottom-right':
      default:
        return 'bottom-4 right-4';
    }
  };

  const recentCommands = commandHistory.slice(0, 5);

  return (
    <>
      <div className={`fixed ${getPositionClasses()} z-40`}>
        <AnimatePresence>
          {isExpanded && enabled && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-16 right-0 w-80 bg-gray-900 border border-gray-700 rounded-2xl shadow-2xl overflow-hidden mb-2"
            >
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-purple-600 to-indigo-600 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">Voice Trading</h3>
                    <p className="text-xs opacity-90">
                      {listening ? 'Listening...' : 'Ready'}
                    </p>
                  </div>
                  <button
                    onClick={() => setIsExpanded(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Session Info */}
              {session && (
                <div className="p-4 border-b border-gray-700">
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center space-x-2 text-gray-400">
                      <Clock className="w-4 h-4" />
                      <span>Active Session</span>
                    </div>
                    <span className="text-purple-400">{session.commandCount} commands</span>
                  </div>
                  {drivingMode && (
                    <div className="mt-2 px-3 py-1.5 bg-blue-500/20 text-blue-400 text-xs rounded-full inline-flex items-center space-x-1">
                      <Activity className="w-3 h-3" />
                      <span>Driving Mode</span>
                    </div>
                  )}
                </div>
              )}

              {/* Current Command */}
              {currentCommand && (
                <div className="p-4 border-b border-gray-700">
                  <div className="text-xs text-gray-400 mb-2">Current Command</div>
                  <div className="p-3 bg-purple-500/10 border border-purple-500/30 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-white font-medium">
                        {currentCommand.intent.type.replace(/_/g, ' ').toUpperCase()}
                      </span>
                      <span className="text-xs text-purple-400">{currentCommand.status}</span>
                    </div>
                    <p className="text-xs text-gray-400 mt-1">
                      {currentCommand.intent.rawText}
                    </p>
                  </div>
                </div>
              )}

              {/* Recent Commands */}
              {recentCommands.length > 0 && (
                <div className="p-4">
                  <div className="text-xs text-gray-400 mb-2">Recent Commands</div>
                  <div className="space-y-2 max-h-48 overflow-y-auto">
                    {recentCommands.map(cmd => (
                      <div
                        key={cmd.id}
                        className="p-2 bg-gray-800/50 rounded-lg flex items-center justify-between"
                      >
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-white truncate">
                            {cmd.intent.type.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs text-gray-500 truncate">
                            {new Date(cmd.createdAt).toLocaleTimeString()}
                          </p>
                        </div>
                        <div
                          className={`px-2 py-0.5 rounded text-xs ${
                            cmd.status === 'completed'
                              ? 'bg-green-500/20 text-green-400'
                              : cmd.status === 'error'
                              ? 'bg-red-500/20 text-red-400'
                              : 'bg-gray-700 text-gray-400'
                          }`}
                        >
                          {cmd.status}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Settings */}
              <div className="p-4 border-t border-gray-700 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-400">Voice Notifications</span>
                  <button
                    onClick={() => speak('This is a test notification')}
                    className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    {notificationSettings.enabled ? (
                      <Volume2 className="w-4 h-4 text-purple-400" />
                    ) : (
                      <VolumeX className="w-4 h-4 text-gray-500" />
                    )}
                  </button>
                </div>
                <button className="w-full px-3 py-2 bg-gray-800 hover:bg-gray-700 text-sm text-gray-300 rounded-lg transition-colors flex items-center justify-center space-x-2">
                  <Settings className="w-4 h-4" />
                  <span>Voice Settings</span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Button */}
        <motion.button
          onClick={() => {
            if (!enabled) {
              setEnabled(true);
            }
            if (enabled && !isExpanded) {
              setIsExpanded(true);
            } else if (!listening) {
              toggleVoice();
            } else {
              stopListening();
            }
          }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className={`relative w-14 h-14 rounded-full flex items-center justify-center shadow-2xl transition-all ${
            listening
              ? 'bg-gradient-to-r from-purple-600 to-indigo-600'
              : enabled
              ? 'bg-gray-800 hover:bg-gray-700'
              : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {listening ? (
            <>
              <Mic className="w-6 h-6 text-white" />
              <motion.div
                className="absolute inset-0 rounded-full border-2 border-purple-400"
                animate={{
                  scale: [1, 1.3, 1],
                  opacity: [1, 0, 1],
                }}
                transition={{
                  duration: 1.5,
                  repeat: Infinity,
                  ease: 'easeInOut',
                }}
              />
            </>
          ) : enabled ? (
            <MicOff className="w-6 h-6 text-gray-400" />
          ) : (
            <Mic className="w-6 h-6 text-gray-500" />
          )}

          {/* Status Indicator */}
          {enabled && (
            <div
              className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-gray-900 ${
                listening ? 'bg-green-500 animate-pulse' : 'bg-gray-500'
              }`}
            />
          )}

          {/* Command Count Badge */}
          {session && session.commandCount > 0 && (
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-purple-600 rounded-full flex items-center justify-center">
              <span className="text-xs text-white font-medium">{session.commandCount}</span>
            </div>
          )}
        </motion.button>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && currentCommand && (
        <VoiceConfirmationModal
          command={currentCommand}
          onConfirm={() => {
            confirmCurrentCommand();
            setShowConfirmation(false);
          }}
          onCancel={() => {
            cancelCurrentCommand();
            setShowConfirmation(false);
          }}
          onMFASubmit={submitMFA}
        />
      )}
    </>
  );
}
