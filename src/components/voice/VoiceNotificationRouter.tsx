import { useEffect, useRef, useCallback } from 'react';
import { invoke } from '@tauri-apps/api/tauri';
import { useVoiceStore } from '../../store/voiceStore';

interface VoiceNotificationRouterProps {
  enabled?: boolean;
}

export function VoiceNotificationRouter({ enabled = true }: VoiceNotificationRouterProps) {
  const {
    notificationSettings,
    pendingNotifications,
    dequeueNotification,
    speechConfig,
  } = useVoiceStore();

  const lastSpokenRef = useRef<number>(0);
  const notificationCountRef = useRef<number>(0);
  const minuteStartRef = useRef<number>(Date.now());

  const shouldSpeak = useCallback((priority: number): boolean => {
    if (!enabled || !notificationSettings.enabled) {
      return false;
    }

    const now = Date.now();

    // Reset counter if minute has passed
    if (now - minuteStartRef.current >= 60000) {
      notificationCountRef.current = 0;
      minuteStartRef.current = now;
    }

    // Check rate limiting
    if (notificationCountRef.current >= notificationSettings.maxNotificationsPerMinute) {
      return false;
    }

    // Check priority threshold
    const threshold = {
      all: 0,
      important: 5,
      critical: 10,
    }[notificationSettings.frequency];

    if (priority < threshold) {
      return false;
    }

    // Check minimum time between notifications (1 second)
    if (now - lastSpokenRef.current < 1000) {
      return false;
    }

    return true;
  }, [enabled, notificationSettings]);

  const speak = useCallback(
    async (message: string) => {
      try {
        // Browser speech synthesis
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();

          const utterance = new SpeechSynthesisUtterance(message);
          utterance.rate = notificationSettings.rate;
          utterance.pitch = notificationSettings.pitch;
          utterance.volume = notificationSettings.volume;
          utterance.lang = speechConfig.lang;

          if (speechConfig.voice) {
            utterance.voice = speechConfig.voice;
          }

          // In driving mode, speak slower and clearer
          if (notificationSettings.drivingMode) {
            utterance.rate = Math.max(0.8, notificationSettings.rate - 0.2);
            utterance.volume = Math.min(1.0, notificationSettings.volume + 0.1);
          }

          window.speechSynthesis.speak(utterance);
        }

        // Also use platform-specific TTS
        await invoke('synthesize_speech', {
          text: message,
          voice: speechConfig.voice?.name || notificationSettings.voice,
          rate: notificationSettings.rate,
          pitch: notificationSettings.pitch,
        });

        lastSpokenRef.current = Date.now();
        notificationCountRef.current += 1;
      } catch (error) {
        console.error('Speech synthesis error:', error);
      }
    },
    [notificationSettings, speechConfig]
  );

  // Process pending notifications
  useEffect(() => {
    if (!enabled || pendingNotifications.length === 0) {
      return;
    }

    const processNotifications = async () => {
      const notification = pendingNotifications[0];
      
      if (shouldSpeak(notification.priority)) {
        let message = notification.message;

        // Format message for driving mode (more concise)
        if (notificationSettings.drivingMode) {
          message = formatForDrivingMode(message);
        }

        await speak(message);
        dequeueNotification(notification.id);
      }
    };

    // Small delay to batch notifications
    const timeoutId = setTimeout(processNotifications, 100);

    return () => clearTimeout(timeoutId);
  }, [enabled, pendingNotifications, shouldSpeak, speak, dequeueNotification, notificationSettings.drivingMode]);

  return null;
}

function formatForDrivingMode(message: string): string {
  // Simplify messages for driving safety
  const simplified = message
    .replace(/approximately/gi, 'about')
    .replace(/successfully/gi, '')
    .replace(/transaction/gi, 'trade')
    .replace(/\$([0-9,]+\.[0-9]{2})/g, '$1 dollars')
    .trim();

  return simplified;
}
