import React from 'react';
import {View, StyleSheet, ActivityIndicator} from 'react-native';
import {useTheme, spacing} from '@theme';

interface TokenSectionProps {
  isLoading: boolean;
  children: React.ReactNode;
}

export function TokenSection({isLoading, children}: TokenSectionProps): React.JSX.Element {
  const {colors} = useTheme();

  return (
    <View style={styles.container}>
      {isLoading && <ActivityIndicator size="small" color={colors.brand.primary} style={styles.loader} />}
      <View style={styles.listContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  loader: {
    marginVertical: spacing.md,
  },
  listContainer: {
    width: '100%',
  },
});
