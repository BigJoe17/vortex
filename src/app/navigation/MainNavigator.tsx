/**
 * Main Navigator
 *
 * Bottom tab navigator for authenticated users.
 * Tabs: Wallet | Rewards | MiniApps | Account
 */

import React, {useEffect, useCallback, useState} from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  FlatList,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {colors, typography, spacing, borderRadius} from '@theme';
import {useAuthStore} from '@store/authStore';
import {useWalletStore} from '@store/walletStore';
import {useTransactionStore} from '@store/transactionStore';
import {useTokenStore} from '@store/tokenStore';
import {fetchWalletBalances} from '@services/blockchain/blockchainService';
import {fetchTokens} from '@services/token/tokenService';
import {fetchTokenPrices, getTokenUsdValue} from '@services/pricing/priceService';
import {
  isValidAddress,
  estimateGasFee,
  sendNativeTransaction,
  waitForConfirmation,
} from '@services/transaction/transactionService';
import {TokenRow} from '../../components/wallet/TokenRow';
import type {MainTabParamList, WalletStackParamList} from './types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

const Tab = createBottomTabNavigator<MainTabParamList>();
const WalletStack = createNativeStackNavigator<WalletStackParamList>();

type WalletNavProp = NativeStackNavigationProp<WalletStackParamList>;

// ── Wallet Screen (formerly Dashboard) ───────────────────────

