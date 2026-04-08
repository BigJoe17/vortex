/**
 * TransactionCard — Styled transaction row
 *
 * Status-colored icon, directional arrow, relative time.
 */

import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme, typography, spacing, borderRadius} from '@theme';
import {formatRelativeTime} from '@shared/utils/formatting';

interface TransactionCardProps {
  hash: string;
  type: 'send' | 'receive';
  status: 'pending' | 'confirmed' | 'failed';
  tokenSymbol: string;
  valueFormatted: string;
  to: string;
  timestamp: number;
}

export function TransactionCard({
  type,
  status,
  tokenSymbol,
  valueFormatted,
  to,
  timestamp,
}: TransactionCardProps): React.JSX.Element {
  const {colors} = useTheme();

  const statusConfig = {
    pending: {color: colors.status.warning, bg: colors.status.warningBg, label: 'Pending'},
    confirmed: {color: colors.status.success, bg: colors.status.successBg, label: 'Confirmed'},
    failed: {color: colors.status.error, bg: colors.status.errorBg, label: 'Failed'},
  };

  const {color, bg, label} = statusConfig[status];
  const isSend = type === 'send';

  return (
    <View style={[styles.container, {backgroundColor: colors.background.secondary}]}>
      {/* Status icon */}
      <View style={[styles.iconCircle, {backgroundColor: bg}]}>
        <Ionicons
          name={isSend ? 'arrow-up' : 'arrow-down'}
          size={18}
          color={color}
        />
      </View>

      {/* Info */}
      <View style={styles.info}>
        <Text style={[styles.title, {color: colors.text.primary}]}>
          {isSend ? 'Sent' : 'Received'} {tokenSymbol}
        </Text>
        <Text style={[styles.subtitle, {color: colors.text.tertiary}]}>
          {status === 'pending'
            ? `⏳ ${label}`
            : `${to.slice(0, 8)}...${to.slice(-4)} · ${formatRelativeTime(timestamp)}`}
        </Text>
      </View>

      {/* Amount */}
      <View style={styles.amountContainer}>
        <Text style={[styles.amount, {color: isSend ? colors.text.primary : colors.status.success}]}>
          {isSend ? '-' : '+'}{valueFormatted}
        </Text>
        <View style={[styles.statusBadge, {backgroundColor: bg}]}>
          <Text style={[styles.statusText, {color}]}>{label}</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  info: {
    flex: 1,
  },
  title: {
    ...typography.labelLarge,
    fontWeight: '600',
    marginBottom: 2,
  },
  subtitle: {
    ...typography.bodySmall,
  },
  amountContainer: {
    alignItems: 'flex-end',
  },
  amount: {
    ...typography.labelLarge,
    fontWeight: '700',
    marginBottom: 2,
  },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '600',
  },
});
