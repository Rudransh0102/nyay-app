import { useThemeStore } from '../store/useThemeStore';

export const darkColors = {
  primary: '#4DA6FF',
  accent: '#FF6B35',
  success: '#4ADE80',
  error: '#ff0000',
  warning: '#FBBF24',

  background: '#0A0A0A',
  surface: '#1A1A1A',
  surfaceLight: '#2A2A2A',
  text: '#F5F5F5',
  textSecondary: '#7A7A7A',
  textTertiary: '#4A4A4A',
  
  glassBackground: 'rgba(255, 255, 255, 0.05)',
  glassBorder: 'rgba(255, 255, 255, 0.1)',
  
  tabBar: '#0A0A0A',
  tabBarBorder: 'rgba(255, 255, 255, 0.08)',
  
  primaryLight: 'rgba(77, 166, 255, 0.15)',
  
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const lightColors = {
  primary: '#FF6B35', 
  accent: '#FF6B35',
  success: '#22C55E',
  error: '#EF4444',
  warning: '#F59E0B',

  background: '#F8F9FB',
  surface: '#FFFFFF',
  surfaceLight: '#F1F3F5',
  
  text: '#0A0A0A',
  textSecondary: '#4B5563',
  textTertiary: '#9CA3AF',
  
  glassBackground: 'rgba(255, 255, 255, 0.65)',
  glassBorder: 'rgba(0, 0, 0, 0.08)',
  
  tabBar: '#FFFFFF',
  tabBarBorder: '#E5E7EB',
  
  primaryLight: '#FFF1EB', 
  
  white: '#FFFFFF',
  black: '#000000',
  transparent: 'transparent',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  '2xl': 32,
  '3xl': 48,
};

export const borderRadius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  '2xl': 28,
  full: 9999,
};

export const typography = {
  fontFamily: {
    primary: 'System',
    mono: 'System',
  },
  fontSize: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    '2xl': 24,
    '3xl': 30,
    '4xl': 36,
  },
};

export const darkShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.3,
    shadowRadius: 2,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
};

export const lightShadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 4,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.12,
    shadowRadius: 24,
    elevation: 8,
  },
};

export const darkTheme = {
  colors: darkColors,
  spacing,
  borderRadius,
  typography,
  shadow: darkShadows,
  mode: 'dark' as const,
};

export const lightTheme = {
  colors: lightColors,
  spacing,
  borderRadius,
  typography,
  shadow: lightShadows,
  mode: 'light' as const,
};

export type Theme = typeof darkTheme;

export const useTheme = () => {
  const mode = useThemeStore((state) => state.mode);
  const theme = mode === 'dark' ? darkTheme : lightTheme;
  return theme;
};
