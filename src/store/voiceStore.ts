import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import {
  VoiceCommand,
  VoiceCommandStatus,
  VoiceIntent,
  VoiceNotificationSettings,
  VoiceSpeechSynthesisConfig,
  VoiceRecognitionConfig,
  VoiceSession,
  VoiceMFAChallenge,
  VoiceMFAResponse,
  VoiceLocale,
} from '../types/voice';

interface VoiceState {
  enabled: boolean;
  listening: boolean;
  currentCommand: VoiceCommand | null;
  commandHistory: VoiceCommand[];
  session: VoiceSession | null;
  notificationSettings: VoiceNotificationSettings;
  speechConfig: VoiceSpeechSynthesisConfig;
  recognitionConfig: VoiceRecognitionConfig;
  availableVoices: SpeechSynthesisVoice[];
  mfaChallenge: VoiceMFAChallenge | null;
  pendingNotifications: Array<{ id: string; message: string; priority: number; timestamp: number }>;

  setEnabled: (enabled: boolean) => void;
  setListening: (listening: boolean) => void;
  startSession: (locale?: VoiceLocale, drivingMode?: boolean) => void;
  endSession: () => void;
  updateSession: () => void;
  
  createCommand: (intent: VoiceIntent) => VoiceCommand;
  updateCommandStatus: (commandId: string, status: VoiceCommandStatus, result?: any, error?: any) => void;
  setCurrentCommand: (command: VoiceCommand | null) => void;
  clearCommandHistory: () => void;
  
  updateNotificationSettings: (settings: Partial<VoiceNotificationSettings>) => void;
  updateSpeechConfig: (config: Partial<VoiceSpeechSynthesisConfig>) => void;
  updateRecognitionConfig: (config: Partial<VoiceRecognitionConfig>) => void;
  setAvailableVoices: (voices: SpeechSynthesisVoice[]) => void;
  
  createMFAChallenge: (type: VoiceMFAChallenge['type'], prompt: string) => VoiceMFAChallenge;
  submitMFAResponse: (response: VoiceMFAResponse) => boolean;
  clearMFAChallenge: () => void;
  
  queueNotification: (message: string, priority?: number) => void;
  dequeueNotification: (id: string) => void;
  clearNotifications: () => void;
}

