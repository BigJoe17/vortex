import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {useTheme, typography, spacing, borderRadius} from '@theme';

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
  const {colors, mode} = useTheme();

  // Truncate address for display
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '...';

  const portfolioChange = '0%';
  const isPositive = true;

  return (
    <View style={styles.container}>
      {/* User Info Header */}
      <View style={styles.headerRow}>
        <View style={styles.userBadge}>
          <View style={[styles.avatarStyle, {backgroundColor: colors.brand.primary + '20'}]}>
             <Text style={styles.avatarText}>👤</Text>
          </View>
          <View>
            <Text style={[styles.usernameText, {color: colors.text.primary}]}>
              {username || 'dev2000'}
            </Text>
            <View style={styles.addressRow}>
              <Text style={[styles.addressText, {color: colors.text.secondary}]}>
                {displayAddress}
              </Text>
              <Ionicons name="copy-outline" size={12} color={colors.text.secondary} style={{marginLeft: 4}} />
            </View>
          </View>
        </View>

        <View style={styles.headerActions}>
           <TouchableOpacity style={[styles.headerIconBtn, {backgroundColor: mode === 'dark' ? '#1c1c1e' : '#f2f2f7'}]}>
             <Ionicons name="scan-outline" size={20} color={colors.text.primary} />
           </TouchableOpacity>
           <TouchableOpacity style={[styles.headerIconBtn, {backgroundColor: mode === 'dark' ? '#1c1c1e' : '#f2f2f7'}]}>
             <Ionicons name="notifications-outline" size={20} color={colors.text.primary} />
           </TouchableOpacity>
        </View>
      </View>

      {/* Main Balance Display Card */}
      <View style={[styles.mainCard, {
        backgroundColor: mode === 'dark' ? '#1c1c1e' : '#ffffff', 
        shadowColor: colors.border.primary,
        borderColor: colors.border.secondary,
      }]}>
        <View style={styles.balanceHeader}>
          <Text style={[styles.balanceAmount, {color: colors.text.primary}]}>
            {totalUsdDisplay}
          </Text>
          <TouchableOpacity>
            <Ionicons name="eye-off-outline" size={20} color={colors.text.tertiary} style={{marginLeft: 8}} />
          </TouchableOpacity>
        </View>
        
        <Text style={[styles.portfolioChangeTxt, {color: colors.brand.primary}]}>
          {portfolioChange}
        </Text>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <ActionButton icon="logo-usd" label="Buy" onPress={onBuy} colors={colors} mode={mode} />
          <ActionButton icon="swap-vertical" label="Swap" onPress={onSwap} colors={colors} mode={mode} />
          <ActionButton icon="arrow-up" label="Send" onPress={onSend} colors={colors} mode={mode} />
          <ActionButton icon="arrow-down" label="Receive" onPress={onReceive} colors={colors} mode={mode} />
        </View>
      </View>
    </View>
  );
}

function ActionButton({icon, label, onPress, colors, mode}: any) {
  return (
    <TouchableOpacity 
      style={[
        styles.actionItem, 
        {backgroundColor: mode === 'dark' ? '#2c2c2e' : '#f2f2f7'}
      ]} 
      onPress={onPress} 
      activeOpacity={0.7}
    >
      <Ionicons name={icon} size={20} color={colors.text.primary} style={{marginBottom: 8}} />
      <Text style={[styles.actionLabel, {color: colors.text.primary}]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.xl,
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
  avatarStyle: {
    width: 40,
    height: 40,
    borderRadius: 8, // Soft square avatar
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
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
    ...typography.labelSmall,
    textTransform: 'uppercase',
  },
  headerActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainCard: {
    borderRadius: 24,
    padding: spacing.xl,
    paddingBottom: spacing.xl,
    elevation: 2,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.05,
    shadowRadius: 10,
    borderWidth: 1,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  balanceAmount: {
    fontSize: 40,
    fontWeight: '900',
    letterSpacing: -1,
  },
  portfolioChangeTxt: {
    ...typography.labelLarge,
    fontWeight: '700',
    marginTop: spacing.xs,
    marginBottom: spacing['2xl'],
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '23%',
    aspectRatio: 0.85,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    ...typography.labelSmall,
    fontSize: 11,
    fontWeight: '500',
  },
});
