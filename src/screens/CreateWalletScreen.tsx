import React, {useState} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../app/navigation/types';
import {colors, typography, spacing, borderRadius} from '@theme';
import {ActionButton} from '../components/ui/ActionButton';
import {createWallet} from '@services/wallet/walletService';
import {tempWalletService} from '@services/wallet/tempWalletService';

type Props = NativeStackScreenProps<AuthStackParamList, 'CreateWallet'>;

export function CreateWalletScreen({navigation, route}: Props): React.JSX.Element {
  const {username, avatarId} = route.params;
  const [isGenerating, setIsGenerating] = useState(false);

  const handleCreate = async () => {
    setIsGenerating(true);
    // Allow UI to render loading state before heavy crypto task blocks main thread slightly
    setTimeout(() => {
      try {
        const wallet = createWallet();
        tempWalletService.setTempWallet(wallet);
        setIsGenerating(false);
        navigation.navigate('SeedPhrase', {username, avatarId});
      } catch (error) {
        console.error(error);
        setIsGenerating(false);
      }
    }, 100);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color={colors.text.secondary} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.emoji}>🛡️</Text>
        <Text style={styles.title}>Secure Your Future</Text>
        <Text style={styles.subtitle}>
          We are about to generate a brand new wallet for you. This will serve as your decentralized identity.
        </Text>

        <View style={styles.infoBox}>
          <Ionicons name="key" size={24} color={colors.brand.primary} style={{marginBottom: spacing.sm}} />
          <Text style={styles.infoTitle}>Non-Custodial Design</Text>
          <Text style={styles.infoText}>
            You hold the keys. We cannot access your funds, nor can we recover them if you lose your backup phrase.
          </Text>
        </View>
      </View>

      <View style={styles.bottomAction}>
        <ActionButton
          label={isGenerating ? "Generating Keys..." : "Generate Wallet"}
          onPress={handleCreate}
          disabled={isGenerating}
          loading={isGenerating}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background.primary},
  content: {flexGrow: 1, paddingHorizontal: spacing['2xl'], paddingTop: spacing.xl, alignItems: 'center'},
  backButton: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing['3xl'], paddingBottom: spacing.md, gap: spacing.xs},
  backButtonText: {...typography.labelLarge, color: colors.text.secondary},
  emoji: {fontSize: 48, marginBottom: spacing.lg},
  title: {...typography.headingLarge, color: colors.text.primary, marginBottom: spacing.sm, textAlign: 'center'},
  subtitle: {...typography.bodyMedium, color: colors.text.tertiary, textAlign: 'center', marginBottom: spacing['3xl'], lineHeight: 22},
  infoBox: {backgroundColor: colors.background.tertiary, padding: spacing.xl, borderRadius: borderRadius.lg, borderWidth: 1, borderColor: colors.border.secondary, alignItems: 'flex-start', width: '100%'},
  infoTitle: {...typography.labelLarge, color: colors.text.primary, marginBottom: spacing.xs},
  infoText: {...typography.bodySmall, color: colors.text.secondary, lineHeight: 20},
  bottomAction: {paddingHorizontal: spacing['2xl'], paddingBottom: spacing['3xl'], paddingTop: spacing.lg},
});
