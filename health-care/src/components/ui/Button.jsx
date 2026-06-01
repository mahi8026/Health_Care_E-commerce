export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  disabled = false,
  loading = false,
  onClick,
  type = 'button',
  className = ''
}) {
  const baseStyles = 'font-semibold font-[family-name:var(--font-plus-jakarta)] rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-[#0B2545] text-white hover:bg-[#0d2d52] focus:ring-[#0B2545]',
    secondary: 'bg-[#0E8A6E] text-white hover:bg-[#0c7a61] focus:ring-[#0E8A6E]',
    outline: 'border-[0.5px] border-[var(--color-border-secondary)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)] focus:ring-[var(--color-border-secondary)]',
    ghost: 'bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)]',
    danger: 'bg-[#E24B4A] text-white hover:bg-[#d43f3e] focus:ring-[#E24B4A]',
    success: 'bg-[#0E8A6E] text-white hover:bg-[#0c7a61] focus:ring-[#0E8A6E]'
  };
  
  const sizes = {
    sm: 'px-3 py-[6px] text-[11px] min-h-[36px]',
    md: 'px-4 py-[8px] text-[12px] min-h-[44px]',
    lg: 'px-6 py-3 text-[13px] min-h-[48px]'
  };
  
  const widthClass = fullWidth ? 'w-full' : '';
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled || loading}
      aria-busy={loading}
      aria-disabled={disabled || loading}
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
    >
      {loading ? (
        <span className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" aria-hidden="true">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          <span className="sr-only">Loading...</span>
          Loading...
        </span>
      ) : (
        children
      )}
    </button>
  );
}
