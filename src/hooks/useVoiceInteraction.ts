import { useState, useEffect, useCallback, useRef } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import {
  useVoiceStore,
  WakeWordConfig,
  SpeechToTextConfig,
  TextToSpeechConfig,
} from '../store/voiceStore';

interface RawMicrophoneStatus {
  granted: boolean;
  reason?: string | null;
  last_checked?: number | null;
}

interface MicrophoneStatus {
  granted: boolean;
  reason?: string;
  lastChecked?: number;
}

interface RawAudioSessionSnapshot {
  session_id?: string | null;
  microphone_active: boolean;
  permissions: RawMicrophoneStatus;
  stream_token?: string | null;
}

interface AudioSessionSnapshot {
  sessionId?: string;
  microphoneActive: boolean;
  permissions: MicrophoneStatus;
  streamToken?: string;
}

interface RawSpeechRecognitionResult {
  transcript: string;
  confidence: number;
  is_final: boolean;
  alternatives: Array<{
    transcript: string;
    confidence: number;
  }>;
  timestamp: number;
}

interface SpeechRecognitionResult {
  transcript: string;
  confidence: number;
  isFinal: boolean;
  alternatives: Array<{
    transcript: string;
    confidence: number;
  }>;
  timestamp: number;
}

interface RawWakeWordConfig {
  enabled: boolean;
  wake_word: string;
  sensitivity: number;
  timeout_ms: number;
}

interface RawSpeechToTextConfig {
  enabled: boolean;
  language: string;
  continuous: boolean;
  interim_results: boolean;
  max_alternatives: number;
}

interface RawTextToSpeechConfig {
  enabled: boolean;
  voice: string;
  rate: number;
  pitch: number;
  volume: number;
  language: string;
}

interface RawLanguageOption {
  code: string;
  name: string;
  supported: boolean;
}

interface LanguageOption {
  code: string;
  name: string;
  supported: boolean;
}

interface RawVoiceOption {
  id: string;
  name: string;
  language: string;
  gender: string;
}

interface VoiceOption {
  id: string;
  name: string;
  language: string;
  gender: string;
}

export interface UseVoiceInteractionOptions {
  onTranscript?: (result: SpeechRecognitionResult) => void;
  onWakeWordDetected?: (confidence: number) => void;
  onError?: (error: string) => void;
}

const toMicrophoneStatus = (raw?: RawMicrophoneStatus): MicrophoneStatus => ({
  granted: raw?.granted ?? false,
  reason: raw?.reason ?? undefined,
  lastChecked: raw?.last_checked ?? undefined,
});

const toAudioSessionSnapshot = (raw: RawAudioSessionSnapshot): AudioSessionSnapshot => ({
  sessionId: raw.session_id ?? undefined,
  microphoneActive: raw.microphone_active,
  permissions: toMicrophoneStatus(raw.permissions),
  streamToken: raw.stream_token ?? undefined,
});

const toWakeWordConfig = (raw: RawWakeWordConfig): WakeWordConfig => ({
  enabled: raw.enabled,
  wakeWord: raw.wake_word,
  sensitivity: raw.sensitivity,
  timeoutMs: raw.timeout_ms,
});

const toRawWakeWordConfig = (config: WakeWordConfig): RawWakeWordConfig => ({
  enabled: config.enabled,
  wake_word: config.wakeWord,
  sensitivity: config.sensitivity,
  timeout_ms: config.timeoutMs,
});

const toSpeechToTextConfig = (raw: RawSpeechToTextConfig): SpeechToTextConfig => ({
  enabled: raw.enabled,
  language: raw.language,
  continuous: raw.continuous,
  interimResults: raw.interim_results,
  maxAlternatives: raw.max_alternatives,
});

const toRawSpeechToTextConfig = (config: SpeechToTextConfig): RawSpeechToTextConfig => ({
  enabled: config.enabled,
  language: config.language,
  continuous: config.continuous,
  interim_results: config.interimResults,
  max_alternatives: config.maxAlternatives,
});

const toTextToSpeechConfig = (raw: RawTextToSpeechConfig): TextToSpeechConfig => ({
  enabled: raw.enabled,
  voice: raw.voice,
  rate: raw.rate,
  pitch: raw.pitch,
  volume: raw.volume,
  language: raw.language,
});

const toRawTextToSpeechConfig = (config: TextToSpeechConfig): RawTextToSpeechConfig => ({
  enabled: config.enabled,
  voice: config.voice,
  rate: config.rate,
  pitch: config.pitch,
  volume: config.volume,
  language: config.language,
});

const toSpeechResult = (raw: RawSpeechRecognitionResult): SpeechRecognitionResult => ({
  transcript: raw.transcript,
  confidence: raw.confidence,
  isFinal: raw.is_final,
  alternatives: raw.alternatives,
  timestamp: raw.timestamp,
});

