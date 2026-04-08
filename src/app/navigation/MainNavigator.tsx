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
  Switch,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {colors, typography, spacing, borderRadius, useTheme} from '@theme';
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
import {WalletSummaryCard} from '../../components/wallet/WalletSummaryCard';
import {TokenSection} from '../../components/wallet/TokenSection';
import {NFTSection} from '../../components/wallet/NFTSection';
import {AssetSwitcher} from '../../components/wallet/AssetSwitcher';
import {FloatingNavBar} from '../../components/navigation/FloatingNavBar';
import {TransactionCard} from '../../components/wallet/TransactionCard';
import {ActionButton} from '../../components/ui/ActionButton';
import {authenticateUser} from '../../services/security/biometricService';
import {decryptPrivateKey, verifyPin} from '../../services/security/encryptionService';
import {secureStorage} from '../../services/storage/secureStorage';
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

  // Layout State
  const [activeTab, setActiveTab] = useState<'tokens' | 'nfts'>('tokens');

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
      const addressesToFetch = rawErc20s.map((t) => t.address);
      const prices = await fetchTokenPrices(addressesToFetch, network as 'ethereum' | 'polygon');

      // 4. Update Token Store with Prices
      const tokensWithUsd = rawErc20s.map((t) => ({
        ...t,
        balanceUsd: getTokenUsdValue(t.balanceFormatted, prices[t.address.toLowerCase()] || prices[t.address] || 0),
      }));
      setErc20Tokens(tokensWithUsd);
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

  const {colors} = useTheme();

  return (
    <View style={[styles.screen, {backgroundColor: colors.background.primary}]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingBalances}
            onRefresh={loadBalances}
            tintColor={colors.brand.primary}
            colors={[colors.brand.primary]}
          />
        }>
        {/* Top Summary Card */}
        <WalletSummaryCard
          username={user?.username}
          address={address ?? undefined}
          network={network}
          totalUsdDisplay={displayTotalUsd}
          onSend={() => navigation.navigate('SendScreen')}
          onReceive={() => Alert.alert('Receive', 'Show QR code modal')}
          onBuy={() => Alert.alert('Buy', 'Fiat onramp integration coming soon')}
          onSwap={() => Alert.alert('Swap', 'DEX integration coming soon')}
        />

        {/* Tab Switcher */}
        <AssetSwitcher activeTab={activeTab} onChangeTab={setActiveTab} />

        {/* Tokens List Section */}
        {activeTab === 'tokens' ? (
          <TokenSection isLoading={isLoadingBalances || isErc20Loading}>
            {[...tokens, ...erc20Tokens].map((item, index) => {
              const isNative = index < tokens.length;
              return (
                <TokenRow
                  key={item.address + item.symbol + index}
                  symbol={item.symbol}
                  name={item.name}
                  balanceFormatted={item.balanceFormatted}
                  balanceUsd={'balanceUsd' in item ? (item as any).balanceUsd : null}
                  logo={'logo' in item ? (item as any).logo : undefined}
                  primaryColor={isNative ? colors.brand.primary : '#4ECDC4'}
                />
              );
            })}
            {tokens.length === 0 && erc20Tokens.length === 0 && (
              <View style={styles.emptyState}>
                <Text style={[styles.emptyStateText, {color: colors.text.tertiary}]}>
                  {isLoadingBalances || isErc20Loading ? 'Loading balances...' : 'No tokens found'}
                </Text>
              </View>
            )}
          </TokenSection>
        ) : (
          /* NFTs Section Placeholder */
          <NFTSection />
        )}
      </ScrollView>
    </View>
  );
}

// ── Recent Activity Component ────────────────────────────────

