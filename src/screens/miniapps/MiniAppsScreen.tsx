import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert} from 'react-native';
import {typography, spacing, borderRadius, useTheme} from '@theme';

const DAPPS = [
  {name: 'Uniswap', icon: '🦄', desc: 'Swap tokens', color: '#FF007A'},
  {name: 'Aave', icon: '👻', desc: 'Lend & borrow', color: '#B6509E'},
  {name: 'OpenSea', icon: '🌊', desc: 'NFT marketplace', color: '#2081E2'},
  {name: 'Lido', icon: '🏔', desc: 'Liquid staking', color: '#00A3FF'},
  {name: '1inch', icon: '🐴', desc: 'DEX aggregator', color: '#1B314F'},
  {name: 'Curve', icon: '🔶', desc: 'Stable swaps', color: '#FF6B35'},
];

export function MiniAppsScreen(): React.JSX.Element {
  const {colors} = useTheme();

  return (
    <View style={[styles.screen, {backgroundColor: colors.background.primary}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.paddedScrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, {color: colors.text.primary}]}>MiniApps</Text>
        <Text style={[styles.pageSubtitle, {color: colors.text.tertiary}]}>
          Access DeFi protocols directly from your wallet
        </Text>

        <View style={styles.dappGrid}>
          {DAPPS.map((dapp) => (
            <TouchableOpacity
              key={dapp.name}
              style={[styles.dappCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary}]}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(dapp.name, 'WebView integration coming in Phase 5')
              }>
              <View style={[styles.dappIcon, {backgroundColor: dapp.color + '15'}]}>
                <Text style={styles.dappEmoji}>{dapp.icon}</Text>
              </View>
              <Text style={[styles.dappName, {color: colors.text.primary}]}>{dapp.name}</Text>
              <Text style={[styles.dappDesc, {color: colors.text.tertiary}]}>{dapp.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.comingSoonCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary}]}>
          <Text style={styles.comingSoonEmoji}>🚀</Text>
          <Text style={[styles.comingSoonTitle, {color: colors.text.primary}]}>More Coming Soon</Text>
          <Text style={[styles.comingSoonText, {color: colors.text.tertiary}]}>
            We're integrating more DeFi protocols and Web3 apps.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  paddedScrollContent: {
    paddingTop: spacing['5xl'],
    paddingBottom: 110,
    paddingHorizontal: spacing['2xl'],
  },
  pageTitle: {
    ...typography.headingLarge,
    marginBottom: spacing.sm,
  },
  pageSubtitle: {
    ...typography.bodyMedium,
    marginBottom: spacing['2xl'],
  },
  dappGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  dappCard: {
    width: '47%',
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  dappIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dappEmoji: {
    fontSize: 22,
  },
  dappName: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  dappDesc: {
    ...typography.bodySmall,
  },
  comingSoonCard: {
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    borderWidth: 1,
  },
  comingSoonEmoji: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  comingSoonTitle: {
    ...typography.labelLarge,
    marginBottom: spacing.sm,
  },
  comingSoonText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
});
