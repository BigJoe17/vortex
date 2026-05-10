/**
 * TokenSection — Token list wrapper with skeleton loading
 *
 * Shows skeleton placeholder rows during async loading.
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {spacing} from '@theme';
import {TokenRowSkeleton} from '../ui/SkeletonLoader';

interface TokenSectionProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export function TokenSection({
  isLoading,
  children,
}: TokenSectionProps): React.JSX.Element {
  return (
    <View style={styles.container}>
      {isLoading && (
        <View style={styles.skeletonContainer}>
          <TokenRowSkeleton />
          <TokenRowSkeleton />
          <TokenRowSkeleton />
        </View>
      )}
      <View style={styles.listContainer}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  skeletonContainer: {
    paddingVertical: spacing.sm,
  },
  listContainer: {
    width: '100%',
  },
});
