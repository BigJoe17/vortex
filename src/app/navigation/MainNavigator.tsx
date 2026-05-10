/**
 * Main Tab Navigator
 *
 * Bottom tab navigator for authenticated users.
 * Tabs: Wallet | Rewards | MiniApps | Account
 */

import React from 'react';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {FloatingNavBar} from '../../components/navigation/FloatingNavBar';
import {WalletStackNavigator} from './WalletStack';
import {RewardsScreen} from '../../screens/rewards/RewardsScreen';
import {MiniAppsScreen} from '../../screens/miniapps/MiniAppsScreen';
import {AccountScreen} from '../../screens/account/AccountScreen';
import type {MainTabParamList} from './types';

const Tab = createBottomTabNavigator<MainTabParamList>();

export function MainNavigator(): React.JSX.Element {
  return (
    <Tab.Navigator
      tabBar={(props) => <FloatingNavBar {...props} />}
      screenOptions={{
        headerShown: false,
      }}>
      <Tab.Screen name="Wallet" component={WalletStackNavigator} />
      <Tab.Screen name="Rewards" component={RewardsScreen} />
      <Tab.Screen name="MiniApps" component={MiniAppsScreen} />
      <Tab.Screen name="Account" component={AccountScreen} />
    </Tab.Navigator>
  );
}
