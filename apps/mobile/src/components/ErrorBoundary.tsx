import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View } from 'react-native';
import { ErrorState } from './ui/ErrorState';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error in ErrorBoundary:', error, errorInfo);
  }

  private handleRetry = () => {
    this.setState({ hasError: false, error: null });
  };

  public render() {
    if (this.state.hasError) {
      return (
        <View className="flex-1 bg-surface items-center justify-center p-6">
          <ErrorState
            title="App ran into a problem"
            message={
              this.state.error?.message ||
              'An unexpected error occurred. Tap Retry to reload.'
            }
            onRetry={this.handleRetry}
          />
        </View>
      );
    }

    return this.props.children;
  }
}
