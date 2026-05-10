/**
 * ActionButton — Premium gradient CTA button
 *
 * Features:
 * - Press-in scale animation
 * - Gradient / muted states
 * - Loading spinner
 * - Primary / secondary / danger variants
 */

import React, {useRef, useCallback} from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Animated,
  ViewStyle,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {useTheme, typography, borderRadius} from '@theme';

type Variant = 'primary' | 'secondary' | 'danger';

interface ActionButtonProps {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}

export function ActionButton({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: ActionButtonProps): React.JSX.Element {
  const {colors} = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.97,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 4,
    }).start();
  }, [scaleAnim]);

  const isDisabled = disabled || loading;

  const getGradientColors = (): readonly [string, string] => {
    if (isDisabled) return ['#2A2B30', '#1A1B1F'] as const;
    switch (variant) {
      case 'danger':
        return [colors.status.error, '#CC4444'] as const;
      case 'secondary':
        return [colors.background.tertiary, colors.background.elevated] as const;
      default:
        return [colors.brand.primary, colors.brand.primaryDark] as const;
    }
  };

  const getTextColor = () => {
    if (isDisabled) return '#6B7280';
    if (variant === 'secondary') return colors.text.primary;
    return '#FFFFFF';
  };

  return (
    <Animated.View style={[{transform: [{scale: scaleAnim}]}, style]}>
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        disabled={isDisabled}>
        <LinearGradient
          colors={getGradientColors()}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 0}}
          style={[
            styles.button,
            variant === 'secondary' && {
              borderWidth: 1,
              borderColor: colors.border.secondary,
            },
          ]}>
          {loading ? (
            <ActivityIndicator color={getTextColor()} size="small" />
          ) : (
            <Text style={[styles.label, {color: getTextColor()}]}>
              {label}
            </Text>
          )}
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    ...typography.labelLarge,
    fontSize: 16,
    fontWeight: '700',
  },
});
