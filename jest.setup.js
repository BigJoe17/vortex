/* eslint-env jest */

const {webcrypto} = require('crypto');

if (!global.crypto) {
  global.crypto = webcrypto;
}

jest.mock('@sentry/react-native', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  wrap: (Component) => Component,
}));

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(() => Promise.resolve()),
  getItemAsync: jest.fn(() => Promise.resolve(null)),
  deleteItemAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-local-authentication', () => ({
  authenticateAsync: jest.fn(() => Promise.resolve({success: true})),
  hasHardwareAsync: jest.fn(() => Promise.resolve(true)),
  isEnrolledAsync: jest.fn(() => Promise.resolve(true)),
  supportedAuthenticationTypesAsync: jest.fn(() => Promise.resolve([])),
}));
