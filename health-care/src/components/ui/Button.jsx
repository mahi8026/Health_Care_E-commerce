'use client';

import { forwardRef, useState } from 'react';

/**
 * Enhanced Button Component with micro-interactions
 * 
 * Usage:
 * <Button variant="primary" size="md" loading={isLoading}>Click me</Button>
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
    ...props
  },
  ref
) {
  const [ripples, setRipples] = useState([]);

  const baseStyles = 'relative overflow-hidden inline-flex items-center justify-center gap-2 font-medium rounded-lg transition-all duration-200 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed';

  const variantStyles = {
    primary: 'bg-[#0B2545] text-white hover:bg-[#0d2d52] hover:shadow-lg hover:shadow-[#0B2545]/20',
    secondary: 'bg-white text-[#0B2545] border border-[#0B2545] hover:bg-gray-50 hover:border-[#0d2d52]',
    success: 'bg-[#0E8A6E] text-white hover:bg-[#0a6b55] hover:shadow-lg hover:shadow-[#0E8A6E]/20',
    danger: 'bg-red-600 text-white hover:bg-red-700 hover:shadow-lg hover:shadow-red-600/20',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 hover:shadow-lg hover:shadow-yellow-500/20',
    ghost: 'bg-transparent text-[#0B2545] hover:bg-gray-100',
    link: 'bg-transparent text-[#0E8A6E] hover:underline p-0',
  };

  const sizeStyles = {
    sm: 'text-xs px-3 py-1.5 min-h-[32px]',
    md: 'text-sm px-4 py-2 min-h-[40px]',
    lg: 'text-base px-6 py-3 min-h-[48px]',
    xl: 'text-lg px-8 py-4 min-h-[56px]',
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

  return (
    <button
      ref={ref}
      className={`
        ${baseStyles}
        ${variantStyles[variant]}
        ${sizeStyles[size]}
        ${fullWidth ? 'w-full' : ''}
        ${className}
      `}
      disabled={disabled || loading}
      onClick={handleClick}
      {...props}
    >
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
    </button>
  );
});

Button.displayName = 'Button';

export default Button;
