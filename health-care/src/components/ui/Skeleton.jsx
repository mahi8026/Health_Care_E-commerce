/**
 * Skeleton Loader Components
 * 
 * Usage:
 * <Skeleton className="h-4 w-32" />
 * <SkeletonCard />
 * <SkeletonProductCard />
 */

export function Skeleton({ className = '', ...props }) {
  return (
    <div
      className={`animate-shimmer bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] bg-[length:200%_100%] rounded ${className}`}
      {...props}
    />
  );
}

export function SkeletonText({ lines = 3, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={`h-4 ${i === lines - 1 ? 'w-3/4' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonCard() {
  return (
    <div className="bg-white rounded-lg border border-[var(--color-border-primary)] p-4 space-y-4">
      {/* Image */}
      <Skeleton className="h-48 w-full" />
      
      {/* Title */}
      <Skeleton className="h-6 w-3/4" />
      
      {/* Description */}
      <SkeletonText lines={2} />
      
      {/* Button */}
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

export function SkeletonProductCard() {
  return (
    <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-[10px] overflow-hidden flex flex-col">
      {/* Image */}
      <Skeleton className="aspect-square w-full" />
      
      {/* Content */}
      <div className="p-2.5 sm:p-3 space-y-2">
        {/* Brand */}
        <Skeleton className="h-3 w-20" />
        
        {/* Product Name */}
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        
        {/* Rating */}
        <Skeleton className="h-3 w-24" />
        
        {/* Price */}
        <Skeleton className="h-5 w-28" />
        
        {/* Stock */}
        <Skeleton className="h-3 w-32" />
        
        {/* Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <Skeleton className="h-8 w-full" />
          <Skeleton className="h-8 w-full" />
        </div>
      </div>
    </div>
  );
}

export function SkeletonTable({ rows = 5, columns = 4 }) {
  return (
    <div className="space-y-3">
      {/* Header */}
      <div className="flex gap-4">
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} className="h-8 flex-1" />
        ))}
      </div>
      
      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex gap-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} className="h-12 flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonAvatar({ size = 'md' }) {
  const sizeClasses = {
    sm: 'w-8 h-8',
    md: 'w-12 h-12',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  return <Skeleton className={`${sizeClasses[size]} rounded-full`} />;
}

export function SkeletonImage({ aspectRatio = '16/9', className = '' }) {
  return (
    <Skeleton
      className={className}
      style={{ aspectRatio }}
    />
  );
}
