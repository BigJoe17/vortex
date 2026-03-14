import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {useTheme, typography, spacing, borderRadius} from '@theme';

export function NFTSection(): React.JSX.Element {
  const {colors} = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.title, {color: colors.text.primary}]}>Collectibles</Text>
      
      <View style={[styles.card, {backgroundColor: colors.background.tertiary}]}>
        <View style={styles.emptyState}>
          <Text style={[styles.emptyEmoji]}>🖼️</Text>
          <Text style={[styles.emptyTitle, {color: colors.text.primary}]}>No NFTs yet</Text>
          <Text style={[styles.emptyDesc, {color: colors.text.secondary}]}>
            NFTs that you buy or receive will show up here.
          </Text>
          
          <TouchableOpacity style={[styles.button, {backgroundColor: colors.brand.primary + '20'}]}>
             <Text style={[styles.buttonText, {color: colors.brand.primary}]}>Receive NFT</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  title: {
    ...typography.headingLarge,
    marginBottom: spacing.md,
  },
  card: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    ...typography.headingMedium,
    marginBottom: spacing.xs,
  },
  emptyDesc: {
    ...typography.bodyMedium,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  button: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
    borderRadius: 100,
  },
  buttonText: {
    ...typography.labelLarge,
  },
});
