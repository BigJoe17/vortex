import React, {useState, useEffect} from 'react';
import {View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {AuthStackParamList} from '../app/navigation/types';
import {colors, typography, spacing, borderRadius} from '@theme';
import {ActionButton} from '../components/ui/ActionButton';
import {tempWalletService} from '@services/wallet/tempWalletService';
import {encryptPrivateKey, hashPin, validatePinStrength} from '@services/security/encryptionService';
import {secureStorage} from '@services/storage/secureStorage';
import {useAuthStore} from '@store/authStore';
import {useWalletStore} from '@store/walletStore';

type Props = NativeStackScreenProps<AuthStackParamList, 'ConfirmSeed'>;

export function ConfirmSeedScreen({navigation, route}: Props): React.JSX.Element {
  const {username, avatarId} = route.params;
  const login = useAuthStore((state) => state.login);
  const initWallet = useWalletStore((state) => state.initWallet);

  const [words, setWords] = useState<string[]>([]);
  const [testIndices, setTestIndices] = useState<number[]>([]);
  const [inputs, setInputs] = useState<string[]>(['', '', '', '']);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isEncrypting, setIsEncrypting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const rawWallet = tempWalletService.getTempWallet();
    if (rawWallet?.mnemonic) {
      const phrase = rawWallet.mnemonic.split(' ');
      setWords(phrase);

      const indices = new Set<number>();
      while (indices.size < 4) {
         indices.add(Math.floor(Math.random() * 12));
      }
      setTestIndices(Array.from(indices).sort((a,b) => a - b));
    }

    return () => {
      setWords([]);
      setInputs(['', '', '', '']);
    };
  }, []);

  const handleVerifySeed = () => {
    const isCorrect = testIndices.every((index, i) => (inputs[i] || '').trim().toLowerCase() === (words[index] || ''));
    if (isCorrect) {
      setIsConfirmed(true);
      setError('');
    } else {
      setError('Some words are incorrect. Please try again.');
    }
  };

  const handleFinishSetup = async () => {
    const pinCheck = validatePinStrength(pin);
    if (!pinCheck.valid) {
       setError(pinCheck.reason ?? 'PIN is too weak.');
       return;
    }
    if (pin !== confirmPin) {
       setError('PINs do not match.');
       return;
    }

    setIsEncrypting(true);
    // Allow slight UI render tick before heavy sync PBKDF2 encrypt lock
    setTimeout(async () => {
       try {
         const rawWallet = tempWalletService.getTempWallet();
         if (!rawWallet || !rawWallet.privateKey) throw new Error("Wallet memory corrupted.");
         
         // 1. PBKDF2 + AES encode private key payload strictly formatted
         const encryptedPayload = encryptPrivateKey(rawWallet.privateKey, pin);
         const pinHash = hashPin(pin);

         // 2. Persist to device keychain secureStorage
         await secureStorage.saveEncryptedWallet(encryptedPayload, rawWallet.address);
         await secureStorage.savePinHash(pinHash);

         // 3. Clear ALL volatile JS memory explicitly
         tempWalletService.clearTempWallet();
         setWords([]);

         // 4. Fire application login session
         initWallet(rawWallet.address);
         login({
            id: `user-${Date.now()}`,
            username,
            avatarId,
            walletAddress: rawWallet.address,
            createdAt: new Date().toISOString(),
          }, 'wallet-session');

       } catch (e) {
         setError('Failed to setup local secure encryption.');
         console.error(e);
         setIsEncrypting(false);
       }
    }, 100);
  };

  if (isConfirmed) {
     return (
       <View style={styles.container}>
         <TouchableOpacity style={styles.backButton} onPress={() => { setIsConfirmed(false); setPin(''); setConfirmPin(''); }}>
           <Ionicons name="chevron-back" size={24} color={colors.text.secondary} />
           <Text style={styles.backButtonText}>Back</Text>
         </TouchableOpacity>

         <View style={styles.content}>
           <Text style={styles.title}>Set Your Wallet PIN</Text>
           <Text style={styles.subtitle}>
             This PIN acts as your password. Your private keys will be securely encrypted locally against this PIN.
           </Text>
           
           <Text style={[styles.label, {marginTop: spacing.xl}]}>Enter 6-digit PIN</Text>
           <TextInput
             style={[styles.input, pin.length >= 6 ? {borderColor: colors.status.success} : null]}
             placeholder="••••••"
             placeholderTextColor={colors.text.tertiary}
             value={pin}
             onChangeText={(t) => setPin(t.replace(/[^0-9]/g, '').slice(0, 8))}
             keyboardType="number-pad"
             secureTextEntry
             maxLength={8}
           />

           <Text style={[styles.label, {marginTop: spacing.lg}]}>Confirm PIN</Text>
           <TextInput
             style={[styles.input, confirmPin.length >= 6 && confirmPin === pin ? {borderColor: colors.status.success} : null]}
             placeholder="••••••"
             placeholderTextColor={colors.text.tertiary}
             value={confirmPin}
             onChangeText={(t) => setConfirmPin(t.replace(/[^0-9]/g, '').slice(0, 8))}
             keyboardType="number-pad"
             secureTextEntry
             maxLength={8}
           />

           {error ? <Text style={styles.errorText}>{error}</Text> : null}
         </View>

         <View style={styles.bottomAction}>
           <ActionButton
             label={isEncrypting ? "Encrypting Keys..." : "Finish Setup"}
             onPress={handleFinishSetup}
             disabled={pin.length < 6 || pin !== confirmPin || isEncrypting}
             loading={isEncrypting}
           />
         </View>
       </View>
     );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color={colors.text.secondary} />
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Verify Phrase</Text>
        <Text style={styles.subtitle}>
          Tap and type in the missing words to confirm you successfully backed up your seed phrase.
        </Text>

        <View style={styles.testingZone}>
           {testIndices.map((wordIndex, i) => (
             <View key={wordIndex} style={styles.testRow}>
               <Text style={styles.testLabel}>Word #{wordIndex + 1}</Text>
               <TextInput
                 style={[styles.input, styles.testInput]}
                 placeholder={`Enter word #${wordIndex + 1}`}
                 placeholderTextColor={colors.text.tertiary}
                 value={inputs[i]}
                 onChangeText={(val) => {
                   const newInputs = [...inputs];
                   newInputs[i] = val.trim().toLowerCase();
                   setInputs(newInputs);
                   setError('');
                 }}
                 autoCapitalize="none"
                 autoCorrect={false}
               />
             </View>
           ))}
        </View>

        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.bottomAction}>
        <ActionButton
          label="Verify Backup"
          onPress={handleVerifySeed}
          disabled={inputs.some(inp => !inp.trim())}
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
  subtitle: {...typography.bodyMedium, color: colors.text.tertiary, marginBottom: spacing.lg, lineHeight: 22},
  testingZone: {marginTop: spacing.xl, gap: spacing.lg},
  testRow: {flexDirection: 'row', alignItems: 'center', gap: spacing.md},
  testLabel: {...typography.labelLarge, color: colors.text.secondary, width: 80},
  testInput: {flex: 1},
  input: {backgroundColor: colors.background.tertiary, borderRadius: borderRadius.md, borderWidth: 1, borderColor: colors.border.secondary, paddingHorizontal: spacing.lg, height: 52, color: colors.text.primary, ...typography.bodyLarge},
  label: {...typography.labelMedium, color: colors.text.primary, marginBottom: spacing.xs},
  errorText: {...typography.bodySmall, color: colors.status.error, marginTop: spacing.md, textAlign: 'center'},
  bottomAction: {paddingHorizontal: spacing['2xl'], paddingBottom: spacing['3xl'], paddingTop: spacing.lg},
});
