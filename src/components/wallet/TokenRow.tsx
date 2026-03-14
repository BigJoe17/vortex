import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import {colors, useTheme, typography, spacing} from '@theme';
import {formatTokenBalance} from '@shared/utils/formatting';

interface TokenRowProps {
  symbol: string;
  name: string;
  balanceFormatted: string;
  balanceUsd?: string | null;
  logo?: string;
  /** Primary brand color used for the fallback icon circle */
  primaryColor?: string;
}

export function TokenRow({
  symbol,
  name,
  balanceFormatted,
  balanceUsd,
  logo,
  primaryColor = '#6C5CE7',
  onPress,
}: TokenRowProps & {onPress?: () => void}): React.JSX.Element {
  const {colors, mode} = useTheme();
  const displayUsd = balanceUsd ? `$${balanceUsd}` : '$0.00';
  const displayBalance = formatTokenBalance(balanceFormatted);

  const ContainerElement = onPress ? React.Fragment : View;
  
  return (
    <View style={[styles.container, {borderBottomColor: mode === 'dark' ? '#2c2c2e' : '#f2f2f7'}]}>
      <View style={styles.leftSection}>
        {logo ? (
          <Image source={{uri: logo}} style={styles.icon} />
        ) : (
          <View style={[styles.icon, styles.fallbackIcon, { backgroundColor: `${primaryColor}20` }]}>
            <Text style={[styles.fallbackIconText, { color: primaryColor }]}>
              {symbol[0]}
            </Text>
          </View>
        )}
        <View style={styles.tokenInfo}>
          <Text style={[styles.symbol, {color: colors.text.primary}]}>{symbol}</Text>
          <Text style={[styles.name, {color: colors.text.secondary}]}>{name}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={[styles.usdValue, {color: colors.text.primary}]}>{displayUsd}</Text>
        <Text style={[styles.balance, {color: colors.text.secondary}]}>
          {displayBalance} {symbol}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: spacing.xl,
    borderBottomWidth: 1,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 14, 
  },
  fallbackIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIconText: {
    fontSize: 18,
    fontWeight: '700',
  },
  tokenInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  symbol: {
    ...typography.headingMedium,
    fontWeight: '700',
    marginBottom: 2,
  },
  name: {
    ...typography.labelMedium,
    fontWeight: '500',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  usdValue: {
    ...typography.headingMedium,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'right', 
  },
  balance: {
    ...typography.labelMedium,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
});
