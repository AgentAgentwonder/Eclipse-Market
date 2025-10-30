import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Theme, ThemeColors, ThemeEffects } from '../types/theme';
import { createThemeFromPreset, DEFAULT_THEME_ID } from '../constants/themePresets';

interface ThemeState {
  currentTheme: Theme;
  customThemes: Theme[];
  
  setTheme: (themeId: string) => void;
  setThemeFromPreset: (presetId: string) => void;
  createCustomTheme: (name: string, colors: ThemeColors, effects?: ThemeEffects) => void;
  updateCustomTheme: (themeId: string, updates: Partial<Theme>) => void;
  deleteCustomTheme: (themeId: string) => void;
  exportTheme: (themeId: string) => string;
  importTheme: (themeJson: string) => void;
  applyThemeColors: () => void;
  setThemeEffects: (effects: ThemeEffects) => void;
}

const hexToRgb = (hex: string) => {
  const sanitized = hex.replace('#', '');
  const value = sanitized.length === 3
    ? sanitized.split('').map(char => char + char).join('')
    : sanitized;

  const int = parseInt(value, 16);
  return {
    r: (int >> 16) & 255,
    g: (int >> 8) & 255,
    b: int & 255,
  };
};

const rgba = (hex: string, alpha: number) => {
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

const applyColorsToDom = (colors: ThemeColors) => {
  const root = document.documentElement;
  
  // Apply CSS custom properties
  root.style.setProperty('--color-background', colors.background);
  root.style.setProperty('--color-background-secondary', colors.backgroundSecondary);
  root.style.setProperty('--color-background-tertiary', colors.backgroundTertiary);
  
  root.style.setProperty('--color-text', colors.text);
  root.style.setProperty('--color-text-secondary', colors.textSecondary);
  root.style.setProperty('--color-text-muted', colors.textMuted);
  
  root.style.setProperty('--color-primary', colors.primary);
  root.style.setProperty('--color-primary-hover', colors.primaryHover);
  root.style.setProperty('--color-primary-active', colors.primaryActive);
  
  root.style.setProperty('--color-accent', colors.accent);
  root.style.setProperty('--color-accent-hover', colors.accentHover);
  
  root.style.setProperty('--color-success', colors.success);
  root.style.setProperty('--color-warning', colors.warning);
  root.style.setProperty('--color-error', colors.error);
  root.style.setProperty('--color-info', colors.info);
  
  root.style.setProperty('--color-border', colors.border);
  root.style.setProperty('--color-border-hover', colors.borderHover);
  
  root.style.setProperty('--color-chart-bullish', colors.chartBullish);
  root.style.setProperty('--color-chart-bearish', colors.chartBearish);
  root.style.setProperty('--color-chart-neutral', colors.chartNeutral);
  
  root.style.setProperty('--color-gradient-start', colors.gradientStart);
  root.style.setProperty('--color-gradient-middle', colors.gradientMiddle);
  root.style.setProperty('--color-gradient-end', colors.gradientEnd);

  // Lunar Eclipse specific colors
  if (colors.deepSpace) {
    root.style.setProperty('--color-deep-space', colors.deepSpace);
  }
  if (colors.eclipseOrange) {
    root.style.setProperty('--color-eclipse-orange', colors.eclipseOrange);
  }
  if (colors.moonlightSilver) {
    root.style.setProperty('--color-moonlight-silver', colors.moonlightSilver);
  }
  if (colors.shadowAccent) {
    root.style.setProperty('--color-shadow-accent', colors.shadowAccent);
  }

  // Derived translucent surfaces
  root.style.setProperty('--color-background-secondary-80', rgba(colors.backgroundSecondary, 0.85));
  root.style.setProperty('--color-background-tertiary-60', rgba(colors.backgroundTertiary, 0.6));
  root.style.setProperty('--color-primary-20', rgba(colors.primary, 0.2));
  root.style.setProperty('--color-accent-20', rgba(colors.accent, 0.2));
};

const defaultEffects: ThemeEffects = {
  glowStrength: 'subtle',
  ambience: 'balanced',
  glassmorphism: true,
};

const glowStrengthToOpacity: Record<ThemeEffects['glowStrength'], number> = {
  none: 0,
  subtle: 0.2,
  normal: 0.4,
  strong: 0.65,
};

const ambienceToOpacity: Record<ThemeEffects['ambience'], number> = {
  minimal: 0.1,
  balanced: 0.25,
  immersive: 0.4,
};

const applyEffectsToDom = (effects?: ThemeEffects) => {
  const root = document.documentElement;
  const finalEffects = effects ?? defaultEffects;

  const glowStrength = glowStrengthToOpacity[finalEffects.glowStrength];
  const ambience = ambienceToOpacity[finalEffects.ambience];
  const glassOpacity = finalEffects.glassmorphism ? Math.min(0.85, 0.35 + ambience) : 0;
  const glassBorderOpacity = finalEffects.glassmorphism ? 0.22 : 0.08;

  root.style.setProperty('--effect-glow-strength', glowStrength.toString());
  root.style.setProperty('--effect-ambience', ambience.toString());
  root.style.setProperty('--effect-glass-enabled', finalEffects.glassmorphism ? '1' : '0');
  root.style.setProperty('--glass-opacity', glassOpacity.toString());
  root.style.setProperty('--glass-border-opacity', glassBorderOpacity.toString());

  if (finalEffects.glassmorphism) {
    root.classList.add('glass-enabled');
  } else {
    root.classList.remove('glass-enabled');
  }
};

const generateId = () => `custom-theme-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;

const defaultTheme = createThemeFromPreset(DEFAULT_THEME_ID);

export const useThemeStore = create<ThemeState>()(
  persist(
    (set, get) => ({
      currentTheme: defaultTheme,
      customThemes: [],
      
      setTheme: (themeId: string) => {
        const customTheme = get().customThemes.find(t => t.id === themeId);
        if (customTheme) {
          set({ currentTheme: customTheme });
          applyColorsToDom(customTheme.colors);
          applyEffectsToDom(customTheme.effects);
        } else {
          const theme = createThemeFromPreset(themeId);
          set({ currentTheme: theme });
          applyColorsToDom(theme.colors);
          applyEffectsToDom(theme.effects);
        }
      },
      
      setThemeFromPreset: (presetId: string) => {
        const theme = createThemeFromPreset(presetId);
        set({ currentTheme: theme });
        applyColorsToDom(theme.colors);
        applyEffectsToDom(theme.effects);
      },
      
      createCustomTheme: (name: string, colors: ThemeColors, effects?: ThemeEffects) => {
        const newTheme: Theme = {
          id: generateId(),
          name,
          colors,
          effects,
          isCustom: true,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        
        set(state => ({
          customThemes: [...state.customThemes, newTheme],
          currentTheme: newTheme,
        }));
        
        applyColorsToDom(colors);
        applyEffectsToDom(effects);
      },
      
      updateCustomTheme: (themeId: string, updates: Partial<Theme>) => {
        set(state => {
          const updatedThemes = state.customThemes.map(theme => 
            theme.id === themeId 
              ? { ...theme, ...updates, updatedAt: Date.now() } 
              : theme
          );
          
          const updatedTheme = updatedThemes.find(t => t.id === themeId);
          const isCurrentTheme = state.currentTheme.id === themeId;
          
          if (isCurrentTheme && updatedTheme) {
            applyColorsToDom(updatedTheme.colors);
            applyEffectsToDom(updatedTheme.effects);
            return {
              customThemes: updatedThemes,
              currentTheme: updatedTheme,
            };
          }
          
          return { customThemes: updatedThemes };
        });
      },
      
      deleteCustomTheme: (themeId: string) => {
        set(state => {
          const filteredThemes = state.customThemes.filter(t => t.id !== themeId);
          const isCurrentTheme = state.currentTheme.id === themeId;
          
          if (isCurrentTheme) {
            const fallbackTheme = createThemeFromPreset(DEFAULT_THEME_ID);
            applyColorsToDom(fallbackTheme.colors);
            applyEffectsToDom(fallbackTheme.effects);
            return {
              customThemes: filteredThemes,
              currentTheme: fallbackTheme,
            };
          }
          
          return { customThemes: filteredThemes };
        });
      },
      
      exportTheme: (themeId: string) => {
        const theme = get().customThemes.find(t => t.id === themeId) || get().currentTheme;
        return JSON.stringify(theme, null, 2);
      },
      
      importTheme: (themeJson: string) => {
        try {
          const imported = JSON.parse(themeJson) as Theme;
          const newTheme: Theme = {
            ...imported,
            id: generateId(),
            isCustom: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          
          set(state => ({
            customThemes: [...state.customThemes, newTheme],
            currentTheme: newTheme,
          }));
          
          applyColorsToDom(newTheme.colors);
          applyEffectsToDom(newTheme.effects);
        } catch (error) {
          console.error('Failed to import theme:', error);
          throw new Error('Invalid theme format');
        }
      },
      
      applyThemeColors: () => {
        const { currentTheme } = get();
        applyColorsToDom(currentTheme.colors);
        applyEffectsToDom(currentTheme.effects);
      },
      
      setThemeEffects: (effects: ThemeEffects) => {
        applyEffectsToDom(effects);
        set(state => {
          const updatedTheme: Theme = {
            ...state.currentTheme,
            effects,
            updatedAt: Date.now(),
          };
          
          if (state.currentTheme.isCustom) {
            const updatedCustomThemes = state.customThemes.map(theme =>
              theme.id === state.currentTheme.id ? updatedTheme : theme
            );
            return {
              currentTheme: updatedTheme,
              customThemes: updatedCustomThemes,
            };
          }
          
          return { currentTheme: updatedTheme };
        });
      },
    }),
    {
      name: 'theme-storage',
      version: 1,
      partialize: state => ({
        currentTheme: state.currentTheme,
        customThemes: state.customThemes,
      }),
      onRehydrateStorage: () => state => {
        if (state) {
          applyColorsToDom(state.currentTheme.colors);
          applyEffectsToDom(state.currentTheme.effects);
        }
      },
    }
  )
);
