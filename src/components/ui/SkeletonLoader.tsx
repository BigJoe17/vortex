/**
 * SkeletonLoader — Animated shimmer placeholder
 *
 * Renders a pulsing placeholder for async content states.
 * Configurable dimensions and border radius.
 */

import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, ViewStyle} from 'react-native';
import {useTheme, borderRadius as br} from '@theme';

interface SkeletonLoaderProps {
  width: number | string;
  height: number;
  borderRadius?: number;
  style?: ViewStyle;
}

export function SkeletonLoader({
  width,
  height,
  borderRadius = br.md,
  style,
}: SkeletonLoaderProps): React.JSX.Element {
  const {colors} = useTheme();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.6,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: colors.background.tertiary,
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

/** Pre-composed skeleton for a token list row */
export function TokenRowSkeleton(): React.JSX.Element {
  return (
    <Animated.View style={skeletonStyles.tokenRow}>
      <SkeletonLoader width={40} height={40} borderRadius={20} />
      <Animated.View style={skeletonStyles.tokenInfo}>
        <SkeletonLoader width={80} height={14} borderRadius={7} />
        <SkeletonLoader width={50} height={10} borderRadius={5} style={{marginTop: 6}} />
      </Animated.View>
      <Animated.View style={skeletonStyles.tokenRight}>
        <SkeletonLoader width={60} height={14} borderRadius={7} />
        <SkeletonLoader width={40} height={10} borderRadius={5} style={{marginTop: 6}} />
      </Animated.View>
    </Animated.View>
  );
}

const skeletonStyles = StyleSheet.create({
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  tokenInfo: {
    flex: 1,
    marginLeft: 14,
  },
  tokenRight: {
    alignItems: 'flex-end',
  },
});
