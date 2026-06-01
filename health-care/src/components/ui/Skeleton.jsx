/**
 * Skeleton loading placeholder component for consistent loading states.
 * 
 * @param {Object} props
 * @param {string} [props.variant] - Skeleton variant: 'text', 'circular', 'rectangular'
 * @param {string} [props.width] - Width (CSS value)
 * @param {string} [props.height] - Height (CSS value)
 * @param {string} [props.className] - Additional CSS classes
 */
export default function Skeleton({ 
  variant = 'rectangular', 
  width, 
  height, 
  className = '' 
}) {
  const baseClasses = 'animate-pulse bg-gray-200';
  
  const variantClasses = {
    text: 'rounded h-4',
    circular: 'rounded-full',
    rectangular: 'rounded-lg'
  };

  const style = {};
  if (width) style.width = width;
  if (height) style.height = height;

  return (
    <div 
      className={`${baseClasses} ${variantClasses[variant]} ${className}`}
      style={style}
      aria-hidden="true"
    />
  );
}

/**
 * Product detail page skeleton loader
 */
export function ProductDetailSkeleton() {
  return (
    <div className="bg-page min-h-screen pb-24 md:pb-8">
      {/* Breadcrumb skeleton */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <div className="flex items-center gap-2">
            <Skeleton width="60px" height="16px" />
            <Skeleton width="80px" height="16px" />
            <Skeleton width="120px" height="16px" />
          </div>
        </div>
      </div>

      {/* Main content skeleton */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6 xl:gap-8">
          {/* Image gallery skeleton */}
          <div>
            <Skeleton height="500px" className="mb-4" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <Skeleton key={i} width="80px" height="80px" />
              ))}
            </div>
          </div>

          {/* Product info skeleton */}
          <div className="space-y-4">
            <Skeleton height="32px" width="80%" />
            <Skeleton height="24px" width="40%" />
            <Skeleton height="20px" width="60%" />
            <div className="space-y-2 mt-6">
              <Skeleton height="16px" width="100%" />
              <Skeleton height="16px" width="90%" />
              <Skeleton height="16px" width="95%" />
            </div>
            <Skeleton height="48px" width="100%" className="mt-6" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Product list skeleton loader
 */
export function ProductListSkeleton({ count = 8 }) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="bg-white rounded-xl border border-gray-100 p-3 space-y-3">
          <Skeleton height="200px" />
          <Skeleton height="16px" width="80%" />
          <Skeleton height="14px" width="60%" />
          <Skeleton height="20px" width="40%" />
        </div>
      ))}
    </div>
  );
}
