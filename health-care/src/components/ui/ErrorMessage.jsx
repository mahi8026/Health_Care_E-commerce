import Button from './Button';

/**
 * ErrorMessage component for consistent error display across the application.
 * 
 * @param {Object} props
 * @param {string} props.message - Error message to display
 * @param {Function} [props.onRetry] - Optional retry callback
 * @param {string} [props.className] - Additional CSS classes
 */
export default function ErrorMessage({ message, onRetry, className = '' }) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 px-4 py-8 ${className}`}>
      <div className="w-14 h-14 text-[var(--color-status-danger)]">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="w-full h-full">
          <circle cx="12" cy="12" r="10" />
          <line x1="12" y1="8" x2="12" y2="12" />
          <line x1="12" y1="16" x2="12.01" y2="16" />
        </svg>
      </div>
      <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">{message || 'Something went wrong'}</h2>
      <p className="text-sm text-[var(--color-text-secondary)] text-center max-w-sm">
        Please try again or contact support if the problem persists.
      </p>
      {onRetry && (
        <Button variant="primary" size="md" onClick={onRetry}>
          Try Again
        </Button>
      )}
    </div>
  );
}

/**
 * Inline error message for form fields and smaller contexts.
 */
export function InlineError({ message, className = '' }) {
  if (!message) return null;
  
  return (
    <div className={`flex items-center gap-2 text-[var(--color-status-danger)] text-xs mt-1 ${className}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{message}</span>
    </div>
  );
}
