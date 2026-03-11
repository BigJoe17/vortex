/**
 * Vortex 2.0 — Color System
 *
 * A premium dark-mode-first palette designed for a financial app.
 * Colors use HSL values for easy manipulation and consistency.
 */

export const colors = {
  // ── Brand ──────────────────────────────────────
  brand: {
    primary: '#6C5CE7',      // Vibrant purple — main accent
    primaryLight: '#A29BFE',  // Light purple — hover/active states
    primaryDark: '#4A3CB5',   // Deep purple — pressed states
    secondary: '#00D2D3',     // Teal — secondary accent
    secondaryLight: '#55EFC4', // Mint — success states
    gradient: ['#6C5CE7', '#00D2D3'] as const, // Primary gradient
  },

  // ── Background ─────────────────────────────────
  background: {
    primary: '#0A0A0F',      // Near-black — main background
    secondary: '#12121A',    // Slightly lighter — card backgrounds
    tertiary: '#1A1A2E',     // Elevated surfaces
    elevated: '#222236',     // Modal/sheet backgrounds
  },

  // ── Text ───────────────────────────────────────
  text: {
    primary: '#FFFFFF',       // Primary text
    secondary: '#9CA3AF',     // Secondary/muted text
    tertiary: '#6B7280',      // Placeholder text
    inverse: '#0A0A0F',       // Text on light backgrounds
    brand: '#6C5CE7',         // Brand-colored text
  },

  // ── Border ─────────────────────────────────────
  border: {
    primary: '#2D2D44',       // Default borders
    secondary: '#3D3D5C',     // Emphasized borders
    focus: '#6C5CE7',         // Focus ring
  },

  // ── Status ─────────────────────────────────────
  status: {
    success: '#00B894',       // Green — success
    successBg: 'rgba(0, 184, 148, 0.1)',
    warning: '#FDCB6E',       // Yellow — warning
    warningBg: 'rgba(253, 203, 110, 0.1)',
    error: '#E17055',         // Red — error/loss
    errorBg: 'rgba(225, 112, 85, 0.1)',
    info: '#74B9FF',          // Blue — info
    infoBg: 'rgba(116, 185, 255, 0.1)',
  },

  // ── Crypto-specific ────────────────────────────
  crypto: {
    positive: '#00B894',      // Price up
    negative: '#E17055',      // Price down
    neutral: '#9CA3AF',       // No change
    eth: '#627EEA',           // Ethereum brand
    matic: '#8247E5',         // Polygon brand
    usdt: '#26A17B',          // USDT brand
    usdc: '#2775CA',          // USDC brand
  },

  // ── Overlay ────────────────────────────────────
  overlay: {
    light: 'rgba(255, 255, 255, 0.05)',
    medium: 'rgba(255, 255, 255, 0.1)',
    dark: 'rgba(0, 0, 0, 0.5)',
    backdrop: 'rgba(0, 0, 0, 0.7)',
  },
} as const;

export type Colors = typeof colors;
