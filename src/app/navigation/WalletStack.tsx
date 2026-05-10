/**
 * Wallet Stack Navigator
 *
 * Nested stack inside the Wallet tab.
 * Screens: WalletHome → Send → ConfirmSend, Receive
 */

import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {WalletHomeScreen} from '../../screens/wallet/WalletHomeScreen';
import {SendScreen} from '../../screens/wallet/SendScreen';
import {ConfirmSendScreen} from '../../screens/wallet/ConfirmSendScreen';
import ReceiveScreen from '../../screens/ReceiveScreen';
import type {WalletStackParamList} from './types';

const Stack = createNativeStackNavigator<WalletStackParamList>();

export function WalletStackNavigator(): React.JSX.Element {
  return (
    <Stack.Navigator screenOptions={{headerShown: false}}>
      <Stack.Screen name="WalletHome" component={WalletHomeScreen} />
      <Stack.Screen name="SendScreen" component={SendScreen} />
      <Stack.Screen name="Receive" component={ReceiveScreen} />
      <Stack.Screen name="ConfirmSend" component={ConfirmSendScreen} />
    </Stack.Navigator>
  );
}
