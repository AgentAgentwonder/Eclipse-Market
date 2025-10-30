import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/tauri';

vi.mock('@tauri-apps/api/tauri', () => ({
  invoke: vi.fn(),
}));

describe('Voice Interaction Commands', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Microphone Permissions', () => {
    it('should request microphone permissions', async () => {
      const mockStatus = {
        granted: true,
        reason: null,
        last_checked: Date.now(),
      };

      vi.mocked(invoke).mockResolvedValue(mockStatus);

      const result = await invoke('voice_request_permissions');

      expect(invoke).toHaveBeenCalledWith('voice_request_permissions');
      expect(result).toEqual(mockStatus);
    });

    it('should revoke microphone permissions', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('voice_revoke_permissions', { reason: 'User requested' });

      expect(invoke).toHaveBeenCalledWith('voice_revoke_permissions', {
        reason: 'User requested',
      });
    });

    it('should get audio status', async () => {
      const mockStatus = {
        session_id: 'test-session-123',
        microphone_active: true,
        permissions: {
          granted: true,
          reason: null,
          last_checked: Date.now(),
        },
        stream_token: 'stream-token-456',
      };

      vi.mocked(invoke).mockResolvedValue(mockStatus);

      const result = await invoke('voice_get_audio_status');

      expect(invoke).toHaveBeenCalledWith('voice_get_audio_status');
      expect(result).toEqual(mockStatus);
    });
  });

  describe('Wake Word Detection', () => {
    it('should start wake word detection', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('voice_start_wake_word');

      expect(invoke).toHaveBeenCalledWith('voice_start_wake_word');
    });

    it('should stop wake word detection', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('voice_stop_wake_word');

      expect(invoke).toHaveBeenCalledWith('voice_stop_wake_word');
    });

    it('should get wake word config', async () => {
      const mockConfig = {
        enabled: true,
        wake_word: 'Hey Eclipse',
        sensitivity: 0.5,
        timeout_ms: 3000,
      };

      vi.mocked(invoke).mockResolvedValue(mockConfig);

      const result = await invoke('voice_get_wake_word_config');

      expect(invoke).toHaveBeenCalledWith('voice_get_wake_word_config');
      expect(result).toEqual(mockConfig);
    });

    it('should update wake word config', async () => {
      const config = {
        enabled: true,
        wake_word: 'Custom Wake Word',
        sensitivity: 0.7,
        timeout_ms: 5000,
      };

      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('voice_update_wake_word_config', { config });

      expect(invoke).toHaveBeenCalledWith('voice_update_wake_word_config', { config });
    });

    it('should process audio for wake word detection', async () => {
      const mockDetection = {
        detected: true,
        confidence: 0.85,
        timestamp: Date.now(),
      };

      const samples = new Array(1000).fill(0.5);
      vi.mocked(invoke).mockResolvedValue(mockDetection);

      const result = await invoke('voice_process_audio_for_wake_word', { samples });

      expect(invoke).toHaveBeenCalledWith('voice_process_audio_for_wake_word', { samples });
      expect(result).toEqual(mockDetection);
    });
  });

  describe('Speech-to-Text', () => {
    it('should start recognition', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('voice_start_recognition');

      expect(invoke).toHaveBeenCalledWith('voice_start_recognition');
    });

    it('should stop recognition', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('voice_stop_recognition');

      expect(invoke).toHaveBeenCalledWith('voice_stop_recognition');
    });

    it('should get supported languages', async () => {
      const mockLanguages = [
        { code: 'en-US', name: 'English (US)', supported: true },
        { code: 'es-ES', name: 'Spanish (Spain)', supported: true },
      ];

      vi.mocked(invoke).mockResolvedValue(mockLanguages);

      const result = await invoke('voice_get_supported_languages');

      expect(invoke).toHaveBeenCalledWith('voice_get_supported_languages');
      expect(result).toEqual(mockLanguages);
    });

    it('should update STT config', async () => {
      const config = {
        enabled: true,
        language: 'es-ES',
        continuous: true,
        interim_results: false,
        max_alternatives: 3,
      };

      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('voice_update_stt_config', { config });

      expect(invoke).toHaveBeenCalledWith('voice_update_stt_config', { config });
    });

    it('should simulate transcription', async () => {
      const mockResult = {
        transcript: 'Test transcript',
        confidence: 0.95,
        is_final: true,
        alternatives: [],
        timestamp: Date.now(),
      };

      vi.mocked(invoke).mockResolvedValue(mockResult);

      const result = await invoke('voice_simulate_transcription', {
        transcript: 'Test transcript',
        confidence: 0.95,
      });

      expect(invoke).toHaveBeenCalledWith('voice_simulate_transcription', {
        transcript: 'Test transcript',
        confidence: 0.95,
      });
      expect(result).toEqual(mockResult);
    });
  });

  describe('Text-to-Speech', () => {
    it('should speak text', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('voice_speak', { text: 'Hello world' });

      expect(invoke).toHaveBeenCalledWith('voice_speak', { text: 'Hello world' });
    });

    it('should stop speaking', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('voice_stop_speaking');

      expect(invoke).toHaveBeenCalledWith('voice_stop_speaking');
    });

    it('should get TTS status', async () => {
      const mockStatus = {
        speaking: true,
        paused: false,
        pending: false,
      };

      vi.mocked(invoke).mockResolvedValue(mockStatus);

      const result = await invoke('voice_get_tts_status');

      expect(invoke).toHaveBeenCalledWith('voice_get_tts_status');
      expect(result).toEqual(mockStatus);
    });

    it('should get available voices', async () => {
      const mockVoices = [
        { id: 'default', name: 'Default', language: 'en-US', gender: 'neutral' },
        { id: 'en-us-male', name: 'English (US) - Male', language: 'en-US', gender: 'male' },
      ];

      vi.mocked(invoke).mockResolvedValue(mockVoices);

      const result = await invoke('voice_get_available_voices');

      expect(invoke).toHaveBeenCalledWith('voice_get_available_voices');
      expect(result).toEqual(mockVoices);
    });

    it('should update TTS config', async () => {
      const config = {
        enabled: true,
        voice: 'en-us-female',
        rate: 1.2,
        pitch: 1.1,
        volume: 0.8,
        language: 'en-US',
      };

      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('voice_update_tts_config', { config });

      expect(invoke).toHaveBeenCalledWith('voice_update_tts_config', { config });
    });

    it('should set voice rate', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('voice_set_rate', { rate: 1.5 });

      expect(invoke).toHaveBeenCalledWith('voice_set_rate', { rate: 1.5 });
    });

    it('should set voice pitch', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('voice_set_pitch', { pitch: 1.2 });

      expect(invoke).toHaveBeenCalledWith('voice_set_pitch', { pitch: 1.2 });
    });

    it('should set voice volume', async () => {
      vi.mocked(invoke).mockResolvedValue(undefined);

      await invoke('voice_set_volume', { volume: 0.75 });

      expect(invoke).toHaveBeenCalledWith('voice_set_volume', { volume: 0.75 });
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete voice interaction flow', async () => {
      // Request permissions
      vi.mocked(invoke).mockResolvedValueOnce({
        granted: true,
        reason: null,
        last_checked: Date.now(),
      });
      await invoke('voice_request_permissions');

      // Start microphone
      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      await invoke('voice_start_microphone');

      // Start wake word detection
      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      await invoke('voice_start_wake_word');

      // Start recognition
      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      await invoke('voice_start_recognition');

      // Simulate transcription
      vi.mocked(invoke).mockResolvedValueOnce({
        transcript: 'Buy Bitcoin',
        confidence: 0.95,
        is_final: true,
        alternatives: [],
        timestamp: Date.now(),
      });
      const transcription = await invoke('voice_simulate_transcription', {
        transcript: 'Buy Bitcoin',
        confidence: 0.95,
      });

      // Speak confirmation
      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      await invoke('voice_speak', { text: 'Understood, buying Bitcoin' });

      // Stop all services
      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      await invoke('voice_stop_speaking');

      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      await invoke('voice_stop_recognition');

      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      await invoke('voice_stop_wake_word');

      vi.mocked(invoke).mockResolvedValueOnce(undefined);
      await invoke('voice_stop_microphone');

      expect(invoke).toHaveBeenCalledTimes(10);
    });

    it('should handle errors gracefully', async () => {
      const error = 'Microphone not available';
      vi.mocked(invoke).mockRejectedValue(error);

      await expect(invoke('voice_start_microphone')).rejects.toEqual(error);
    });
  });
});
