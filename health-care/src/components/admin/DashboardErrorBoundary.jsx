"use client";

import { Component } from 'react';

/**
 * DashboardErrorBoundary - Error boundary with retry mechanism for Admin Dashboard
 * Catches errors during lazy loading and provides a retry option
 */
class DashboardErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: 0
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    process.env.NODE_ENV !== "production" && console.error('Dashboard Error Boundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo
    });
  }

  handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      retryCount: prevState.retryCount + 1
    }));
  };

  handleGoHome = () => {
    if (this.props.onNavigateHome) {
      this.props.onNavigateHome();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-page-muted flex items-center justify-center p-6">
          <div className="bg-[var(--color-background-primary)] rounded-lg border border-[var(--color-border-tertiary)] p-8 max-w-md w-full shadow-lg">
            {/* Error Icon */}
            <div className="flex justify-center mb-4">
              <div className="w-16 h-16 rounded-full bg-[var(--color-status-danger-tint)] flex items-center justify-center">
                <svg 
                  className="w-8 h-8 text-[var(--color-status-danger)]" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path 
                    strokeLinecap="round" 
                    strokeLinejoin="round" 
                    strokeWidth={2} 
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                  />
                </svg>
              </div>
            </div>

            {/* Error Message */}
            <h2 className="text-xl font-semibold text-center mb-2 text-[var(--color-text-primary)]">
              Failed to Load Dashboard
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] text-center mb-6">
              {this.state.retryCount > 0 
                ? `We're having trouble loading the admin dashboard. This might be due to a network issue or a temporary problem.`
                : `Something went wrong while loading the admin dashboard. Please try again.`
              }
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-3 bg-[var(--color-background-secondary)] rounded border border-[var(--color-border-primary)]">
                <p className="text-xs font-mono text-[var(--color-status-danger)] mb-1">
                  {this.state.error.toString()}
                </p>
                {this.state.errorInfo && (
                  <details className="text-xs font-mono text-[var(--color-text-secondary)]">
                    <summary className="cursor-pointer">Stack trace</summary>
                    <pre className="mt-2 whitespace-pre-wrap">
                      {this.state.errorInfo.componentStack}
                    </pre>
                  </details>
                )}
              </div>
            )}

            {/* Retry Count Indicator */}
            {this.state.retryCount > 0 && (
              <p className="text-xs text-center text-[var(--color-text-tertiary)] mb-4">
                Retry attempt: {this.state.retryCount}
              </p>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="flex-1 bg-brand-navy text-white px-4 py-2.5 rounded-lg text-sm font-medium hover:bg-[#0a1f3a] transition-colors"
              >
                Try Again
              </button>
              {this.props.onNavigateHome && (
                <button
                  onClick={this.handleGoHome}
                  className="flex-1 bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)] px-4 py-2.5 rounded-lg text-sm font-medium border border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)] transition-colors"
                >
                  Go Home
                </button>
              )}
            </div>

            {/* Help Text */}
            <p className="text-xs text-center text-[var(--color-text-tertiary)] mt-4">
              If the problem persists, please contact support or try refreshing the page.
            </p>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default DashboardErrorBoundary;
