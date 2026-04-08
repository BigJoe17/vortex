import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../app/navigation/types';
import {colors, typography, spacing, borderRadius} from '@theme';
import {ActionButton} from '../components/ui/ActionButton';
import {tempWalletService} from '@services/wallet/tempWalletService';

type Props = NativeStackScreenProps<AuthStackParamList, 'SeedPhrase'>;

export function SeedPhraseScreen({navigation, route}: Props): React.JSX.Element {
  const {username, avatarId} = route.params;
  const [isChecked, setIsChecked] = useState(false);
  const [words, setWords] = useState<string[]>([]);

  useEffect(() => {
    const rawWallet = tempWalletService.getTempWallet();
    if (rawWallet?.mnemonic) {
      setWords(rawWallet.mnemonic.split(' '));
    }
  }, []);

  const handleContinue = () => {
    navigation.navigate('ConfirmSeed', {username, avatarId});
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color={colors.text.secondary} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <View style={styles.content}>
        <Text style={styles.title}>Your Secret Phrase</Text>
        <Text style={styles.subtitle}>
          Write down these 12 words exactly in order and keep them somewhere safe offline.
        </Text>

        <View style={styles.warningBox}>
          <Text style={styles.warningText}>
            ⚠️ Never share this with anyone. Anyone with these words can steal your crypto.
          </Text>
        </View>

        <View style={styles.gridContainer}>
          {words.map((word, index) => (
            <View key={index} style={styles.wordPill}>
              <Text style={styles.wordNumber}>{index + 1}</Text>
              <Text style={styles.wordText}>{word}</Text>
            </View>
          ))}
        </View>
        
        <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsChecked(!isChecked)} activeOpacity={0.7}>
          <View style={[styles.checkbox, isChecked && styles.checkboxActive]}>
            {isChecked && <Ionicons name="checkmark" size={16} color={colors.background.primary} />}
          </View>
          <Text style={styles.checkboxLabel}>I have securely written down my seed phrase</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.bottomAction}>
        <ActionButton
          label="Continue"
          onPress={handleContinue}
          disabled={!isChecked || words.length === 0}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: colors.background.primary},
  content: {flexGrow: 1, paddingHorizontal: spacing['2xl'], paddingTop: spacing.md},
  backButton: {flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.xl, paddingTop: spacing['3xl'], paddingBottom: spacing.md, gap: spacing.xs},
  backButtonText: {...typography.labelLarge, color: colors.text.secondary},
  title: {...typography.headingLarge, color: colors.text.primary, marginBottom: spacing.sm},
  subtitle: {...typography.bodyMedium, color: colors.text.tertiary, marginBottom: spacing.xl, lineHeight: 22},
  warningBox: {backgroundColor: colors.brand.secondary + '10', padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.brand.secondary + '40', marginBottom: spacing['2xl']},
  warningText: {...typography.bodySmall, color: colors.brand.secondary, lineHeight: 20},
  gridContainer: {flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: spacing.md, paddingBottom: spacing['2xl']},
  wordPill: {width: '47%', flexDirection: 'row', alignItems: 'center', backgroundColor: colors.background.tertiary, paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderRadius: borderRadius.sm, borderWidth: 1, borderColor: colors.border.primary},
  wordNumber: {...typography.bodySmall, color: colors.text.tertiary, width: 24},
  wordText: {...typography.labelLarge, color: colors.text.primary},
  checkboxRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: 'auto', marginBottom: spacing.md},
  checkbox: {width: 24, height: 24, borderRadius: 4, borderWidth: 1.5, borderColor: colors.border.secondary, alignItems: 'center', justifyContent: 'center'},
  checkboxActive: {backgroundColor: colors.brand.primary, borderColor: colors.brand.primary},
  checkboxLabel: {...typography.bodyMedium, color: colors.text.secondary, flex: 1},
  bottomAction: {paddingHorizontal: spacing['2xl'], paddingBottom: spacing['3xl'], paddingTop: spacing.lg},
});
