/**
 * Alert — shared inline feedback banner.
 *
 * Usage:
 * <Alert variant="danger">Invalid OTP code</Alert>
 * <Alert variant="success" title="Password reset">Check your email</Alert>
 */
export default function Alert({ variant = 'danger', title, children, className = '' }) {
  const styles = {
    danger: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]',
    success: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
    warning: 'bg-[var(--color-status-warning-tint)] text-warning-ink',
    info: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
  };

  return (
    <div role="alert" className={`p-3 rounded-lg text-xs ${styles[variant]} ${className}`}>
      {title && <p className="font-semibold mb-0.5">{title}</p>}
      {children}
    </div>
  );
}
