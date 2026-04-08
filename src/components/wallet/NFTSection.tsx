/**
 * NFTSection — NFT collection display with empty state
 */

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme, typography, spacing, borderRadius} from '@theme';

export function NFTSection(): React.JSX.Element {
  const {colors} = useTheme();

  return (
    <View style={styles.container}>
      <View
        style={[
          styles.card,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.primary,
          },
        ]}>
        <View style={styles.emptyState}>
          <View
            style={[
              styles.emptyIconCircle,
              {backgroundColor: colors.background.tertiary},
            ]}>
            <Text style={styles.emptyEmoji}>🖼️</Text>
          </View>
          <Text style={[styles.emptyTitle, {color: colors.text.primary}]}>
            No NFTs yet
          </Text>
          <Text style={[styles.emptyDesc, {color: colors.text.tertiary}]}>
            NFTs that you buy or receive will show up here.
          </Text>

          <TouchableOpacity
            style={[
              styles.button,
              {backgroundColor: colors.brand.primary + '15'},
            ]}
            activeOpacity={0.7}>
            <Text style={[styles.buttonText, {color: colors.brand.primary}]}>
              Receive NFT
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    paddingHorizontal: spacing['2xl'],
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 28,
  },
  emptyTitle: {
    ...typography.headingMedium,
    marginBottom: spacing.sm,
  },
  emptyDesc: {
    ...typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: spacing.xl,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm + 2,
    borderRadius: borderRadius.full,
  },
  buttonText: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
});
