import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useTheme, typography, spacing } from '@theme';

interface AssetSwitcherProps {
  activeTab: 'tokens' | 'nfts';
  onChangeTab: (tab: 'tokens' | 'nfts') => void;
}

export function AssetSwitcher({ activeTab, onChangeTab }: AssetSwitcherProps): React.JSX.Element {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border.secondary }]}>
      {/* Tokens Tab */}
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'tokens' && { borderBottomColor: colors.brand.primary }]}
        onPress={() => onChangeTab('tokens')}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.tabText, 
          { color: activeTab === 'tokens' ? colors.brand.primary : colors.text.secondary },
          activeTab === 'tokens' && styles.activeTabText
        ]}>
          Tokens
        </Text>
      </TouchableOpacity>

      {/* NFTs Tab */}
      <TouchableOpacity 
        style={[styles.tabButton, activeTab === 'nfts' && { borderBottomColor: colors.brand.primary }]}
        onPress={() => onChangeTab('nfts')}
        activeOpacity={0.7}
      >
        <Text style={[
          styles.tabText, 
          { color: activeTab === 'nfts' ? colors.brand.primary : colors.text.secondary },
          activeTab === 'nfts' && styles.activeTabText
        ]}>
          NFTs
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.md,
    borderBottomWidth: 1,
  },
  tabButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  activeTabText: {
    fontWeight: '800',
  },
});
