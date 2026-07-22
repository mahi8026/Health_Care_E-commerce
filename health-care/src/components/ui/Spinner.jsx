export default function Spinner({ size = 'md', className = '', variant = 'medical' }) {
  const sizes = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  // Medical heartbeat pulse loader (default)
  if (variant === 'medical') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative">
          {/* Pulsing medical cross */}
          <div className={`${sizes[size]} relative`}>
            {/* Outer pulse ring */}
            <div className="absolute inset-0 rounded-full bg-[#0E8A6E]/20 animate-ping" />
            
            {/* Medical cross icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <svg 
                className={`${sizes[size]} text-[#0E8A6E] animate-pulse`}
                viewBox="0 0 24 24" 
                fill="currentColor"
              >
                <path d="M20 6h-4V2h-8v4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-7 11h-2v-3H8v-2h3v-3h2v3h3v2h-3v3z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Heartbeat ECG line loader
  if (variant === 'heartbeat') {
    return (
      <div className={`flex items-center justify-center gap-1 ${className}`}>
        <div className="flex items-end space-x-1">
          <div className="w-1 bg-[#0E8A6E] rounded-full animate-heartbeat-1" style={{ height: '8px' }} />
          <div className="w-1 bg-[#0E8A6E] rounded-full animate-heartbeat-2" style={{ height: '16px' }} />
          <div className="w-1 bg-[#0E8A6E] rounded-full animate-heartbeat-3" style={{ height: '24px' }} />
          <div className="w-1 bg-[#0E8A6E] rounded-full animate-heartbeat-4" style={{ height: '16px' }} />
          <div className="w-1 bg-[#0E8A6E] rounded-full animate-heartbeat-5" style={{ height: '8px' }} />
        </div>
      </div>
    );
  }

  // DNA helix loader
  if (variant === 'dna') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className="relative">
          <div className={`${sizes[size]} relative animate-spin-slow`}>
            {/* DNA strands */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-full h-1 bg-gradient-to-r from-[#0E8A6E] via-[#0B2545] to-[#0E8A6E] rounded-full animate-pulse" />
            </div>
            <div className="absolute inset-0 flex items-center justify-center rotate-90">
              <div className="w-full h-1 bg-gradient-to-r from-[#0B2545] via-[#0E8A6E] to-[#0B2545] rounded-full animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Pills rotating loader
  if (variant === 'pills') {
    return (
      <div className={`flex items-center justify-center ${className}`}>
        <div className={`${sizes[size]} relative animate-spin`}>
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-full h-1/3 bg-gradient-to-r from-[#0E8A6E] to-[#0B2545] rounded-full" />
          </div>
        </div>
      </div>
    );
  }

  // Default modern spinner
  return (
    <div className={`flex items-center justify-center ${className}`}>
      <svg
        className={`animate-spin ${sizes[size]} text-[#0E8A6E]`}
        viewBox="0 0 24 24"
        fill="none"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="3"
        />
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>
  );
}

export function LoadingOverlay({ message = 'Loading...', variant = 'medical' }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl p-8 shadow-2xl text-center max-w-xs mx-4 animate-scale-in">
        <Spinner size="xl" variant={variant} className="mb-4" />
        <p className="text-sm text-gray-600 font-medium animate-pulse">
          {message}
        </p>
      </div>
    </div>
  );
}

// Product card skeleton loader
export function ProductCardSkeleton() {
  return (
    <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="relative aspect-square bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent animate-shimmer" />
      </div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full w-3/4 animate-shimmer" />
        <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full w-1/2 animate-shimmer" />
        <div className="h-6 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-full animate-shimmer" />
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
        <div className="h-8 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-lg w-1/3 animate-shimmer" />
        <div className="h-4 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded-full w-2/3 animate-shimmer" />
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
