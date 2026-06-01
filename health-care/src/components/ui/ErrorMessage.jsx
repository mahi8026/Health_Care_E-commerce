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
      <div className="text-[56px]">😕</div>
      <h2 className="text-[18px] font-semibold text-gray-800">{message || 'Something went wrong'}</h2>
      <p className="text-[13px] text-gray-500 text-center max-w-sm">
        Please try again or contact support if the problem persists.
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-6 py-2.5 bg-[#0B2545] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0d2d52] transition-colors"
        >
          Try Again
        </button>
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
    <div className={`flex items-center gap-2 text-red-600 text-[12px] mt-1 ${className}`}>
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <circle cx="12" cy="12" r="10"/>
        <line x1="12" y1="8" x2="12" y2="12"/>
        <line x1="12" y1="16" x2="12.01" y2="16"/>
      </svg>
      <span>{message}</span>
    </div>
  );
}
