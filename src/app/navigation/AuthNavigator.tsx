/**
 * Auth Navigator
 *
 * Stack navigator for the authentication flow.
 * Flow: Welcome → (Username → Avatar) OR (ImportWallet) → Main App
 */

import React, {useState} from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  TextInput,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
import {Ionicons} from '@expo/vector-icons';
import {colors, typography, spacing, borderRadius} from '@theme';
import {useAuthStore} from '@store/authStore';
import {useWalletStore} from '@store/walletStore';
import {
  importFromPrivateKey,
  importFromSeedPhrase,
  validatePrivateKey,
  validateMnemonic,
} from '@services/wallet/walletService';
import {secureStorage} from '@services/storage/secureStorage';
import {encryptPrivateKey, hashPin} from '@services/security/encryptionService';
import {ActionButton} from '../../components/ui/ActionButton';
import {CreateWalletScreen} from '../../screens/CreateWalletScreen';
import {SeedPhraseScreen} from '../../screens/SeedPhraseScreen';
import {ConfirmSeedScreen} from '../../screens/ConfirmSeedScreen';
import type {AuthStackParamList} from './types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const {width, height} = Dimensions.get('window');

type AuthNavProp = NativeStackNavigationProp<AuthStackParamList>;

// ── Welcome Screen ───────────────────────────────────────────

function WelcomeScreen({navigation}: {navigation: AuthNavProp}): React.JSX.Element {
  return (
    <LinearGradient
      colors={[colors.background.primary, '#0D0D10', '#111118']}
      style={styles.container}>
      {/* Decorative gradient orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['rgba(255, 112, 98, 0.2)', 'rgba(255, 112, 98, 0)']}
          style={[styles.orb, styles.orbPrimary]}
        />
        <LinearGradient
          colors={['rgba(78, 205, 196, 0.15)', 'rgba(78, 205, 196, 0)']}
          style={[styles.orb, styles.orbTeal]}
        />
      </View>

      {/* Logo area */}
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/logo.png')}
          style={styles.logoImage}
          resizeMode="contain"
        />
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Vortex</Text>
        <View style={[styles.versionBadge, {backgroundColor: colors.brand.secondary + '18'}]}>
          <Text style={[styles.versionText, {color: colors.brand.secondary}]}>2.0</Text>
        </View>
      </View>
      <Text style={styles.subtitle}>The Future of Digital Finance</Text>

      {/* Feature pills */}
      <View style={styles.pillsContainer}>
        <View style={[styles.pill, {borderColor: colors.border.primary}]}>
          <Text style={styles.pillIcon}>🔐</Text>
          <Text style={[styles.pillText, {color: colors.text.secondary}]}>Secure</Text>
        </View>
        <View style={[styles.pill, {borderColor: colors.border.primary}]}>
          <Text style={styles.pillIcon}>⚡</Text>
          <Text style={[styles.pillText, {color: colors.text.secondary}]}>Fast</Text>
        </View>
        <View style={[styles.pill, {borderColor: colors.border.primary}]}>
          <Text style={styles.pillIcon}>🌐</Text>
          <Text style={[styles.pillText, {color: colors.text.secondary}]}>Web3</Text>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaContainer}>
        <ActionButton
          label="Create New Vortex Account"
          onPress={() => navigation.navigate('Username')}
        />

        <TouchableOpacity
          style={[styles.secondaryButton, {borderColor: colors.border.secondary, backgroundColor: colors.overlay.light}]}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ImportWallet')}>
          <Text style={[styles.secondaryButtonText, {color: colors.text.secondary}]}>
            Already Have an Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom text */}
      <Text style={[styles.footerText, {color: colors.text.tertiary}]}>
        Your keys. Your crypto. Your future.
      </Text>
    </LinearGradient>
  );
}

// ── Username Screen ──────────────────────────────────────────

