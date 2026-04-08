/**
 * Vortex 2.0 — Color System
 *
 * Premium dark-first palette with #FF7062 coral accent.
 * Supports Light and Dark modes.
 */

const baseColors = {
  brand: {
    primary: '#FF7062',       // Coral accent
    primaryLight: '#FF9A90',
    primaryDark: '#E5544A',
    secondary: '#4ECDC4',     // Soft teal
    secondaryLight: '#7EDDD6',
    gradient: ['#FF7062', '#E5544A'] as const,
  },
  status: {
    success: '#00C48C',
    successBg: 'rgba(0, 196, 140, 0.10)',
    warning: '#FFB946',
    warningBg: 'rgba(255, 185, 70, 0.10)',
    error: '#FF6B6B',
    errorBg: 'rgba(255, 107, 107, 0.10)',
    info: '#64B5F6',
    infoBg: 'rgba(100, 181, 246, 0.10)',
  },
  crypto: {
    positive: '#00C48C',
    negative: '#FF6B6B',
    neutral: '#6B7280',
    eth: '#627EEA',
    matic: '#8247E5',
    usdt: '#26A17B',
    usdc: '#2775CA',
  },
};

export const lightColors = {
  ...baseColors,
  background: {
    primary: '#F5F5F7',
    secondary: '#FFFFFF',
    tertiary: '#EBEBF0',
    elevated: '#FFFFFF',
  },
  text: {
    primary: '#1C1C1E',
    secondary: '#636366',
    tertiary: '#AEAEB2',
    inverse: '#FFFFFF',
    brand: '#FF7062',
  },
  border: {
    primary: '#E5E5EA',
    secondary: '#D1D1D6',
    focus: '#FF7062',
  },
  overlay: {
    light: 'rgba(0, 0, 0, 0.04)',
    medium: 'rgba(0, 0, 0, 0.08)',
    dark: 'rgba(255, 255, 255, 0.5)',
    backdrop: 'rgba(0, 0, 0, 0.4)',
  },
};

export const darkColors = {
  ...baseColors,
  background: {
    primary: '#0F0F12',
    secondary: '#1A1B1F',
    tertiary: '#242530',
    elevated: '#2D2E38',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#A0A3AD',
    tertiary: '#6B7280',
    inverse: '#0F0F12',
    brand: '#FF7062',
  },
  border: {
    primary: '#2A2B30',
    secondary: '#3A3B42',
    focus: '#FF7062',
  },
  overlay: {
    light: 'rgba(255, 255, 255, 0.04)',
    medium: 'rgba(255, 255, 255, 0.08)',
    dark: 'rgba(0, 0, 0, 0.5)',
    backdrop: 'rgba(0, 0, 0, 0.7)',
  },
};

// Fallback for backwards compatibility outside the ThemeProvider context
export const colors = darkColors;
export type Colors = typeof darkColors;
