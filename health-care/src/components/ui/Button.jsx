'use client';

import { forwardRef, useState } from 'react';
import Link from 'next/link';

/**
 * Enhanced Button Component with micro-interactions
 * 
 * Usage:
 * <Button variant="primary" size="md" loading={isLoading}>Click me</Button>
 * <Button href="/products" variant="success" size="lg">Browse</Button>
 */

const Button = forwardRef(function Button(
  {
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    icon,
    iconPosition = 'left',
    fullWidth = false,
    className = '',
    onClick,
    href,
    ...props
  },
  ref
) {
  const [ripples, setRipples] = useState([]);

  const baseStyles = 'relative overflow-hidden inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-brand-navy text-white hover:bg-[var(--color-brand-navy-hover)] hover:shadow-lg hover:shadow-brand-navy/20',
    secondary: 'bg-white text-brand-navy border border-brand-navy hover:bg-[var(--color-background-secondary)] hover:border-[var(--color-brand-navy-hover)]',
    success: 'bg-brand-teal text-white hover:bg-[var(--color-brand-teal-hover)] hover:shadow-lg hover:shadow-brand-teal/20',
    danger: 'bg-danger text-white hover:bg-danger hover:shadow-lg hover:shadow-red-600/20',
    warning: 'bg-warning text-white hover:opacity-90 hover:shadow-lg hover:shadow-yellow-500/20',
    ghost: 'bg-transparent text-brand-navy hover:bg-[var(--color-background-tertiary)]',
    link: 'bg-transparent text-brand-teal hover:underline p-0 touch-compact',
  };

  const sizeStyles = {
    sm: 'text-xs px-2.5 py-1 min-h-[28px] touch-compact',
    md: 'text-sm px-3.5 py-1.5 min-h-[36px] touch-compact',
    lg: 'text-sm px-5 py-2 min-h-[40px]',
    xl: 'text-base px-6 py-2.5 min-h-[46px]',
  };

  const handleClick = (e) => {
    if (disabled || loading) return;

    // Create ripple effect
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;

    const newRipple = {
      x,
      y,
      size,
      id: Date.now(),
    };

    setRipples((prev) => [...prev, newRipple]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples((prev) => prev.filter((ripple) => ripple.id !== newRipple.id));
    }, 600);

    onClick?.(e);
  };

  const buttonClasses = `
    ${baseStyles}
    ${variantStyles[variant]}
    ${sizeStyles[size]}
    ${fullWidth ? 'w-full' : ''}
    ${className}
  `;

  const content = (
    <>
      {/* Ripple effects */}
      {ripples.map((ripple) => (
        <span
          key={ripple.id}
          className="absolute bg-white/30 rounded-full animate-ripple pointer-events-none"
          style={{
            left: ripple.x,
            top: ripple.y,
            width: ripple.size,
            height: ripple.size,
          }}
        />
      ))}

      {/* Content */}
      <span className="relative flex items-center gap-2">
        {loading && (
          <svg
            className="animate-spin w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
            />
          </svg>
        )}
        
        {!loading && icon && iconPosition === 'left' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
        
        {children}
        
        {!loading && icon && iconPosition === 'right' && (
          <span className="flex-shrink-0">{icon}</span>
        )}
      </span>
    </>
  );

  if (href) {
    return (
      <Link
        ref={ref}
        href={href}
        className={buttonClasses}
        onClick={handleClick}
        aria-disabled={disabled || loading}
        {...props}
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      ref={ref}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
      {content}
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
