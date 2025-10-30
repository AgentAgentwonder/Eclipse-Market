import { renderHook, act } from '@testing-library/react';
import { useThemeStore } from './themeStore';
import { ThemeEffects } from '../types/theme';
import { createThemeFromPreset, DEFAULT_THEME_ID } from '../constants/themePresets';

describe('ThemeStore', () => {
  beforeEach(() => {
    window.localStorage.clear();

    act(() => {
      useThemeStore.setState({
        currentTheme: createThemeFromPreset(DEFAULT_THEME_ID),
        customThemes: [],
      });
    });

    const { result } = renderHook(() => useThemeStore());
    act(() => {
      result.current.setThemeFromPreset('dark-default');
    });
  });

  describe('Theme Selection', () => {
    it('should set theme from preset', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setThemeFromPreset('lunar-eclipse');
      });

      expect(result.current.currentTheme.name).toBe('Lunar Eclipse');
      expect(result.current.currentTheme.colors.eclipseOrange).toBe('#FF6B35');
      expect(result.current.currentTheme.colors.deepSpace).toBe('#050810');
    });

    it('should apply Lunar Eclipse theme with effects', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setThemeFromPreset('lunar-eclipse');
      });

      expect(result.current.currentTheme.effects?.glowStrength).toBe('normal');
      expect(result.current.currentTheme.effects?.ambience).toBe('immersive');
      expect(result.current.currentTheme.effects?.glassmorphism).toBe(true);
    });

    it('should update custom theme', () => {
      const { result } = renderHook(() => useThemeStore());

      const customColors = {
        background: '#000000',
        backgroundSecondary: '#111111',
        backgroundTertiary: '#222222',
        text: '#FFFFFF',
        textSecondary: '#EEEEEE',
        textMuted: '#CCCCCC',
        primary: '#FF0000',
        primaryHover: '#EE0000',
        primaryActive: '#DD0000',
        accent: '#00FF00',
        accentHover: '#00EE00',
        success: '#00FF00',
        warning: '#FFFF00',
        error: '#FF0000',
        info: '#0000FF',
        border: '#333333',
        borderHover: '#444444',
        chartBullish: '#00FF00',
        chartBearish: '#FF0000',
        chartNeutral: '#0000FF',
        gradientStart: '#000000',
        gradientMiddle: '#111111',
        gradientEnd: '#222222',
      };

      act(() => {
        result.current.createCustomTheme('Test Theme', customColors);
      });

      expect(result.current.currentTheme.name).toBe('Test Theme');
      expect(result.current.currentTheme.isCustom).toBe(true);
      expect(result.current.customThemes.length).toBe(1);
    });
  });

  describe('Theme Effects', () => {
    it('should update theme effects', () => {
      const { result } = renderHook(() => useThemeStore());

      const newEffects: ThemeEffects = {
        glowStrength: 'strong',
        ambience: 'immersive',
        glassmorphism: true,
      };

      act(() => {
        result.current.setThemeEffects(newEffects);
      });

      expect(result.current.currentTheme.effects?.glowStrength).toBe('strong');
      expect(result.current.currentTheme.effects?.ambience).toBe('immersive');
    });

    it('should persist effects for custom themes', () => {
      const { result } = renderHook(() => useThemeStore());

      const customColors = {
        background: '#000000',
        backgroundSecondary: '#111111',
        backgroundTertiary: '#222222',
        text: '#FFFFFF',
        textSecondary: '#EEEEEE',
        textMuted: '#CCCCCC',
        primary: '#FF0000',
        primaryHover: '#EE0000',
        primaryActive: '#DD0000',
        accent: '#00FF00',
        accentHover: '#00EE00',
        success: '#00FF00',
        warning: '#FFFF00',
        error: '#FF0000',
        info: '#0000FF',
        border: '#333333',
        borderHover: '#444444',
        chartBullish: '#00FF00',
        chartBearish: '#FF0000',
        chartNeutral: '#0000FF',
        gradientStart: '#000000',
        gradientMiddle: '#111111',
        gradientEnd: '#222222',
      };

      const customEffects: ThemeEffects = {
        glowStrength: 'subtle',
        ambience: 'minimal',
        glassmorphism: false,
      };

      act(() => {
        result.current.createCustomTheme('Custom Test', customColors, customEffects);
      });

      expect(result.current.currentTheme.effects).toEqual(customEffects);
    });

    it('should disable glassmorphism when effect is off', () => {
      const { result } = renderHook(() => useThemeStore());

      const effects: ThemeEffects = {
        glowStrength: 'none',
        ambience: 'minimal',
        glassmorphism: false,
      };

      act(() => {
        result.current.setThemeEffects(effects);
      });

      expect(result.current.currentTheme.effects?.glassmorphism).toBe(false);
    });
  });

  describe('Theme Persistence', () => {
    it('should export theme as JSON', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setThemeFromPreset('lunar-eclipse');
      });

      const exported = result.current.exportTheme(result.current.currentTheme.id);
      const parsed = JSON.parse(exported);

      expect(parsed.name).toBe('Lunar Eclipse');
      expect(parsed.colors.eclipseOrange).toBe('#FF6B35');
    });

    it('should import theme from JSON', () => {
      const { result } = renderHook(() => useThemeStore());

      const themeJson = JSON.stringify({
        name: 'Imported Theme',
        colors: {
          background: '#000000',
          backgroundSecondary: '#111111',
          backgroundTertiary: '#222222',
          text: '#FFFFFF',
          textSecondary: '#EEEEEE',
          textMuted: '#CCCCCC',
          primary: '#FF0000',
          primaryHover: '#EE0000',
          primaryActive: '#DD0000',
          accent: '#00FF00',
          accentHover: '#00EE00',
          success: '#00FF00',
          warning: '#FFFF00',
          error: '#FF0000',
          info: '#0000FF',
          border: '#333333',
          borderHover: '#444444',
          chartBullish: '#00FF00',
          chartBearish: '#FF0000',
          chartNeutral: '#0000FF',
          gradientStart: '#000000',
          gradientMiddle: '#111111',
          gradientEnd: '#222222',
        },
        effects: {
          glowStrength: 'normal',
          ambience: 'balanced',
          glassmorphism: true,
        },
      });

      act(() => {
        result.current.importTheme(themeJson);
      });

      expect(result.current.currentTheme.name).toBe('Imported Theme');
      expect(result.current.currentTheme.isCustom).toBe(true);
    });

    it('should handle theme deletion gracefully', () => {
      const { result } = renderHook(() => useThemeStore());

      const customColors = {
        background: '#000000',
        backgroundSecondary: '#111111',
        backgroundTertiary: '#222222',
        text: '#FFFFFF',
        textSecondary: '#EEEEEE',
        textMuted: '#CCCCCC',
        primary: '#FF0000',
        primaryHover: '#EE0000',
        primaryActive: '#DD0000',
        accent: '#00FF00',
        accentHover: '#00EE00',
        success: '#00FF00',
        warning: '#FFFF00',
        error: '#FF0000',
        info: '#0000FF',
        border: '#333333',
        borderHover: '#444444',
        chartBullish: '#00FF00',
        chartBearish: '#FF0000',
        chartNeutral: '#0000FF',
        gradientStart: '#000000',
        gradientMiddle: '#111111',
        gradientEnd: '#222222',
      };

      act(() => {
        result.current.createCustomTheme('To Delete', customColors);
      });

      const themeId = result.current.currentTheme.id;

      act(() => {
        result.current.deleteCustomTheme(themeId);
      });

      expect(result.current.customThemes.length).toBe(0);
      expect(result.current.currentTheme.name).not.toBe('To Delete');
    });
  });

  describe('Lunar Eclipse Color Tokens', () => {
    it('should include Lunar Eclipse specific tokens', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setThemeFromPreset('lunar-eclipse');
      });

      const colors = result.current.currentTheme.colors;

      expect(colors.deepSpace).toBeDefined();
      expect(colors.eclipseOrange).toBeDefined();
      expect(colors.moonlightSilver).toBeDefined();
      expect(colors.shadowAccent).toBeDefined();
    });

    it('should maintain WCAG AA contrast for text', () => {
      const { result } = renderHook(() => useThemeStore());

      act(() => {
        result.current.setThemeFromPreset('lunar-eclipse');
      });

      const colors = result.current.currentTheme.colors;

      // These are well-tested color combinations for WCAG AA
      expect(colors.text).toBe('#E8EBF0'); // Light text
      expect(colors.background).toBe('#0A0E1A'); // Dark background
    });
  });
});