const isTauriEnvironment = () =>
  typeof window !== 'undefined' && Boolean((window as Record<string, unknown>).__TAURI_IPC__);

export function useVoiceInteraction(options: UseVoiceInteractionOptions = {}) {
  const {
    settings,
    updateWakeWordConfig,
    updateSTTConfig,
    updateTTSConfig,
    setIsListening,
    setIsProcessing,
    setLastTranscript,
    setErrorMessage,
    setPrivacyMode,
  } = useVoiceStore();

  const [microphoneStatus, setMicrophoneStatus] = useState<MicrophoneStatus>({ granted: false });
  const [audioSession, setAudioSession] = useState<AudioSessionSnapshot | null>(null);
  const [supportedLanguages, setSupportedLanguages] = useState<LanguageOption[]>([]);
  const [availableVoices, setAvailableVoices] = useState<VoiceOption[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);
  const [hasWebSpeech, setHasWebSpeech] = useState(false);

  const audioContextRef = useRef<AudioContext | null>(null);

  type BrowserSpeechRecognitionEvent = {
    results: ArrayLike<{
      isFinal: boolean;
      [index: number]: { transcript: string };
    }>;
  };

  type BrowserSpeechRecognition = {
    lang: string;
    continuous: boolean;
    interimResults: boolean;
    start: () => void;
    stop: () => void;
    abort: () => void;
    onerror?: (event: { error: string }) => void;
    onresult?: (event: BrowserSpeechRecognitionEvent) => void;
  };

  type SpeechRecognitionConstructor = new () => BrowserSpeechRecognition;

  const recognitionRef = useRef<BrowserSpeechRecognition | null>(null);
  const isTauri = isTauriEnvironment();

  const ensureAudioContext = useCallback(async () => {
    if (typeof window === 'undefined') return null;

    const audioWindow = window as typeof window & {
      AudioContext?: typeof AudioContext;
      webkitAudioContext?: typeof AudioContext;
    };

    const AudioContextCtor = audioWindow.AudioContext || audioWindow.webkitAudioContext;

    if (!AudioContextCtor) return null;

    if (!audioContextRef.current || audioContextRef.current.state === 'closed') {
      audioContextRef.current = new AudioContextCtor();
    }

    if (audioContextRef.current.state === 'suspended') {
      await audioContextRef.current.resume();
    }

    return audioContextRef.current;
  }, []);

  const suspendAudioContext = useCallback(async () => {
    if (audioContextRef.current && audioContextRef.current.state === 'running') {
      await audioContextRef.current.suspend();
    }
  }, []);

  const establishWebSpeech = useCallback(() => {
    if (typeof window === 'undefined') return;
    const windowWithSpeech = window as {
      SpeechRecognition?: SpeechRecognitionConstructor;
      webkitSpeechRecognition?: SpeechRecognitionConstructor;
    };
    const SpeechRecognitionCtor =
      windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) return;

    setHasWebSpeech(true);

    const recognition = new SpeechRecognitionCtor();
    recognition.lang = settings.stt.language;
    recognition.continuous = settings.stt.continuous;
    recognition.interimResults = settings.stt.interimResults;

    recognition.onresult = event => {
      const results = Array.from(event.results);
      const finalResult = results.find(result => result.isFinal);
      if (!finalResult) return;
      const transcript = Array.from(finalResult)
        .map(part => part.transcript)
        .join(' ')
        .trim();

      const speechResult: SpeechRecognitionResult = {
        transcript,
        confidence: 0.9,
        isFinal: true,
        alternatives: [],
        timestamp: Date.now(),
      };

      setLastTranscript(speechResult.transcript);
      options.onTranscript?.(speechResult);
    };

    recognition.onerror = event => {
      const error = `Web Speech API error: ${event.error}`;
      setErrorMessage(error);
      options.onError?.(error);
    };

    recognitionRef.current = recognition;
  }, [options, setErrorMessage, setLastTranscript, settings.stt]);

  const requestMicrophonePermission = useCallback(async () => {
    try {
      if (settings.privacyMode) {
        throw new Error('Voice interaction is disabled while privacy mode is active.');
      }

      if (!isTauri) {
        setMicrophoneStatus({ granted: true });
        return true;
      }

      const raw = await invoke<RawMicrophoneStatus>('voice_request_permissions');
      const status = toMicrophoneStatus(raw);
      setMicrophoneStatus(status);
      return status.granted;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(errorMsg);
      options.onError?.(errorMsg);
      return false;
    }
  }, [isTauri, options, setErrorMessage, settings.privacyMode]);

  const revokeMicrophonePermission = useCallback(
    async (reason?: string) => {
      try {
        if (isTauri) {
          await invoke('voice_revoke_permissions', { reason });
        }
        setMicrophoneStatus({ granted: false, reason });
        await suspendAudioContext();
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setErrorMessage(errorMsg);
        options.onError?.(errorMsg);
      }
    },
    [isTauri, options, setErrorMessage, suspendAudioContext]
  );

  const refreshAudioSession = useCallback(async () => {
    if (!isTauri) return null;
    try {
      const raw = await invoke<RawAudioSessionSnapshot>('voice_get_audio_status');
      const snapshot = toAudioSessionSnapshot(raw);
      setAudioSession(snapshot);
      setMicrophoneStatus(snapshot.permissions);
      return snapshot;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(errorMsg);
      options.onError?.(errorMsg);
      return null;
    }
  }, [isTauri, options, setErrorMessage]);

  const synchronizeConfigs = useCallback(
    async (wake?: RawWakeWordConfig, stt?: RawSpeechToTextConfig, tts?: RawTextToSpeechConfig) => {
      if (wake) {
        updateWakeWordConfig(toWakeWordConfig(wake));
      }
      if (stt) {
        updateSTTConfig(toSpeechToTextConfig(stt));
      }
      if (tts) {
        updateTTSConfig(toTextToSpeechConfig(tts));
      }
    },
    [updateWakeWordConfig, updateSTTConfig, updateTTSConfig]
  );

  const initialize = useCallback(async () => {
    if (isInitialized) return;

    try {
      setIsProcessing(true);

      if (isTauri) {
        const [audio, wake, stt, tts, langs, voices] = await Promise.all([
          invoke<RawAudioSessionSnapshot>('voice_get_audio_status').catch(() => null),
          invoke<RawWakeWordConfig>('voice_get_wake_word_config').catch(() => null),
          invoke<RawSpeechToTextConfig>('voice_get_stt_config').catch(() => null),
          invoke<RawTextToSpeechConfig>('voice_get_tts_config').catch(() => null),
          invoke<RawLanguageOption[]>('voice_get_supported_languages').catch(() => []),
          invoke<RawVoiceOption[]>('voice_get_available_voices').catch(() => []),
        ]);

        if (audio) {
          const snapshot = toAudioSessionSnapshot(audio);
          setAudioSession(snapshot);
          setMicrophoneStatus(snapshot.permissions);
        }

        await synchronizeConfigs(wake ?? undefined, stt ?? undefined, tts ?? undefined);

        setSupportedLanguages(langs?.map(lang => ({ ...lang })) ?? []);
        setAvailableVoices(voices?.map(voice => ({ ...voice })) ?? []);
      } else {
        establishWebSpeech();
        setSupportedLanguages([
          { code: 'en-US', name: 'English (US)', supported: true },
          { code: 'es-ES', name: 'Spanish', supported: true },
          { code: 'fr-FR', name: 'French', supported: true },
        ]);
        setAvailableVoices([
          { id: 'default', name: 'Default', language: 'en-US', gender: 'neutral' },
        ]);
        setMicrophoneStatus({ granted: true });
      }

      setIsInitialized(true);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(errorMsg);
      options.onError?.(errorMsg);
    } finally {
      setIsProcessing(false);
    }
  }, [
    establishWebSpeech,
    isInitialized,
    isTauri,
    options,
    setErrorMessage,
    setIsProcessing,
    synchronizeConfigs,
  ]);

  const updateWakeWordOnBackend = useCallback(async () => {
    if (!isTauri) return;
    try {
      await invoke('voice_update_wake_word_config', { config: toRawWakeWordConfig(settings.wakeWord) });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(errorMsg);
      options.onError?.(errorMsg);
    }
  }, [isTauri, options, setErrorMessage, settings.wakeWord]);

  const updateSTTOnBackend = useCallback(async () => {
    if (!isTauri) return;
    try {
      await invoke('voice_update_stt_config', { config: toRawSpeechToTextConfig(settings.stt) });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(errorMsg);
      options.onError?.(errorMsg);
    }
  }, [isTauri, options, setErrorMessage, settings.stt]);

  const updateTTSOnBackend = useCallback(async () => {
    if (!isTauri) return;
    try {
      await invoke('voice_update_tts_config', { config: toRawTextToSpeechConfig(settings.tts) });
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(errorMsg);
      options.onError?.(errorMsg);
    }
  }, [isTauri, options, setErrorMessage, settings.tts]);

  const startListening = useCallback(async () => {
    try {
      if (settings.privacyMode) {
        throw new Error('Unable to start voice pipeline while privacy mode is active.');
      }

      await ensureAudioContext();

      if (!microphoneStatus.granted) {
        const granted = await requestMicrophonePermission();
        if (!granted) {
          return;
        }
      }

      if (isTauri) {
        await invoke('voice_start_microphone');
        if (settings.wakeWord.enabled) {
          await invoke('voice_start_wake_word');
        }
        await invoke('voice_start_recognition');
        await refreshAudioSession();
      } else if (recognitionRef.current) {
        recognitionRef.current.start();
      }

      setIsListening(true);
      setErrorMessage(null);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setIsListening(false);
      setErrorMessage(errorMsg);
      options.onError?.(errorMsg);
    }
  }, [
    ensureAudioContext,
    isTauri,
    microphoneStatus.granted,
    options,
    refreshAudioSession,
    requestMicrophonePermission,
    setErrorMessage,
    setIsListening,
    settings.privacyMode,
    settings.wakeWord.enabled,
  ]);

  const stopListening = useCallback(async () => {
    try {
      if (isTauri) {
        await invoke('voice_stop_recognition');
        await invoke('voice_stop_wake_word');
        await invoke('voice_stop_microphone');
        await refreshAudioSession();
      } else if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      await suspendAudioContext();
      setIsListening(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(errorMsg);
      options.onError?.(errorMsg);
    }
  }, [
    isTauri,
    options,
    refreshAudioSession,
    setErrorMessage,
    setIsListening,
    suspendAudioContext,
  ]);

  const speak = useCallback(
    async (text: string) => {
      if (!text.trim()) return;

      try {
        if (!settings.tts.enabled) {
          return;
        }

        setIsProcessing(true);

        if (isTauri) {
          if (settings.confirmationPrompts) {
            await invoke('voice_speak', { text });
          } else {
            await invoke('voice_speak', { text });
          }
        } else if (typeof window !== 'undefined') {
          const synth = window.speechSynthesis;
          const speechWindow = window as typeof window & {
            SpeechSynthesisUtterance?: typeof SpeechSynthesisUtterance;
          };

          if (synth && speechWindow.SpeechSynthesisUtterance) {
            const utterance = new speechWindow.SpeechSynthesisUtterance(text);
            utterance.lang = settings.tts.language;
            utterance.pitch = settings.tts.pitch;
            utterance.rate = settings.tts.rate;
            utterance.volume = settings.tts.volume;
            synth.speak(utterance);
          }
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setErrorMessage(errorMsg);
        options.onError?.(errorMsg);
      } finally {
        setIsProcessing(false);
      }
    },
    [isTauri, options, setErrorMessage, setIsProcessing, settings]
  );

  const stopSpeaking = useCallback(async () => {
    try {
      if (isTauri) {
        await invoke('voice_stop_speaking');
      } else if (typeof window !== 'undefined' && window.speechSynthesis) {
        window.speechSynthesis.cancel();
      }
      setIsProcessing(false);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      setErrorMessage(errorMsg);
      options.onError?.(errorMsg);
    }
  }, [isTauri, options, setErrorMessage, setIsProcessing]);

  const simulateTranscription = useCallback(
    async (transcript: string, confidence = 0.96) => {
      try {
        let result: SpeechRecognitionResult;
        if (isTauri) {
          const raw = await invoke<RawSpeechRecognitionResult>('voice_simulate_transcription', {
            transcript,
            confidence,
          });
          result = toSpeechResult(raw);
        } else {
          result = {
            transcript,
            confidence,
            isFinal: true,
            alternatives: [],
            timestamp: Date.now(),
          };
        }

        setLastTranscript(result.transcript);
        options.onTranscript?.(result);
        return result;
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : String(err);
        setErrorMessage(errorMsg);
        options.onError?.(errorMsg);
        throw err;
      }
    },
    [isTauri, options, setErrorMessage, setLastTranscript]
  );

  const togglePrivacyMode = useCallback(
    (enabled: boolean) => {
      setPrivacyMode(enabled);
      if (enabled) {
        stopListening();
        stopSpeaking();
      }
    },
    [setPrivacyMode, stopListening, stopSpeaking]
  );

  useEffect(() => {
    initialize();
  }, [initialize]);

  useEffect(() => {
    if (!isInitialized) return;
    updateWakeWordOnBackend();
  }, [isInitialized, updateWakeWordOnBackend, settings.wakeWord]);

  useEffect(() => {
    if (!isInitialized) return;
    updateSTTOnBackend();
  }, [isInitialized, updateSTTOnBackend, settings.stt]);

  useEffect(() => {
    if (!isInitialized) return;
    updateTTSOnBackend();
  }, [isInitialized, updateTTSOnBackend, settings.tts]);

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        audioContextRef.current.close();
      }
    };
  }, []);

  return {
    isInitialized,
    microphoneStatus,
    audioSession,
    supportedLanguages,
    availableVoices,
    hasWebSpeech,
    requestMicrophonePermission,
    revokeMicrophonePermission,
    refreshAudioSession,
    startListening,
    stopListening,
    speak,
    stopSpeaking,
    simulateTranscription,
    togglePrivacyMode,
  };
}
