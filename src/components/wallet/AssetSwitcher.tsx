/**
 * AssetSwitcher — Pill-style segmented control
 *
 * Switches between Tokens and NFTs tabs.
 * Active pill has coral background.
 */

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme, typography, spacing, borderRadius} from '@theme';

interface AssetSwitcherProps {
  activeTab: 'tokens' | 'nfts';
  onChangeTab: (tab: 'tokens' | 'nfts') => void;
}

export function AssetSwitcher({
  activeTab,
  onChangeTab,
}: AssetSwitcherProps): React.JSX.Element {
  const {colors} = useTheme();

  return (
    <View
      style={[
        styles.container,
        {backgroundColor: colors.background.secondary},
      ]}>
      <View
        style={[
          styles.track,
          {backgroundColor: colors.background.tertiary},
        ]}>
        {/* Tokens Tab */}
        <TouchableOpacity
          style={[
            styles.pill,
            activeTab === 'tokens' && [
              styles.activePill,
              {backgroundColor: colors.brand.primary},
            ],
          ]}
          onPress={() => onChangeTab('tokens')}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.pillText,
              {
                color:
                  activeTab === 'tokens'
                    ? '#FFFFFF'
                    : colors.text.tertiary,
              },
              activeTab === 'tokens' && styles.activePillText,
            ]}>
            Tokens
          </Text>
        </TouchableOpacity>

        {/* NFTs Tab */}
        <TouchableOpacity
          style={[
            styles.pill,
            activeTab === 'nfts' && [
              styles.activePill,
              {backgroundColor: colors.brand.primary},
            ],
          ]}
          onPress={() => onChangeTab('nfts')}
          activeOpacity={0.8}>
          <Text
            style={[
              styles.pillText,
              {
                color:
                  activeTab === 'nfts'
                    ? '#FFFFFF'
                    : colors.text.tertiary,
              },
              activeTab === 'nfts' && styles.activePillText,
            ]}>
            NFTs
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing['2xl'],
    paddingVertical: spacing.md,
  },
  track: {
    flexDirection: 'row',
    borderRadius: borderRadius.md,
    padding: 3,
  },
  pill: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md - 1,
  },
  activePill: {
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 2},
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  pillText: {
    ...typography.labelMedium,
    fontWeight: '600',
  },
  activePillText: {
    fontWeight: '700',
  },
});
