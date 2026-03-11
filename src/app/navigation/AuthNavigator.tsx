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
  ActivityIndicator,
} from 'react-native';
import {LinearGradient} from 'expo-linear-gradient';
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
import type {AuthStackParamList} from './types';
import type {NativeStackNavigationProp} from '@react-navigation/native-stack';

const Stack = createNativeStackNavigator<AuthStackParamList>();
const {width, height} = Dimensions.get('window');

type AuthNavProp = NativeStackNavigationProp<AuthStackParamList>;

// ── Welcome Screen ───────────────────────────────────────────

function WelcomeScreen({navigation}: {navigation: AuthNavProp}): React.JSX.Element {
  return (
    <LinearGradient
      colors={[colors.background.primary, '#0D0D1A', '#141428']}
      style={styles.container}>
      {/* Decorative gradient orbs */}
      <View style={styles.orbContainer}>
        <LinearGradient
          colors={['rgba(108, 92, 231, 0.3)', 'rgba(108, 92, 231, 0)']}
          style={[styles.orb, styles.orbPurple]}
        />
        <LinearGradient
          colors={['rgba(0, 210, 211, 0.2)', 'rgba(0, 210, 211, 0)']}
          style={[styles.orb, styles.orbTeal]}
        />
      </View>

      {/* Logo area */}
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={[colors.brand.primary, colors.brand.secondary]}
          start={{x: 0, y: 0}}
          end={{x: 1, y: 1}}
          style={styles.logoGradient}>
          <Text style={styles.logoText}>V</Text>
        </LinearGradient>
      </View>

      {/* Title */}
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Vortex</Text>
        <Text style={styles.versionBadge}>2.0</Text>
      </View>
      <Text style={styles.subtitle}>The Future of Digital Finance</Text>

      {/* Feature pills */}
      <View style={styles.pillsContainer}>
        <View style={styles.pill}>
          <Text style={styles.pillIcon}>🔐</Text>
          <Text style={styles.pillText}>Secure</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillIcon}>⚡</Text>
          <Text style={styles.pillText}>Fast</Text>
        </View>
        <View style={styles.pill}>
          <Text style={styles.pillIcon}>🌐</Text>
          <Text style={styles.pillText}>Web3</Text>
        </View>
      </View>

      {/* CTA Buttons */}
      <View style={styles.ctaContainer}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={() => navigation.navigate('Username')}>
          <LinearGradient
            colors={[colors.brand.primary, colors.brand.primaryDark]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>
              Create New Vortex Account
            </Text>
          </LinearGradient>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          activeOpacity={0.7}
          onPress={() => navigation.navigate('ImportWallet')}>
          <Text style={styles.secondaryButtonText}>
            Already Have an Account
          </Text>
        </TouchableOpacity>
      </View>

      {/* Bottom text */}
      <Text style={styles.footerText}>
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
    <LinearGradient
      colors={[colors.background.primary, '#0D0D1A']}
      style={styles.screenContainer}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <View style={styles.screenContent}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenEmoji}>👤</Text>
          <Text style={styles.screenTitle}>Claim Your Username</Text>
          <Text style={styles.screenSubtitle}>
            Choose a unique username for your Vortex wallet. This is how others
            will find you.
          </Text>
        </View>

        {/* Input */}
        <View style={styles.inputContainer}>
          <Text style={styles.inputPrefix}>@</Text>
          <TextInput
            style={styles.textInput}
            placeholder="username"
            placeholderTextColor={colors.text.tertiary}
            value={username}
            onChangeText={validate}
            autoCapitalize="none"
            autoCorrect={false}
            maxLength={20}
          />
        </View>
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
        {username.length >= 3 && !error ? (
          <Text style={styles.successText}>✓ @{username} is available</Text>
        ) : null}

        {/* Rules */}
        <View style={styles.rulesContainer}>
          {['3-20 characters', 'Letters, numbers, underscores', 'Cannot be changed later'].map(
            (rule) => (
              <Text key={rule} style={styles.ruleText}>
                • {rule}
              </Text>
            ),
          )}
        </View>
      </View>

      {/* Continue button */}
      <View style={styles.bottomAction}>
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleContinue}
          disabled={username.length < 3 || !!error}>
          <LinearGradient
            colors={
              username.length >= 3 && !error
                ? [colors.brand.primary, colors.brand.primaryDark]
                : ['#333', '#222']
            }
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

