import React, {useState} from 'react';
import {View, Text, TextInput, TouchableOpacity, Image, StyleSheet} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {useAuthStore} from '@store/authStore';
import {secureStorage} from '@services/storage/secureStorage';
import {verifyPin} from '@services/security/encryptionService';
import {authenticateUser} from '@services/security/biometricService';
import {resetSessionTimer} from '@services/security/sessionManager';
import {useWalletStore} from '@store/walletStore';
import {colors, typography, spacing, borderRadius} from '@theme';

export function LockScreen(): React.JSX.Element {
  const unlock = useAuthStore(state => state.unlock);
  const logout = useAuthStore(state => state.logout);
  const isBiometricEnabled = useAuthStore(state => state.isBiometricEnabled);
  const clearWallet = useWalletStore(state => state.clearWallet);

  const [pinInput, setPinInput] = useState('');
  const [pinError, setPinError] = useState('');

  const handlePinUnlock = async () => {
    if (!pinInput || pinInput.length < 6) return;
    
    const storedHash = await secureStorage.getPinHash();
    if (storedHash && verifyPin(pinInput, storedHash)) {
      setPinInput('');
      setPinError('');
      unlock();
      setTimeout(() => resetSessionTimer(), 0);
    } else {
      setPinError('Incorrect PIN');
    }
  };

  const handleBiometricUnlock = async () => {
    const result = await authenticateUser('Unlock Wallet');
    if (result.success) {
      unlock();
      resetSessionTimer();
    }
  };

  const handleResetWallet = () => {
    secureStorage.clearAll().then(() => {
      clearWallet();
      logout();
    });
  };

  return (
    <View style={styles.container}>
      <Image
        source={require('../assets/logo.png')}
        style={styles.logoImage}
        resizeMode="contain"
      />
      <Text style={styles.title}>Wallet Locked</Text>

      <View style={styles.pinInputContainer}>
        <Text style={styles.pinDesc}>
          Enter your PIN to access your wallet securely.
        </Text>

        <TextInput
          style={[styles.pinInput, pinError ? {borderColor: colors.status.error} : null]}
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
          onSubmitEditing={handlePinUnlock}
        />

        {pinError ? (
           <Text style={[{color: colors.status.error, ...typography.bodySmall, marginTop: 8}]}>
             {pinError}
           </Text>
        ) : null}

        <TouchableOpacity
          style={[
            styles.unlockButton,
            { marginTop: 24, alignSelf: 'stretch', justifyContent: 'center' },
            (!pinInput || pinInput.length < 6) && {opacity: 0.5}
          ]}
          disabled={!pinInput || pinInput.length < 6}
          onPress={handlePinUnlock}
          activeOpacity={0.7}>
          <Text style={styles.unlockAction}>Unlock Wallet</Text>
        </TouchableOpacity>
      </View>

      {isBiometricEnabled && (
        <View style={styles.unlockBtnContainer}>
          <TouchableOpacity
            style={styles.bioButton}
            onPress={handleBiometricUnlock}
            activeOpacity={0.7}>
            <Ionicons name="finger-print" size={20} color={colors.text.secondary} style={{marginRight: 8}} />
            <Text style={styles.bioAction}>Use Face ID / Touch ID</Text>
          </TouchableOpacity>
        </View>
      )}

      <TouchableOpacity 
        style={{marginTop: 40}}
        onPress={handleResetWallet}
      >
        <Text style={{color: colors.text.secondary, ...typography.bodySmall}}>
          Forgot PIN? <Text style={{color: colors.status.error, fontWeight: '600'}}>Reset Wallet</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoImage: {
    width: 80,
    height: 80,
    marginBottom: spacing.xl,
    opacity: 0.9,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text.primary,
    marginBottom: spacing.sm,
  },
  pinInputContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing.xl,
    width: '100%',
  },
  pinDesc: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  pinInput: {
    backgroundColor: colors.background.tertiary,
    borderRadius: borderRadius.md,
    borderWidth: 1.5,
    borderColor: colors.border.secondary,
    paddingHorizontal: spacing.lg,
    width: '100%',
    height: 52,
    color: colors.text.primary,
    fontSize: 18,
    fontWeight: '600',
    letterSpacing: 8,
    textAlign: 'center',
  },
  unlockButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.brand.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.full,
  },
  unlockAction: {
    ...typography.labelLarge,
    color: colors.background.primary,
    fontWeight: '700',
  },
  unlockBtnContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing['2xl'],
    marginTop: spacing.xl,
  },
  bioButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
  },
  bioAction: {
    ...typography.labelLarge,
    color: colors.text.secondary,
    fontWeight: '600',
  },
});
