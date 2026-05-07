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
  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={name}
          className="block text-[10px] sm:text-[11px] text-[var(--color-text-secondary)] mb-1 font-[family-name:var(--font-plus-jakarta)]"
        >
          {label} {required && <span className="text-[#E24B4A]">*</span>}
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
        className={`w-full px-2.5 sm:px-3 py-2 sm:py-[9px] border-[0.5px] rounded-lg text-[12px] sm:text-[13px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none transition-colors ${
          error
            ? 'border-[#E24B4A] focus:border-[#E24B4A] focus:ring-1 focus:ring-[#E24B4A]'
            : 'border-[var(--color-border-secondary)] focus:border-[#0E8A6E] focus:ring-1 focus:ring-[#0E8A6E]'
        } ${disabled ? 'bg-[var(--color-background-tertiary)] cursor-not-allowed' : 'bg-white'}`}
        {...props}
      />
      {error && (
        <p className="mt-1 text-[9px] sm:text-[10px] text-[#E24B4A]">{error}</p>
      )}
    </div>
  );
}
