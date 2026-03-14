/**
 * Vortex 2.0 — Color System
 *
 * A modern color palette supporting both Light and Dark modes.
 */

const baseColors = {
  brand: {
    primary: '#6C5CE7',      // Vibrant purple
    primaryLight: '#A29BFE',
    primaryDark: '#4A3CB5',
    secondary: '#00D2D3',
    secondaryLight: '#55EFC4',
    gradient: ['#6C5CE7', '#00D2D3'] as const,
  },
  status: {
    success: '#00B894',
    successBg: 'rgba(0, 184, 148, 0.1)',
    warning: '#FDCB6E',
    warningBg: 'rgba(253, 203, 110, 0.1)',
    error: '#E17055',
    errorBg: 'rgba(225, 112, 85, 0.1)',
    info: '#74B9FF',
    infoBg: 'rgba(116, 185, 255, 0.1)',
  },
  crypto: {
    positive: '#00B894',
    negative: '#E17055',
    neutral: '#9CA3AF',
    eth: '#627EEA',
    matic: '#8247E5',
    usdt: '#26A17B',
    usdc: '#2775CA',
  },
};

export const lightColors = {
  ...baseColors,
  background: {
    primary: '#F9FAFB',      // Very light gray
    secondary: '#FFFFFF',    // White cards
    tertiary: '#F3F4F6',     // Elevated surfaces
    elevated: '#FFFFFF',     // Modals
  },
  text: {
    primary: '#111827',       // Near black
    secondary: '#4B5563',     // Dark gray
    tertiary: '#9CA3AF',      // Placeholder
    inverse: '#FFFFFF',       // Text on dark backgrounds
    brand: '#6C5CE7',
  },
  border: {
    primary: '#E5E7EB',
    secondary: '#D1D5DB',
    focus: '#6C5CE7',
  },
  overlay: {
    light: 'rgba(0, 0, 0, 0.05)',
    medium: 'rgba(0, 0, 0, 0.1)',
    dark: 'rgba(255, 255, 255, 0.5)',
    backdrop: 'rgba(0, 0, 0, 0.4)',
  },
};

export const darkColors = {
  ...baseColors,
  background: {
    primary: '#0A0A0F',
    secondary: '#12121A',
    tertiary: '#1A1A2E',
    elevated: '#222236',
  },
  text: {
    primary: '#FFFFFF',
    secondary: '#9CA3AF',
    tertiary: '#6B7280',
    inverse: '#0A0A0F',
    brand: '#6C5CE7',
  },
  border: {
    primary: '#2D2D44',
    secondary: '#3D3D5C',
    focus: '#6C5CE7',
  },
  overlay: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.1)',
    dark: 'rgba(0, 0, 0, 0.5)',
    backdrop: 'rgba(0, 0, 0, 0.7)',
  },
};

// Fallback for backwards compatibility outside the ThemeProvider context
export const colors = darkColors;
export type Colors = typeof darkColors;
