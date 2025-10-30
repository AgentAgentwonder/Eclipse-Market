export interface ThemeColors {
  // Background colors
  background: string;
  backgroundSecondary: string;
  backgroundTertiary: string;
  
  // Text colors
  text: string;
  textSecondary: string;
  textMuted: string;
  
  // Primary brand colors
  primary: string;
  primaryHover: string;
  primaryActive: string;
  
  // Accent colors
  accent: string;
  accentHover: string;
  
  // Status colors
  success: string;
  warning: string;
  error: string;
  info: string;
  
  // Border colors
  border: string;
  borderHover: string;
  
  // Chart colors
  chartBullish: string;
  chartBearish: string;
  chartNeutral: string;
  
  // Gradient stops
  gradientStart: string;
  gradientMiddle: string;
  gradientEnd: string;
  
  // Lunar Eclipse additions
  deepSpace?: string;
  eclipseOrange?: string;
  moonlightSilver?: string;
  shadowAccent?: string;
}

export interface ThemeEffects {
  glowStrength: 'none' | 'subtle' | 'normal' | 'strong';
  ambience: 'minimal' | 'balanced' | 'immersive';
  glassmorphism: boolean;
}

export interface Theme {
  id: string;
  name: string;
  colors: ThemeColors;
  effects?: ThemeEffects;
  isCustom: boolean;
  createdAt: number;
  updatedAt: number;
  author?: string;
  description?: string;
  bestFor?: string;
}

export interface ThemePreset {
  id: string;
  name: string;
  description: string;
  bestFor?: string;
  colors: ThemeColors;
  effects?: ThemeEffects;
  preview?: string;
}

export interface SharedTheme {
  theme: Theme;
  downloads: number;
  rating: number;
  tags: string[];
}
