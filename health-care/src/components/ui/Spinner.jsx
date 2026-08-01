import { useId } from 'react';

export default function Spinner({ size = 'md', className = '', variant = 'medical' }) {
  const gradientId = useId();
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // Medical heartbeat pulse loader (default) - ENHANCED
  if (variant === 'medical') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative">
          {/* Multiple pulsing rings for depth */}
          <div className={`${sizes[size]} relative`}>
            {/* Outer pulse ring 1 */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-teal/30 to-brand-navy/30 animate-ping" />
            
            {/* Outer pulse ring 2 - delayed */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-navy/20 to-brand-teal/20 animate-ping" style={{ animationDelay: '0.5s' }} />
            
            {/* Inner rotating glow */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-brand-teal/40 via-transparent to-brand-navy/40 animate-spin-slow" />
            
            {/* Medical cross icon with gradient */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                className={`${sizes[size]} drop-shadow-lg animate-pulse`}
                viewBox="0 0 24 24" 
                fill={`url(#${gradientId})`}
              >
                <defs>
                  <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="var(--color-brand-teal)" />
                    <stop offset="100%" stopColor="var(--color-brand-navy)" />
                  </linearGradient>
                </defs>
                <path d="M20 6h-4V2h-8v4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7 11h-2v-3H8v-2h3v-3h2v3h3v2h-3v3z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Heartbeat ECG line loader - ENHANCED
  if (variant === 'heartbeat') {
    return (
      <div className={`flex items-center justify-center gap-1 ${className}`}>
        <div className="flex items-end space-x-1">
          <div className="w-1.5 bg-gradient-to-t from-brand-teal to-brand-navy rounded-full animate-heartbeat-1 shadow-lg" style={{ height: '8px' }} />
          <div className="w-1.5 bg-gradient-to-t from-brand-teal to-brand-navy rounded-full animate-heartbeat-2 shadow-lg" style={{ height: '16px' }} />
          <div className="w-1.5 bg-gradient-to-t from-brand-navy to-brand-teal rounded-full animate-heartbeat-3 shadow-lg" style={{ height: '28px' }} />
          <div className="w-1.5 bg-gradient-to-t from-brand-teal to-brand-navy rounded-full animate-heartbeat-4 shadow-lg" style={{ height: '16px' }} />
          <div className="w-1.5 bg-gradient-to-t from-brand-teal to-brand-navy rounded-full animate-heartbeat-5 shadow-lg" style={{ height: '8px' }} />
        </div>
      </div>
    );
  }

  // DNA helix loader - ENHANCED
  if (variant === 'dna') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative">
          <div className={`${sizes[size]} relative`}>
            {/* Outer glow ring */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-r from-brand-teal/30 to-brand-navy/30 animate-pulse" />
            
            {/* DNA strand 1 - horizontal with gradient */}
            <div className="absolute inset-0 flex items-center justify-center animate-spin-slow">
              <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-brand-teal to-transparent rounded-full shadow-lg" />
            </div>
            
            {/* DNA strand 2 - vertical with gradient */}
            <div className="absolute inset-0 flex items-center justify-center rotate-90 animate-spin-slow">
              <div className="w-full h-1.5 bg-gradient-to-r from-transparent via-brand-navy to-transparent rounded-full shadow-lg" />
            </div>
            
            {/* Center dot */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-2 bg-gradient-to-br from-brand-teal to-brand-navy rounded-full shadow-lg animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pills rotating loader - ENHANCED
  if (variant === 'pills') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className={`${sizes[size]} relative`}>
          {/* Rotating pill with gradient and shadow */}
          <div className="absolute inset-0 flex items-center justify-center animate-spin">
            <div className="w-full h-1/3 bg-gradient-to-r from-brand-teal via-[var(--color-brand-teal-hover)] to-brand-navy rounded-full shadow-xl" />
          </div>
          
          {/* Center line */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-0.5 bg-white/40 rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Pulsing dots loader
  if (variant === 'dots') {
    const dotSize = size === 'sm' ? 'w-1.5 h-1.5' : size === 'md' ? 'w-2 h-2' : size === 'lg' ? 'w-3 h-3' : 'w-4 h-4';
    return (
      <div className={`flex items-center justify-center gap-2 ${className}`}>
        <div className={`${dotSize} bg-gradient-to-br from-brand-teal to-[#0a7560] rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '0s' }} />
        <div className={`${dotSize} bg-gradient-to-br from-[#0a7560] to-brand-navy rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '0.2s' }} />
        <div className={`${dotSize} bg-gradient-to-br from-brand-navy to-brand-teal rounded-full animate-bounce shadow-lg`} style={{ animationDelay: '0.4s' }} />
      </div>
    );
  }

  // Default modern spinner - ENHANCED
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="relative">
        {/* Outer glow ring */}
        <div className={`absolute inset-0 ${sizes[size]} rounded-full bg-gradient-to-r from-brand-teal/20 to-brand-navy/20 animate-ping`} />
        
        {/* Main spinner */}
        <svg
          className={`animate-spin ${sizes[size]} drop-shadow-lg`}
          viewBox="0 0 24 24"
          fill="none"
        >
          <defs>
            <linearGradient id={`${gradientId}-ring`} x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="var(--color-brand-teal)" />
              <stop offset="100%" stopColor="var(--color-brand-navy)" />
            </linearGradient>
          </defs>
          <circle
            className="opacity-20"
            cx="12"
            cy="12"
            r="10"
            stroke={`url(#${gradientId}-ring)`}
            strokeWidth="3"
          />
          <path
            className="opacity-90"
            fill={`url(#${gradientId}-ring)`}
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      </div>
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...', variant = 'medical' }) {
  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center bg-gradient-to-br from-black/50 to-gray-900/60 backdrop-blur-md">
      <div className="bg-white rounded-3xl p-10 shadow-lg text-center max-w-sm mx-4 animate-scale-in border-2 border-[var(--color-border-tertiary)]">
        {/* Decorative gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-teal/5 to-brand-navy/5 rounded-3xl" />
        
        {/* Content */}
        <div className="relative">
          <Spinner size="xl" variant={variant} className="mb-6" />
          <p className="text-base text-[var(--color-text-primary)] font-semibold mb-2 animate-pulse">
            {message}
          </p>
          <div className="flex items-center justify-center gap-1 mt-4">
            <div className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '0s' }} />
            <div className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
            <div className="w-2 h-2 bg-brand-teal rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
          </div>
        </div>
      </div>
    </div>
  );
}

// Product card skeleton loader - ENHANCED
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-[var(--color-border-tertiary)] animate-fade-in">
      {/* Image skeleton with animated gradient background */}
      <div className="relative aspect-square bg-gradient-to-br from-[var(--color-background-tertiary)] via-[var(--color-background-secondary)] to-[var(--color-background-tertiary)] overflow-hidden">
        {/* Animated shimmer overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent animate-shimmer" style={{ backgroundSize: '200% 100%' }} />
        
        {/* Pulse icon in center */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-brand-teal/20 to-brand-navy/20 flex items-center justify-center animate-pulse">
            <svg className="w-6 h-6 text-[var(--color-text-tertiary)]" fill="currentColor" viewBox="0 0 24 24">
              <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
            </svg>
          </div>
        </div>
      </div>
      
      {/* Content skeleton with staggered animations */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-full w-3/4 animate-shimmer" style={{ backgroundSize: '200% 100%', animationDelay: '0.1s' }} />
        <div className="h-3 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-full w-1/2 animate-shimmer" style={{ backgroundSize: '200% 100%', animationDelay: '0.2s' }} />
        <div className="flex items-center justify-between pt-2">
          <div className="h-6 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-lg w-24 animate-shimmer" style={{ backgroundSize: '200% 100%', animationDelay: '0.3s' }} />
          <div className="h-8 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-lg w-20 animate-shimmer" style={{ backgroundSize: '200% 100%', animationDelay: '0.4s' }} />
        </div>
      </div>
    </div>
  );
}

// Inline loader for buttons
export function ButtonLoader({ className = '' }) {
  return (
    <svg 
      className={`animate-spin h-4 w-4 ${className}`} 
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
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

// Page loading skeleton
export function PageLoadingSkeleton() {
  return (
    <div className="container mx-auto px-4 py-8 space-y-6 animate-fade-in">
      {/* Header skeleton */}
      <div className="space-y-3">
        <div className="h-8 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-lg w-1/3 animate-shimmer" />
        <div className="h-4 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-full w-2/3 animate-shimmer" />
      </div>
      
      {/* Content grid skeleton */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <ProductCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
