/**
 * TokenRow — Premium token list item
 *
 * Displays token icon, name, balance, and USD value.
 * Supports press feedback and optional price change.
 */

import React from 'react';
import {View, Text, StyleSheet, Image, TouchableOpacity} from 'react-native';
import {useTheme, typography, spacing, borderRadius} from '@theme';
import {formatTokenBalance} from '@shared/utils/formatting';

interface TokenRowProps {
  symbol: string;
  name: string;
  balanceFormatted: string;
  balanceUsd?: string | null;
  logo?: string;
  /** Primary brand color used for the fallback icon circle */
  primaryColor?: string;
  onPress?: () => void;
}

export function TokenRow({
  symbol,
  name,
  balanceFormatted,
  balanceUsd,
  logo,
  primaryColor = '#FF7062',
  onPress,
}: TokenRowProps): React.JSX.Element {
  const {colors} = useTheme();
  const displayUsd = balanceUsd ? `$${parseFloat(balanceUsd).toLocaleString('en-US', {minimumFractionDigits: 2, maximumFractionDigits: 2})}` : '$0.00';
  const displayBalance = formatTokenBalance(balanceFormatted);

  const content = (
    <View style={[styles.container, {backgroundColor: 'transparent'}]}>
      {/* Token icon */}
      <View style={styles.leftSection}>
        {logo ? (
          <Image source={{uri: logo}} style={styles.icon} />
        ) : (
          <View
            style={[
              styles.icon,
              styles.fallbackIcon,
              {backgroundColor: `${primaryColor}15`},
            ]}>
            <Text style={[styles.fallbackIconText, {color: primaryColor}]}>
              {symbol[0]}
            </Text>
          </View>
        )}
        <View style={styles.tokenInfo}>
          <Text style={[styles.symbol, {color: colors.text.primary}]}>
            {symbol}
          </Text>
          <Text style={[styles.name, {color: colors.text.tertiary}]}>
            {name}
          </Text>
        </View>
      </View>

      {/* Balance + USD */}
      <View style={styles.rightSection}>
        <Text style={[styles.usdValue, {color: colors.text.primary}]}>
          {displayUsd}
        </Text>
        <Text style={[styles.balance, {color: colors.text.tertiary}]}>
          {displayBalance} {symbol}
        </Text>
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.65} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: spacing['2xl'],
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  icon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 14,
  },
  fallbackIcon: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackIconText: {
    fontSize: 17,
    fontWeight: '700',
  },
  tokenInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  symbol: {
    ...typography.labelLarge,
    fontWeight: '700',
    marginBottom: 2,
  },
  name: {
    ...typography.bodySmall,
    fontWeight: '400',
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  usdValue: {
    ...typography.labelLarge,
    fontWeight: '700',
    marginBottom: 2,
    textAlign: 'right',
  },
  balance: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
});
