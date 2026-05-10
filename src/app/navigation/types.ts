/**
 * Navigation type definitions
 *
 * Centralized types for type-safe navigation throughout the app.
 */

export type AuthStackParamList = {
  Welcome: undefined;
  Username: undefined;
  Avatar: {username: string};
  CreateWallet: {username: string; avatarId: string};
  SeedPhrase: {username: string; avatarId: string};
  ConfirmSeed: {username: string; avatarId: string};
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
  SendScreen:
    | {
        tokenAddress?: string;
      }
    | undefined;
  Receive: undefined;
  ConfirmSend: {
    to: string;
    amount: string;
    gasFee: string;
    asset: SendAssetParam;
  };
};

export type SendAssetParam = {
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  balance: string;
  balanceFormatted: string;
  isNative: boolean;
  logoUri?: string;
};


export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};
