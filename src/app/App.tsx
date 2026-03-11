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
import {colors} from '@theme';

function App(): React.JSX.Element {
  return (
    <AppProviders>
      <StatusBar
        barStyle="light-content"
        backgroundColor={colors.background.primary}
        translucent={false}
      />
      <NavigationContainer
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
    </AppProviders>
  );
}

export default App;
