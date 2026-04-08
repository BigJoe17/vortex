/**
 * WalletSummaryCard — Premium wallet hero section
 *
 * Displays user info, total balance, portfolio change,
 * and quick action buttons (Buy, Swap, Send, Receive).
 */

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme, typography, spacing, borderRadius} from '@theme';
import {QuickAction} from '../ui/QuickAction';

interface WalletSummaryCardProps {
  username?: string;
  address?: string;
  totalUsdDisplay: string;
  network: string;
  onSend: () => void;
  onReceive: () => void;
  onSwap: () => void;
  onBuy: () => void;
}

export function WalletSummaryCard({
  username,
  address,
  totalUsdDisplay,
  network,
  onSend,
  onReceive,
  onSwap,
  onBuy,
}: WalletSummaryCardProps): React.JSX.Element {
  const {colors} = useTheme();

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '...';

  return (
    <View style={styles.container}>
      {/* User Info Header */}
      <View style={styles.headerRow}>
        <View style={styles.userBadge}>
          <View
            style={[
              styles.avatarCircle,
              {backgroundColor: colors.brand.primary + '15'},
            ]}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View>
            <Text style={[styles.usernameText, {color: colors.text.primary}]}>
              {username || 'Wallet'}
            </Text>
            <TouchableOpacity style={styles.addressRow} activeOpacity={0.6}>
              <Text style={[styles.addressText, {color: colors.text.tertiary}]}>
                {displayAddress}
              </Text>
              <Ionicons
                name="copy-outline"
                size={11}
                color={colors.text.tertiary}
                style={{marginLeft: 4}}
              />
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.headerActions}>
          <TouchableOpacity
            style={[
              styles.headerIconBtn,
              {backgroundColor: colors.background.tertiary},
            ]}>
            <Ionicons
              name="scan-outline"
              size={18}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.headerIconBtn,
              {backgroundColor: colors.background.tertiary},
            ]}>
            <Ionicons
              name="notifications-outline"
              size={18}
              color={colors.text.secondary}
            />
          </TouchableOpacity>
        </View>
      </View>

      {/* Main Balance Card */}
      <View
        style={[
          styles.balanceCard,
          {
            backgroundColor: colors.background.secondary,
            borderColor: colors.border.primary,
          },
        ]}>
        {/* Network badge */}
        <View
          style={[
            styles.networkBadge,
            {backgroundColor: colors.brand.primary + '12'},
          ]}>
          <View style={[styles.networkDot, {backgroundColor: colors.brand.primary}]} />
          <Text style={[styles.networkText, {color: colors.brand.primary}]}>
            {network.charAt(0).toUpperCase() + network.slice(1)}
          </Text>
        </View>

        {/* Balance */}
        <View style={styles.balanceRow}>
          <Text style={[styles.balanceAmount, {color: colors.text.primary}]}>
            {totalUsdDisplay}
          </Text>
          <TouchableOpacity style={{marginLeft: 8, padding: 4}}>
            <Ionicons name="eye-off-outline" size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        </View>

        {/* Portfolio change */}
        <View
          style={[
            styles.changeBadge,
            {backgroundColor: colors.status.successBg},
          ]}>
          <Ionicons name="caret-up" size={10} color={colors.status.success} />
          <Text style={[styles.changeText, {color: colors.status.success}]}>
            0.00%
          </Text>
        </View>

        {/* Quick Actions */}
        <View style={styles.actionsRow}>
          <QuickAction icon="logo-usd" label="Buy" onPress={onBuy} />
          <QuickAction icon="swap-vertical" label="Swap" onPress={onSwap} />
          <QuickAction icon="arrow-up" label="Send" onPress={onSend} />
          <QuickAction icon="arrow-down" label="Receive" onPress={onReceive} />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing['2xl'],
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  userBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatarCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  avatarText: {
    fontSize: 20,
  },
  usernameText: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  addressText: {
    ...typography.bodySmall,
    fontFamily: 'monospace',
    fontSize: 11,
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  balanceCard: {
    borderRadius: borderRadius['2xl'],
    padding: spacing.xl,
    borderWidth: 1,
  },
  networkBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginBottom: spacing.lg,
    gap: 6,
  },
  networkDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  networkText: {
    fontSize: 11,
    fontWeight: '600',
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    ...typography.balanceDisplay,
  },
  changeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    marginTop: spacing.sm,
    marginBottom: spacing['2xl'],
    gap: 4,
  },
  changeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: spacing.sm,
  },
});
