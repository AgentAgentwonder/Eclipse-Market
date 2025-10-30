import { useEffect, useState, useCallback } from 'react';
import { Theme, SharedTheme } from '../types/theme';
import { themePresets } from '../constants/themePresets';

const STORAGE_KEY = 'community-theme-gallery';

const createSharedTheme = (theme: Theme, overrides: Partial<SharedTheme> = {}): SharedTheme => ({
  theme,
  downloads: 0,
  rating: 4.8,
  tags: [],
  ...overrides,
});

const seedCommunityThemes = (): SharedTheme[] => {
  const timestamp = Date.now();
  return themePresets.slice(0, 3).map((preset, index) =>
    createSharedTheme(
      {
        id: `community-${preset.id}`,
        name: preset.name,
        colors: preset.colors,
        isCustom: false,
        createdAt: timestamp - index * 86400000,
        updatedAt: timestamp - index * 3600000,
        author: index === 0 ? 'A11y Collective' : index === 1 ? 'Darkroom DAO' : 'Aurora Labs',
        description: preset.description,
      },
      {
        downloads: 1200 - index * 240,
        rating: 4.8 - index * 0.2,
        tags: index === 0 ? ['light', 'clean'] : index === 1 ? ['dark', 'contrast'] : ['vibrant'],
      }
    )
  );
};

const loadCommunityThemes = (): SharedTheme[] => {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = seedCommunityThemes();
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }
    const parsed = JSON.parse(raw) as SharedTheme[];
    if (!Array.isArray(parsed)) {
      throw new Error('Invalid community themes format');
    }
    return parsed;
  } catch (error) {
    console.error('Failed to load community themes: ', error);
    return seedCommunityThemes();
  }
};

const persistCommunityThemes = (themes: SharedTheme[]) => {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(themes));
};

interface ShareThemePayload {
  author: string;
  description: string;
  tags?: string[];
}

export const useCommunityThemes = () => {
  const [communityThemes, setCommunityThemes] = useState<SharedTheme[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshThemes = useCallback(() => {
    try {
      setLoading(true);
      const themes = loadCommunityThemes();
      setCommunityThemes(themes);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load themes');
    } finally {
      setLoading(false);
    }
  }, []);

  const shareTheme = useCallback(
    (theme: Theme, payload: ShareThemePayload) => {
      const newTheme: Theme = {
        ...theme,
        id: `community-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        author: payload.author,
        description: payload.description,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isCustom: true,
      };

      setCommunityThemes(prev => {
        const next = [
          createSharedTheme(newTheme, {
            downloads: 0,
            rating: 5,
            tags: payload.tags ?? [],
          }),
          ...prev,
        ];
        persistCommunityThemes(next);
        return next;
      });
    },
    []
  );

  const recordDownload = useCallback((id: string) => {
    setCommunityThemes(prev => {
      const next = prev.map(entry =>
        entry.theme.id === id
          ? { ...entry, downloads: entry.downloads + 1, theme: { ...entry.theme, updatedAt: Date.now() } }
          : entry
      );
      persistCommunityThemes(next);
      return next;
    });
  }, []);

  useEffect(() => {
    refreshThemes();
  }, [refreshThemes]);

  return {
    communityThemes,
    loading,
    error,
    refreshThemes,
    shareTheme,
    recordDownload,
  };
};