function UsernameScreen({navigation}: {navigation: AuthNavProp}): React.JSX.Element {
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');

  const validate = (text: string) => {
    setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
    if (text.length > 0 && text.length < 3) {
      setError('Username must be at least 3 characters');
    } else if (text.length > 20) {
      setError('Username must be 20 characters or less');
    } else {
      setError('');
    }
  };

  const handleContinue = () => {
    if (username.length < 3) {
      setError('Username must be at least 3 characters');
      return;
    }
    navigation.navigate('Avatar', {username});
  };

  return (
    <View style={[styles.screenContainer, {backgroundColor: colors.background.primary}]}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color={colors.text.secondary} />
        <Text style={[styles.backButtonText, {color: colors.text.secondary}]}>Back</Text>
      </TouchableOpacity>

      <View style={styles.screenContent}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenEmoji}>👤</Text>
          <Text style={[styles.screenTitle, {color: colors.text.primary}]}>Claim Your Username</Text>
          <Text style={[styles.screenSubtitle, {color: colors.text.tertiary}]}>
            Choose a unique username for your Vortex wallet. This is how others
            will find you.
          </Text>
        </View>

        {/* Input */}
        <View style={[styles.inputContainer, {backgroundColor: colors.background.tertiary, borderColor: error ? colors.status.error : username.length >= 3 ? colors.status.success : colors.border.secondary}]}>
          <Text style={[styles.inputPrefix, {color: colors.brand.primary}]}>@</Text>
          <TextInput
            style={[styles.textInput, {color: colors.text.primary}]}
            placeholder="username"
            placeholderTextColor={colors.text.tertiary}
            value={username}
            onChangeText={validate}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
        </View>
        {error ? <Text style={[styles.errorText, {color: colors.status.error}]}>{error}</Text> : null}
        {username.length >= 3 && !error ? (
          <View style={styles.successRow}>
            <Ionicons name="checkmark-circle" size={14} color={colors.status.success} />
            <Text style={[styles.successText, {color: colors.status.success}]}>@{username} is available</Text>
          </View>
        ) : null}

        {/* Rules */}
        <View style={styles.rulesContainer}>
          {['3-20 characters', 'Letters, numbers, underscores', 'Cannot be changed later'].map(
            (rule) => (
              <Text key={rule} style={[styles.ruleText, {color: colors.text.tertiary}]}>
                • {rule}
              </Text>
            ),
          )}
        </View>
      </View>

      {/* Continue button */}
      <View style={styles.bottomAction}>
        <ActionButton
          label="Continue"
          onPress={handleContinue}
          disabled={username.length < 3 || !!error}
        />
      </View>
    </View>
  );
}

// ── Avatar Screen ────────────────────────────────────────────

const AVATARS = ['🦊', '🐺', '🦁', '🐯', '🦅', '🐉', '🦈', '🐋', '🦄', '🔥', '💎', '⚡'];

function AvatarScreen({route, navigation}: {route: {params: {username: string}}, navigation: AuthNavProp}): React.JSX.Element {
  const [selected, setSelected] = useState<number | null>(null);
  const {username} = route.params;

  const handleContinue = () => {
    if (selected === null) {
      Alert.alert('Select an Avatar', 'Please choose an avatar to continue.');
      return;
    }
    // Deep Link to cryptographic onboarding flow dynamically natively
    navigation.navigate('CreateWallet', {username, avatarId: AVATARS[selected] || '🦊'});
  };

  return (
    <View style={[styles.screenContainer, {backgroundColor: colors.background.primary}]}>
      <View style={styles.screenContent}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenEmoji}>🎨</Text>
          <Text style={[styles.screenTitle, {color: colors.text.primary}]}>Choose Your Avatar</Text>
          <Text style={[styles.screenSubtitle, {color: colors.text.tertiary}]}>
            Pick an avatar that represents you in the Vortex ecosystem.
          </Text>
        </View>

        {/* Avatar grid */}
        <View style={styles.avatarGrid}>
          {AVATARS.map((avatar, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.avatarItem,
                {backgroundColor: colors.background.tertiary, borderColor: colors.border.primary},
                selected === index && {
                  borderColor: colors.brand.primary,
                  backgroundColor: colors.brand.primary + '12',
                  shadowColor: colors.brand.primary,
                  shadowOffset: {width: 0, height: 0},
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 6,
                },
              ]}
              onPress={() => setSelected(index)}
              activeOpacity={0.7}>
              <Text style={styles.avatarEmoji}>{avatar}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Continue button */}
      <View style={styles.bottomAction}>
        <ActionButton
          label="Continue"
          onPress={handleContinue}
          disabled={selected === null}
        />
      </View>
    </View>
  );
}

// ── Import Wallet Screen ─────────────────────────────────────

