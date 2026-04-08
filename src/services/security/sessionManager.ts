/**
 * Session Manager
 *
 * Handles inactivity timeouts manually using setTimeout to lock the wallet
 * after a specified period of non-interaction.
 */

import {useAuthStore} from '@store/authStore';

// Default timeout is 60 seconds
const SESSION_TIMEOUT_MS = 60 * 1000;

let sessionTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * Start the inactivity timer. If the timer expires, it locks the wallet.
 */
export function startSessionTimer(timeoutMs: number = SESSION_TIMEOUT_MS) {
  clearSessionTimer();

  sessionTimer = setTimeout(() => {
    const authStore = useAuthStore.getState();
    if (authStore.isAuthenticated && !authStore.isLocked) {
      authStore.lock();
    }
  }, timeoutMs);
}

/**
 * Resets the timer. Should be called on every user interaction
 * (touch, navigation, keyboard input)
 */
export function resetSessionTimer(timeoutMs: number = SESSION_TIMEOUT_MS) {
  const authStore = useAuthStore.getState();
  // We only care about tracking active sessions
  if (authStore.isAuthenticated && !authStore.isLocked) {
    startSessionTimer(timeoutMs);
  }
}

/**
 * Clears the session timer entirely (e.g., when logging out or backgrounding)
 */
export function clearSessionTimer() {
  if (sessionTimer) {
    clearTimeout(sessionTimer);
    sessionTimer = null;
  }
}
