/**
 * QuickAction — Circular action button (Send, Receive, Swap, Buy)
 *
 * Press-in feedback, coral tinted icon background.
 * Used in WalletSummaryCard.
 */

import React, {useRef, useCallback} from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  View,
} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme, typography, spacing} from '@theme';

interface QuickActionProps {
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  onPress: () => void;
}

export function QuickAction({icon, label, onPress}: QuickActionProps): React.JSX.Element {
  const {colors} = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 0.9,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  }, [scaleAnim]);

  const handlePressOut = useCallback(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      speed: 50,
      bounciness: 6,
    }).start();
  }, [scaleAnim]);

  return (
    <Animated.View style={{transform: [{scale: scaleAnim}]}}>
      <TouchableOpacity
        style={styles.container}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.9}>
        <View
          style={[
            styles.iconCircle,
            {backgroundColor: colors.brand.primary + '18'},
          ]}>
          <Ionicons name={icon} size={22} color={colors.brand.primary} />
        </View>
        <Text style={[styles.label, {color: colors.text.secondary}]}>
          {label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    minWidth: 64,
  },
  iconCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.sm,
  },
  label: {
    ...typography.labelSmall,
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'none',
  },
});
