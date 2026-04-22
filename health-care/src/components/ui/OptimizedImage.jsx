'use client';

import { useState } from 'react';
import Image from 'next/image';

/**
 * Optimized image component with error handling and CLS prevention
 * Wraps next/image with automatic format selection (WebP/AVIF) and lazy loading
 * 
 * @param {Object} props
 * @param {string} props.src - Image source URL
 * @param {string} props.alt - Alt text for accessibility
 * @param {number} [props.width] - Image width in pixels
 * @param {number} [props.height] - Image height in pixels
 * @param {boolean} [props.priority=false] - Whether to preload (for above-fold images)
 * @param {boolean} [props.fill=false] - Whether to fill container
 * @param {string} [props.sizes] - Responsive sizes attribute
 * @param {string} [props.className] - CSS classes
 * @param {Function} [props.onError] - Custom error handler
 * @returns {React.Element}
 */
export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  priority = false,
  fill = false,
  sizes,
  className = '',
  onError: customOnError,
  ...props
}) {
  const [error, setError] = useState(false);

  const handleError = (e) => {
    setError(true);
    if (customOnError) {
      customOnError(e);
    }
  };

  // Display placeholder on error to prevent layout shift
  if (error) {
    const style = fill
      ? { position: 'absolute', inset: 0 }
      : { width: width || '100%', height: height || 'auto' };

    return (
      <div
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={style}
        role="img"
        aria-label={`${alt} (unavailable)`}
      >
        <span className="text-gray-500 text-sm px-4 text-center">
          Image unavailable
        </span>
      </div>
    );
  }

  // Render optimized image
  return (
    <Image
      src={src}
      alt={alt}
      width={fill ? undefined : width}
      height={fill ? undefined : height}
      fill={fill}
      priority={priority}
      sizes={sizes}
      className={className}
      onError={handleError}
      {...props}
    />
  );
}
