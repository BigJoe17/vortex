/**
 * Vortex 2.0 — Typography System
 *
 * Premium Web3 typography with display, heading, body, label, and mono scales.
 * Uses system fonts for maximum compatibility.
 */

import {Platform, TextStyle} from 'react-native';

const fontFamily = Platform.select({
  ios: 'System',
  android: 'Roboto',
  default: 'System',
});

const fontFamilyMono = Platform.select({
  ios: 'Menlo',
  android: 'monospace',
  default: 'monospace',
});

export const typography = {
  // ── Display ────────────────────────────────────
  displayLarge: {
    fontFamily,
    fontSize: 40,
    lineHeight: 48,
    fontWeight: '700',
    letterSpacing: -0.5,
  } as TextStyle,

  displayMedium: {
    fontFamily,
    fontSize: 32,
    lineHeight: 40,
    fontWeight: '700',
    letterSpacing: -0.3,
  } as TextStyle,

  // ── Balance (new — large wallet balance) ───────
  balanceDisplay: {
    fontFamily,
    fontSize: 48,
    lineHeight: 56,
    fontWeight: '800',
    letterSpacing: -1,
  } as TextStyle,

  balanceSmall: {
    fontFamily,
    fontSize: 14,
    lineHeight: 18,
    fontWeight: '600',
    letterSpacing: 0,
  } as TextStyle,

  // ── Heading ────────────────────────────────────
  headingLarge: {
    fontFamily,
    fontSize: 22,
    lineHeight: 28,
    fontWeight: '700',
    letterSpacing: -0.3,
  } as TextStyle,

  headingMedium: {
    fontFamily,
    fontSize: 18,
    lineHeight: 24,
    fontWeight: '600',
    letterSpacing: -0.1,
  } as TextStyle,

  headingSmall: {
    fontFamily,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
  } as TextStyle,

  // ── Body ───────────────────────────────────────
  bodyLarge: {
    fontFamily,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  } as TextStyle,

  bodyMedium: {
    fontFamily,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  } as TextStyle,

  bodySmall: {
    fontFamily,
    fontSize: 12,
    lineHeight: 16,
    fontWeight: '400',
  } as TextStyle,

  // ── Label ──────────────────────────────────────
  labelLarge: {
    fontFamily,
    fontSize: 15,
    lineHeight: 20,
    fontWeight: '600',
    letterSpacing: 0.1,
  } as TextStyle,

  labelMedium: {
    fontFamily,
    fontSize: 13,
    lineHeight: 16,
    fontWeight: '600',
    letterSpacing: 0.1,
  } as TextStyle,

  labelSmall: {
    fontFamily,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '600',
    letterSpacing: 0.2,
    textTransform: 'uppercase',
  } as TextStyle,

  // ── Mono (for addresses, amounts) ──────────────
  mono: {
    fontFamily: fontFamilyMono,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '400',
  } as TextStyle,

  monoLarge: {
    fontFamily: fontFamilyMono,
    fontSize: 24,
    lineHeight: 32,
    fontWeight: '700',
  } as TextStyle,
} as const;

export type Typography = typeof typography;
