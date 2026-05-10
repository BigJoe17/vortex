import React from 'react';
import {View, Text, StyleSheet, TouchableOpacity} from 'react-native';
import {captureError} from '@services/monitoring/errorReporting';
import {borderRadius, spacing, typography} from '@theme';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
}

interface AppErrorBoundaryState {
  hasError: boolean;
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  state: AppErrorBoundaryState = {
    hasError: false,
  };

  static getDerivedStateFromError(): AppErrorBoundaryState {
    return {hasError: true};
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
    captureError(error, {
      componentStack: errorInfo.componentStack,
      source: 'AppErrorBoundary',
    });
  }

  handleRetry = (): void => {
    this.setState({hasError: false});
  };

  render(): React.ReactNode {
    if (!this.state.hasError) {
      return this.props.children;
    }

    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Vortex needs a quick reset</Text>
          <Text style={styles.message}>
            Something unexpected happened. Your wallet keys remain encrypted on
            this device.
          </Text>
          <TouchableOpacity
            activeOpacity={0.75}
            onPress={this.handleRetry}
            style={styles.button}>
            <Text style={styles.buttonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing['2xl'],
    backgroundColor: '#0F0F12',
  },
  card: {
    width: '100%',
    maxWidth: 420,
    borderRadius: borderRadius.lg,
    padding: spacing['2xl'],
    backgroundColor: '#1A1B1F',
    borderWidth: 1,
    borderColor: '#2A2B30',
  },
  title: {
    ...typography.headingMedium,
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  message: {
    ...typography.bodyMedium,
    color: '#A0A3AD',
    marginBottom: spacing.xl,
  },
  button: {
    minHeight: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF7062',
  },
  buttonText: {
    ...typography.labelLarge,
    color: '#0F0F12',
    fontWeight: '800',
  },
});
