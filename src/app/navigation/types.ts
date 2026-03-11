/**
 * Navigation type definitions
 *
 * Centralized types for type-safe navigation throughout the app.
 */

export type AuthStackParamList = {
  Welcome: undefined;
  Username: undefined;
  Avatar: {username: string};
  ImportWallet: undefined;
};

export type MainTabParamList = {
  Wallet: undefined;
  Rewards: undefined;
  MiniApps: undefined;
  Account: undefined;
};

export type WalletStackParamList = {
  WalletHome: undefined;
  SendScreen: undefined;
  ConfirmSend: {
    to: string;
    amount: string;
    gasFee: string;
  };
};

export type DashboardStackParamList = {
  DashboardHome: undefined;
  TokenDetail: {tokenAddress: string; symbol: string};
  Send: {tokenAddress?: string};
  Receive: undefined;
};

export type TransactionsStackParamList = {
  TransactionList: undefined;
  TransactionDetail: {txHash: string};
};

export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

