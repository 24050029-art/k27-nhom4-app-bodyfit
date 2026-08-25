/**
 * BodyFit Theme System
 * Premium wellness gradients, editorial contrast, and soft organic accents.
 */

import '@/global.css';
import { Platform } from 'react-native';

export const Colors = {
  light: {
    primary: '#FF9F1C',
    secondary: '#FFA200',
    accent: '#FF5E36',
    success: '#28C76F',
    warning: '#FF9F43',
    danger: '#FF4D4D',

    background: '#FAF7EF',
    backgroundSecondary: '#F0EAD8',

    card: 'rgba(255, 252, 244, 0.94)',
    cardBorder: 'rgba(255, 159, 28, 0.45)',
    cardShadow: '#FF9F1C',

    inputBg: 'rgba(255, 252, 244, 0.9)',
    inputBorder: 'rgba(255, 159, 28, 0.45)',

    text: '#1F211D',
    textSecondary: '#5E6655',
    textMuted: '#8B927D',

    tabBar: 'rgba(255, 252, 244, 0.86)',
    tabBarBorder: 'rgba(255, 159, 28, 0.15)',
    tabBarActive: '#1F211D',
    tabBarInactive: '#7B826E',

    divider: 'rgba(31, 33, 29, 0.08)',

    glowColor1: '#FF9F1C',
    glowColor2: '#FFA200',
    glowColor3: '#FF5E36',
    glowColor4: '#FF9F1C',

    modalBg: '#FFFFFF',
    modalOverlay: 'rgba(31, 33, 29, 0.5)',

    bottomSheetBg: '#FFFDF7',
    bottomSheetKnob: '#D8CEBA',
    bottomSheetItemBg: '#F6F0E2',
    bottomSheetItemBorder: '#E6DDC8',
    bottomSheetItemActiveBg: '#EEF5CF',
    bottomSheetItemActiveBorder: '#FF9F1C',

    backgroundSelected: 'rgba(255, 159, 28, 0.14)',
    backgroundElement: 'rgba(255, 252, 244, 0.86)',
  },

  dark: {
    primary: '#FF9F1C',
    secondary: '#FFA200',
    accent: '#FF5E36',
    success: '#28C76F',
    warning: '#FF9F43',
    danger: '#FF4D4D',

    background: '#100E0C',
    backgroundSecondary: '#1A1613',

    card: 'rgba(30, 26, 23, 0.76)',
    cardBorder: 'rgba(255, 159, 28, 0.15)',
    cardShadow: '#FF9F1C',

    inputBg: 'rgba(255, 255, 255, 0.04)',
    inputBorder: 'rgba(255, 255, 255, 0.08)',

    text: '#FFFFFF',
    textSecondary: '#E5E0D8',
    textMuted: '#A59E92',

    tabBar: 'rgba(16, 14, 12, 0.92)',
    tabBarBorder: 'rgba(255, 159, 28, 0.2)',
    tabBarActive: '#FF9F1C',
    tabBarInactive: '#756E63',

    divider: 'rgba(255, 255, 255, 0.08)',

    glowColor1: '#FF9F1C',
    glowColor2: '#FFA200',
    glowColor3: '#FF5E36',
    glowColor4: '#FF9F1C',

    modalBg: '#1E1A17',
    modalOverlay: 'rgba(0, 0, 0, 0.8)',

    bottomSheetBg: '#1E1A17',
    bottomSheetKnob: 'rgba(255, 255, 255, 0.15)',
    bottomSheetItemBg: 'rgba(255, 255, 255, 0.04)',
    bottomSheetItemBorder: 'rgba(255, 255, 255, 0.08)',
    bottomSheetItemActiveBg: 'rgba(255, 159, 28, 0.1)',
    bottomSheetItemActiveBorder: '#FF9F1C',

    backgroundSelected: 'rgba(255, 159, 28, 0.15)',
    backgroundElement: 'rgba(30, 26, 23, 0.76)',
  },
} as const;

export type ColorScheme = 'light' | 'dark';
export type ThemeColor = keyof typeof Colors.light;
export type ThemeColors = (typeof Colors)[ColorScheme];

export const Gradients = {
  primary: ['#FFC000', '#FF5E00'] as const,
  energy: ['#FF9F1C', '#FF5E36', '#FFA200'] as const,
  wellness: ['#28C76F', '#81FBB8'] as const,
  aiCoach: ['#FF9F1C', '#FF5E36', '#FFA200'] as const,
  performance: ['#1A1613', '#FF9F1C'] as const,
  darkSurface: ['#100E0C', '#1A1613', '#151311'] as const,
  lightSurface: ['#FAF7EF', '#F6F0E2', '#EAF3D1'] as const,
  nutrition: ['#FFA200', '#28C76F', '#81FBB8'] as const,
  achievement: ['#FFA200', '#FF5E36', '#FF9F1C'] as const,
} as const;

export const Fonts = Platform.select({
  ios: {
    sans: 'system-ui',
    serif: 'ui-serif',
    rounded: 'ui-rounded',
    mono: 'ui-monospace',
  },
  default: {
    sans: 'normal',
    serif: 'serif',
    rounded: 'normal',
    mono: 'monospace',
  },
  web: {
    sans: 'var(--font-display)',
    serif: 'var(--font-serif)',
    rounded: 'var(--font-rounded)',
    mono: 'var(--font-mono)',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

export const DEFAULT_AVATAR = 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=300&q=80';
