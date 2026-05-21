"use client";

import { Component } from 'react';

/**
 * Error Boundary Component
 * Catches React rendering errors and displays a fallback UI
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null, errorInfo: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({
      error,
      errorInfo
    });
    
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      process.env.NODE_ENV !== "production" && console.error('ErrorBoundary caught an error:', error, errorInfo);
    }
    
    // In production, you could send this to an error tracking service like Sentry
    // Sentry.captureException(error, { extra: errorInfo });
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    if (this.props.onReset) {
      this.props.onReset();
    }
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI if provided
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default fallback UI
      return (
        <div className="min-h-screen bg-page flex items-center justify-center p-6">
          <div className="max-w-md w-full bg-white rounded-xl shadow-sm p-8 text-center">
            <div className="text-[64px] mb-4">⚠️</div>
            <h2 className="text-[20px] font-semibold mb-2 text-[#0B2545] font-[family-name:var(--font-lora)]">
              {this.props.title || 'Something went wrong'}
            </h2>
            <p className="text-[13px] text-[var(--color-text-secondary)] mb-6">
              {this.props.message || 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-[12px] text-red-600 cursor-pointer mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-[10px] bg-red-50 p-3 rounded overflow-auto max-h-40 text-red-800">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3 justify-center">
              <button
                onClick={this.handleReset}
                className="px-6 py-3 bg-[#0E8A6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0B7558] transition-colors"
              >
                Try Again
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="px-6 py-3 border border-[var(--color-border-secondary)] rounded-lg text-[13px] font-semibold hover:bg-[var(--color-background-tertiary)] transition-colors"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
