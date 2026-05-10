/**
 * TransactionHistorySection
 *
 * Displays real on-chain transaction history with loading/error/empty states.
 */

import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useTheme, typography, spacing, borderRadius} from '@theme';
import {useTransactionHistory} from '../../hooks/useTransactionHistory';
import type {MergedTransaction} from '../../hooks/useTransactionHistory';
import {formatRelativeTime} from '@shared/utils/formatting';

export function TransactionHistorySection(): React.JSX.Element {
  const {colors} = useTheme();
  const {transactions, isLoading, isError, refetch, isEmpty} = useTransactionHistory();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, {color: colors.text.primary}]}>Recent Activity</Text>
        {transactions.length > 0 && (
          <TouchableOpacity onPress={() => refetch()} activeOpacity={0.6}>
            <Ionicons name="refresh" size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        )}
      </View>

      {isLoading && transactions.length === 0 && (
        <View style={styles.loadingContainer}>
          <SkeletonRow colors={colors} />
          <SkeletonRow colors={colors} />
          <SkeletonRow colors={colors} />
        </View>
      )}

      {isError && (
        <View style={[styles.errorContainer, {backgroundColor: colors.status.errorBg}]}>
          <Ionicons name="warning" size={16} color={colors.status.error} />
          <Text style={[styles.errorText, {color: colors.status.error}]}>
            Failed to load history
          </Text>
          <TouchableOpacity onPress={() => refetch()} style={[styles.retryButton, {borderColor: colors.status.error}]}>
            <Text style={[styles.retryText, {color: colors.status.error}]}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {isEmpty && !isError && (
        <View style={styles.emptyContainer}>
          <Text style={[styles.emptyEmoji]}>📭</Text>
          <Text style={[styles.emptyText, {color: colors.text.tertiary}]}>
            No transactions yet
          </Text>
          <Text style={[styles.emptySubtext, {color: colors.text.tertiary}]}>
            Send or receive tokens to see activity here
          </Text>
        </View>
      )}

      {transactions.slice(0, 15).map((tx) => (
        <HistoryRow key={`${tx.hash}-${tx.direction}`} tx={tx} colors={colors} />
      ))}
    </View>
  );
}

function HistoryRow({tx, colors}: {tx: MergedTransaction; colors: any}): React.JSX.Element {
  const isSend = tx.direction === 'out';
  const isPending = tx.status === 'pending';

  const statusConfig = {
    pending: {color: colors.status.warning, bg: colors.status.warningBg},
    confirmed: {color: colors.status.success, bg: colors.status.successBg},
    failed: {color: colors.status.error, bg: colors.status.errorBg},
  };

  const {color, bg} = statusConfig[tx.status];

  return (
    <View style={[styles.row, {backgroundColor: colors.background.secondary}]}>
      <View style={[styles.iconCircle, {backgroundColor: bg}]}>
        <Ionicons
          name={isSend ? 'arrow-up' : 'arrow-down'}
          size={18}
          color={color}
        />
      </View>

      <View style={styles.rowInfo}>
        <Text style={[styles.rowTitle, {color: colors.text.primary}]}>
          {isSend ? 'Sent' : 'Received'} {tx.symbol}
        </Text>
        <Text style={[styles.rowSubtitle, {color: colors.text.tertiary}]} numberOfLines={1}>
          {isPending
            ? '⏳ Pending confirmation...'
            : `${(isSend ? tx.to : tx.from).slice(0, 8)}...${(isSend ? tx.to : tx.from).slice(-4)} · ${formatRelativeTime(tx.timestamp)}`}
        </Text>
      </View>

      <View style={styles.rowRight}>
        <Text style={[styles.rowAmount, {color: isSend ? colors.text.primary : colors.status.success}]}>
          {isSend ? '-' : '+'}{tx.valueFormatted}
        </Text>
        {tx.category === 'erc20' && (
          <Text style={[styles.rowBadge, {color: colors.text.tertiary}]}>ERC-20</Text>
        )}
      </View>
    </View>
  );
}

function SkeletonRow({colors}: {colors: any}): React.JSX.Element {
  return (
    <View style={[styles.row, {backgroundColor: colors.background.secondary}]}>
      <View style={[styles.iconCircle, {backgroundColor: colors.background.tertiary}]} />
      <View style={styles.rowInfo}>
        <View style={[styles.skeletonLine, {backgroundColor: colors.background.tertiary, width: 100}]} />
        <View style={[styles.skeletonLine, {backgroundColor: colors.background.tertiary, width: 160, marginTop: 6}]} />
      </View>
      <View style={[styles.skeletonLine, {backgroundColor: colors.background.tertiary, width: 50}]} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    ...typography.headingSmall,
  },
  loadingContainer: {
    gap: spacing.sm,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    flex: 1,
  },
  retryButton: {
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  retryText: {
    ...typography.labelSmall,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: spacing['3xl'],
  },
  emptyEmoji: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  emptyText: {
    ...typography.labelMedium,
    marginBottom: spacing.xs,
  },
  emptySubtext: {
    ...typography.bodySmall,
  },
  row: {
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
  rowInfo: {
    flex: 1,
  },
  rowTitle: {
    ...typography.labelLarge,
    fontWeight: '600',
    marginBottom: 2,
  },
  rowSubtitle: {
    ...typography.bodySmall,
  },
  rowRight: {
    alignItems: 'flex-end',
  },
  rowAmount: {
    ...typography.labelLarge,
    fontWeight: '700',
    marginBottom: 2,
  },
  rowBadge: {
    fontSize: 9,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
});
