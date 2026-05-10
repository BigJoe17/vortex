module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.ts', '.android.ts', '.ts', '.tsx', '.json'],
        alias: {
          '@app': './src/app',
          '@features': './src/features',
          '@shared': './src/shared',
          '@services': './src/services',
          '@store': './src/store',
          '@hooks': './src/hooks',
          '@theme': './src/theme',
        },
      },
    ],
  ],
};

