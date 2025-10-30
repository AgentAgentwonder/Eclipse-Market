import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
