import React from 'react';
import {View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, Switch} from 'react-native';
import {Ionicons} from '@expo/vector-icons';
import {typography, spacing, borderRadius, useTheme} from '@theme';
import {useAuthStore} from '@store/authStore';
import {authenticateUser} from '@services/security/biometricService';

export function AccountScreen(): React.JSX.Element {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const isBiometricEnabled = useAuthStore((state) => state.isBiometricEnabled);
  const setBiometricEnabled = useAuthStore((state) => state.setBiometricEnabled);

  const {colors} = useTheme();

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to log out?', [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Logout', style: 'destructive', onPress: logout},
    ]);
  };

  const handleToggleBiometrics = async (value: boolean) => {
    if (value) {
      const result = await authenticateUser('Enable Biometric Unlock');
      if (result.success) {
        setBiometricEnabled(true);
      } else {
        setBiometricEnabled(false);
      }
    } else {
      setBiometricEnabled(false);
    }
  };

  return (
    <View style={[styles.screen, {backgroundColor: colors.background.primary}]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.paddedScrollContent}>
        <Text style={[styles.pageTitle, {color: colors.text.primary}]}>Account</Text>

        <View style={[styles.profileCard, {borderBottomColor: colors.border.primary}]}>
          <View style={[styles.profileAvatar, {backgroundColor: colors.background.tertiary, borderColor: colors.brand.primary}]}>
            <Text style={styles.profileAvatarText}>
              {user?.avatarId ?? '👤'}
            </Text>
          </View>
          <Text style={[styles.profileName, {color: colors.text.primary}]}>@{user?.username ?? 'user'}</Text>
          <Text style={[styles.profileAddress, {color: colors.text.tertiary}]}>
            {user?.walletAddress
              ? `${user.walletAddress.slice(0, 6)}...${user.walletAddress.slice(-4)}`
              : '0x0000...0000'}
          </Text>
        </View>

        <View style={[styles.settingsRow, {borderBottomColor: colors.border.primary}]}>
          <View style={[styles.settingsIconCircle, {backgroundColor: colors.background.tertiary}]}>
            <Text style={styles.settingsIconText}>🔐</Text>
          </View>
          <Text style={[styles.settingsLabel, {color: colors.text.primary}]}>Face ID / Touch ID</Text>
          <Switch
            value={isBiometricEnabled}
            onValueChange={handleToggleBiometrics}
            trackColor={{false: colors.border.secondary, true: colors.brand.primary}}
            thumbColor={'#FFFFFF'}
          />
        </View>

        {[
          {icon: '👤', label: 'Edit Profile'},
          {icon: '🌐', label: 'Network'},
          {icon: '🔔', label: 'Notifications'},
          {icon: '🎨', label: 'Appearance'},
          {icon: '📖', label: 'About Vortex'},
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.settingsRow, {borderBottomColor: colors.border.primary}]}
            activeOpacity={0.6}>
            <View style={[styles.settingsIconCircle, {backgroundColor: colors.background.tertiary}]}>
              <Text style={styles.settingsIconText}>{item.icon}</Text>
            </View>
            <Text style={[styles.settingsLabel, {color: colors.text.primary}]}>{item.label}</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.text.tertiary} />
          </TouchableOpacity>
        ))}

        <TouchableOpacity
          style={[styles.logoutButton, {backgroundColor: colors.status.errorBg, borderColor: 'rgba(255, 107, 107, 0.2)'}]}
          onPress={handleLogout}
          activeOpacity={0.7}>
          <Text style={[styles.logoutText, {color: colors.status.error}]}>Log Out</Text>
        </TouchableOpacity>

        <Text style={[styles.versionText, {color: colors.text.tertiary}]}>Vortex 2.0 — v0.0.1</Text>
      </ScrollView>
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
  pageTitle: {
    ...typography.headingLarge,
    marginBottom: spacing.sm,
  },
  profileCard: {
    alignItems: 'center',
    paddingVertical: spacing['2xl'],
    marginBottom: spacing.xl,
    borderBottomWidth: 1,
  },
  profileAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    borderWidth: 2.5,
  },
  profileAvatarText: {
    fontSize: 36,
  },
  profileName: {
    ...typography.headingMedium,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  profileAddress: {
    ...typography.bodySmall,
    fontFamily: 'monospace',
  },
  settingsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    borderBottomWidth: 1,
  },
  settingsIconCircle: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  settingsIconText: {
    fontSize: 18,
  },
  settingsLabel: {
    ...typography.bodyLarge,
    flex: 1,
  },
  logoutButton: {
    marginTop: spacing['3xl'],
    borderRadius: borderRadius.lg,
    paddingVertical: spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
  },
  logoutText: {
    ...typography.labelLarge,
    fontWeight: '700',
  },
  versionText: {
    ...typography.bodySmall,
    textAlign: 'center',
    marginTop: spacing['2xl'],
    marginBottom: spacing['3xl'],
  },
});
