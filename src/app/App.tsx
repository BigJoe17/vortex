/**
 * App.tsx — Main Application Entry Point
 *
 * This is the root component that sets up navigation and providers.
 * Keep this file thin — all logic lives in providers and navigators.
 */

import React from 'react';
import {StatusBar} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {AppProviders} from './providers/AppProviders';
import {RootNavigator} from './navigation/RootNavigator';
import {ActivityWrapper} from '../components/security/ActivityWrapper';
import {AppErrorBoundary} from '../components/error/AppErrorBoundary';
import {
  captureMessage,
  initErrorReporting,
  wrapWithErrorReporting,
} from '@services/monitoring/errorReporting';
import {colors} from '@theme';

initErrorReporting();

function App(): React.JSX.Element {
  return (
    <AppErrorBoundary>
      <AppProviders>
        <StatusBar
          barStyle="light-content"
          backgroundColor={colors.background.primary}
          translucent={false}
        />
        <ActivityWrapper>
          <NavigationContainer
            onUnhandledAction={(action) => {
              captureMessage('Unhandled navigation action', {action});
            }}
            theme={{
              dark: true,
              colors: {
                primary: colors.brand.primary,
                background: colors.background.primary,
                card: colors.background.secondary,
                text: colors.text.primary,
                border: colors.border.primary,
                notification: colors.brand.secondary,
              },
              fonts: {
                regular: {
                  fontFamily: 'System',
                  fontWeight: '400',
                },
                medium: {
                  fontFamily: 'System',
                  fontWeight: '500',
                },
                bold: {
                  fontFamily: 'System',
                  fontWeight: '700',
                },
                heavy: {
                  fontFamily: 'System',
                  fontWeight: '900',
                },
              },
            }}>
            <RootNavigator />
          </NavigationContainer>
        </ActivityWrapper>
      </AppProviders>
    </AppErrorBoundary>
  );
}

export default wrapWithErrorReporting(App);
