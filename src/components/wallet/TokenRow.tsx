import React from 'react';
import {View, Text, StyleSheet, Image} from 'react-native';
import {colors} from '@theme';
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
}: TokenRowProps): React.JSX.Element {
  
  const displayUsd = balanceUsd ? `$${balanceUsd}` : '$0.00';
  const displayBalance = formatTokenBalance(balanceFormatted);

  return (
    <View style={styles.container}>
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
          <Text style={styles.symbol}>{symbol}</Text>
          <Text style={styles.name}>{name}</Text>
        </View>
      </View>

      <View style={styles.rightSection}>
        <Text style={styles.usdValue}>{displayUsd}</Text>
        <Text style={styles.balance}>
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
    paddingVertical: 14,
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
    marginRight: 12, // Updated spacing to match common patterns
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
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
  },
  name: {
    fontSize: 13,
    color: colors.text.secondary,
  },
  rightSection: {
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
  usdValue: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text.primary,
    marginBottom: 4,
    textAlign: 'right', // Align right as explicitly requested
  },
  balance: {
    fontSize: 13,
    color: '#8E8E93',
  },
});
