import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Mic,
  MicOff,
  Volume2,
  Shield,
  AlertCircle,
  CheckCircle,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { useVoiceStore } from '../../store/voiceStore';
import { useVoiceInteraction } from '../../hooks/useVoiceInteraction';

export function VoiceSettings() {
  const {
    settings,
    isListening,
    lastTranscript,
    errorMessage,
    updateWakeWordConfig,
    updateSTTConfig,
    updateTTSConfig,
    setConfirmationPrompts,
    setAutoActivation,
  } = useVoiceStore();

  const {
    isInitialized,
    microphoneStatus,
    supportedLanguages,
    availableVoices,
    hasWebSpeech,
    requestMicrophonePermission,
    revokeMicrophonePermission,
    startListening,
    stopListening,
    speak,
    simulateTranscription,
    togglePrivacyMode,
  } = useVoiceInteraction({
    onTranscript: () => {
      // handled by store, no-op hook for settings page
    },
    onWakeWordDetected: () => {
      // optional handler for future analytics
    },
    onError: () => {
      // errors surface via store and notifications
    },
  });

  const [testText, setTestText] = useState('Welcome to Eclipse Market Pro');
  const [isTesting, setIsTesting] = useState(false);

  const handleTestTTS = async () => {
    setIsTesting(true);
    await speak(testText);
    setTimeout(() => setIsTesting(false), 2000);
  };

  const handleTestSTT = async () => {
    try {
      await simulateTranscription('Test transcription: Buy Bitcoin at market price');
    } catch (error) {
      console.error('Test failed:', error);
    }
  };

  const handleRequestPermission = async () => {
    await requestMicrophonePermission();
  };

  const handleRevokePermission = async () => {
    await revokeMicrophonePermission('User requested revocation from settings');
  };

  return (
    <div className="space-y-6">
      {/* Initialization Status */}
      {!isInitialized && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-blue-400">
            <p className="font-medium mb-1">Initializing Voice System</p>
            <p className="text-blue-400/80">
              Setting up voice recognition and speech synthesis...
            </p>
          </div>
        </motion.div>
      )}

      {/* Error Display */}
      {errorMessage && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-start gap-3"
        >
          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-400">
            <p className="font-medium mb-1">Error</p>
            <p className="text-red-400/80">{errorMessage}</p>
          </div>
        </motion.div>
      )}

      {/* Microphone Permissions */}
      <div className="p-6 bg-slate-900/50 rounded-2xl border border-purple-500/10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
              {microphoneStatus.granted ? (
                <Mic className="w-5 h-5" />
              ) : (
                <MicOff className="w-5 h-5" />
              )}
            </div>
            <div>
              <h3 className="font-semibold">Microphone Access</h3>
              <p className="text-sm text-white/60">Required for voice commands</p>
            </div>
          </div>
          <div
            className={`px-3 py-1 rounded-lg text-sm font-medium ${
              microphoneStatus.granted
                ? 'bg-green-500/20 text-green-400 border border-green-500/30'
                : 'bg-red-500/20 text-red-400 border border-red-500/30'
            }`}
          >
            {microphoneStatus.granted ? 'Granted' : 'Not Granted'}
          </div>
        </div>

        {hasWebSpeech && (
          <div className="mb-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <div className="flex items-center gap-2 text-sm text-blue-400">
              <CheckCircle className="w-4 h-4" />
              <span>Web Speech API available</span>
            </div>
          </div>
        )}

        <div className="flex gap-3">
          {!microphoneStatus.granted ? (
            <motion.button
              onClick={handleRequestPermission}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl font-semibold text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/50 transition-all"
            >
              Request Permission
            </motion.button>
          ) : (
            <motion.button
              onClick={handleRevokePermission}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 rounded-xl font-semibold text-red-400 transition-all"
            >
              Revoke Permission
            </motion.button>
          )}
        </div>
      </div>

      {/* Wake Word Configuration */}
      <div className="p-6 bg-slate-900/50 rounded-2xl border border-purple-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-500 to-orange-500 flex items-center justify-center">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Wake Word Detection</h3>
            <p className="text-sm text-white/60">Activate voice commands with a trigger phrase</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enable Wake Word</label>
            <button
              onClick={() => updateWakeWordConfig({ enabled: !settings.wakeWord.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.wakeWord.enabled ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.wakeWord.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.wakeWord.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Wake Word</label>
                <input
                  type="text"
                  value={settings.wakeWord.wakeWord}
                  onChange={(e) => updateWakeWordConfig({ wakeWord: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                  placeholder="Hey Eclipse"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Sensitivity: {(settings.wakeWord.sensitivity * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.wakeWord.sensitivity}
                  onChange={(e) =>
                    updateWakeWordConfig({ sensitivity: parseFloat(e.target.value) })
                  }
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>Low</span>
                  <span>High</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Speech-to-Text Configuration */}
      <div className="p-6 bg-slate-900/50 rounded-2xl border border-purple-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
            <Mic className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Speech Recognition</h3>
            <p className="text-sm text-white/60">Convert voice to text</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enable Speech Recognition</label>
            <button
              onClick={() => updateSTTConfig({ enabled: !settings.stt.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.stt.enabled ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.stt.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.stt.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Language</label>
                <select
                  value={settings.stt.language}
                  onChange={(e) => updateSTTConfig({ language: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                >
                  {supportedLanguages.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Continuous Recognition</label>
                <button
                  onClick={() => updateSTTConfig({ continuous: !settings.stt.continuous })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.stt.continuous ? 'bg-purple-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.stt.continuous ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Interim Results</label>
                <button
                  onClick={() =>
                    updateSTTConfig({ interimResults: !settings.stt.interimResults })
                  }
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    settings.stt.interimResults ? 'bg-purple-500' : 'bg-slate-700'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      settings.stt.interimResults ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              {lastTranscript && (
                <div className="p-4 bg-slate-800/50 border border-purple-500/20 rounded-xl">
                  <p className="text-xs text-white/40 mb-1">Last Transcript:</p>
                  <p className="text-sm text-white">{lastTranscript}</p>
                </div>
              )}

              <motion.button
                onClick={handleTestSTT}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-xl font-semibold text-green-400 transition-all"
              >
                Test Recognition (Simulation)
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Text-to-Speech Configuration */}
      <div className="p-6 bg-slate-900/50 rounded-2xl border border-purple-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-rose-500 flex items-center justify-center">
            <Volume2 className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Text-to-Speech</h3>
            <p className="text-sm text-white/60">Convert text to voice</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">Enable Text-to-Speech</label>
            <button
              onClick={() => updateTTSConfig({ enabled: !settings.tts.enabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.tts.enabled ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.tts.enabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {settings.tts.enabled && (
            <>
              <div>
                <label className="block text-sm font-medium mb-2">Voice</label>
                <select
                  value={settings.tts.voice}
                  onChange={(e) => updateTTSConfig({ voice: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-xl text-white focus:outline-none focus:border-purple-500/50 transition-colors"
                >
                  {availableVoices.map((voice) => (
                    <option key={voice.id} value={voice.id}>
                      {voice.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Rate: {settings.tts.rate.toFixed(1)}x
                </label>
                <input
                  type="range"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={settings.tts.rate}
                  onChange={(e) => updateTTSConfig({ rate: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
                <div className="flex justify-between text-xs text-white/40 mt-1">
                  <span>Slow</span>
                  <span>Fast</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Pitch: {settings.tts.pitch.toFixed(1)}
                </label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={settings.tts.pitch}
                  onChange={(e) => updateTTSConfig({ pitch: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">
                  Volume: {(settings.tts.volume * 100).toFixed(0)}%
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={settings.tts.volume}
                  onChange={(e) => updateTTSConfig({ volume: parseFloat(e.target.value) })}
                  className="w-full h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Test Text</label>
                <input
                  type="text"
                  value={testText}
                  onChange={(e) => setTestText(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-800 border border-purple-500/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-purple-500/50 transition-colors"
                  placeholder="Enter text to test speech synthesis"
                />
              </div>

              <motion.button
                onClick={handleTestTTS}
                disabled={isTesting}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full py-3 bg-pink-500/20 hover:bg-pink-500/30 border border-pink-500/30 rounded-xl font-semibold text-pink-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isTesting ? 'Speaking...' : 'Test Speech'}
              </motion.button>
            </>
          )}
        </div>
      </div>

      {/* Privacy & Advanced Options */}
      <div className="p-6 bg-slate-900/50 rounded-2xl border border-purple-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Privacy & Settings</h3>
            <p className="text-sm text-white/60">Advanced voice options</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Confirmation Prompts</label>
              <p className="text-xs text-white/40 mt-1">
                Require confirmation for important actions
              </p>
            </div>
            <button
              onClick={() => setConfirmationPrompts(!settings.confirmationPrompts)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.confirmationPrompts ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.confirmationPrompts ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Privacy Mode</label>
              <p className="text-xs text-white/40 mt-1">
                Disable all voice features
              </p>
            </div>
            <button
              onClick={() => togglePrivacyMode(!settings.privacyMode)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.privacyMode ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.privacyMode ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium">Auto Activation</label>
              <p className="text-xs text-white/40 mt-1">
                Start listening on app launch
              </p>
            </div>
            <button
              onClick={() => setAutoActivation(!settings.autoActivation)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                settings.autoActivation ? 'bg-purple-500' : 'bg-slate-700'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoActivation ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      {/* Voice Control Test */}
      <div className="p-6 bg-slate-900/50 rounded-2xl border border-purple-500/10">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold">Test Voice Pipeline</h3>
            <p className="text-sm text-white/60">Try voice commands end-to-end</p>
          </div>
        </div>

        <div className="flex gap-3">
          {!isListening ? (
            <motion.button
              onClick={startListening}
              disabled={!microphoneStatus.granted || settings.privacyMode}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-xl font-semibold text-white shadow-lg shadow-green-500/30 hover:shadow-green-500/50 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Start Listening
            </motion.button>
          ) : (
            <motion.button
              onClick={stopListening}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 rounded-xl font-semibold text-white shadow-lg shadow-red-500/30 hover:shadow-red-500/50 transition-all"
            >
              Stop Listening
            </motion.button>
          )}
        </div>

        {isListening && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center gap-3"
          >
            <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
            <span className="text-sm text-green-400 font-medium">Listening...</span>
          </motion.div>
        )}
      </div>
    </div>
  );
}
