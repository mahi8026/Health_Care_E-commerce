"use client";

import { Component } from 'react';
import * as Sentry from '@sentry/nextjs';
import Button from './Button';

/**
 * Error Boundary Component
 * Catches React rendering errors, reports them to Sentry, and displays a fallback UI.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <YourComponent />
 *   </ErrorBoundary>
 *
 * Props:
 *   - fallback: ReactNode — custom fallback UI (optional)
 *   - title: string — custom error heading (optional)
 *   - message: string — custom error message (optional)
 *   - onReset: () => void — callback when user clicks "Try Again" (optional)
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
    this.setState({ error, errorInfo });

    // Report to Sentry with component stack context
    Sentry.captureException(error, {
      extra: {
        componentStack: errorInfo?.componentStack,
      },
    });

    // Also log to console in development for quick debugging
    if (process.env.NODE_ENV === 'development') {
      console.error('[ErrorBoundary] Caught an error:', error, errorInfo);
    }
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
            <div className="w-16 h-16 mx-auto mb-4 text-[var(--color-status-danger)]">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold mb-2 text-brand-navy font-[family-name:var(--font-lora)]">
              {this.props.title || 'Something went wrong'}
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              {this.props.message || 'An unexpected error occurred. Please try again or contact support if the problem persists.'}
            </p>
            
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details className="mb-6 text-left">
                <summary className="text-xs text-[var(--color-status-danger)] cursor-pointer mb-2">
                  Error Details (Development Only)
                </summary>
                <pre className="text-xs bg-[var(--color-status-danger-tint)] p-3 rounded overflow-auto max-h-40 text-[var(--color-status-danger)]">
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}
            
            <div className="flex gap-3 justify-center">
              <Button variant="success" size="lg" onClick={this.handleReset}>
                Try Again
              </Button>
              <Button
                variant="secondary"
                size="lg"
                onClick={() => { window.location.href = '/'; }}
              >
                Go Home
              </Button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