function RecentActivity(): React.JSX.Element {
  const transactions = useTransactionStore((s) => s.transactions);
  const pendingTxs = useTransactionStore((s) => s.pendingTransactions);
  const allTxs = [...pendingTxs, ...transactions].slice(0, 10);
  const {colors} = useTheme();

  return (
    <View style={{paddingHorizontal: spacing['2xl']}}>
      <View style={[styles.sectionHeader, {marginTop: spacing['2xl']}]}>
        <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>Recent Activity</Text>
      </View>
      {allTxs.length > 0 ? (
        allTxs.map((tx) => (
          <TransactionCard
            key={tx.hash}
            hash={tx.hash}
            type={tx.type as 'send' | 'receive'}
            status={tx.status as 'pending' | 'confirmed' | 'failed'}
            tokenSymbol={tx.tokenSymbol}
            valueFormatted={tx.valueFormatted}
            to={tx.to}
            timestamp={tx.timestamp}
          />
        ))
      ) : (
        <View style={styles.emptyState}>
          <Text style={[styles.emptyStateText, {color: colors.text.tertiary}]}>
            No transactions yet
          </Text>
        </View>
      )}
    </View>
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
  const {colors} = useTheme();

  const nativeBalance = tokens.length > 0 ? tokens[0]! : null;
  const symbol = nativeBalance?.symbol ?? 'ETH';

  // Address validation state
  const addressValid = toAddress.length > 0 ? isValidAddress(toAddress) : null;

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
    <View style={[styles.screen, {backgroundColor: colors.background.primary}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.paddedScrollContent, {paddingBottom: 120}]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={sendStyles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, {color: colors.text.primary}]}>Send {symbol}</Text>
          <View style={{width: 40}} />
        </View>

        {/* Step indicator */}
        <View style={sendStyles.stepRow}>
          <View style={[sendStyles.stepDot, {backgroundColor: colors.brand.primary}]} />
          <View style={[sendStyles.stepLine, {backgroundColor: colors.border.primary}]} />
          <View style={[sendStyles.stepDot, {backgroundColor: colors.border.primary}]} />
        </View>

        {/* Balance info card */}
        <View style={[sendStyles.balanceCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary}]}>
          <Text style={[sendStyles.balanceLabel, {color: colors.text.tertiary}]}>Available Balance</Text>
          <Text style={[sendStyles.balanceValue, {color: colors.text.primary}]}>
            {nativeBalance ? `${nativeBalance.balanceFormatted} ${symbol}` : '...'}
          </Text>
        </View>

        {/* Recipient */}
        <Text style={[sendStyles.inputLabel, {color: colors.text.secondary}]}>Recipient Address</Text>
        <View style={[sendStyles.inputWrapper, {borderColor: addressValid === false ? colors.status.error : addressValid === true ? colors.status.success : colors.border.secondary, backgroundColor: colors.background.secondary}]}>
          <TextInput
            style={[sendStyles.input, {color: colors.text.primary}]}
            placeholder="0x..."
            placeholderTextColor={colors.text.tertiary}
            value={toAddress}
            onChangeText={(t) => { setToAddress(t); setError(''); }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {addressValid !== null && (
            <View style={[sendStyles.validationBadge, {backgroundColor: addressValid ? colors.status.successBg : colors.status.errorBg}]}>
              <Ionicons
                name={addressValid ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={addressValid ? colors.status.success : colors.status.error}
              />
            </View>
          )}
        </View>

        {/* Amount */}
        <Text style={[sendStyles.inputLabel, {color: colors.text.secondary}]}>Amount ({symbol})</Text>
        <View style={[sendStyles.inputWrapper, {borderColor: colors.border.secondary, backgroundColor: colors.background.secondary}]}>
          <TextInput
            style={[sendStyles.input, {color: colors.text.primary}]}
            placeholder="0.00"
            placeholderTextColor={colors.text.tertiary}
            value={amount}
            onChangeText={(t) => { setAmount(t); setError(''); }}
            keyboardType="decimal-pad"
          />
          {nativeBalance && (
            <TouchableOpacity
              style={[sendStyles.maxPill, {borderColor: colors.brand.primary}]}
              onPress={() => setAmount(nativeBalance.balanceFormatted)}>
              <Text style={[sendStyles.maxPillText, {color: colors.brand.primary}]}>MAX</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Error */}
        {error ? (
          <View style={[sendStyles.errorRow, {backgroundColor: colors.status.errorBg}]}>
            <Ionicons name="warning" size={14} color={colors.status.error} />
            <Text style={[sendStyles.errorText, {color: colors.status.error}]}>{error}</Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Continue button */}
      <View style={[sendStyles.bottomAction, {backgroundColor: colors.background.primary}]}>
        <ActionButton
          label="Continue"
          onPress={handleEstimate}
          disabled={!toAddress || !amount || isEstimating}
          loading={isEstimating}
        />
      </View>
    </View>
  );
}

// ── Confirm Send Screen ──────────────────────────────────────

function ConfirmSendScreen({route, navigation}: {
  route: {params: {to: string; amount: string; gasFee: string}};
  navigation: WalletNavProp;
}): React.JSX.Element {
  const [isSending, setIsSending] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const network = useWalletStore((s) => s.network);
  const tokens = useWalletStore((s) => s.tokens);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const setTokens = useWalletStore((s) => s.setTokens);
  const address = useWalletStore((s) => s.address);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);
  const {colors} = useTheme();

  const {to, amount, gasFee} = route.params;
  const symbol = tokens.length > 0 ? tokens[0]!.symbol : 'ETH';
  const totalAmount = (parseFloat(amount) + parseFloat(gasFee)).toFixed(8);

  const handleConfirm = async () => {
    // Validate PIN input
    if (!pinInput || pinInput.length < 6) {
      setPinError('Enter your 6-digit PIN to continue');
      return;
    }

    setIsSending(true);
    setPinError('');

    // 1. Biometric check (if enabled)
    if (isBiometricEnabled) {
      const auth = await authenticateUser('Confirm Transaction');
      if (!auth.success) {
        setIsSending(false);
        if (auth.reason !== 'cancelled') {
          Alert.alert('Authentication Failed', auth.message);
        }
        return;
      }
    }

    try {
      // 2. Verify PIN against stored hash
      const storedHash = await secureStorage.getPinHash();
      if (storedHash && !verifyPin(pinInput, storedHash)) {
        setPinError('Incorrect PIN');
        setIsSending(false);
        return;
      }

      // 3. Retrieve encrypted wallet
      const encryptedWallet = await secureStorage.getEncryptedWallet();

      let decryptedKey: string | undefined;

      if (encryptedWallet) {
        // 4. Decrypt private key using PIN (in function scope only)
        try {
          decryptedKey = decryptPrivateKey(encryptedWallet.encryptedPrivateKey, pinInput);
        } catch {
          setPinError('Incorrect PIN — decryption failed');
          setIsSending(false);
          return;
        }
      }
      // If no encrypted wallet, legacy flow will be used (no PIN needed)

      // 5. Send transaction with decrypted key
      const result = await sendNativeTransaction(to, amount, network, decryptedKey);

      // 6. Immediately discard decrypted key
      decryptedKey = undefined;

      // 7. Add to pending transactions
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

      // 8. Navigate back to wallet
      navigation.popToTop();

      // 9. Wait for confirmation in background
      const confirmation = await waitForConfirmation(result.hash, network);
      updateTransaction(result.hash, {
        status: confirmation.status,
        blockNumber: confirmation.blockNumber,
        gasUsed: confirmation.gasUsed,
      });

      // 10. Refresh balances
      if (address) {
        const balances = await fetchWalletBalances(address, network);
        setTokens(balances);
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Transaction failed';
      Alert.alert('Transaction Failed', msg);
    } finally {
      setIsSending(false);
      setPinInput(''); // Clear PIN from memory
    }
  };

  return (
    <View style={[styles.screen, {backgroundColor: colors.background.primary}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.paddedScrollContent, {paddingBottom: 120}]}
        showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={sendStyles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, {color: colors.text.primary}]}>Confirm</Text>
          <View style={{width: 40}} />
        </View>

        {/* Step indicator */}
        <View style={sendStyles.stepRow}>
          <View style={[sendStyles.stepDot, {backgroundColor: colors.brand.primary}]} />
          <View style={[sendStyles.stepLine, {backgroundColor: colors.brand.primary}]} />
          <View style={[sendStyles.stepDot, {backgroundColor: colors.brand.primary}]} />
        </View>

        {/* Amount summary */}
        <View style={[confirmStyles.summaryCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary}]}>
          <Text style={[confirmStyles.summaryLabel, {color: colors.text.tertiary}]}>Sending</Text>
          <Text style={[confirmStyles.summaryAmount, {color: colors.text.primary}]}>
            {amount} {symbol}
          </Text>
        </View>

        {/* Details */}
        <View style={[confirmStyles.detailsCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary}]}>
          <View style={confirmStyles.detailRow}>
            <Text style={[confirmStyles.detailLabel, {color: colors.text.tertiary}]}>To</Text>
            <Text style={[confirmStyles.detailValue, {color: colors.text.primary}]} numberOfLines={1}>
              {to.slice(0, 10)}...{to.slice(-8)}
            </Text>
          </View>
          <View style={[confirmStyles.divider, {backgroundColor: colors.border.primary}]} />
          <View style={confirmStyles.detailRow}>
            <Text style={[confirmStyles.detailLabel, {color: colors.text.tertiary}]}>Network</Text>
            <Text style={[confirmStyles.detailValue, {color: colors.text.primary}]}>
              {network.charAt(0).toUpperCase() + network.slice(1)}
            </Text>
          </View>
          <View style={[confirmStyles.divider, {backgroundColor: colors.border.primary}]} />
          <View style={confirmStyles.detailRow}>
            <Text style={[confirmStyles.detailLabel, {color: colors.text.tertiary}]}>Network Fee</Text>
            <Text style={[confirmStyles.detailValue, {color: colors.text.secondary}]}>{gasFee} {symbol}</Text>
          </View>
          <View style={[confirmStyles.divider, {backgroundColor: colors.border.primary}]} />
          <View style={confirmStyles.detailRow}>
            <Text style={[confirmStyles.detailLabel, {color: colors.text.primary, fontWeight: '600'}]}>Total</Text>
            <Text style={[confirmStyles.detailValue, {color: colors.brand.primary, fontWeight: '700'}]}>
              {totalAmount} {symbol}
            </Text>
          </View>
        </View>

        {/* PIN Input */}
        <View style={[confirmStyles.detailsCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary, marginTop: spacing.xl}]}>
          <Text style={[confirmStyles.detailLabel, {color: colors.text.secondary, marginBottom: spacing.sm}]}>
            🔐 Enter Wallet PIN
          </Text>
          <TextInput
            style={[{
              backgroundColor: colors.background.tertiary,
              borderRadius: borderRadius.md,
              borderWidth: 1.5,
              borderColor: pinError ? colors.status.error : colors.border.secondary,
              paddingHorizontal: spacing.lg,
              height: 52,
              color: colors.text.primary,
              fontSize: 18,
              fontWeight: '600',
              letterSpacing: 8,
              textAlign: 'center',
            }]}
            placeholder="••••••"
            placeholderTextColor={colors.text.tertiary}
            value={pinInput}
            onChangeText={(t) => {
              setPinInput(t.replace(/[^0-9]/g, '').slice(0, 8));
              setPinError('');
            }}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={8}
            editable={!isSending}
          />
          {pinError ? (
            <Text style={[{color: colors.status.error, ...typography.bodySmall, marginTop: spacing.sm}]}>
              {pinError}
            </Text>
          ) : null}
        </View>
      </ScrollView>

      {/* Confirm button */}
      <View style={[sendStyles.bottomAction, {backgroundColor: colors.background.primary}]}>
        <ActionButton
          label="Confirm & Send"
          onPress={handleConfirm}
          disabled={isSending}
          loading={isSending}
        />
      </View>
    </View>
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
  const {colors} = useTheme();

  return (
    <View style={[styles.screen, {backgroundColor: colors.background.primary}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.paddedScrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, {color: colors.text.primary}]}>Rewards</Text>

        {/* Points card */}
        <View style={[styles.rewardsHeroCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary}]}>
          <Text style={styles.rewardsHeroEmoji}>🏆</Text>
          <Text style={[styles.rewardsHeroPoints, {color: colors.brand.primary}]}>0</Text>
          <Text style={[styles.rewardsHeroLabel, {color: colors.text.tertiary}]}>Total Points</Text>
          <View style={[styles.rewardsLevelBadge, {backgroundColor: colors.brand.primary + '15'}]}>
            <Text style={[styles.rewardsLevelText, {color: colors.brand.primary}]}>Level 1 — Newcomer</Text>
          </View>
        </View>

        {/* How to earn */}
        <Text style={[styles.sectionTitle, {color: colors.text.primary}]}>How to Earn</Text>
        {[
          {icon: '💸', title: 'Send Tokens', desc: '+10 pts per tx', pts: '10'},
          {icon: '📥', title: 'Receive Tokens', desc: '+5 pts per tx', pts: '5'},
          {icon: '🔄', title: 'Swap Tokens', desc: '+15 pts per swap', pts: '15'},
          {icon: '📅', title: 'Daily Check-in', desc: '+3 pts daily', pts: '3'},
        ].map((item) => (
          <View key={item.title} style={[styles.earnRow, {borderBottomColor: colors.border.primary}]}>
            <View style={[styles.earnIconCircle, {backgroundColor: colors.background.tertiary}]}>
              <Text style={styles.earnIcon}>{item.icon}</Text>
            </View>
            <View style={styles.earnInfo}>
              <Text style={[styles.earnTitle, {color: colors.text.primary}]}>{item.title}</Text>
              <Text style={[styles.earnDesc, {color: colors.text.tertiary}]}>{item.desc}</Text>
            </View>
            <View style={[styles.earnPts, {backgroundColor: colors.brand.primary + '15'}]}>
              <Text style={[styles.earnPtsText, {color: colors.brand.primary}]}>+{item.pts}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
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
  const {colors} = useTheme();

  return (
    <View style={[styles.screen, {backgroundColor: colors.background.primary}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.paddedScrollContent}
        showsVerticalScrollIndicator={false}>
        <Text style={[styles.pageTitle, {color: colors.text.primary}]}>MiniApps</Text>
        <Text style={[styles.pageSubtitle, {color: colors.text.tertiary}]}>
          Access DeFi protocols directly from your wallet
        </Text>

        {/* DApp grid */}
        <View style={styles.dappGrid}>
          {DAPPS.map((dapp) => (
            <TouchableOpacity
              key={dapp.name}
              style={[styles.dappCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary}]}
              activeOpacity={0.7}
              onPress={() =>
                Alert.alert(dapp.name, 'WebView integration coming in Phase 5')
              }>
              <View style={[styles.dappIcon, {backgroundColor: dapp.color + '15'}]}>
                <Text style={styles.dappEmoji}>{dapp.icon}</Text>
              </View>
              <Text style={[styles.dappName, {color: colors.text.primary}]}>{dapp.name}</Text>
              <Text style={[styles.dappDesc, {color: colors.text.tertiary}]}>{dapp.desc}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Coming soon */}
        <View style={[styles.comingSoonCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary}]}>
          <Text style={styles.comingSoonEmoji}>🚀</Text>
          <Text style={[styles.comingSoonTitle, {color: colors.text.primary}]}>More Coming Soon</Text>
          <Text style={[styles.comingSoonText, {color: colors.text.tertiary}]}>
            We're integrating more DeFi protocols and Web3 apps.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

// ── Account Screen ───────────────────────────────────────────

function AccountScreen(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isBiometricEnabled = useAuthStore((state) => state.isBiometricEnabled);
  const setBiometricEnabled = useAuthStore((state) => state.setBiometricEnabled);

  const {colors} = useTheme();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', style: 'destructive', onPress: logout},
    ]);
  };

  const handleToggleBiometrics = async (value: boolean) => {
    if (value) {
      const result = await authenticateUser('Enable Biometric Unlock');
      if (result.success) {
        setBiometricEnabled(true);
      } else {
        setBiometricEnabled(false);
      }
    } else {
      setBiometricEnabled(false);
    }
  };

  return (
    <View style={[styles.screen, {backgroundColor: colors.background.primary}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.paddedScrollContent}>
        <Text style={[styles.pageTitle, {color: colors.text.primary}]}>Account</Text>

        {/* Profile header */}
        <View style={[styles.profileCard, {borderBottomColor: colors.border.primary}]}>
          <View style={[styles.profileAvatar, {backgroundColor: colors.background.tertiary, borderColor: colors.brand.primary}]}>
            <Text style={styles.profileAvatarText}>
              {user?.avatarId ?? '👤'}
            </Text>
          </View>
          <Text style={[styles.profileName, {color: colors.text.primary}]}>@{user?.username ?? 'user'}</Text>
          <Text style={[styles.profileAddress, {color: colors.text.tertiary}]}>
            {user?.walletAddress
              ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
              : '0x0000...0000'}
          </Text>
        </View>

        {/* Settings rows */}
        <View style={[styles.settingsRow, {borderBottomColor: colors.border.primary}]}>
          <View style={[styles.settingsIconCircle, {backgroundColor: colors.background.tertiary}]}>
            <Text style={styles.settingsIconText}>🔐</Text>
          </View>
          <Text style={[styles.settingsLabel, {color: colors.text.primary}]}>Face ID / Touch ID</Text>
          <Switch
            value={isBiometricEnabled}
            onValueChange={handleToggleBiometrics}
            trackColor={{false: colors.border.secondary, true: colors.brand.primary}}
            thumbColor={'#FFFFFF'}
          />
        </View>

        {[
          {icon: '👤', label: 'Edit Profile'},
          {icon: '🌐', label: 'Network'},
          {icon: '🔔', label: 'Notifications'},
          {icon: '🎨', label: 'Appearance'},
          {icon: '📖', label: 'About Vortex'},
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.settingsRow, {borderBottomColor: colors.border.primary}]}
            activeOpacity={0.6}>
            <View style={[styles.settingsIconCircle, {backgroundColor: colors.background.tertiary}]}>
              <Text style={styles.settingsIconText}>{item.icon}</Text>
            </View>
            <Text style={[styles.settingsLabel, {color: colors.text.primary}]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        ))}

        {/* Logout */}
        <TouchableOpacity
          style={[styles.logoutButton, {backgroundColor: colors.status.errorBg, borderColor: 'rgba(255, 107, 107, 0.2)'}]}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <Text style={[styles.logoutText, {color: colors.status.error}]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, {color: colors.text.tertiary}]}>Vortex 2.0 — v0.0.1</Text>
      </ScrollView>
    </View>
  );
}

// ── Navigator ────────────────────────────────────────────────

export function MainNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingNavBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
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
    paddingTop: spacing['5xl'],
    paddingBottom: 110,
  },
  paddedScrollContent: {
    paddingTop: spacing['5xl'],
    paddingBottom: 110,
    paddingHorizontal: spacing['2xl'],
  },

  // Page title
  pageTitle: {
    ...typography.headingLarge,
    marginBottom: spacing.sm,
  },
  pageSubtitle: {
    ...typography.bodyMedium,
    marginBottom: spacing['2xl'],
  },

  // Header (used by SendScreen / ConfirmSendScreen)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
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
    marginBottom: spacing.md,
  },

  // Empty state
  emptyState: {
    paddingVertical: spacing['3xl'],
    alignItems: 'center',
  },
  emptyStateText: {
    ...typography.bodyMedium,
  },

  // Rewards
  rewardsHeroCard: {
    borderRadius: borderRadius.xl,
    padding: spacing['3xl'],
    alignItems: 'center',
    marginBottom: spacing['3xl'],
    borderWidth: 1,
  },
  rewardsHeroEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  rewardsHeroPoints: {
    ...typography.displayLarge,
  },
  rewardsHeroLabel: {
    ...typography.labelMedium,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  rewardsLevelBadge: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  rewardsLevelText: {
    ...typography.labelSmall,
  },
  earnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  earnIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  earnIcon: {
    fontSize: 20,
  },
  earnInfo: {
    flex: 1,
  },
  earnTitle: {
    ...typography.labelMedium,
  },
  earnDesc: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  earnPts: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: borderRadius.full,
  },
  earnPtsText: {
    ...typography.labelSmall,
    fontWeight: '700',
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
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  dappIcon: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dappEmoji: {
    fontSize: 22,
  },
  dappName: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  dappDesc: {
    ...typography.bodySmall,
  },
  comingSoonCard: {
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    borderWidth: 1,
  },
  comingSoonEmoji: {
    fontSize: 32,
    marginBottom: spacing.md,
  },
  comingSoonTitle: {
    ...typography.labelLarge,
    marginBottom: spacing.sm,
  },
  comingSoonText: {
    ...typography.bodySmall,
    textAlign: 'center',
  },

  // Account / Profile
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.xl,
    borderBottomWidth: 1,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2.5,
  },
  profileAvatarText: {
    fontSize: 36,
  },
  profileName: {
    ...typography.headingMedium,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  profileAddress: {
    ...typography.bodySmall,
    fontFamily: 'monospace',
  },

  // Settings rows
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  settingsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingsIconText: {
    fontSize: 18,
  },
  settingsLabel: {
    ...typography.bodyLarge,
    flex: 1,
  },

  // Logout
  logoutButton: {
    marginTop: spacing['3xl'],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutText: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  versionText: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing['3xl'],
  },
});

