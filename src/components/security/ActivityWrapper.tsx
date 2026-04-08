import React, { PropsWithChildren } from 'react';
import { View, StyleSheet } from 'react-native';
import { useAuthStore } from '@store/authStore';
import { resetSessionTimer } from '@services/security/sessionManager';

export function ActivityWrapper({ children }: PropsWithChildren) {
  const updateActivity = useAuthStore((state) => state.updateActivity);

  const handleTouch = () => {
    updateActivity();
    resetSessionTimer();
  };

  return (
    <View style={styles.container} onTouchStart={handleTouch}>
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