function WalletHomeScreen({navigation}: {navigation: WalletNavProp}): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const address = useWalletStore((state) => state.address);
  const tokens = useWalletStore((state) => state.tokens);
  const network = useWalletStore((state) => state.network);
  const isLoadingBalances = useWalletStore((state) => state.isLoadingBalances);
  const setTokens = useWalletStore((state) => state.setTokens);
  const setLoadingBalances = useWalletStore((state) => state.setLoadingBalances);

  // New Token Store
  const erc20Tokens = useTokenStore((state) => state.tokens);
  const setErc20Tokens = useTokenStore((state) => state.setTokens);
  const isErc20Loading = useTokenStore((state) => state.loading);
  const setErc20Loading = useTokenStore((state) => state.setLoading);

  const loadBalances = useCallback(async () => {
    if (!address) return;
    setLoadingBalances(true);
    setErc20Loading(true);

    try {
      // 1. Native balance (ETH/MATIC)
      const balances = await fetchWalletBalances(address, network);
      setTokens(balances);

      // 2. ERC-20 Tokens
      const rawErc20s = await fetchTokens(address, network);

      // 3. USD Pricing
      const nativeSymbol = balances[0]?.symbol || 'ETH';
      const symbolsToFetch = [nativeSymbol, ...rawErc20s.map((t) => t.symbol)];
      const prices = await fetchTokenPrices(symbolsToFetch, network as 'ethereum' | 'polygon');

      // 4. Update Token Store with Prices
      const tokensWithUsd = rawErc20s.map((t) => ({
        ...t,
        balanceUsd: getTokenUsdValue(t.balanceFormatted, prices[t.symbol.toLowerCase()] || 0),
      }));
      setErc20Tokens(tokensWithUsd);

      // (Optional phase logic: update total balance to include everything)
    } catch (error) {
      console.error('[WalletScreen] Data fetch failed:', error);
    } finally {
      setLoadingBalances(false);
      setErc20Loading(false);
    }
  }, [address, network]);

  useEffect(() => {
    loadBalances();
  }, [loadBalances]);

  // Track overall USD balance
  const totalUsdBalance = React.useMemo(() => {
    let total = 0;
    // We assume native balance isn't tracked in USD right now based on the old code "Future",
    // but the prompt tasks to improve the portfolio UI to show all total values.
    // If native has usd we'd add it here. For now we only have ERC20 USD values.
    for (const t of erc20Tokens) {
      if (t.balanceUsd) {
        total += parseFloat(t.balanceUsd);
      }
    }
    return total;
  }, [erc20Tokens]);

  const displayTotalUsd = `$${totalUsdBalance.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

  // Truncate address for display
  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : '...';

  return (
    <LinearGradient
      colors={[colors.background.primary, '#0D0D1A']}
      style={styles.screen}>
      <FlatList
        data={[...tokens, ...erc20Tokens]}
        keyExtractor={(item) => item.address + item.symbol}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingBalances}
            onRefresh={loadBalances}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }
        ListHeaderComponent={
          <>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.greeting}>Good evening 👋</Text>
              <Text style={styles.username}>@{user?.username ?? 'user'}</Text>
            </View>

            {/* Balance Card */}
            <LinearGradient
              colors={[colors.brand.primary, '#4A3CB5', '#2D2080']}
              start={{x: 0, y: 0}}
              end={{x: 1, y: 1}}
              style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Wallet Balance</Text>
              <Text style={[styles.balanceAmount, {fontSize: 36, fontWeight: '700'}]}>
                {displayTotalUsd}
              </Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceAddressLabel}>{displayAddress}</Text>
                <Text style={styles.balancePeriod}>{network}</Text>
              </View>
            </LinearGradient>

            {/* Quick Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={styles.actionItem}
                onPress={() => navigation.navigate('SendScreen')}
                activeOpacity={0.7}>
                <View style={styles.actionIcon}>
                  <Ionicons name="arrow-up" size={22} color={colors.text.primary} />
                </View>
                <Text style={styles.actionLabel}>Send</Text>
              </TouchableOpacity>
              <View style={styles.actionItem}>
                <View style={styles.actionIcon}>
                  <Ionicons name="arrow-down" size={22} color={colors.text.primary} />
                </View>
                <Text style={styles.actionLabel}>Receive</Text>
              </View>
              <View style={styles.actionItem}>
                <View style={styles.actionIcon}>
                  <Ionicons name="swap-horizontal" size={22} color={colors.text.primary} />
                </View>
                <Text style={styles.actionLabel}>Swap</Text>
              </View>
            </View>

            {/* Token list */}
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Tokens</Text>
              {(isLoadingBalances || isErc20Loading) && (
                <ActivityIndicator size="small" color={colors.brand.primary} />
              )}
            </View>
          </>
        }
        renderItem={({item}) => {
          // Both native tokens and ERC20 tokens share `symbol`, `name`, `balanceFormatted`
          // ERC20 tokens also have `balanceUsd` and `logo`
          const isNative = item.address === 'native';
          return (
            <TokenRow
              symbol={item.symbol}
              name={item.name}
              balanceFormatted={item.balanceFormatted}
              balanceUsd={'balanceUsd' in item ? (item as any).balanceUsd : null}
              logo={'logo' in item ? (item as any).logo : undefined}
              primaryColor={isNative ? colors.brand.primary : '#6C5CE7'}
            />
          );
        }}
        ListEmptyComponent={
          tokens.length === 0 && erc20Tokens.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>
                {isLoadingBalances || isErc20Loading ? 'Loading balances...' : 'No tokens found'}
              </Text>
            </View>
          ) : null
        }
        ListFooterComponent={<RecentActivity />}
      />
    </LinearGradient>
  );
}

// ── Recent Activity Component ────────────────────────────────

function RecentActivity(): React.JSX.Element {
  const transactions = useTransactionStore((s) => s.transactions);
  const pendingTxs = useTransactionStore((s) => s.pendingTransactions);
  const allTxs = [...pendingTxs, ...transactions].slice(0, 10);

  return (
    <>
      <View style={[styles.sectionHeader, {marginTop: spacing['2xl']}]}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
      </View>
      {allTxs.length > 0 ? (
        allTxs.map((tx) => (
          <View key={tx.hash} style={styles.tokenRow}>
            <View style={[
              styles.tokenIcon,
              {backgroundColor: tx.status === 'pending' ? '#FFA50020' : tx.status === 'confirmed' ? colors.brand.primary + '20' : '#FF000020'},
            ]}>
              <Ionicons
                name={tx.type === 'send' ? 'arrow-up' : 'arrow-down'}
                size={18}
                color={tx.status === 'pending' ? '#FFA500' : tx.status === 'confirmed' ? colors.brand.primary : '#FF0000'}
              />
            </View>
            <View style={styles.tokenInfo}>
              <Text style={styles.tokenSymbol}>
                {tx.type === 'send' ? 'Sent' : 'Received'} {tx.tokenSymbol}
              </Text>
              <Text style={styles.tokenName}>
                {tx.status === 'pending' ? '⏳ Pending...' : tx.to.slice(0, 8) + '...'}
              </Text>
            </View>
            <View style={styles.tokenBalance}>
              <Text style={styles.tokenAmount}>
                {tx.type === 'send' ? '-' : '+'}{tx.valueFormatted}
              </Text>
            </View>
          </View>
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No transactions yet</Text>
        </View>
      )}
    </>
  );
}

// ── Send Screen ──────────────────────────────────────────────

function SendScreen({navigation}: {navigation: WalletNavProp}): React.JSX.Element {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [gasFee, setGasFee] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState('');
  const address = useWalletStore((s) => s.address);
  const tokens = useWalletStore((s) => s.tokens);
  const network = useWalletStore((s) => s.network);

  const nativeBalance = tokens.length > 0 ? tokens[0]! : null;
  const symbol = nativeBalance?.symbol ?? 'ETH';

  const handleEstimate = useCallback(async () => {
    setError('');
    if (!isValidAddress(toAddress)) {
      setError('Invalid recipient address');
      return;
    }
    if (!amount || parseFloat(amount) <= 0) {
      setError('Enter a valid amount');
      return;
    }
    if (nativeBalance && parseFloat(amount) > parseFloat(nativeBalance.balanceFormatted)) {
      setError('Insufficient balance');
      return;
    }

    setIsEstimating(true);
    try {
      const estimate = await estimateGasFee(toAddress, amount, network);
      setGasFee(estimate.totalFeeFormatted);
      navigation.navigate('ConfirmSend', {
        to: toAddress,
        amount,
        gasFee: estimate.totalFeeFormatted,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gas estimation failed');
    } finally {
      setIsEstimating(false);
    }
  }, [toAddress, amount, network, nativeBalance]);

  return (
    <LinearGradient
      colors={[colors.background.primary, '#0D0D1A']}
      style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: 120}]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, {marginLeft: spacing.md}]}>Send {symbol}</Text>
        </View>

        {/* Balance info */}
        <View style={sendStyles.balanceInfo}>
          <Text style={sendStyles.balanceLabel}>Available Balance</Text>
          <Text style={sendStyles.balanceValue}>
            {nativeBalance ? `${nativeBalance.balanceFormatted} ${symbol}` : '...'}
          </Text>
        </View>

        {/* Recipient */}
        <Text style={sendStyles.inputLabel}>Recipient Address</Text>
        <TextInput
          style={sendStyles.input}
          placeholder="0x..."
          placeholderTextColor={colors.text.tertiary}
          value={toAddress}
          onChangeText={(t) => { setToAddress(t); setError(''); }}
          autoCapitalize="none"
          autoCorrect={false}
        />

        {/* Amount */}
        <Text style={sendStyles.inputLabel}>Amount ({symbol})</Text>
        <TextInput
          style={sendStyles.input}
          placeholder="0.00"
          placeholderTextColor={colors.text.tertiary}
          value={amount}
          onChangeText={(t) => { setAmount(t); setError(''); }}
          keyboardType="decimal-pad"
        />

        {/* Max button */}
        {nativeBalance && (
          <TouchableOpacity
            style={sendStyles.maxButton}
            onPress={() => setAmount(nativeBalance.balanceFormatted)}>
            <Text style={sendStyles.maxButtonText}>MAX</Text>
          </TouchableOpacity>
        )}

        {/* Error */}
        {error ? <Text style={sendStyles.errorText}>{error}</Text> : null}
      </ScrollView>

      {/* Continue button */}
      <View style={sendStyles.bottomAction}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleEstimate}
          disabled={!toAddress || !amount || isEstimating}>
          <LinearGradient
            colors={
              toAddress && amount && !isEstimating
                ? [colors.brand.primary, colors.brand.primaryDark]
                : ['#333', '#222']
            }
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={sendStyles.primaryButton}>
            {isEstimating ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={sendStyles.primaryButtonText}>Continue</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

// ── Confirm Send Screen ──────────────────────────────────────

function ConfirmSendScreen({route, navigation}: {
  route: {params: {to: string; amount: string; gasFee: string}};
  navigation: WalletNavProp;
}): React.JSX.Element {
  const [isSending, setIsSending] = useState(false);
  const network = useWalletStore((s) => s.network);
  const tokens = useWalletStore((s) => s.tokens);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const setTokens = useWalletStore((s) => s.setTokens);
  const address = useWalletStore((s) => s.address);

  const {to, amount, gasFee} = route.params;
  const symbol = tokens.length > 0 ? tokens[0]!.symbol : 'ETH';

  const handleConfirm = async () => {
    setIsSending(true);
    try {
      // 1. Send transaction
      const result = await sendNativeTransaction(to, amount, network);

      // 2. Add to pending transactions
      addTransaction({
        hash: result.hash,
        type: 'send',
        status: 'pending',
        from: result.from,
        to: result.to,
        value: amount,
        valueFormatted: amount,
        tokenSymbol: symbol,
        tokenAddress: '0x0000000000000000000000000000000000000000',
        timestamp: Date.now(),
      });

      // 3. Navigate back to wallet
      navigation.popToTop();

      // 4. Wait for confirmation in background
      const confirmation = await waitForConfirmation(result.hash, network);
      updateTransaction(result.hash, {
        status: confirmation.status,
        blockNumber: confirmation.blockNumber,
        gasUsed: confirmation.gasUsed,
      });

      // 5. Refresh balances
      if (address) {
        const balances = await fetchWalletBalances(address, network);
        setTokens(balances);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      Alert.alert('Transaction Failed', msg);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.background.primary, '#0D0D1A']}
      style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, {paddingBottom: 120}]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, {marginLeft: spacing.md}]}>Confirm Transaction</Text>
        </View>

        {/* Summary card */}
        <LinearGradient
          colors={[colors.brand.primary, '#4A3CB5', '#2D2080']}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={confirmStyles.summaryCard}>
          <Text style={confirmStyles.summaryLabel}>Sending</Text>
          <Text style={confirmStyles.summaryAmount}>{amount} {symbol}</Text>
        </LinearGradient>

        {/* Details */}
        <View style={confirmStyles.detailsCard}>
          <View style={confirmStyles.detailRow}>
            <Text style={confirmStyles.detailLabel}>To</Text>
            <Text style={confirmStyles.detailValue} numberOfLines={1}>
              {to.slice(0, 10)}...{to.slice(-8)}
            </Text>
          </View>
          <View style={confirmStyles.divider} />
          <View style={confirmStyles.detailRow}>
            <Text style={confirmStyles.detailLabel}>Network</Text>
            <Text style={confirmStyles.detailValue}>{network}</Text>
          </View>
          <View style={confirmStyles.divider} />
          <View style={confirmStyles.detailRow}>
            <Text style={confirmStyles.detailLabel}>Network Fee</Text>
            <Text style={confirmStyles.detailValue}>{gasFee} {symbol}</Text>
          </View>
          <View style={confirmStyles.divider} />
          <View style={confirmStyles.detailRow}>
            <Text style={confirmStyles.detailLabel}>Total</Text>
            <Text style={[confirmStyles.detailValue, {color: colors.brand.primary}]}>
              {(parseFloat(amount) + parseFloat(gasFee)).toFixed(8)} {symbol}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Confirm button */}
      <View style={sendStyles.bottomAction}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleConfirm}
          disabled={isSending}>
          <LinearGradient
            colors={
              !isSending
                ? [colors.brand.primary, colors.brand.primaryDark]
                : ['#333', '#222']
            }
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={sendStyles.primaryButton}>
            {isSending ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <Text style={sendStyles.primaryButtonText}>Confirm & Send</Text>
            )}
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

// ── Wallet Stack Navigator ───────────────────────────────────

function WalletStackNavigator(): React.JSX.Element {
  return (
    <WalletStack.Navigator screenOptions={{headerShown: false}}>
      <WalletStack.Screen name="WalletHome" component={WalletHomeScreen} />
      <WalletStack.Screen name="SendScreen" component={SendScreen} />
      <WalletStack.Screen name="ConfirmSend" component={ConfirmSendScreen} />
    </WalletStack.Navigator>
  );
}

// ── Rewards Screen ───────────────────────────────────────────

function RewardsScreen(): React.JSX.Element {
  return (
    <LinearGradient
      colors={[colors.background.primary, '#0D0D1A']}
      style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>Rewards</Text>

        {/* Points card */}
        <LinearGradient
          colors={['#1A1A2E', '#16213E']}
          style={styles.rewardsHeroCard}>
          <Text style={styles.rewardsHeroEmoji}>🏆</Text>
          <Text style={styles.rewardsHeroPoints}>0</Text>
          <Text style={styles.rewardsHeroLabel}>Total Points</Text>
          <View style={styles.rewardsLevelBadge}>
            <Text style={styles.rewardsLevelText}>Level 1 — Newcomer</Text>
          </View>
        </LinearGradient>

        {/* How to earn */}
        <Text style={styles.sectionTitle}>How to Earn</Text>
        {[
          {icon: '💸', title: 'Send Tokens', desc: '+10 pts per tx', pts: '10'},
          {icon: '📥', title: 'Receive Tokens', desc: '+5 pts per tx', pts: '5'},
          {icon: '🔄', title: 'Swap Tokens', desc: '+15 pts per swap', pts: '15'},
          {icon: '📅', title: 'Daily Check-in', desc: '+3 pts daily', pts: '3'},
        ].map((item) => (
          <View key={item.title} style={styles.earnRow}>
            <Text style={styles.earnIcon}>{item.icon}</Text>
            <View style={styles.earnInfo}>
              <Text style={styles.earnTitle}>{item.title}</Text>
              <Text style={styles.earnDesc}>{item.desc}</Text>
            </View>
            <View style={styles.earnPts}>
              <Text style={styles.earnPtsText}>+{item.pts}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </LinearGradient>
  );
}

// ── MiniApps Screen ──────────────────────────────────────────

const DAPPS = [
  {name: 'Uniswap', icon: '🦄', desc: 'Swap tokens', color: '#FF007A'},
  {name: 'Aave', icon: '👻', desc: 'Lend & borrow', color: '#B6509E'},
  {name: 'OpenSea', icon: '🌊', desc: 'NFT marketplace', color: '#2081E2'},
  {name: 'Lido', icon: '🏔', desc: 'Liquid staking', color: '#00A3FF'},
  {name: '1inch', icon: '🐴', desc: 'DEX aggregator', color: '#1B314F'},
  {name: 'Curve', icon: '🔶', desc: 'Stable swaps', color: '#FF6B35'},
];

function MiniAppsScreen(): React.JSX.Element {
  return (
    <LinearGradient
      colors={[colors.background.primary, '#0D0D1A']}
      style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={styles.pageTitle}>MiniApps</Text>
        <Text style={styles.pageSubtitle}>
          Access DeFi protocols directly from your wallet
        </Text>

        {/* DApp grid */}
        <View style={styles.dappGrid}>
          {DAPPS.map((dapp) => (
            <TouchableOpacity
              key={dapp.name}
              style={styles.dappCard}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(dapp.name, 'WebView integration coming in Phase 5')
              }>
              <View style={[styles.dappIcon, {backgroundColor: dapp.color + '20'}]}>
                <Text style={styles.dappEmoji}>{dapp.icon}</Text>
              </View>
              <Text style={styles.dappName}>{dapp.name}</Text>
              <Text style={styles.dappDesc}>{dapp.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming soon */}
        <View style={styles.comingSoonCard}>
          <Text style={styles.comingSoonEmoji}>🚀</Text>
          <Text style={styles.comingSoonTitle}>More Coming Soon</Text>
          <Text style={styles.comingSoonText}>
            We're integrating more DeFi protocols and Web3 apps.
          </Text>
        </View>
      </ScrollView>
    </LinearGradient>
  );
}

// ── Account Screen ───────────────────────────────────────────

function AccountScreen(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', style: 'destructive', onPress: logout},
    ]);
  };

  return (
    <LinearGradient
      colors={[colors.background.primary, '#0D0D1A']}
      style={styles.screen}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}>
        <Text style={styles.pageTitle}>Account</Text>

        {/* Profile header */}
        <View style={styles.profileCard}>
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user?.avatarId ?? '👤'}
            </Text>
          </View>
          <Text style={styles.profileName}>@{user?.username ?? 'user'}</Text>
          <Text style={styles.profileAddress}>
            {user?.walletAddress
              ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
              : '0x0000...0000'}
          </Text>
        </View>

        {/* Settings rows */}
        {[
          {icon: '👤', label: 'Edit Profile'},
          {icon: '🔐', label: 'Security & Biometrics'},
          {icon: '🌐', label: 'Network'},
          {icon: '🔔', label: 'Notifications'},
          {icon: '🎨', label: 'Appearance'},
          {icon: '📖', label: 'About Vortex'},
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={styles.settingsRow}
            activeOpacity={0.6}>
            <Text style={styles.settingsIcon}>{item.icon}</Text>
            <Text style={styles.settingsLabel}>{item.label}</Text>
            <Text style={styles.settingsArrow}>›</Text>
          </TouchableOpacity>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <Text style={styles.versionText}>Vortex 2.0 — v0.0.1</Text>
      </ScrollView>
    </LinearGradient>
  );
}

// ── Tab Icon ─────────────────────────────────────────────────

function TabIcon({label, focused}: {label: string; focused: boolean}) {
  const iconMap: Record<string, keyof typeof Ionicons.glyphMap> = {
    Wallet: focused ? 'wallet' : 'wallet-outline',
    Rewards: focused ? 'trophy' : 'trophy-outline',
    MiniApps: focused ? 'grid' : 'grid-outline',
    Account: focused ? 'person' : 'person-outline',
  };

  return (
    <View style={styles.tabIconContainer}>
      <Ionicons
        name={iconMap[label] ?? 'ellipse-outline'}
        size={22}
        color={focused ? colors.brand.primary : colors.text.tertiary}
      />
      {focused && <View style={styles.tabDot} />}
    </View>
  );
}

// ── Navigator ────────────────────────────────────────────────

export function MainNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      screenOptions={({route}) => ({
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: colors.brand.primary,
        tabBarInactiveTintColor: colors.text.tertiary,
        tabBarLabelStyle: styles.tabLabel,
        tabBarIcon: ({focused}) => (
          <TabIcon label={route.name} focused={focused} />
        ),
      })}>
      <Tab.Screen name="Wallet" component={WalletStackNavigator} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
      <Tab.Screen name="MiniApps" component={MiniAppsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['5xl'],
    paddingBottom: 100,
  },

  // Page title
  pageTitle: {
    ...typography.headingLarge,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  pageSubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing['2xl'],
  },

  // Header
  header: {
    marginBottom: spacing['2xl'],
  },
  greeting: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    marginBottom: spacing['2xs'],
  },
  username: {
    ...typography.headingLarge,
    color: colors.text.primary,
  },

  // Balance Card
  balanceCard: {
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    marginBottom: spacing['2xl'],
    shadowColor: colors.brand.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  balanceLabel: {
    ...typography.labelMedium,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.xs,
  },
  balanceAmount: {
    ...typography.displayLarge,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  balanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  balanceAddressLabel: {
    ...typography.labelMedium,
    color: 'rgba(255,255,255,0.7)',
    fontFamily: 'monospace',
  },
  balancePeriod: {
    ...typography.labelSmall,
    color: 'rgba(255,255,255,0.5)',
  },

  // Quick Actions
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing['3xl'],
  },
  actionItem: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionIcon: {
    width: 52,
    height: 52,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  actionIconText: {
    fontSize: 20,
    color: colors.text.primary,
  },
  actionLabel: {
    ...typography.labelSmall,
    color: colors.text.secondary,
  },

  // Section
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    ...typography.headingSmall,
    color: colors.text.primary,
  },
  sectionAction: {
    ...typography.labelMedium,
    color: colors.brand.primary,
  },

  // Token rows (Used by RecentActivity)
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  tokenIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  tokenInfo: {
    flex: 1,
  },
  tokenSymbol: {
    ...typography.labelLarge,
    color: colors.text.primary,
  },
  tokenName: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  tokenBalance: {
    alignItems: 'flex-end',
  },
  tokenAmount: {
    ...typography.labelLarge,
    color: colors.text.primary,
  },

  // Empty state
  emptyState: {
    paddingVertical: spacing['2xl'],
    alignItems: 'center',
  },
  emptyStateText: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
  },

  // Rewards
  rewardsHeroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing['3xl'],
    alignItems: 'center',
    marginBottom: spacing['3xl'],
    borderWidth: 1,
    borderColor: colors.border.primary,
  },
  rewardsHeroEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  rewardsHeroPoints: {
    ...typography.displayLarge,
    color: colors.brand.primary,
  },
  rewardsHeroLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  rewardsLevelBadge: {
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  rewardsLevelText: {
    ...typography.labelSmall,
    color: colors.brand.primary,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  earnIcon: {
    fontSize: 24,
    marginRight: spacing.md,
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  earnDesc: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  earnPts: {
    backgroundColor: 'rgba(0, 210, 211, 0.12)',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  earnPtsText: {
    ...typography.labelSmall,
    color: colors.brand.secondary,
  },

  // MiniApps / DApp grid
  dappGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    marginBottom: spacing['2xl'],
  },
  dappCard: {
    width: '47%',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    borderWidth: 1,
    borderColor: colors.border.primary,
    gap: spacing.sm,
  },
  dappIcon: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dappEmoji: {
    fontSize: 24,
  },
  dappName: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  dappDesc: {
    ...typography.bodySmall,
    color: colors.text.secondary,
  },
  comingSoonCard: {
    backgroundColor: 'rgba(108, 92, 231, 0.08)',
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(108, 92, 231, 0.2)',
  },
  comingSoonEmoji: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  comingSoonTitle: {
    ...typography.labelLarge,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  comingSoonText: {
    ...typography.bodySmall,
    color: colors.text.secondary,
    textAlign: 'center',
  },

  // Account / Profile
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.xl,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2,
    borderColor: colors.brand.primary,
  },
  profileAvatarText: {
    fontSize: 36,
  },
  profileName: {
    ...typography.headingMedium,
    color: colors.text.primary,
    marginBottom: spacing.xs,
  },
  profileAddress: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    fontFamily: 'monospace',
  },

  // Settings rows
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: colors.border.primary,
  },
  settingsIcon: {
    fontSize: 20,
    marginRight: spacing.md,
  },
  settingsLabel: {
    ...typography.bodyLarge,
    color: colors.text.primary,
    flex: 1,
  },
  settingsArrow: {
    ...typography.headingMedium,
    color: colors.text.tertiary,
  },

  // Logout
  logoutButton: {
    marginTop: spacing['3xl'],
    backgroundColor: 'rgba(255, 71, 87, 0.1)',
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 71, 87, 0.3)',
  },
  logoutText: {
    ...typography.labelLarge,
    color: colors.status.error,
  },
  versionText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
    marginTop: spacing['2xl'],
  },

  // Tab Bar
  tabBar: {
    backgroundColor: colors.background.secondary,
    borderTopColor: colors.border.primary,
    borderTopWidth: 1,
    height: 80,
    paddingBottom: spacing.sm,
    paddingTop: spacing.sm,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  tabIconContainer: {
    alignItems: 'center',
  },
  tabIcon: {
    fontSize: 22,
  },
  tabDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.brand.primary,
    marginTop: 2,
  },
});

// ── Send Screen Styles ───────────────────────────────────────

const sendStyles = StyleSheet.create({
  balanceInfo: {
    backgroundColor: colors.overlay.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing['2xl'],
  },
  balanceLabel: {
    ...typography.labelSmall,
    color: colors.text.tertiary,
    marginBottom: spacing.xs,
  },
  balanceValue: {
    ...typography.headingMedium,
    color: colors.text.primary,
  },
  inputLabel: {
    ...typography.labelMedium,
    color: colors.text.secondary,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  input: {
    backgroundColor: colors.overlay.light,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    color: colors.text.primary,
    fontSize: 16,
    borderWidth: 1,
    borderColor: colors.border.secondary,
  },
  maxButton: {
    alignSelf: 'flex-end',
    marginTop: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xs,
    backgroundColor: colors.brand.primary + '20',
    borderRadius: borderRadius.md,
  },
  maxButtonText: {
    ...typography.labelSmall,
    color: colors.brand.primary,
    fontWeight: '700',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.error,
    marginTop: spacing.md,
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.lg,
    backgroundColor: colors.background.primary,
  },
  primaryButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    ...typography.labelLarge,
    color: '#FFFFFF',
    fontSize: 16,
  },
});

// ── Confirm Screen Styles ────────────────────────────────────

const confirmStyles = StyleSheet.create({
  summaryCard: {
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    marginBottom: spacing['2xl'],
  },
  summaryLabel: {
    ...typography.labelMedium,
    color: 'rgba(255,255,255,0.7)',
    marginBottom: spacing.sm,
  },
  summaryAmount: {
    ...typography.displayLarge,
    color: '#FFFFFF',
  },
  detailsCard: {
    backgroundColor: colors.overlay.light,
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  detailLabel: {
    ...typography.bodyMedium,
    color: colors.text.tertiary,
  },
  detailValue: {
    ...typography.bodyMedium,
    color: colors.text.primary,
    fontFamily: 'monospace',
    maxWidth: '60%',
  },
  divider: {
    height: 1,
    backgroundColor: colors.border.secondary,
  },
});