function ImportWalletScreen({navigation}: {navigation: AuthNavProp}): React.JSX.Element {
  const [walletType, setWalletType] = useState<'evm' | 'multi' | null>(null);
  const [importMethod, setImportMethod] = useState<'seed' | 'key' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [username, setUsername] = useState('');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const initWallet = useWalletStore((state) => state.initWallet);

  const handleImport = async () => {
    const trimmedInput = inputValue.trim();
    const trimmedUsername = username.trim();

    if (!trimmedUsername) {
      setError('Please choose a username.');
      return;
    }
    if (!trimmedInput) {
      setError('Please enter your seed phrase or private key.');
      return;
    }

    // Validate input
    if (importMethod === 'key' && !validatePrivateKey(trimmedInput)) {
      setError('Invalid private key. Must be a valid 64-character hex string.');
      return;
    }
    if (importMethod === 'seed' && !validateMnemonic(trimmedInput)) {
      setError('Invalid seed phrase. Please check your words and try again.');
      return;
    }

    // Validate PIN
    if (!pin || pin.length < 6) {
      setError('PIN must be at least 6 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    setError('');
    setIsLoading(true);

    // Use setTimeout to allow the UI thread to update and show the loading spinner 
    // before the CPU-heavy synchronous PBKDF2 encryption starts.
    setTimeout(async () => {
      try {
        // 1. Import wallet using ethers.js
        const result =
          importMethod === 'key'
            ? importFromPrivateKey(trimmedInput)
            : importFromSeedPhrase(trimmedInput);

        // 2. Encrypt private key with PIN (PBKDF2 + AES-CBC)
        const encryptedKey = encryptPrivateKey(result.privateKey, pin);

        // 3. Hash PIN for future verification (SHA-256)
        const pinHash = hashPin(pin);

        // 4. Store encrypted key + PIN hash + User profile in secure storage
        await secureStorage.saveEncryptedWallet(encryptedKey, result.address);
        await secureStorage.savePinHash(pinHash);
        await secureStorage.saveUserProfile(trimmedUsername);

        // 5. Update wallet store
        initWallet(result.address);

        // 6. Log in with custom username
        login(
          {
            id: `imported-${Date.now()}`,
            username: trimmedUsername,
            walletAddress: result.address,
            createdAt: new Date().toISOString(),
          },
          'wallet-session',
        );
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to import wallet';
        setError(message);
        setIsLoading(false);
      }
    }, 100);
  };

  return (
    <View style={[styles.screenContainer, {backgroundColor: colors.background.primary}]}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Ionicons name="chevron-back" size={24} color={colors.text.secondary} />
        <Text style={[styles.backButtonText, {color: colors.text.secondary}]}>Back</Text>
      </TouchableOpacity>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenEmoji}>📥</Text>
          <Text style={[styles.screenTitle, {color: colors.text.primary}]}>Import Wallet</Text>
          <Text style={[styles.screenSubtitle, {color: colors.text.tertiary}]}>
            Restore your existing wallet by choosing your wallet type and import
            method.
          </Text>
        </View>

        {/* Username area */}
        <Text style={[styles.sectionLabel, {color: colors.text.primary}]}>Choose Username</Text>
        <View style={[styles.inputContainer, {backgroundColor: colors.background.tertiary, borderColor: colors.border.secondary, marginBottom: spacing.xl}]}>
          <Text style={[styles.inputPrefix, {color: colors.brand.primary}]}>@</Text>
          <TextInput
            style={[styles.textInput, {color: colors.text.primary}]}
            placeholder="vortex_user"
            placeholderTextColor={colors.text.tertiary}
            value={username}
            onChangeText={(text) => {
              setUsername(text.toLowerCase().replace(/[^a-z0-9_]/g, ''));
              setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
            editable={!isLoading}
          />
        </View>

        {/* Wallet type selection */}
        <Text style={[styles.sectionLabel, {color: colors.text.primary}]}>Wallet Type</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              {backgroundColor: colors.background.tertiary, borderColor: colors.border.primary},
              walletType === 'evm' && {borderColor: colors.brand.primary, backgroundColor: colors.brand.primary + '10'},
            ]}
            onPress={() => setWalletType('evm')}
            activeOpacity={0.7}>
            <Text style={styles.optionEmoji}>⟠</Text>
            <Text style={[styles.optionTitle, {color: colors.text.primary}]}>EVM</Text>
            <Text style={[styles.optionDesc, {color: colors.text.tertiary}]}>Ethereum, Polygon, BSC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              {backgroundColor: colors.background.tertiary, borderColor: colors.border.primary},
              walletType === 'multi' && {borderColor: colors.brand.primary, backgroundColor: colors.brand.primary + '10'},
            ]}
            onPress={() => setWalletType('multi')}
            activeOpacity={0.7}>
            <Text style={styles.optionEmoji}>🌐</Text>
            <Text style={[styles.optionTitle, {color: colors.text.primary}]}>Multi-Chain</Text>
            <Text style={[styles.optionDesc, {color: colors.text.tertiary}]}>EVM + Solana, Bitcoin</Text>
          </TouchableOpacity>
        </View>

        {/* Import method selection */}
        {walletType && (
          <>
            <Text style={[styles.sectionLabel, {color: colors.text.primary}]}>Import Method</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  {backgroundColor: colors.background.tertiary, borderColor: colors.border.primary},
                  importMethod === 'seed' && {borderColor: colors.brand.primary, backgroundColor: colors.brand.primary + '10'},
                ]}
                onPress={() => setImportMethod('seed')}
                activeOpacity={0.7}>
                <Text style={styles.optionEmoji}>📝</Text>
                <Text style={[styles.optionTitle, {color: colors.text.primary}]}>Seed Phrase</Text>
                <Text style={[styles.optionDesc, {color: colors.text.tertiary}]}>12 or 24 words</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  {backgroundColor: colors.background.tertiary, borderColor: colors.border.primary},
                  importMethod === 'key' && {borderColor: colors.brand.primary, backgroundColor: colors.brand.primary + '10'},
                ]}
                onPress={() => setImportMethod('key')}
                activeOpacity={0.7}>
                <Text style={styles.optionEmoji}>🔑</Text>
                <Text style={[styles.optionTitle, {color: colors.text.primary}]}>Private Key</Text>
                <Text style={[styles.optionDesc, {color: colors.text.tertiary}]}>Hex string</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Input area */}
        {importMethod && (
          <>
            <Text style={[styles.sectionLabel, {color: colors.text.primary}]}>
              {importMethod === 'seed'
                ? 'Enter Seed Phrase'
                : 'Enter Private Key'}
            </Text>
            <TextInput
              style={[styles.multilineInput, {backgroundColor: colors.background.tertiary, borderColor: colors.border.secondary, color: colors.text.primary}]}
              placeholder={
                importMethod === 'seed'
                  ? 'word1 word2 word3 ...'
                  : '0x...'
              }
              placeholderTextColor={colors.text.tertiary}
              value={inputValue}
              onChangeText={(text) => {
                setInputValue(text);
                setError('');
              }}
              multiline={importMethod === 'seed'}
              numberOfLines={importMethod === 'seed' ? 4 : 1}
              autoCapitalize="none"
              autoCorrect={false}
              secureTextEntry={importMethod === 'key'}
              editable={!isLoading}
            />

            {/* Error message */}
            {error ? (
              <View style={styles.errorRow}>
                <Ionicons name="warning" size={14} color={colors.status.error} />
                <Text style={[styles.errorText, {color: colors.status.error}]}>{error}</Text>
              </View>
            ) : null}

            {/* Security warning */}
            <View style={[styles.warningBox, {backgroundColor: colors.brand.secondary + '0A', borderColor: colors.brand.secondary + '20'}]}>
              <Text style={[styles.warningText, {color: colors.brand.secondary}]}>
                🔒 Your keys never leave this device. We do not store or transmit
                your seed phrase or private key.
              </Text>
            </View>

            {/* PIN Setup */}
            <Text style={[styles.sectionLabel, {color: colors.text.primary, marginTop: spacing.xl}]}>Set a Wallet PIN</Text>
            <Text style={[{color: colors.text.tertiary, ...typography.bodySmall, marginBottom: spacing.md}]}>
              This PIN encrypts your private key. You'll need it to send transactions.
            </Text>

            <TextInput
              style={[styles.multilineInput, {
                backgroundColor: colors.background.tertiary,
                borderColor: pin.length >= 6 ? colors.status.success : colors.border.secondary,
                color: colors.text.primary,
                minHeight: 56,
                marginBottom: spacing.md,
              }]}
              placeholder="Enter 6-digit PIN"
              placeholderTextColor={colors.text.tertiary}
              value={pin}
              onChangeText={(t) => {
                setPin(t.replace(/[^0-9]/g, '').slice(0, 8));
                setError('');
              }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              editable={!isLoading}
            />

            <TextInput
              style={[styles.multilineInput, {
                backgroundColor: colors.background.tertiary,
                borderColor: confirmPin.length >= 6 && confirmPin === pin ? colors.status.success : colors.border.secondary,
                color: colors.text.primary,
                minHeight: 56,
              }]}
              placeholder="Confirm PIN"
              placeholderTextColor={colors.text.tertiary}
              value={confirmPin}
              onChangeText={(t) => {
                setConfirmPin(t.replace(/[^0-9]/g, '').slice(0, 8));
                setError('');
              }}
              keyboardType="number-pad"
              secureTextEntry
              maxLength={8}
              editable={!isLoading}
            />
          </>
        )}
      </ScrollView>

      {/* Import button */}
      {importMethod && (
        <View style={styles.bottomAction}>
          <ActionButton
            label="Import Wallet"
            onPress={handleImport}
            disabled={!inputValue.trim() || !pin || pin.length < 6 || pin !== confirmPin || isLoading}
            loading={isLoading}
          />
        </View>
      )}
    </View>
  );
}

