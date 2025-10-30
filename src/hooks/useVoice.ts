import { useEffect, useCallback, useRef, useState } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useVoiceStore } from '../store/voiceStore';
import { voiceCommandService } from '../utils/voiceCommandService';
import { VoiceIntent } from '../types/voice';

interface UseVoiceOptions {
  autoStart?: boolean;
  drivingMode?: boolean;
  onCommand?: (intent: VoiceIntent) => void;
  onError?: (error: Error) => void;
}

export function useVoice(options: UseVoiceOptions = {}) {
  const {
    enabled,
    listening,
    currentCommand,
    session,
    recognitionConfig,
    speechConfig,
    setListening,
    startSession,
    endSession,
    createCommand,
    updateCommandStatus,
    setCurrentCommand,
    queueNotification,
    mfaChallenge,
    createMFAChallenge,
    submitMFAResponse,
    clearMFAChallenge,
  } = useVoiceStore();

  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [permissionGranted, setPermissionGranted] = useState(false);

  useEffect(() => {
    const supported =
      'SpeechRecognition' in window ||
      'webkitSpeechRecognition' in window;
    setIsSupported(supported);
  }, []);

  useEffect(() => {
    voiceCommandService.setLocale(recognitionConfig.lang);
  }, [recognitionConfig.lang]);

  useEffect(() => {
    const checkPermission = async () => {
      try {
        const granted = await invoke<boolean>('check_voice_permission');
        setPermissionGranted(granted);
      } catch (error) {
        console.error('Failed to check voice permission:', error);
        setPermissionGranted(false);
      }
    };

    if (enabled) {
      checkPermission();
    }
  }, [enabled]);

  useEffect(() => {
    if (!isSupported || !enabled || !permissionGranted) return;

    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = recognitionConfig.continuous;
    recognition.interimResults = recognitionConfig.interimResults;
    recognition.maxAlternatives = recognitionConfig.maxAlternatives;
    recognition.lang = recognitionConfig.lang;

    recognition.onstart = () => {
      setListening(true);
    };

    recognition.onend = () => {
      setListening(false);
    };

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0].transcript)
        .join(' ')
        .trim();

      handleVoiceInput(transcript);
    };

    recognition.onerror = (event: any) => {
      console.error('Speech recognition error:', event.error);
      setListening(false);

      if (options.onError) {
        options.onError(new Error(event.error));
      }
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isSupported, enabled, permissionGranted, recognitionConfig]);

  useEffect(() => {
    if (enabled && options.autoStart && !session) {
      startSession(recognitionConfig.lang, options.drivingMode);
    }
  }, [enabled, options.autoStart, session, recognitionConfig.lang, options.drivingMode, startSession]);

  const speak = useCallback(
    (text: string) => {
      if (!('speechSynthesis' in window)) {
        console.warn('Speech synthesis not supported');
        return;
      }

      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speechConfig.rate;
      utterance.pitch = speechConfig.pitch;
      utterance.volume = speechConfig.volume;
      utterance.lang = speechConfig.lang;

      if (speechConfig.voice) {
        utterance.voice = speechConfig.voice;
      }

      synthesisRef.current = utterance;
      window.speechSynthesis.speak(utterance);

      invoke('synthesize_speech', {
        text,
        voice: speechConfig.voice?.name,
        rate: speechConfig.rate,
        pitch: speechConfig.pitch,
      }).catch(err => console.error('Backend TTS error:', err));
    },
    [speechConfig]
  );

  const handleVoiceInput = useCallback(
    async (text: string) => {
      try {
        const intent = voiceCommandService.parseIntent(text);

        if (!intent) {
          speak("I didn't understand that command. Please try again.");
          return;
        }

        if (options.onCommand) {
          options.onCommand(intent);
        }

        const command = createCommand(intent);
        command.riskScore = voiceCommandService.calculateRiskScore(intent);
        command.confirmationData = voiceCommandService.generateConfirmationData(intent);
        setCurrentCommand(command);

        if (command.requiresConfirmation) {
          updateCommandStatus(command.id, 'confirming');
          speak(command.confirmationData.audioSummary);
          return;
        }

        await executeVoiceCommand(command.id);
      } catch (error) {
        console.error('Error handling voice input:', error);
        speak('An error occurred processing your command.');

        if (options.onError) {
          options.onError(error as Error);
        }
      }
    },
    [createCommand, options, setCurrentCommand, speak, updateCommandStatus]
  );

  const executeVoiceCommand = useCallback(
    async (commandId: string, bypassMFA = false) => {
      const storeState = useVoiceStore.getState();
      const command =
        currentCommand?.id === commandId
          ? currentCommand
          : storeState.commandHistory.find(cmd => cmd.id === commandId);

      if (!command) return;

      if (command.requiresMFA && !bypassMFA) {
        setCurrentCommand(command);

        if (!mfaChallenge || mfaChallenge.commandId !== command.id) {
          createMFAChallenge('pin', 'Please provide your trading PIN to continue.');
        }

        speak('Multi-factor authentication required. Please provide your PIN.');
        return;
      }

      updateCommandStatus(commandId, 'executing');

      try {
        const result = await voiceCommandService.executeCommand(command.intent);
        updateCommandStatus(commandId, 'completed', result);
        clearMFAChallenge();

        if (result.success) {
          speak(result.message);
          queueNotification(result.message, 1);
        } else {
          speak(`Command failed: ${result.message}`);
        }
      } catch (error: any) {
        console.error('Error executing voice command:', error);
        updateCommandStatus(commandId, 'error', undefined, {
          code: 'EXECUTION_ERROR',
          message: error.message,
          recoverable: true,
        });

        speak(`Error: ${error.message}`);
      }
    },
    [clearMFAChallenge, createMFAChallenge, currentCommand, mfaChallenge, queueNotification, setCurrentCommand, speak, updateCommandStatus]
  );

  const startListening = useCallback(() => {
    if (!isSupported || !enabled || !permissionGranted) {
      console.warn('Voice recognition not available');
      return;
    }

    if (recognitionRef.current && !listening) {
      try {
        recognitionRef.current.start();
      } catch (error) {
        console.error('Error starting recognition:', error);
      }
    }
  }, [isSupported, enabled, permissionGranted, listening]);

  const stopListening = useCallback(() => {
    if (recognitionRef.current && listening) {
      recognitionRef.current.stop();
    }
  }, [listening]);

  const confirmCurrentCommand = useCallback(
    async (bypassMFA = false) => {
      if (!currentCommand) return;

      await executeVoiceCommand(currentCommand.id, bypassMFA || !currentCommand.requiresMFA);
      setCurrentCommand(null);
    },
    [currentCommand, executeVoiceCommand, setCurrentCommand]
  );

  const cancelCurrentCommand = useCallback(() => {
    if (!currentCommand) return;

    updateCommandStatus(currentCommand.id, 'cancelled');
    clearMFAChallenge();
    setCurrentCommand(null);
    speak('Command cancelled.');
  }, [clearMFAChallenge, currentCommand, setCurrentCommand, speak, updateCommandStatus]);

  const submitMFA = useCallback(
    async (pin: string) => {
      if (!currentCommand?.requiresMFA) return false;

      let challenge = mfaChallenge;
      if (!challenge || challenge.commandId !== currentCommand.id) {
        challenge = createMFAChallenge('pin', 'Please provide your trading PIN to continue.');
      }

      try {
        const isValid = await invoke<boolean>('validate_voice_mfa', {
          challengeId: challenge.id,
          response: pin,
        });

        if (isValid) {
          clearMFAChallenge();
          return true;
        }

        submitMFAResponse({
          challengeId: challenge.id,
          response: pin,
          timestamp: Date.now(),
        });

        speak('Invalid authentication. Please try again.');
        return false;
      } catch (error) {
        console.error('MFA validation error:', error);
        speak('Authentication failed. Please try again.');
        return false;
      }
    },
    [clearMFAChallenge, createMFAChallenge, currentCommand, mfaChallenge, speak, submitMFAResponse]
  );

  return {
    isSupported,
    permissionGranted,
    enabled,
    listening,
    currentCommand,
    session,
    speak,
    startListening,
    stopListening,
    startSession,
    endSession,
    confirmCurrentCommand,
    cancelCurrentCommand,
    submitMFA,
    executeCommand: executeVoiceCommand,
  };
}