// ── Avatar Screen ────────────────────────────────────────────

const AVATARS = ['🦊', '🐺', '🦁', '🐯', '🦅', '🐉', '🦈', '🐋', '🦄', '🔥', '💎', '⚡'];

function AvatarScreen({route}: {route: {params: {username: string}}}): React.JSX.Element {
  const [selected, setSelected] = useState<number | null>(null);
  const login = useAuthStore((state) => state.login);
  const {username} = route.params;

  const handleContinue = () => {
    if (selected === null) {
      Alert.alert('Select an Avatar', 'Please choose an avatar to continue.');
      return;
    }
    // Complete onboarding — set auth state
    login(
      {
        id: `user-${Date.now()}`,
        username,
        walletAddress: '0x0000000000000000000000000000000000000000',
        avatarId: AVATARS[selected],
        createdAt: new Date().toISOString(),
      },
      'onboarding-token',
    );
  };

  return (
    <LinearGradient
      colors={[colors.background.primary, '#0D0D1A']}
      style={styles.screenContainer}>
      <View style={styles.screenContent}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenEmoji}>🎨</Text>
          <Text style={styles.screenTitle}>Choose Your Avatar</Text>
          <Text style={styles.screenSubtitle}>
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
                selected === index && styles.avatarSelected,
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
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleContinue}
          disabled={selected === null}>
          <LinearGradient
            colors={
              selected !== null
                ? [colors.brand.primary, colors.brand.primaryDark]
                : ['#333', '#222']
            }
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={styles.primaryButton}>
            <Text style={styles.primaryButtonText}>Continue</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

// ── Import Wallet Screen ─────────────────────────────────────

