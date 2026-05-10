import React, {useState} from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Image} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useQueryClient} from '@tanstack/react-query';
import {typography, spacing, borderRadius, useTheme} from '@theme';
import {useWalletStore} from '@store/walletStore';
import {useTransactionStore} from '@store/transactionStore';
import {useAuthStore} from '@store/authStore';
import {sendNativeTransaction, waitForConfirmation} from '@services/transaction/transactionService';
import {getRpcUrl, sendERC20Token} from '@services/blockchain/blockchainService';
import {authenticateUser} from '@services/security/biometricService';
import {decryptPrivateKey, verifyPin} from '@services/security/encryptionService';
import {secureStorage} from '@services/storage/secureStorage';
import {captureError} from '@services/monitoring/errorReporting';
import {ActionButton} from '../../components/ui/ActionButton';
import type {NativeStackScreenProps} from '@react-navigation/native-stack';
import type {WalletStackParamList} from '../../app/navigation/types';

type ConfirmSendProps = NativeStackScreenProps<WalletStackParamList, 'ConfirmSend'>;
type TxStatus = 'idle' | 'authenticating' | 'signing' | 'broadcasting' | 'confirming' | 'confirmed' | 'failed';
type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

function getStatusDisplay(status: TxStatus): {label: string; icon: IoniconName} {
  switch (status) {
    case 'authenticating':
      return {label: 'Authenticating', icon: 'shield-checkmark'};
    case 'signing':
      return {label: 'Signing', icon: 'key'};
    case 'broadcasting':
      return {label: 'Broadcasting', icon: 'radio'};
    case 'confirming':
      return {label: 'Confirming', icon: 'time'};
    case 'confirmed':
      return {label: 'Confirmed', icon: 'checkmark-circle'};
    case 'failed':
      return {label: 'Failed', icon: 'close-circle'};
    case 'idle':
      return {label: 'Ready', icon: 'ellipse'};
  }
}

function getFriendlySendError(error: unknown): string {
  const message = error instanceof Error ? error.message : 'Transaction failed';
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes('timeout')) {
    return 'RPC timeout. Please try again.';
  }

  if (lowerMessage.includes('insufficient') && lowerMessage.includes('gas')) {
    return 'Insufficient MATIC for network fee.';
  }

  if (lowerMessage.includes('insufficient')) {
    return message;
  }

  if (lowerMessage.includes('invalid') && lowerMessage.includes('address')) {
    return 'Invalid recipient address.';
  }

  if (lowerMessage.includes('rejected')) {
    return 'Transaction was rejected.';
  }

  if (lowerMessage.includes('failed on-chain')) {
    return 'Transaction failed on-chain. Please retry.';
  }

  return message || 'Transaction failed. Please try again.';
}

