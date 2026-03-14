import * as LocalAuthentication from 'expo-local-authentication';

export type AuthResult =
  | { success: true }
  | { success: false; reason: 'cancelled' | 'no_hardware' | 'not_enrolled' | 'failed' | 'error'; message: string };

export async function isBiometricSupported(): Promise<boolean> {
  return LocalAuthentication.hasHardwareAsync();
}

export async function isBiometricEnrolled(): Promise<boolean> {
  return LocalAuthentication.isEnrolledAsync();
}

/**
 * Returns a typed result so the caller knows WHY auth failed,
 * not just that it did. This lets the UI show the right message.
 */
export async function authenticateUser(promptMessage: string): Promise<AuthResult> {
  try {
    const [hasHardware, isEnrolled] = await Promise.all([
      isBiometricSupported(),
      isBiometricEnrolled(),
    ]);

    if (!hasHardware) {
      return {
        success: false,
        reason: 'no_hardware',
        message: 'This device does not support biometric authentication.',
      };
    }

    if (!isEnrolled) {
      return {
        success: false,
        reason: 'not_enrolled',
        message: 'No biometrics enrolled. Please set up Face ID or fingerprint in device settings.',
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Passcode',  // device passcode fallback built in
      disableDeviceFallback: false,
      cancelLabel: 'Cancel',
    });

    if (result.success) return { success: true };

    // result.error gives you 'user_cancel', 'user_fallback', 'system_cancel' etc.
    return {
      success: false,
      reason: result.error === 'user_cancel' ? 'cancelled' : 'failed',
      message: result.error === 'user_cancel'
        ? 'Authentication cancelled.'
        : 'Biometric authentication failed. Please try again.',
    };

  } catch (error) {
    console.error('[BiometricService] Authentication error:', error);
    return {
      success: false,
      reason: 'error',
      message: 'Authentication error. Please try again.',
    };
  }
}