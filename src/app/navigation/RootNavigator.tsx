/**
 * Root Navigator
 *
 * Switches between Auth and Main stacks based on auth state.
 * On mount, checks secure storage for a saved wallet and restores it.
 */

import React, {useEffect, useState} from 'react';
import {View, ActivityIndicator, StyleSheet, Text} from 'react-native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {useAuthStore} from '@store/authStore';
import {useWalletStore} from '@store/walletStore';
import {secureStorage} from '@services/storage/secureStorage';
import {authenticateUser} from '@services/security/biometricService';
import {AuthNavigator} from './AuthNavigator';
import {MainNavigator} from './MainNavigator';
import {colors, typography, spacing} from '@theme';
import type {RootStackParamList} from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator(): React.JSX.Element {
  const isAuthenticated = useAuthStore(state => state.isAuthenticated);
  const isBiometricEnabled = useAuthStore(state => state.isBiometricEnabled);
  const isUnlocked = useAuthStore(state => state.isUnlocked);
  const setUnlocked = useAuthStore(state => state.setUnlocked);
  
  const login = useAuthStore(state => state.login);
  const initWallet = useWalletStore(state => state.initWallet);
  const [isRestoring, setIsRestoring] = useState(true);

  useEffect(() => {
    restoreWallet();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleUnlock = async () => {
    const success = await authenticateUser('Unlock Wallet');
    if (success) {
      setUnlocked(true);
    }
  };

  const restoreWallet = async () => {
    try {
      const wallet = await secureStorage.getWallet();
      if (wallet) {
        // Wallet found in secure storage — restore session
        initWallet(wallet.address);
        login(
          {
            id: 'restored',
            username:
              wallet.address.slice(0, 6) + '...' + wallet.address.slice(-4),
            walletAddress: wallet.address,
            createdAt: new Date().toISOString(),
          },
          'restored-session',
        );
      }
    } catch (error) {
      console.error('[RootNavigator] Failed to restore wallet:', error);
    } finally {
      setIsRestoring(false);
      
      // Auto-trigger biometric prompt if they are authenticated and locked
      if (useAuthStore.getState().isAuthenticated && useAuthStore.getState().isBiometricEnabled && !useAuthStore.getState().isUnlocked) {
         setTimeout(() => {
           handleUnlock();
         }, 500);
      }
    }
  };

  // Show splash while checking storage
  if (isRestoring) {
    return (
      <View style={splashStyles.container}>
        <Text style={splashStyles.logo}>V</Text>
        <Text style={splashStyles.title}>Vortex</Text>
        <ActivityIndicator
          size="large"
          color={colors.brand.primary}
          style={splashStyles.spinner}
        />
      </View>
    );
  }

  // If the user is authenticated, but they enabled biometrics and haven't unlocked yet, show locked screen.
  if (isAuthenticated && isBiometricEnabled && !isUnlocked) {
    return (
      <View style={splashStyles.container}>
        <Text style={splashStyles.logo}>🔒</Text>
        <Text style={splashStyles.title}>Wallet Locked</Text>
        
        <View style={splashStyles.unlockBtnContainer}>
           <Text style={splashStyles.unlockDesc}>Use Face ID / Touch ID to access your wallet securely.</Text>
           <Text style={splashStyles.unlockAction} onPress={handleUnlock}>Tap to Unlock</Text>
        </View>
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: {backgroundColor: colors.background.primary},
        animation: 'fade',
      }}>
      {isAuthenticated ? (
        <Stack.Screen name="Main" component={MainNavigator} />
      ) : (
        <Stack.Screen name="Auth" component={AuthNavigator} />
      )}
    </Stack.Navigator>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 64,
    fontWeight: '800',
    color: colors.brand.primary,
    marginBottom: spacing.sm,
  },
  title: {
    ...typography.headingLarge,
    color: colors.text.primary,
    marginBottom: spacing['3xl'],
  },
  spinner: {
    marginTop: spacing.xl,
  },
  unlockBtnContainer: {
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    marginTop: spacing.xl,
  },
  unlockDesc: {
    ...typography.bodyMedium,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  unlockAction: {
    ...typography.headingMedium,
    color: colors.brand.primary,
    padding: spacing.md,
  },
});

