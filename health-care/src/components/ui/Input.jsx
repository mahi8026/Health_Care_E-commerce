export default function Input({
  label,
  type = 'text',
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) {
  const errorId = error ? `${name}-error` : undefined;
  
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={name}
          className="block text-xs sm:text-xs text-[var(--color-text-secondary)] mb-1 font-[family-name:var(--font-plus-jakarta)]"
        >
          {label} {required && <span className="text-danger" aria-label="required">*</span>}
        </label>
      )}
      <input
        id={name}
        type={type}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        required={required}
        aria-required={required}
        aria-invalid={!!error}
        aria-describedby={errorId}
        className={`w-full px-3 py-2.5 border-[0.5px] rounded-lg text-base sm:text-sm font-[family-name:var(--font-plus-jakarta)] focus:outline-none transition-colors min-h-[48px] ${
          error
            ? 'border-danger focus:border-danger focus:ring-1 focus:ring-danger'
            : 'border-[var(--color-border-secondary)] focus:border-brand-teal focus:ring-1 focus:ring-brand-teal'
        } ${disabled ? 'bg-[var(--color-background-tertiary)] cursor-not-allowed' : 'bg-white'}`}
        {...props}
      />
      {error && (
        <p id={errorId} className="mt-1 text-xs sm:text-xs text-danger" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