// ── Navigator ────────────────────────────────────────────────

export function AuthNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.background.primary},
        animation: 'slide_from_right',
      }}>
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="Username" component={UsernameScreen} />
      <Stack.Screen name="Avatar" component={AvatarScreen} />
      <Stack.Screen name="CreateWallet" component={CreateWalletScreen} />
      <Stack.Screen name="SeedPhrase" component={SeedPhraseScreen} />
      <Stack.Screen name="ConfirmSeed" component={ConfirmSeedScreen} />
      <Stack.Screen name="ImportWallet" component={ImportWalletScreen} />
    </Stack.Navigator>
  );
}

// ── Styles ───────────────────────────────────────────────────

const styles = StyleSheet.create({
  // Welcome screen
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing['2xl'],
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbPrimary: {
    width: width * 0.8,
    height: width * 0.8,
    top: -width * 0.2,
    right: -width * 0.3,
  },
  orbTeal: {
    width: width * 0.6,
    height: width * 0.6,
    bottom: height * 0.1,
    left: -width * 0.2,
  },
  logoContainer: {
    marginBottom: spacing['3xl'],
    alignItems: 'center',
  },
  logoImage: {
    width: 100,
    height: 100,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.displayLarge,
    color: colors.text.primary,
    letterSpacing: -1,
  },
  versionBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'] + 1,
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
    overflow: 'hidden',
  },
  versionText: {
    fontSize: 11,
    fontWeight: '700',
  },
  subtitle: {
    ...typography.bodyLarge,
    color: colors.text.secondary,
    marginBottom: spacing['4xl'],
    textAlign: 'center',
  },
  pillsContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing['5xl'],
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.overlay.light,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    gap: spacing.xs,
  },
  pillIcon: {
    fontSize: 14,
  },
  pillText: {
    ...typography.labelMedium,
  },

  // CTA Buttons
  ctaContainer: {
    width: '100%',
    gap: spacing.md,
  },
  secondaryButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  secondaryButtonText: {
    ...typography.labelLarge,
    fontSize: 16,
  },
  footerText: {
    ...typography.bodySmall,
    marginTop: spacing['3xl'],
    textAlign: 'center',
  },

  // Generic screen layout
  screenContainer: {
    flex: 1,
  },
  screenContent: {
    flexGrow: 1,
    paddingHorizontal: spacing['2xl'],
    paddingTop: spacing.xl,
    paddingBottom: spacing['3xl'],
  },
  screenHeader: {
    alignItems: 'center',
    marginBottom: spacing['3xl'],
    marginTop: spacing['2xl'],
  },
  screenEmoji: {
    fontSize: 48,
    marginBottom: spacing.lg,
  },
  screenTitle: {
    ...typography.headingLarge,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  screenSubtitle: {
    ...typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Back button
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  backButtonText: {
    ...typography.labelLarge,
  },

  // Bottom action
  bottomAction: {
    paddingHorizontal: spacing['2xl'],
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.lg,
  },

  // Username input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  inputPrefix: {
    ...typography.headingMedium,
    marginRight: spacing.xs,
  },
  textInput: {
    flex: 1,
    ...typography.bodyLarge,
    height: '100%',
  },
  errorText: {
    ...typography.bodySmall,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  successRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
    gap: spacing.xs,
  },
  successText: {
    ...typography.bodySmall,
  },
  rulesContainer: {
    marginTop: spacing['2xl'],
    gap: spacing.sm,
  },
  ruleText: {
    ...typography.bodySmall,
  },

  // Avatar grid
  avatarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.md,
  },
  avatarItem: {
    width: 72,
    height: 72,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  avatarEmoji: {
    fontSize: 32,
  },

  // Import wallet
  sectionLabel: {
    ...typography.labelLarge,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  optionCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    gap: spacing.xs,
  },
  optionEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  optionTitle: {
    ...typography.labelMedium,
    fontWeight: '700',
  },
  optionDesc: {
    ...typography.bodySmall,
    textAlign: 'center',
  },
  multilineInput: {
    borderRadius: borderRadius.lg,
    borderWidth: 1.5,
    padding: spacing.lg,
    ...typography.bodyMedium,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  warningBox: {
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
  },
  warningText: {
    ...typography.bodySmall,
    lineHeight: 20,
  },
});
