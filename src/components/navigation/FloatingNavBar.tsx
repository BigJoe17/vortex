/**
 * FloatingNavBar — Context-aware, adaptive bottom tab bar
 *
 * Features:
 * - Frosted glass blur backdrop with coral accent
 * - Auto-hides on nested screens (Send, ConfirmSend, etc.)
 * - Safe-area-aware positioning
 * - Smooth animated slide transitions
 * - Responsive sizing across devices
 */

import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, TouchableOpacity, Text, Animated, Dimensions, Platform} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {BlurView} from 'expo-blur';
import {Ionicons} from '@expo/vector-icons';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useTheme} from '@theme';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

// Screens where the nav bar should be hidden
const HIDDEN_SCREENS = new Set([
  'SendScreen',
  'ConfirmSend',
  'TokenDetail',
  'TransactionDetail',
  'Send',
  'Receive',
]);

/**
 * Inspects the navigation state to find the currently focused
 * screen name, even inside nested stack navigators.
 */
function getActiveRouteName(state: any): string {
  if (!state) return '';
  const route = state.routes[state.index];
  // If this route has a nested navigator state, recurse into it
  if (route?.state) {
    return getActiveRouteName(route.state);
  }
  return route?.name ?? '';
}

export function FloatingNavBar({
  state,
  descriptors,
  navigation,
}: BottomTabBarProps): React.JSX.Element {
  const {colors, mode} = useTheme();
  const insets = useSafeAreaInsets();

  const activeColor = colors.brand.primary;
  const inactiveColor = '#6B7280';

  // ── Determine visibility ──────────────────────
  const activeRouteName = getActiveRouteName(state);
  const shouldHide = HIDDEN_SCREENS.has(activeRouteName);

  // ── Animated values ───────────────────────────
  const translateY = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: shouldHide ? 120 : 0,
        useNativeDriver: true,
        speed: 16,
        bounciness: shouldHide ? 0 : 4,
      }),
      Animated.timing(opacity, {
        toValue: shouldHide ? 0 : 1,
        duration: shouldHide ? 150 : 300,
        useNativeDriver: true,
      }),
    ]).start();
  }, [shouldHide, translateY, opacity]);

  // ── Responsive spacing ────────────────────────
  // On devices with a home indicator (bottom inset > 0), position
  // just above the safe area. On devices without, add a comfortable margin.
  const bottomOffset = Math.max(insets.bottom, 12) + 8;

  // Responsive horizontal margin (tighter on small screens)
  const horizontalMargin = SCREEN_WIDTH < 375 ? 12 : 20;

  // Nav bar height scales slightly on larger screens
  const barHeight = SCREEN_WIDTH >= 428 ? 68 : 64;

  return (
    <Animated.View
      pointerEvents={shouldHide ? 'none' : 'auto'}
      style={[
        styles.container,
        {
          bottom: bottomOffset,
          left: horizontalMargin,
          right: horizontalMargin,
          height: barHeight,
          transform: [{translateY}],
          opacity,
        },
      ]}>
      <BlurView
        intensity={mode === 'dark' ? 40 : 70}
        tint={mode === 'dark' ? 'dark' : 'light'}
        style={[
          styles.blurContainer,
          {
            backgroundColor:
              mode === 'dark'
                ? 'rgba(15, 15, 18, 0.78)'
                : 'rgba(255, 255, 255, 0.78)',
            borderColor: colors.border.primary,
          },
        ]}>
        {state.routes.map((route, index) => {
          const {options} = descriptors[route.key]!;
          const label =
            options.tabBarLabel !== undefined
              ? options.tabBarLabel
              : options.title !== undefined
              ? options.title
              : route.name;

          const isFocused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate({name: route.name, merge: true} as any);
            }
          };

          const onLongPress = () => {
            navigation.emit({
              type: 'tabLongPress',
              target: route.key,
            });
          };

          // Map route names to icons
          let iconName: keyof typeof Ionicons.glyphMap = 'ellipse-outline';
          if (route.name === 'Wallet')
            iconName = isFocused ? 'wallet' : 'wallet-outline';
          if (route.name === 'Rewards')
            iconName = isFocused ? 'trophy' : 'trophy-outline';
          if (route.name === 'MiniApps')
            iconName = isFocused ? 'grid' : 'grid-outline';
          if (route.name === 'Account')
            iconName = isFocused ? 'person' : 'person-outline';

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as any).tabBarTestID ?? route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}
              activeOpacity={0.7}>
              <View style={styles.iconContainer}>
                <Ionicons
                  name={iconName}
                  size={22}
                  color={isFocused ? activeColor : inactiveColor}
                />
              </View>
              <Text
                style={[
                  styles.tabLabel,
                  {
                    color: isFocused ? activeColor : inactiveColor,
                    fontWeight: isFocused ? '700' : '500',
                  },
                ]}>
                {label as string}
              </Text>
              {/* Active indicator dot */}
              {isFocused && (
                <View
                  style={[
                    styles.activeDot,
                    {backgroundColor: activeColor},
                  ]}
                />
              )}
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    borderRadius: 22,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 8,
  },
  blurContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 22,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    paddingTop: 6,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabLabel: {
    fontSize: 10,
    marginTop: 3,
  },
  activeDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    marginTop: 3,
  },
});