const generateId = () => `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

const defaultNotificationSettings: VoiceNotificationSettings = {
  enabled: true,
  frequency: 'important',
  voice: 'default',
  rate: 1.0,
  pitch: 1.0,
  volume: 0.8,
  drivingMode: false,
  maxNotificationsPerMinute: 5,
};

const defaultSpeechConfig: VoiceSpeechSynthesisConfig = {
  rate: 1.0,
  pitch: 1.0,
  volume: 0.8,
  lang: 'en-US',
};

const defaultRecognitionConfig: VoiceRecognitionConfig = {
  continuous: true,
  interimResults: true,
  maxAlternatives: 3,
  lang: 'en-US',

export interface WakeWordConfig {
  enabled: boolean;
  wakeWord: string;
  sensitivity: number;
  timeoutMs: number;
}

export interface SpeechToTextConfig {
  enabled: boolean;
  language: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
}

export interface TextToSpeechConfig {
  enabled: boolean;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  language: string;
}

export interface VoiceSettings {
  wakeWord: WakeWordConfig;
  stt: SpeechToTextConfig;
  tts: TextToSpeechConfig;
  confirmationPrompts: boolean;
  privacyMode: boolean;
  autoActivation: boolean;
}

interface VoiceState {
  settings: VoiceSettings;
  isListening: boolean;
  isProcessing: boolean;
  lastTranscript: string | null;
  errorMessage: string | null;
  
  updateWakeWordConfig: (config: Partial<WakeWordConfig>) => void;
  updateSTTConfig: (config: Partial<SpeechToTextConfig>) => void;
  updateTTSConfig: (config: Partial<TextToSpeechConfig>) => void;
  setIsListening: (listening: boolean) => void;
  setIsProcessing: (processing: boolean) => void;
  setLastTranscript: (transcript: string | null) => void;
  setErrorMessage: (error: string | null) => void;
  setConfirmationPrompts: (enabled: boolean) => void;
  setPrivacyMode: (enabled: boolean) => void;
  setAutoActivation: (enabled: boolean) => void;
  resetSettings: () => void;
}

const DEFAULT_SETTINGS: VoiceSettings = {
  wakeWord: {
    enabled: true,
    wakeWord: 'Hey Eclipse',
    sensitivity: 0.5,
    timeoutMs: 3000,
  },
  stt: {
    enabled: true,
    language: 'en-US',
    continuous: false,
    interimResults: true,
    maxAlternatives: 1,
  },
  tts: {
    enabled: true,
    voice: 'default',
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    language: 'en-US',
  },
  confirmationPrompts: true,
  privacyMode: false,
  autoActivation: false,
};

export const useVoiceStore = create<VoiceState>()(
  persist(
    (set, get) => ({
      enabled: false,
      listening: false,
      currentCommand: null,
      commandHistory: [],
      session: null,
      notificationSettings: defaultNotificationSettings,
      speechConfig: defaultSpeechConfig,
      recognitionConfig: defaultRecognitionConfig,
      availableVoices: [],
      mfaChallenge: null,
      pendingNotifications: [],

      setEnabled: enabled => {
        set({ enabled });
        if (!enabled) {
          get().endSession();
        }
      },

      setListening: listening => {
        set({ listening });
        if (listening) {
          get().updateSession();
        }
      },

      startSession: (locale = 'en-US', drivingMode = false) => {
        const session: VoiceSession = {
          id: generateId(),
          active: true,
          startedAt: Date.now(),
          lastActivityAt: Date.now(),
          commandCount: 0,
          locale,
          drivingMode,
        };
        set({ session, listening: true });
      },

      endSession: () => {
        const { session } = get();
        if (session) {
          set({
            session: { ...session, active: false },
            listening: false,
            currentCommand: null,
          });
        }
      },

      updateSession: () => {
        const { session } = get();
        if (session && session.active) {
          set({
            session: {
              ...session,
              lastActivityAt: Date.now(),
            },
          });
        }
      },

      createCommand: intent => {
        const requiresMFA = ['trade_buy', 'trade_sell'].includes(intent.type) &&
          intent.parameters.amount > 1000;
        
        const sensitivityLevel =
          ['trade_buy', 'trade_sell'].includes(intent.type)
            ? 'critical'
            : intent.type === 'alert_create'
            ? 'medium'
            : 'low';

        const command: VoiceCommand = {
          id: generateId(),
          intent,
          status: 'processing',
          requiresConfirmation: ['trade_buy', 'trade_sell', 'trade_cancel'].includes(intent.type),
          requiresMFA,
          sensitivityLevel,
          createdAt: Date.now(),
        };

        const { session, commandHistory } = get();
        
        set({
          currentCommand: command,
          commandHistory: [command, ...commandHistory].slice(0, 50),
          session: session
            ? { ...session, commandCount: session.commandCount + 1, lastActivityAt: Date.now() }
            : session,
        });

        return command;
      },

      updateCommandStatus: (commandId, status, result, error) => {
        const { currentCommand, commandHistory } = get();

        const updateCommand = (cmd: VoiceCommand): VoiceCommand => {
          if (cmd.id !== commandId) return cmd;
          
          const updated: VoiceCommand = {
            ...cmd,
            status,
          };

          if (result) {
            updated.result = result;
          }

          if (error) {
            updated.error = error;
          }

          if (status === 'completed' || status === 'error') {
            updated.completedAt = Date.now();
          }

          return updated;
        };

        const updatedCurrent = currentCommand?.id === commandId
          ? updateCommand(currentCommand)
          : currentCommand;

        const updatedHistory = commandHistory.map(updateCommand);

        set({
          currentCommand: updatedCurrent,
          commandHistory: updatedHistory,
        });
      },

      setCurrentCommand: command => {
        set({ currentCommand: command });
      },

      clearCommandHistory: () => {
        set({ commandHistory: [] });
      },

      updateNotificationSettings: settings => {
        set(state => ({
          notificationSettings: {
            ...state.notificationSettings,
            ...settings,
          },
        }));
      },

      updateSpeechConfig: config => {
        set(state => ({
          speechConfig: {
            ...state.speechConfig,
            ...config,
          },
        }));
      },

      updateRecognitionConfig: config => {
        set(state => ({
          recognitionConfig: {
            ...state.recognitionConfig,
            ...config,
          },
        }));
      },

      setAvailableVoices: voices => {
        set({ availableVoices: voices });
      },

      createMFAChallenge: (type, prompt) => {
        const { currentCommand } = get();
        const challenge: VoiceMFAChallenge = {
          id: generateId(),
          commandId: currentCommand?.id || '',
          type,
          prompt,
          expiresAt: Date.now() + 120000, // 2 minutes
          attempts: 0,
          maxAttempts: 3,
        };
        set({ mfaChallenge: challenge });
        return challenge;
      },

      submitMFAResponse: response => {
        const { mfaChallenge } = get();
        if (!mfaChallenge || mfaChallenge.id !== response.challengeId) {
          return false;
        }

        if (Date.now() > mfaChallenge.expiresAt) {
          get().clearMFAChallenge();
          return false;
        }

        const updatedChallenge = {
          ...mfaChallenge,
          attempts: mfaChallenge.attempts + 1,
        };

        if (updatedChallenge.attempts >= updatedChallenge.maxAttempts) {
          get().clearMFAChallenge();
          return false;
        }

        set({ mfaChallenge: updatedChallenge });
        return true;
      },

      clearMFAChallenge: () => {
        set({ mfaChallenge: null });
      },

      queueNotification: (message, priority = 0) => {
        const notification = {
          id: generateId(),
          message,
          priority,
          timestamp: Date.now(),
        };
        
        set(state => ({
          pendingNotifications: [...state.pendingNotifications, notification]
            .sort((a, b) => b.priority - a.priority)
            .slice(0, 20),
        }));
      },

      dequeueNotification: id => {
        set(state => ({
          pendingNotifications: state.pendingNotifications.filter(n => n.id !== id),
        }));
      },

      clearNotifications: () => {
        set({ pendingNotifications: [] });
      },
    }),
    {
      name: 'voice-store',
      version: 1,
      partialize: state => ({
        enabled: state.enabled,
        notificationSettings: state.notificationSettings,
        speechConfig: state.speechConfig,
        recognitionConfig: state.recognitionConfig,
        commandHistory: state.commandHistory.slice(0, 20),
      }),
    (set) => ({
      settings: DEFAULT_SETTINGS,
      isListening: false,
      isProcessing: false,
      lastTranscript: null,
      errorMessage: null,

      updateWakeWordConfig: (config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            wakeWord: {
              ...state.settings.wakeWord,
              ...config,
            },
          },
        })),

      updateSTTConfig: (config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            stt: {
              ...state.settings.stt,
              ...config,
            },
          },
        })),

      updateTTSConfig: (config) =>
        set((state) => ({
          settings: {
            ...state.settings,
            tts: {
              ...state.settings.tts,
              ...config,
            },
          },
        })),

      setIsListening: (listening) => set({ isListening: listening }),

      setIsProcessing: (processing) => set({ isProcessing: processing }),

      setLastTranscript: (transcript) => set({ lastTranscript: transcript }),

      setErrorMessage: (error) => set({ errorMessage: error }),

      setConfirmationPrompts: (enabled) =>
        set((state) => ({
          settings: {
            ...state.settings,
            confirmationPrompts: enabled,
          },
        })),

      setPrivacyMode: (enabled) =>
        set((state) => ({
          settings: {
            ...state.settings,
            privacyMode: enabled,
          },
        })),

      setAutoActivation: (enabled) =>
        set((state) => ({
          settings: {
            ...state.settings,
            autoActivation: enabled,
          },
        })),

      resetSettings: () =>
        set({
          settings: DEFAULT_SETTINGS,
          isListening: false,
          isProcessing: false,
          lastTranscript: null,
          errorMessage: null,
        }),
    }),
    {
      name: 'voice-settings',
      version: 1,
    }
  )
);