export function ConfirmSendScreen({route, navigation}: ConfirmSendProps): React.JSX.Element {
  const [isSending, setIsSending] = useState(false);
  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');
  const [txStatus, setTxStatus] = useState<TxStatus>('idle');
  const [txError, setTxError] = useState('');
  const network = useWalletStore((s) => s.network);
  const tokens = useWalletStore((s) => s.tokens);
  const addTransaction = useTransactionStore((s) => s.addTransaction);
  const updateTransaction = useTransactionStore((s) => s.updateTransaction);
  const address = useWalletStore((s) => s.address);
  const isBiometricEnabled = useAuthStore((s) => s.isBiometricEnabled);
  const queryClient = useQueryClient();
  const {colors} = useTheme();

  const {to, amount, gasFee, asset} = route.params;
  const nativeSymbol = tokens.length > 0 ? tokens[0]!.symbol : 'MATIC';
  const totalNativeAmount = asset.isNative
    ? (parseFloat(amount) + parseFloat(gasFee)).toFixed(8)
    : null;
  const statusDisplay = getStatusDisplay(txStatus);

  const refreshWalletQueries = async () => {
    if (!address) {
      return;
    }

    await Promise.all([
      queryClient.invalidateQueries({queryKey: ['walletData', address, network]}),
      queryClient.invalidateQueries({queryKey: ['txHistory', address, network]}),
    ]);
  };

  const handleConfirm = async () => {
    if (txStatus === 'confirmed') {
      navigation.popToTop();
      return;
    }

    if (!pinInput || pinInput.length < 6) {
      setPinError('Enter your 6-digit PIN to continue');
      return;
    }

    setIsSending(true);
    setPinError('');
    setTxError('');
    setTxStatus('authenticating');

    if (isBiometricEnabled) {
      const auth = await authenticateUser('Confirm Transaction');
      if (!auth.success) {
        setIsSending(false);
        setTxStatus('idle');
        if (auth.reason !== 'cancelled') {
          Alert.alert('Authentication Failed', auth.message);
        }
        return;
      }
    }

    let decryptedKey: string | undefined;

    try {
      const storedHash = await secureStorage.getPinHash();
      if (storedHash && !verifyPin(pinInput, storedHash)) {
        setPinError('Incorrect PIN');
        setIsSending(false);
        setTxStatus('idle');
        return;
      }

      const encryptedWallet = await secureStorage.getEncryptedWallet();

      if (encryptedWallet) {
        try {
          decryptedKey = decryptPrivateKey(encryptedWallet.encryptedPrivateKey, pinInput);
        } catch {
          setPinError('Incorrect PIN — decryption failed');
          setIsSending(false);
          setTxStatus('idle');
          return;
        }
      }

      if (!decryptedKey) {
        setPinError('Unable to decrypt wallet. Please re-import.');
        setIsSending(false);
        setTxStatus('idle');
        return;
      }

      setTxStatus('signing');

      if (asset.isNative) {
        setTxStatus('broadcasting');
        const result = await sendNativeTransaction(to, amount, network, decryptedKey);

        decryptedKey = undefined;

        addTransaction({
          hash: result.hash,
          type: 'send',
          status: 'pending',
          from: result.from,
          to: result.to,
          value: amount,
          valueFormatted: amount,
          tokenSymbol: asset.symbol,
          tokenAddress: asset.address,
          timestamp: Date.now(),
        });

        setTxStatus('confirming');
        const confirmation = await waitForConfirmation(result.hash, network);
        updateTransaction(result.hash, {
          status: confirmation.status,
          blockNumber: confirmation.blockNumber,
          gasUsed: confirmation.gasUsed,
        });

        if (confirmation.status === 'failed') {
          throw new Error('Transaction failed on-chain. Please try again.');
        }
      } else {
        setTxStatus('confirming');
        const result = await sendERC20Token({
          tokenAddress: asset.address,
          recipient: to,
          amount,
          privateKey: decryptedKey,
          rpcUrl: getRpcUrl(network),
        });

        decryptedKey = undefined;

        addTransaction({
          hash: result.hash,
          type: 'send',
          status: 'confirmed',
          from: result.from,
          to: result.to,
          value: result.amountWei,
          valueFormatted: amount,
          tokenSymbol: result.symbol,
          tokenAddress: result.tokenAddress,
          gasUsed: result.gasUsed,
          timestamp: Date.now(),
          blockNumber: result.blockNumber,
        });
      }

      await refreshWalletQueries();
      setTxStatus('confirmed');
    } catch (err) {
      const msg = getFriendlySendError(err);
      captureError(err, {
        source: 'ConfirmSendScreen',
        network,
        tokenAddress: asset.address,
        tokenSymbol: asset.symbol,
        isNative: asset.isNative,
      });
      setTxStatus('failed');
      setTxError(msg);
    } finally {
      decryptedKey = undefined;
      setIsSending(false);
      setPinInput('');
    }
  };

  return (
    <View style={[styles.screen, {backgroundColor: colors.background.primary}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.paddedScrollContent, {paddingBottom: 120}]}
        showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backBtn}>
            <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
          </TouchableOpacity>
          <Text style={[styles.pageTitle, {color: colors.text.primary}]}>Confirm</Text>
          <View style={{width: 40}} />
        </View>

        <View style={styles.stepRow}>
          <View style={[styles.stepDot, {backgroundColor: colors.brand.primary}]} />
          <View style={[styles.stepLine, {backgroundColor: colors.brand.primary}]} />
          <View style={[styles.stepDot, {backgroundColor: colors.brand.primary}]} />
        </View>

        <View style={[styles.summaryCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary}]}>
          {asset.logoUri ? (
            <Image source={{uri: asset.logoUri}} style={styles.summaryLogo} />
          ) : (
            <View style={[styles.summaryLogoFallback, {backgroundColor: colors.background.tertiary}]}>
              <Text style={[styles.summaryLogoText, {color: colors.brand.primary}]}>
                {asset.symbol[0]}
              </Text>
            </View>
          )}
          <Text style={[styles.summaryLabel, {color: colors.text.tertiary}]}>Sending</Text>
          <Text style={[styles.summaryAmount, {color: colors.text.primary}]}>
            {amount} {asset.symbol}
          </Text>
        </View>

        <View style={[styles.detailsCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary}]}>
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.text.tertiary}]}>Token</Text>
            <Text style={[styles.detailValue, {color: colors.text.primary}]} numberOfLines={1}>
              {asset.name} ({asset.symbol})
            </Text>
          </View>
          <View style={[styles.divider, {backgroundColor: colors.border.primary}]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.text.tertiary}]}>To</Text>
            <Text style={[styles.detailValue, {color: colors.text.primary}]} numberOfLines={1}>
              {to.slice(0, 10)}...{to.slice(-8)}
            </Text>
          </View>
          <View style={[styles.divider, {backgroundColor: colors.border.primary}]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.text.tertiary}]}>Network</Text>
            <Text style={[styles.detailValue, {color: colors.text.primary}]}>
              {network.charAt(0).toUpperCase() + network.slice(1)}
            </Text>
          </View>
          <View style={[styles.divider, {backgroundColor: colors.border.primary}]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.text.tertiary}]}>Network Fee</Text>
            <Text style={[styles.detailValue, {color: colors.text.secondary}]}>{gasFee} {nativeSymbol}</Text>
          </View>
          <View style={[styles.divider, {backgroundColor: colors.border.primary}]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.text.primary, fontWeight: '600'}]}>Total</Text>
            <Text style={[styles.detailValue, {color: colors.brand.primary, fontWeight: '700'}]}>
              {totalNativeAmount
                ? `${totalNativeAmount} ${asset.symbol}`
                : `${amount} ${asset.symbol} + ${gasFee} ${nativeSymbol}`}
            </Text>
          </View>
          <View style={[styles.divider, {backgroundColor: colors.border.primary}]} />
          <View style={styles.detailRow}>
            <Text style={[styles.detailLabel, {color: colors.text.tertiary}]}>Status</Text>
            <View style={styles.statusValue}>
              <Ionicons
                name={statusDisplay.icon}
                size={16}
                color={txStatus === 'failed' ? colors.status.error : txStatus === 'confirmed' ? colors.status.success : colors.text.secondary}
              />
              <Text
                style={[
                  styles.statusText,
                  {
                    color: txStatus === 'failed'
                      ? colors.status.error
                      : txStatus === 'confirmed'
                        ? colors.status.success
                        : colors.text.secondary,
                  },
                ]}>
                {statusDisplay.label}
              </Text>
            </View>
          </View>
        </View>

        {txError ? (
          <View style={[styles.errorRow, {backgroundColor: colors.status.errorBg}]}>
            <Ionicons name="warning" size={14} color={colors.status.error} />
            <Text style={[styles.errorText, {color: colors.status.error}]}>
              {txError}
            </Text>
          </View>
        ) : null}

        <View style={[styles.detailsCard, {backgroundColor: colors.background.secondary, borderColor: colors.border.primary, marginTop: spacing.xl}]}>
          <Text style={[styles.detailLabel, {color: colors.text.secondary, marginBottom: spacing.sm}]}>
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
              setTxError('');
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

      <View style={[styles.bottomAction, {backgroundColor: colors.background.primary}]}>
        <ActionButton
          label={txStatus === 'confirmed' ? 'Done' : txStatus === 'failed' ? 'Retry Send' : 'Confirm & Send'}
          onPress={handleConfirm}
          disabled={isSending}
          loading={isSending && txStatus !== 'failed'}
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
  summaryCard: {
    borderRadius: borderRadius.xl,
    padding: spacing['2xl'],
    alignItems: 'center',
    marginBottom: spacing['2xl'],
    borderWidth: 1,
  },
  summaryLogo: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginBottom: spacing.md,
  },
  summaryLogoFallback: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  summaryLogoText: {
    fontSize: 18,
    fontWeight: '800',
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
  statusValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    maxWidth: '60%',
  },
  statusText: {
    ...typography.bodyMedium,
    fontWeight: '700',
  },
  divider: {
    height: 1,
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
    flex: 1,
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
