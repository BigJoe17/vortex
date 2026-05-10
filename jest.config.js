module.exports = {
  preset: 'react-native',
  setupFiles: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '^@app/(.*)$': '<rootDir>/src/app/$1',
    '^@features/(.*)$': '<rootDir>/src/features/$1',
    '^@shared/(.*)$': '<rootDir>/src/shared/$1',
    '^@services/(.*)$': '<rootDir>/src/services/$1',
    '^@store/(.*)$': '<rootDir>/src/store/$1',
    '^@hooks/(.*)$': '<rootDir>/src/hooks/$1',
    '^@theme$': '<rootDir>/src/theme/index.ts',
    '^@theme/(.*)$': '<rootDir>/src/theme/$1',
  },
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native|@react-navigation|@react-native-community|expo|expo-.*|@expo|@sentry/react-native|react-native-.*)/)',
  ],
};