// ── Send Screen Styles ───────────────────────────────────────

const sendStyles = StyleSheet.create({
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing['2xl'],
    gap: 0,
  },
  stepDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepLine: {
    width: 40,
    height: 2,
    marginHorizontal: 4,
  },
  balanceCard: {
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing['2xl'],
    borderWidth: 1,
  },
  balanceLabel: {
    ...typography.labelSmall,
    marginBottom: spacing.xs,
  },
  balanceValue: {
    ...typography.headingMedium,
    fontWeight: '700',
  },
  inputLabel: {
    ...typography.labelMedium,
    marginBottom: spacing.sm,
    marginTop: spacing.lg,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    height: '100%',
  },
  validationBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: spacing.sm,
  },
  maxPill: {
    borderWidth: 1.5,
    borderRadius: borderRadius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginLeft: spacing.sm,
  },
  maxPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.sm,
    gap: spacing.sm,
  },
  errorText: {
    ...typography.bodySmall,
    fontWeight: '500',
  },
  bottomAction: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.lg,
  },
});

// ── Confirm Screen Styles ────────────────────────────────────

const confirmStyles = StyleSheet.create({
  summaryCard: {
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    borderWidth: 1,
  },
  summaryLabel: {
    ...typography.labelMedium,
    marginBottom: spacing.sm,
  },
  summaryAmount: {
    ...typography.displayLarge,
    fontWeight: '800',
  },
  detailsCard: {
    borderRadius: borderRadius.xl,
    padding: spacing.xl,
    borderWidth: 1,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  detailLabel: {
    ...typography.bodyMedium,
  },
  detailValue: {
    ...typography.bodyMedium,
    fontFamily: 'monospace',
    maxWidth: '60%',
    textAlign: 'right',
  },
  divider: {
    height: 1,
  },
});