function ImportWalletScreen({navigation}: {navigation: AuthNavProp}): React.JSX.Element {
  const [walletType, setWalletType] = useState<'evm' | 'multi' | null>(null);
  const [importMethod, setImportMethod] = useState<'seed' | 'key' | null>(null);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const login = useAuthStore((state) => state.login);
  const initWallet = useWalletStore((state) => state.initWallet);

  const handleImport = async () => {
    const trimmed = inputValue.trim();
    if (!trimmed) {
      setError('Please enter your seed phrase or private key.');
      return;
    }

    // Validate input
    if (importMethod === 'key' && !validatePrivateKey(trimmed)) {
      setError('Invalid private key. Must be a valid 64-character hex string.');
      return;
    }
    if (importMethod === 'seed' && !validateMnemonic(trimmed)) {
      setError('Invalid seed phrase. Please check your words and try again.');
      return;
    }

    setError('');
    setIsLoading(true);

    try {
      // 1. Import wallet using ethers.js
      const result =
        importMethod === 'key'
          ? importFromPrivateKey(trimmed)
          : importFromSeedPhrase(trimmed);

      // 2. Store securely (encrypted by OS keystore)
      await secureStorage.saveWallet(result.privateKey, result.address);

      // 3. Update wallet store
      initWallet(result.address);

      // 4. Log in with real wallet address
      login(
        {
          id: `imported-${Date.now()}`,
          username: result.address.slice(0, 6) + '...' + result.address.slice(-4),
          walletAddress: result.address,
          createdAt: new Date().toISOString(),
        },
        'wallet-session',
      );
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to import wallet';
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <LinearGradient
      colors={[colors.background.primary, '#0D0D1A']}
      style={styles.screenContainer}>
      {/* Back button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}>
        <Text style={styles.backButtonText}>← Back</Text>
      </TouchableOpacity>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={styles.screenContent}
        showsVerticalScrollIndicator={false}>
        <View style={styles.screenHeader}>
          <Text style={styles.screenEmoji}>📥</Text>
          <Text style={styles.screenTitle}>Import Wallet</Text>
          <Text style={styles.screenSubtitle}>
            Restore your existing wallet by choosing your wallet type and import
            method.
          </Text>
        </View>

        {/* Wallet type selection */}
        <Text style={styles.sectionLabel}>Wallet Type</Text>
        <View style={styles.optionRow}>
          <TouchableOpacity
            style={[
              styles.optionCard,
              walletType === 'evm' && styles.optionSelected,
            ]}
            onPress={() => setWalletType('evm')}
            activeOpacity={0.7}>
            <Text style={styles.optionEmoji}>⟠</Text>
            <Text style={styles.optionTitle}>EVM</Text>
            <Text style={styles.optionDesc}>Ethereum, Polygon, BSC</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              walletType === 'multi' && styles.optionSelected,
            ]}
            onPress={() => setWalletType('multi')}
            activeOpacity={0.7}>
            <Text style={styles.optionEmoji}>🌐</Text>
            <Text style={styles.optionTitle}>Multi-Chain</Text>
            <Text style={styles.optionDesc}>EVM + Solana, Bitcoin</Text>
          </TouchableOpacity>
        </View>

        {/* Import method selection */}
        {walletType && (
          <>
            <Text style={styles.sectionLabel}>Import Method</Text>
            <View style={styles.optionRow}>
              <TouchableOpacity
                style={[
                  styles.optionCard,
                  importMethod === 'seed' && styles.optionSelected,
                ]}
                onPress={() => setImportMethod('seed')}
                activeOpacity={0.7}>
                <Text style={styles.optionEmoji}>📝</Text>
                <Text style={styles.optionTitle}>Seed Phrase</Text>
                <Text style={styles.optionDesc}>12 or 24 words</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.optionCard,
                  importMethod === 'key' && styles.optionSelected,
                ]}
                onPress={() => setImportMethod('key')}
                activeOpacity={0.7}>
                <Text style={styles.optionEmoji}>🔑</Text>
                <Text style={styles.optionTitle}>Private Key</Text>
                <Text style={styles.optionDesc}>Hex string</Text>
              </TouchableOpacity>
            </View>
          </>
        )}

        {/* Input area */}
        {importMethod && (
          <>
            <Text style={styles.sectionLabel}>
              {importMethod === 'seed'
                ? 'Enter Seed Phrase'
                : 'Enter Private Key'}
            </Text>
            <TextInput
              style={styles.multilineInput}
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
              <Text style={styles.errorText}>{error}</Text>
            ) : null}

            {/* Security warning */}
            <View style={styles.warningBox}>
              <Text style={styles.warningText}>
                🔒 Your keys never leave this device. We do not store or transmit
                your seed phrase or private key.
              </Text>
            </View>
          </>
        )}
      </ScrollView>

      {/* Import button */}
      {importMethod && (
        <View style={styles.bottomAction}>
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={handleImport}
            disabled={!inputValue.trim() || isLoading}>
            <LinearGradient
              colors={
                inputValue.trim() && !isLoading
                  ? [colors.brand.primary, colors.brand.primaryDark]
                  : ['#333', '#222']
              }
              start={{x: 0, y: 0}}
              end={{x: 1, y: 0}}
              style={styles.primaryButton}>
              {isLoading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.primaryButtonText}>Import Wallet</Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
      )}
    </LinearGradient>
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
    paddingHorizontal: spacing.xl,
  },
  orbContainer: {
    ...StyleSheet.absoluteFillObject,
    overflow: 'hidden',
  },
  orb: {
    position: 'absolute',
    borderRadius: 999,
  },
  orbPurple: {
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
  },
  logoGradient: {
    width: 88,
    height: 88,
    borderRadius: borderRadius['2xl'],
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.primary,
    shadowOffset: {width: 0, height: 8},
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 16,
  },
  logoText: {
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.displayLarge,
    color: colors.text.primary,
    letterSpacing: -1,
  },
  versionBadge: {
    ...typography.labelSmall,
    color: colors.brand.secondary,
    backgroundColor: 'rgba(0, 210, 211, 0.15)',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing['2xs'],
    borderRadius: borderRadius.sm,
    marginLeft: spacing.sm,
    overflow: 'hidden',
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
    borderColor: colors.border.primary,
    gap: spacing.xs,
  },
  pillIcon: {
    fontSize: 14,
  },
  pillText: {
    ...typography.labelMedium,
    color: colors.text.secondary,
  },

  // CTA Buttons (shared)
  ctaContainer: {
    width: '100%',
    gap: spacing.md,
  },
  primaryButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.brand.primary,
    shadowOffset: {width: 0, height: 4},
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  primaryButtonText: {
    ...typography.labelLarge,
    color: '#FFFFFF',
    fontSize: 16,
  },
  secondaryButton: {
    height: 56,
    borderRadius: borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.border.secondary,
    backgroundColor: colors.overlay.light,
  },
  secondaryButtonText: {
    ...typography.labelLarge,
    color: colors.text.secondary,
    fontSize: 16,
  },
  footerText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    marginTop: spacing['3xl'],
    textAlign: 'center',
  },

  // Generic screen layout
  screenContainer: {
    flex: 1,
  },
  screenContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.xl,
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
    color: colors.text.primary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  screenSubtitle: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    lineHeight: 22,
  },

  // Back button
  backButton: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing['3xl'],
    paddingBottom: spacing.md,
  },
  backButtonText: {
    ...typography.labelLarge,
    color: colors.text.secondary,
  },

  // Bottom action
  bottomAction: {
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing['3xl'],
    paddingTop: spacing.lg,
  },

  // Username input
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.secondary,
    paddingHorizontal: spacing.lg,
    height: 56,
  },
  inputPrefix: {
    ...typography.headingMedium,
    color: colors.brand.primary,
    marginRight: spacing.xs,
  },
  textInput: {
    flex: 1,
    ...typography.bodyLarge,
    color: colors.text.primary,
    height: '100%',
  },
  errorText: {
    ...typography.bodySmall,
    color: colors.status.error,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  successText: {
    ...typography.bodySmall,
    color: colors.status.success,
    marginTop: spacing.sm,
    marginLeft: spacing.xs,
  },
  rulesContainer: {
    marginTop: spacing['2xl'],
    gap: spacing.sm,
  },
  ruleText: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
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
    backgroundColor: colors.background.tertiary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.border.primary,
  },
  avatarSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(108, 92, 231, 0.15)',
    shadowColor: colors.brand.primary,
    shadowOffset: {width: 0, height: 0},
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarEmoji: {
    fontSize: 32,
  },

  // Import wallet
  sectionLabel: {
    ...typography.labelLarge,
    color: colors.text.primary,
    marginBottom: spacing.md,
    marginTop: spacing.xl,
  },
  optionRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  optionCard: {
    flex: 1,
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.border.primary,
    gap: spacing.xs,
  },
  optionSelected: {
    borderColor: colors.brand.primary,
    backgroundColor: 'rgba(108, 92, 231, 0.1)',
  },
  optionEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  optionTitle: {
    ...typography.labelMedium,
    color: colors.text.primary,
  },
  optionDesc: {
    ...typography.bodySmall,
    color: colors.text.tertiary,
    textAlign: 'center',
  },
  multilineInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.border.secondary,
    padding: spacing.lg,
    ...typography.bodyMedium,
    color: colors.text.primary,
    minHeight: 56,
    textAlignVertical: 'top',
  },
  warningBox: {
    backgroundColor: 'rgba(0, 210, 211, 0.08)',
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(0, 210, 211, 0.2)',
  },
  warningText: {
    ...typography.bodySmall,
    color: colors.brand.secondary,
    lineHeight: 20,
  },
});
