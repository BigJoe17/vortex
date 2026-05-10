import React, {useEffect, useState} from 'react';
import {View, Text, StyleSheet, ScrollView, RefreshControl, Alert, TouchableOpacity} from 'react-native';
import {useQuery} from '@tanstack/react-query';
import {useAuthStore} from '@store/authStore';
import {useWalletStore} from '@store/walletStore';
import {useTokenStore} from '@store/tokenStore';
import {typography, spacing, borderRadius, useTheme} from '@theme';
import {getEnrichedWalletData} from '@services/pricing/walletDataService';
import {TokenRow} from '../../components/wallet/TokenRow';
import {WalletSummaryCard} from '../../components/wallet/WalletSummaryCard';
import {TokenSection} from '../../components/wallet/TokenSection';
import {NFTSection} from '../../components/wallet/NFTSection';
import {AssetSwitcher} from '../../components/wallet/AssetSwitcher';
import {TransactionHistorySection} from '../../components/wallet/TransactionHistorySection';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';
import type {WalletStackParamList} from '../../app/navigation/types';

type WalletNavProp = NativeStackNavigationProp<WalletStackParamList>;

export function WalletHomeScreen({navigation}: {navigation: WalletNavProp}): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const address = useWalletStore((state) => state.address);
  const network = useWalletStore((state) => state.network);
  const setTokens = useWalletStore((state) => state.setTokens);

  const [activeTab, setActiveTab] = useState<'tokens' | 'nfts'>('tokens');

  const setErc20Tokens = useTokenStore((state) => state.setTokens);

  const {
    data: enrichedTokens = [],
    isLoading: isLoadingBalances,
    isFetching,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ['walletData', address, network],
    queryFn: () => getEnrichedWalletData(address!, network),
    enabled: !!address,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
    placeholderData: (previousData) => previousData,
    retry: 2,
  });

  useEffect(() => {
    const nativeToken = enrichedTokens[0];
    if (enrichedTokens.length > 0 && nativeToken) {
      setTokens([nativeToken]);
      setErc20Tokens(enrichedTokens.slice(1));
    }
  }, [enrichedTokens, setTokens, setErc20Tokens]);

  const totalUsdBalance = React.useMemo(() => {
    let total = 0;
    for (const t of enrichedTokens) {
      if (t.balanceUsd) {
        total += parseFloat(t.balanceUsd);
      }
    }
    return total;
  }, [enrichedTokens]);

  const displayTotalUsd = `$${totalUsdBalance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  const {colors} = useTheme();
  const balanceErrorMessage =
    error instanceof Error ? error.message : 'Unable to load balances';

  return (
    <View style={[styles.screen, {backgroundColor: colors.background.primary}]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isFetching}
            onRefresh={refetch}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }>
        <WalletSummaryCard
          username={user?.username}
          address={address ?? undefined}
          network={network}
          totalUsdDisplay={displayTotalUsd}
          onSend={() => navigation.navigate('SendScreen')}
          onReceive={() => navigation.navigate('Receive')}
          onBuy={() => Alert.alert('Buy', 'Fiat onramp integration coming soon')}
          onSwap={() => Alert.alert('Swap', 'DEX integration coming soon')}
        />

        <AssetSwitcher activeTab={activeTab} onChangeTab={setActiveTab} />

        {activeTab === 'tokens' ? (
          <TokenSection isLoading={isLoadingBalances}>
            {isError && enrichedTokens.length === 0 ? (
              <View style={[styles.errorState, {backgroundColor: colors.status.errorBg}]}>
                <Text style={[styles.errorTitle, {color: colors.status.error}]}>
                  Unable to load balances
                </Text>
                <Text style={[styles.errorText, {color: colors.text.tertiary}]}>
                  {balanceErrorMessage}
                </Text>
                <TouchableOpacity
                  activeOpacity={0.75}
                  onPress={() => refetch()}
                  style={[styles.retryButton, {borderColor: colors.status.error}]}>
                  <Text style={[styles.retryText, {color: colors.status.error}]}>Retry</Text>
                </TouchableOpacity>
              </View>
            ) : null}
            {enrichedTokens.map((item, index) => {
              const isNative = index === 0;
              return (
                <TokenRow
                  key={item.address + item.symbol + index}
                  symbol={item.symbol}
                  name={item.name}
                  balanceFormatted={item.balanceFormatted}
                  balanceUsd={'balanceUsd' in item ? item.balanceUsd : null}
                  logo={'logo' in item ? item.logo : undefined}
                  primaryColor={isNative ? colors.brand.primary : '#4ECDC4'}
                />
              );
            })}
            {enrichedTokens.length === 0 && !isError && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, {color: colors.text.tertiary}]}>
                  {isLoadingBalances ? 'Loading balances...' : 'No tokens found'}
                </Text>
              </View>
            )}
          </TokenSection>
        ) : (
          <NFTSection />
        )}

        <TransactionHistorySection />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing['5xl'],
    paddingBottom: 110,
  },
  emptyState: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  emptyStateText: {
    ...typography.bodyMedium,
  },
  errorState: {
    marginHorizontal: spacing['2xl'],
    marginVertical: spacing.lg,
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  errorTitle: {
    ...typography.labelLarge,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  errorText: {
    ...typography.bodySmall,
    marginBottom: spacing.md,
  },
  retryButton: {
    minHeight: 44,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderRadius: borderRadius.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  retryText: {
    ...typography.labelSmall,
    fontWeight: '700',
  },
});
