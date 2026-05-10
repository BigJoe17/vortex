import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Share } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, spacing, borderRadius, typography } from '../theme';
import { useWalletStore } from '../store/walletStore';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { WalletStackParamList } from '../app/navigation/types';

type Props = {
  navigation: NativeStackNavigationProp<WalletStackParamList, 'Receive'>;
};

export default function ReceiveScreen({ navigation }: Props): React.JSX.Element {
  const address = useWalletStore((state) => state.address);
  const { colors } = useTheme();

  const handleCopy = async () => {
    if (!address) return;
    await Clipboard.setStringAsync(address);
    Alert.alert('Copied!', 'Address copied to clipboard');
  };

  const handleShare = async () => {
    if (!address) return;
    try {
      await Share.share({
        message: `My wallet address:\n${address}`,
      });
    } catch (error) {
      console.error('Error sharing address:', error);
    }
  };

  const displayAddress = address
    ? `${address.slice(0, 6)}...${address.slice(-4)}`
    : 'No Address';

  return (
    <View style={[styles.screen, { backgroundColor: colors.background.primary }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={24} color={colors.text.primary} />
        </TouchableOpacity>
        <Text style={[styles.pageTitle, { color: colors.text.primary }]}>Receive</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        {address ? (
          <>
            {/* QR Code Container */}
            <View style={styles.qrContainer}>
              <QRCode value={address} size={220} />
            </View>

            <Text style={[styles.hintText, { color: colors.text.secondary }]}>
              Scan address to receive funds
            </Text>

            {/* Actions */}
            <View style={styles.actionsRow}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.background.secondary, borderColor: colors.border.primary }]}
                onPress={handleCopy}
                disabled={!address}
              >
                <Ionicons name="copy-outline" size={20} color={colors.text.primary} />
                <Text style={[styles.actionText, { color: colors.text.primary }]}>
                  {displayAddress}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: colors.brand.primary + '15', borderColor: colors.brand.primary }]}
                onPress={handleShare}
                disabled={!address}
              >
                <Ionicons name="share-outline" size={20} color={colors.brand.primary} />
                <Text style={[styles.actionText, { color: colors.brand.primary }]}>Share</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.tapHint, { color: colors.text.tertiary }]}>
              Tap address to copy
            </Text>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="wallet-outline" size={48} color={colors.text.tertiary} />
            <Text style={[styles.emptyStateText, { color: colors.text.tertiary }]}>
              No wallet connected
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing['2xl'],
    paddingTop: 60,
    paddingBottom: spacing.lg,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  pageTitle: {
    ...typography.headingMedium,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  qrContainer: {
    backgroundColor: '#FFFFFF',
    padding: spacing['2xl'],
    borderRadius: borderRadius['2xl'],
    marginBottom: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
  },
  hintText: {
    ...typography.bodyMedium,
    marginBottom: spacing['2xl'],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.md,
    width: '100%',
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    gap: spacing.sm,
  },
  actionText: {
    ...typography.labelLarge,
    fontWeight: '600',
  },
  tapHint: {
    ...typography.bodySmall,
    marginTop: spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.md,
  },
  emptyStateText: {
    ...typography.bodyLarge,
  },
});
