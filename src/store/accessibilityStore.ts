import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AccessibilityState {
  fontScale: number;
  highContrastMode: boolean;
  reducedMotion: boolean;
  screenReaderOptimizations: boolean;
  keyboardNavigationHints: boolean;
  focusIndicatorEnhanced: boolean;
  
  setFontScale: (scale: number) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleScreenReaderOptimizations: () => void;
  toggleKeyboardNavigationHints: () => void;
  toggleFocusIndicatorEnhanced: () => void;
  applyAccessibilitySettings: () => void;
  resetToDefaults: () => void;
}

const applyFontScale = (scale: number) => {
  const root = document.documentElement;
  root.style.setProperty('--font-scale', scale.toString());
  root.style.fontSize = `${16 * scale}px`;
};

const applyReducedMotion = (enabled: boolean) => {
  const root = document.documentElement;
  if (enabled) {
    root.style.setProperty('--motion-duration', '0.01ms');
    root.classList.add('reduce-motion');
  } else {
    root.style.removeProperty('--motion-duration');
    root.classList.remove('reduce-motion');
  }
};

const applyHighContrast = (enabled: boolean) => {
  const root = document.documentElement;
  if (enabled) {
    root.classList.add('high-contrast');
  } else {
    root.classList.remove('high-contrast');
  }
};

const applyEnhancedFocusIndicators = (enabled: boolean) => {
  const root = document.documentElement;
  if (enabled) {
    root.classList.add('enhanced-focus');
  } else {
    root.classList.remove('enhanced-focus');
  }
};

const applyKeyboardNavigationHints = (enabled: boolean) => {
  const root = document.documentElement;
  if (enabled) {
    root.classList.add('keyboard-hints');
  } else {
    root.classList.remove('keyboard-hints');
  }
};

export const useAccessibilityStore = create<AccessibilityState>()(
  persist(
    (set, get) => ({
      fontScale: 1.0,
      highContrastMode: false,
      reducedMotion: false,
      screenReaderOptimizations: false,
      keyboardNavigationHints: false,
      focusIndicatorEnhanced: false,
      
      setFontScale: (scale: number) => {
        const clampedScale = Math.max(1.0, Math.min(2.0, scale));
        set({ fontScale: clampedScale });
        applyFontScale(clampedScale);
      },
      
      toggleHighContrast: () => {
        set(state => {
          const newValue = !state.highContrastMode;
          applyHighContrast(newValue);
          return { highContrastMode: newValue };
        });
      },
      
      toggleReducedMotion: () => {
        set(state => {
          const newValue = !state.reducedMotion;
          applyReducedMotion(newValue);
          return { reducedMotion: newValue };
        });
      },
      
      toggleScreenReaderOptimizations: () => {
        set(state => ({ screenReaderOptimizations: !state.screenReaderOptimizations }));
      },
      
      toggleKeyboardNavigationHints: () => {
        set(state => {
          const newValue = !state.keyboardNavigationHints;
          applyKeyboardNavigationHints(newValue);
          return { keyboardNavigationHints: newValue };
        });
      },
      
      toggleFocusIndicatorEnhanced: () => {
        set(state => {
          const newValue = !state.focusIndicatorEnhanced;
          applyEnhancedFocusIndicators(newValue);
          return { focusIndicatorEnhanced: newValue };
        });
      },
      
      applyAccessibilitySettings: () => {
        const state = get();
        applyFontScale(state.fontScale);
        applyHighContrast(state.highContrastMode);
        applyReducedMotion(state.reducedMotion);
        applyEnhancedFocusIndicators(state.focusIndicatorEnhanced);
        applyKeyboardNavigationHints(state.keyboardNavigationHints);
      },
      
      resetToDefaults: () => {
        set({
          fontScale: 1.0,
          highContrastMode: false,
          reducedMotion: false,
          screenReaderOptimizations: false,
          keyboardNavigationHints: false,
          focusIndicatorEnhanced: false,
        });
        
        applyFontScale(1.0);
        applyHighContrast(false);
        applyReducedMotion(false);
        applyEnhancedFocusIndicators(false);
        applyKeyboardNavigationHints(false);
      },
    }),
    {
      name: 'accessibility-storage',
      version: 1,
      onRehydrateStorage: () => state => {
        if (state) {
          state.applyAccessibilitySettings();
        }
      },
    }
  )
);
