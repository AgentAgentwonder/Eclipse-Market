import { useState, useEffect, useCallback } from 'react';

export interface ChartSettings {
  intervalMs: number;
  maxDataPoints: number;
  enabled: boolean;
}

const STORAGE_KEY = 'realtime_chart_settings';

const DEFAULT_SETTINGS: ChartSettings = {
  intervalMs: 1000, // 1 second
  maxDataPoints: 1000,
  enabled: true,
};

export function useChartSettings() {
  const [settings, setSettings] = useState<ChartSettings>(() => {
    if (typeof window === 'undefined') return DEFAULT_SETTINGS;

    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return DEFAULT_SETTINGS;
      return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
    } catch (err) {
      console.error('Failed to load chart settings:', err);
      return DEFAULT_SETTINGS;
    }
  });

  const updateSettings = useCallback((updates: Partial<ChartSettings>) => {
    setSettings(prev => {
      const updated = { ...prev, ...updates };

      // Persist to localStorage
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        } catch (err) {
          console.error('Failed to save chart settings:', err);
        }
      }

      return updated;
    });
  }, []);

  const resetSettings = useCallback(() => {
    setSettings(DEFAULT_SETTINGS);
    if (typeof window !== 'undefined') {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch (err) {
        console.error('Failed to reset chart settings:', err);
      }
    }
  }, []);

  return {
    settings,
    updateSettings,
    resetSettings,
  };
}
