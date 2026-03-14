import React from 'react';
import {View, StyleSheet, TouchableOpacity, Text} from 'react-native';
import {BottomTabBarProps} from '@react-navigation/bottom-tabs';
import {BlurView} from 'expo-blur';
import {Ionicons} from '@expo/vector-icons';
import {useTheme} from '@theme';

export function FloatingNavBar({state, descriptors, navigation}: BottomTabBarProps): React.JSX.Element {
  const {colors, mode} = useTheme();

  return (
    <View style={styles.container}>
      <BlurView
        intensity={mode === 'dark' ? 50 : 80}
        tint={mode === 'dark' ? 'dark' : 'light'}
        style={[
          styles.blurContainer,
          {
            backgroundColor: mode === 'dark' ? 'rgba(20, 20, 30, 0.65)' : 'rgba(255, 255, 255, 0.65)',
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
          if (route.name === 'Wallet') iconName = isFocused ? 'wallet' : 'wallet-outline';
          if (route.name === 'Rewards') iconName = isFocused ? 'trophy' : 'trophy-outline';
          if (route.name === 'MiniApps') iconName = isFocused ? 'grid' : 'grid-outline';
          if (route.name === 'Account') iconName = isFocused ? 'person' : 'person-outline';

          // Theme based values based on reference image
          const activeColor = colors.brand.primary; // e.g. Pink or Purple
          const inactiveColor = mode === 'dark' ? '#A1A1AA' : '#3F3F46'; // dark grey for inactive

          return (
            <TouchableOpacity
              key={route.key}
              accessibilityRole="button"
              accessibilityState={isFocused ? {selected: true} : {}}
              accessibilityLabel={options.tabBarAccessibilityLabel}
              testID={(options as any).tabBarTestID ?? route.key}
              onPress={onPress}
              onLongPress={onLongPress}
              style={styles.tabButton}>
              
              {/* Glow background for active tab */}
              {isFocused && (
                <View style={[styles.activeGlow, { 
                  backgroundColor: activeColor,
                  shadowColor: activeColor,
                }]} />
              )}

              <View style={[styles.iconContainer]}>
                <Ionicons
                  name={iconName}
                  size={26}
                  color={isFocused ? activeColor : inactiveColor}
                />
              </View>
              <Text 
                style={[
                  styles.tabLabel, 
                  {
                    color: isFocused ? activeColor : inactiveColor,
                    fontWeight: isFocused ? '700' : '500'
                  }
                ]}>
                {label as string}
              </Text>
            </TouchableOpacity>
          );
        })}
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 30,
    left: 20,
    right: 20,
    height: 70,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  blurContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderRadius: 24,
    borderWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    position: 'relative',
  },
  activeGlow: {
    position: 'absolute',
    top: '15%',
    width: 50,
    height: 50,
    borderRadius: 25,
    opacity: 0.15,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 15,
    elevation: 4,
  },
  iconContainer: {
    padding: 4,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 2,
  },
  tabLabel: {
    fontSize: 11,
    marginTop: 2,
    zIndex: 2,
  },
});
