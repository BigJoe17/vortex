/**
 * Vortex 2.0 — Spacing & Layout System
 *
 * 4px base unit for consistent spacing.
 * Naming convention: xs, sm, md, lg, xl, 2xl, 3xl
 */

export const spacing = {
  /** 2px */  '2xs': 2,
  /** 4px */  xs: 4,
  /** 8px */  sm: 8,
  /** 12px */ md: 12,
  /** 16px */ lg: 16,
  /** 20px */ xl: 20,
  /** 24px */ '2xl': 24,
  /** 32px */ '3xl': 32,
  /** 40px */ '4xl': 40,
  /** 48px */ '5xl': 48,
  /** 64px */ '6xl': 64,
} as const;

export const borderRadius = {
  /** 4px */  xs: 4,
  /** 8px */  sm: 8,
  /** 12px */ md: 12,
  /** 16px */ lg: 16,
  /** 20px */ xl: 20,
  /** 24px */ '2xl': 24,
  /** 9999px */ full: 9999,
} as const;

export const layout = {
  /** Standard horizontal padding for screens */
  screenPaddingHorizontal: 20,
  /** Standard top padding for screens */
  screenPaddingTop: 16,
  /** Standard bottom padding for screens (above tab bar) */
  screenPaddingBottom: 24,
  /** Maximum content width */
  maxContentWidth: 428,
  /** Card minimum height */
  cardMinHeight: 80,
  /** Button height */
  buttonHeight: 52,
  /** Input height */
  inputHeight: 52,
  /** Icon sizes */
  iconSm: 20,
  iconMd: 24,
  iconLg: 32,
  iconXl: 48,
} as const;

export type Spacing = typeof spacing;
export type BorderRadius = typeof borderRadius;
export type Layout = typeof layout;
