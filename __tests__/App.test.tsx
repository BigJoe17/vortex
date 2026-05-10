/**
 * @format
 */

import React from 'react';
import {fireEvent, render, screen} from '@testing-library/react-native';
import {AppErrorBoundary} from '../src/components/error/AppErrorBoundary';

function CrashingChild(): React.JSX.Element {
  throw new Error('render crash');
}

test('error boundary shows a retryable fallback after render crash', () => {
  const errorSpy = jest.spyOn(console, 'error').mockImplementation(() => undefined);
  const warnSpy = jest.spyOn(console, 'warn').mockImplementation(() => undefined);

  render(
    <AppErrorBoundary>
      <CrashingChild />
    </AppErrorBoundary>,
  );

  expect(screen.getByText('Vortex needs a quick reset')).toBeTruthy();

  fireEvent.press(screen.getByText('Retry'));

  expect(screen.getByText('Retry')).toBeTruthy();

  errorSpy.mockRestore();
  warnSpy.mockRestore();
});
