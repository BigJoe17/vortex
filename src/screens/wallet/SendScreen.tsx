import React, {useState, useCallback, useMemo} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Image} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {typography, spacing, borderRadius, useTheme} from '@theme';
import {useWalletStore} from '@store/walletStore';
import {useTokenStore} from '@store/tokenStore';
import {isValidAddress, estimateGasFee} from '@services/transaction/transactionService';
import {estimateERC20TransferGas, getRpcUrl} from '@services/blockchain/blockchainService';
import {formatTokenBalance} from '@shared/utils/formatting';
import {ActionButton} from '../../components/ui/ActionButton';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {SendAssetParam, WalletStackParamList} from '../../app/navigation/types';

type SendScreenProps = NativeStackScreenProps<WalletStackParamList, 'SendScreen'>;
type SendAsset = SendAssetParam & {
  balanceUsd?: string | null;
};

export function SendScreen({navigation, route}: SendScreenProps): React.JSX.Element {
  const [toAddress, setToAddress] = useState('');
  const [amount, setAmount] = useState('');
  const [gasFee, setGasFee] = useState('');
  const [isEstimating, setIsEstimating] = useState(false);
  const [error, setError] = useState('');
  const [selectedAddress, setSelectedAddress] = useState<string | null>(
    route.params?.tokenAddress ?? null,
  );
  const address = useWalletStore((s) => s.address);
  const nativeTokens = useWalletStore((s) => s.tokens);
  const erc20Tokens = useTokenStore((s) => s.tokens);
  const network = useWalletStore((s) => s.network);
  const {colors} = useTheme();

  const availableAssets = useMemo<SendAsset[]>(() => {
    const nativeBalance = nativeTokens[0];
    const nativeAsset: SendAsset[] = nativeBalance
      ? [{
          address: nativeBalance.address,
          symbol: nativeBalance.symbol,
          name: nativeBalance.name,
          decimals: nativeBalance.decimals,
          balance: nativeBalance.balance,
          balanceFormatted: nativeBalance.balanceFormatted,
          balanceUsd: nativeBalance.balanceUsd,
          logoUri: nativeBalance.logoUri,
          isNative: true,
        }]
      : [];

    const tokenAssets = erc20Tokens.map<SendAsset>((token) => ({
      address: token.address,
      symbol: token.symbol,
      name: token.name,
      decimals: token.decimals,
      balance: token.balance,
      balanceFormatted: token.balanceFormatted,
      balanceUsd: token.balanceUsd,
      logoUri: token.logo ?? token.logoUri,
      isNative: false,
    }));

    return [...nativeAsset, ...tokenAssets];
  }, [nativeTokens, erc20Tokens]);

  const selectedAsset = useMemo(() => {
    const selected = selectedAddress
      ? availableAssets.find(
          (asset) => asset.address.toLowerCase() === selectedAddress.toLowerCase(),
        )
      : undefined;

    return selected ?? availableAssets[0] ?? null;
  }, [availableAssets, selectedAddress]);

  const nativeBalance = availableAssets.find((asset) => asset.isNative) ?? null;
  const symbol = selectedAsset?.symbol ?? 'Token';

  const addressValid = toAddress.length > 0 ? isValidAddress(toAddress) : null;
  const amountNumber = Number(amount);
  const selectedBalanceNumber = selectedAsset
    ? Number(selectedAsset.balanceFormatted)
    : 0;
  const hasValidAmount = Number.isFinite(amountNumber) && amountNumber > 0;
  const hasInsufficientAssetBalance =
    !!selectedAsset && hasValidAmount && amountNumber > selectedBalanceNumber;
  const displayError =
    error ||
    (hasInsufficientAssetBalance ? `Insufficient ${symbol} balance` : '');

  const handleEstimate = useCallback(async () => {
    setError('');
    setGasFee('');

    if (!selectedAsset) {
      setError('Select an asset to send');
      return;
    }

    if (!isValidAddress(toAddress)) {
      setError('Invalid recipient address');
      return;
    }

    if (!hasValidAmount) {
      setError('Enter a valid amount');
      return;
    }

    if (hasInsufficientAssetBalance) {
      setError(`Insufficient ${selectedAsset.symbol} balance`);
      return;
    }

    if (!selectedAsset.isNative && !address) {
      setError('Wallet address unavailable');
      return;
    }

    setIsEstimating(true);
    try {
      const estimate = selectedAsset.isNative
        ? await estimateGasFee(toAddress, amount, network)
        : await estimateERC20TransferGas({
            tokenAddress: selectedAsset.address,
            recipient: toAddress,
            amount,
            senderAddress: address ?? '',
            rpcUrl: getRpcUrl(network),
          });

      setGasFee(estimate.totalFeeFormatted);

      if (selectedAsset.isNative && nativeBalance) {
        const totalNativeDebit = amountNumber + Number(estimate.totalFeeFormatted);
        if (totalNativeDebit > Number(nativeBalance.balanceFormatted)) {
          setError(`Insufficient ${selectedAsset.symbol} balance for amount and network fee`);
          return;
        }
      }

      navigation.navigate('ConfirmSend', {
        to: toAddress,
        amount,
        gasFee: estimate.totalFeeFormatted,
        asset: {
          address: selectedAsset.address,
          symbol: selectedAsset.symbol,
          name: selectedAsset.name,
          decimals: selectedAsset.decimals,
          balance: selectedAsset.balance,
          balanceFormatted: selectedAsset.balanceFormatted,
          logoUri: selectedAsset.logoUri,
          isNative: selectedAsset.isNative,
        },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gas estimation failed');
    } finally {
      setIsEstimating(false);
    }
  }, [
    selectedAsset,
    toAddress,
    hasValidAmount,
    hasInsufficientAssetBalance,
    network,
    nativeBalance,
    navigation,
    amount,
    address,
    amountNumber,
  ]);

  const handleSelectAsset = useCallback((asset: SendAsset) => {
    setSelectedAddress(asset.address);
    setGasFee('');
    setError('');
  }, []);

  return (
    <View style={[styles.screen, {backgroundColor: colors.background.primary}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.paddedScrollContent, {paddingBottom: 120}]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, {color: colors.text.primary}]}>Send {symbol}</Text>
          <View style={{width: 40}} />
        </View>

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, {backgroundColor: colors.brand.primary}]} />
          <View style={[styles.stepLine, {backgroundColor: colors.border.primary}]} />
          <View style={[styles.stepDot, {backgroundColor: colors.border.primary}]} />
        </View>

        <Text style={[styles.inputLabel, {color: colors.text.secondary}]}>Asset</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.assetSelector}>
          {availableAssets.map((asset) => {
            const selected =
              selectedAsset?.address.toLowerCase() === asset.address.toLowerCase();

            return (
              <TouchableOpacity
                key={`${asset.address}-${asset.symbol}`}
                style={[
                  styles.assetOption,
                  {
                    borderColor: selected ? colors.brand.primary : colors.border.secondary,
                    backgroundColor: selected
                      ? colors.background.tertiary
                      : colors.background.secondary,
                  },
                ]}
                onPress={() => handleSelectAsset(asset)}
                activeOpacity={0.72}>
                {asset.logoUri ? (
                  <Image source={{uri: asset.logoUri}} style={styles.assetOptionLogo} />
                ) : (
                  <View
                    style={[
                      styles.assetOptionFallback,
                      {backgroundColor: selected ? colors.brand.primary : colors.background.tertiary},
                    ]}>
                    <Text
                      style={[
                        styles.assetOptionFallbackText,
                        {color: selected ? colors.text.inverse : colors.text.secondary},
                      ]}>
                      {asset.symbol[0]}
                    </Text>
                  </View>
                )}
                <View>
                  <Text style={[styles.assetOptionSymbol, {color: colors.text.primary}]}>
                    {asset.symbol}
                  </Text>
                  <Text style={[styles.assetOptionBalance, {color: colors.text.tertiary}]}>
                    {formatTokenBalance(asset.balanceFormatted)}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        <View style={[styles.balanceCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary}]}>
          <View style={styles.selectedAssetRow}>
            {selectedAsset?.logoUri ? (
              <Image source={{uri: selectedAsset.logoUri}} style={styles.selectedAssetLogo} />
            ) : (
              <View style={[styles.selectedAssetFallback, {backgroundColor: colors.background.tertiary}]}>
                <Text style={[styles.selectedAssetFallbackText, {color: colors.brand.primary}]}>
                  {symbol[0]}
                </Text>
              </View>
            )}
            <View style={styles.selectedAssetInfo}>
              <Text style={[styles.balanceLabel, {color: colors.text.tertiary}]}>Available Balance</Text>
              <Text style={[styles.balanceValue, {color: colors.text.primary}]}>
                {selectedAsset ? `${formatTokenBalance(selectedAsset.balanceFormatted)} ${symbol}` : '...'}
              </Text>
            </View>
          </View>
        </View>

        <Text style={[styles.inputLabel, {color: colors.text.secondary}]}>Recipient Address</Text>
        <View style={[styles.inputWrapper, {borderColor: addressValid === false ? colors.status.error : addressValid === true ? colors.status.success : colors.border.secondary, backgroundColor: colors.background.secondary}]}>
          <TextInput
            style={[styles.input, {color: colors.text.primary}]}
            placeholder="0x..."
            placeholderTextColor={colors.text.tertiary}
            value={toAddress}
            onChangeText={(t) => { setToAddress(t); setError(''); setGasFee(''); }}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {addressValid !== null && (
            <View style={[styles.validationBadge, {backgroundColor: addressValid ? colors.status.successBg : colors.status.errorBg}]}>
              <Ionicons
                name={addressValid ? 'checkmark-circle' : 'close-circle'}
                size={16}
                color={addressValid ? colors.status.success : colors.status.error}
              />
            </View>
          )}
        </View>

        <Text style={[styles.inputLabel, {color: colors.text.secondary}]}>Amount ({symbol})</Text>
        <View style={[styles.inputWrapper, {borderColor: colors.border.secondary, backgroundColor: colors.background.secondary}]}>
          <TextInput
            style={[styles.input, {color: colors.text.primary}]}
            placeholder="0.00"
            placeholderTextColor={colors.text.tertiary}
            value={amount}
            onChangeText={(t) => { setAmount(t); setError(''); setGasFee(''); }}
            keyboardType="decimal-pad"
          />
          {selectedAsset && (
            <TouchableOpacity
              style={[styles.maxPill, {borderColor: colors.brand.primary}]}
              onPress={() => {
                setAmount(selectedAsset.balanceFormatted);
                setError('');
                setGasFee('');
              }}>
              <Text style={[styles.maxPillText, {color: colors.brand.primary}]}>MAX</Text>
            </TouchableOpacity>
          )}
        </View>

        {gasFee ? (
          <View style={[styles.gasRow, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary}]}>
            <Text style={[styles.gasLabel, {color: colors.text.tertiary}]}>Estimated Network Fee</Text>
            <Text style={[styles.gasValue, {color: colors.text.secondary}]}>
              {gasFee} {nativeBalance?.symbol ?? 'MATIC'}
            </Text>
          </View>
        ) : null}

        {displayError ? (
          <View style={[styles.errorRow, {backgroundColor: colors.status.errorBg}]}>
            <Ionicons name="warning" size={14} color={colors.status.error} />
            <Text style={[styles.errorText, {color: colors.status.error}]}>{displayError}</Text>
          </View>
        ) : null}
      </ScrollView>

      <View style={[styles.bottomAction, {backgroundColor: colors.background.primary}]}>
        <ActionButton
          label="Continue"
          onPress={handleEstimate}
          disabled={!selectedAsset || !toAddress || !amount || isEstimating || hasInsufficientAssetBalance}
          loading={isEstimating}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  paddedScrollContent: {
    paddingTop: spacing['5xl'],
    paddingBottom: 110,
    paddingHorizontal: spacing['2xl'],
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xl,
  },
  pageTitle: {
    ...typography.headingLarge,
    marginBottom: spacing.sm,
  },
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
  assetSelector: {
    gap: spacing.sm,
    paddingBottom: spacing.lg,
  },
  assetOption: {
    minWidth: 126,
    height: 58,
    borderRadius: borderRadius.sm,
    borderWidth: 1.5,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: spacing.sm,
  },
  assetOptionLogo: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: spacing.sm,
  },
  assetOptionFallback: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
  },
  assetOptionFallbackText: {
    fontSize: 14,
    fontWeight: '800',
  },
  assetOptionSymbol: {
    ...typography.labelMedium,
    fontWeight: '800',
  },
  assetOptionBalance: {
    ...typography.bodySmall,
    marginTop: 2,
  },
  selectedAssetRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedAssetLogo: {
    width: 42,
    height: 42,
    borderRadius: 21,
    marginRight: spacing.md,
  },
  selectedAssetFallback: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  selectedAssetFallbackText: {
    fontSize: 18,
    fontWeight: '800',
  },
  selectedAssetInfo: {
    flex: 1,
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
  gasRow: {
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    marginTop: spacing.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  gasLabel: {
    ...typography.bodySmall,
  },
  gasValue: {
    ...typography.bodySmall,
    fontWeight: '700',
    fontFamily: 'monospace',
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
