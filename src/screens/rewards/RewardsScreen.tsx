import React from 'react';
import {View, Text, StyleSheet, ScrollView} from 'react-native';
import {typography, spacing, borderRadius, useTheme} from '@theme';

export function RewardsScreen(): React.JSX.Element {
  const {colors} = useTheme();

  return (
    <View style={[styles.screen, {backgroundColor: colors.background.primary}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.paddedScrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, {color: colors.text.primary}]}>Rewards</Text>

        <View style={[styles.rewardsHeroCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary}]}>
          <Text style={styles.rewardsHeroEmoji}>🏆</Text>
          <Text style={[styles.rewardsHeroPoints, {color: colors.brand.primary}]}>0</Text>
          <Text style={[styles.rewardsHeroLabel, {color: colors.text.tertiary}]}>Total Points</Text>
          <View style={[styles.rewardsLevelBadge, {backgroundColor: colors.brand.primary + '15'}]}>
            <Text style={[styles.rewardsLevelText, {color: colors.brand.primary}]}>Level 1 — Newcomer</Text>
          </View>
        </View>

        <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>How to Earn</Text>
        {[
          {icon: '💸', title: 'Send Tokens', desc: '+10 pts per tx', pts: '10'},
          {icon: '📥', title: 'Receive Tokens', desc: '+5 pts per tx', pts: '5'},
          {icon: '🔄', title: 'Swap Tokens', desc: '+15 pts per swap', pts: '15'},
          {icon: '📅', title: 'Daily Check-in', desc: '+3 pts daily', pts: '3'},
        ].map((item) => (
          <View key={item.title} style={[styles.earnRow, {borderBottomColor: colors.border.primary}]}>
            <View style={[styles.earnIconCircle, {backgroundColor: colors.background.tertiary}]}>
              <Text style={styles.earnIcon}>{item.icon}</Text>
            </View>
            <View style={styles.earnInfo}>
              <Text style={[styles.earnTitle, {color: colors.text.primary}]}>{item.title}</Text>
              <Text style={[styles.earnDesc, {color: colors.text.tertiary}]}>{item.desc}</Text>
            </View>
            <View style={[styles.earnPts, {backgroundColor: colors.brand.primary + '15'}]}>
              <Text style={[styles.earnPtsText, {color: colors.brand.primary}]}>+{item.pts}</Text>
            </View>
          </View>
        ))}
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
  sectionTitle: {
    ...typography.headingSmall,
    marginBottom: spacing.md,
  },
  rewardsHeroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing['3xl'],
    alignItems: 'center',
    marginBottom: spacing['3xl'],
    borderWidth: 1,
  },
  rewardsHeroEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  rewardsHeroPoints: {
    ...typography.displayLarge,
  },
  rewardsHeroLabel: {
    ...typography.labelMedium,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  rewardsLevelBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  rewardsLevelText: {
    ...typography.labelSmall,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  earnIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  earnIcon: {
    fontSize: 20,
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    ...typography.labelMedium,
  },
  earnDesc: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  earnPts: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  earnPtsText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
});
