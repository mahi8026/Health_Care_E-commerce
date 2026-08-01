'use client';

/**
 * OptimizedImage — drop-in replacement for <img> and Next.js <Image>
 *
 * Features:
 * - Automatic Cloudinary URL optimization (right size, AVIF/WebP)
 * - Blur-up placeholder while loading
 * - Graceful fallback on error
 * - Respects Next.js Image optimization pipeline for non-Cloudinary sources
 * - Native lazy loading for below-fold images
 *
 * Usage:
 *   <OptimizedImage
 *     src={product.images[0]}
 *     alt="Product name"
 *     width={400} height={400}
 *     context="card"           // 'card' | 'detail' | 'hero' | 'cart' | 'thumb'
 *     priority={false}         // set true for above-fold LCP images
 *   />
 */

import { useState, useCallback } from 'react';
import Image from 'next/image';
import { optimizeCloudinaryUrl, CLOUDINARY_SIZES } from '@/utils/cloudinary';

const CONTEXT_SIZES = {
  card:   CLOUDINARY_SIZES.CARD,
  detail: CLOUDINARY_SIZES.DETAIL_MAIN,
  thumb:  CLOUDINARY_SIZES.DETAIL_THUMB,
  hero:   CLOUDINARY_SIZES.HERO,
  cart:   CLOUDINARY_SIZES.CART,
  search: CLOUDINARY_SIZES.SEARCH,
};

// Tiny 1×1 transparent pixel — used when no image available
const TRANSPARENT_PIXEL =
  'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

export default function OptimizedImage({
  src,
  alt,
  width,
  height,
  context = 'card',
  priority = false,
  fill = false,
  className = '',
  style = {},
  fallback = '🏥',
  onLoad,
  sizes,
  ...rest
}) {
  const [error, setError] = useState(false);
  const [loaded, setLoaded] = useState(false);

  const handleError = useCallback(() => setError(true), []);
  const handleLoad = useCallback((e) => {
    setLoaded(true);
    onLoad?.(e);
  }, [onLoad]);

  // Resolve the source URL
  const rawSrc = typeof src === 'string' ? src
    : typeof src === 'object' ? (src?.url || src?.src || '') : '';

  if (!rawSrc || error) {
    // Fallback placeholder
    return (
      <div
        style={{
          width: fill ? '100%' : width,
          height: fill ? '100%' : height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'var(--color-background-tertiary)',
          fontSize: Math.min((width || 100) * 0.4, 52),
          borderRadius: style.borderRadius || 0,
          ...style,
        }}
        role="img"
        aria-label={alt}
        className={className}
      >
        {fallback}
      </div>
    );
  }

  // Optimize Cloudinary URLs to the right size for this context
  const ctxSize = CONTEXT_SIZES[context] || {};
  const optimizedSrc = optimizeCloudinaryUrl(rawSrc, {
    width: ctxSize.width || width || 800,
    height: ctxSize.height || height,
    crop: ctxSize.crop || 'limit',
  });

  // Determine responsive sizes hint if not provided
  const defaultSizes = sizes || (() => {
    switch (context) {
      case 'card':   return '(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw';
      case 'detail': return '(max-width: 768px) 100vw, 50vw';
      case 'hero':   return '100vw';
      case 'cart':   return '80px';
      case 'search': return '(max-width: 640px) 25vw, 160px';
      default:       return '(max-width: 768px) 100vw, 50vw';
    }
  })();

  return (
    <div
      style={{
        position: 'relative',
        width: fill ? '100%' : width,
        height: fill ? '100%' : height,
        overflow: 'hidden',
        ...style,
      }}
      className={className}
    >
      {/* Blur-up shimmer shown while loading */}
      {!loaded && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(90deg, #f0f0f0 25%, #e8e8e8 50%, #f0f0f0 75%)',
            backgroundSize: '200% 100%',
            animation: 'shimmer 1.4s infinite',
          }}
          aria-hidden="true"
        />
      )}

      <Image
        src={optimizedSrc}
        alt={alt || ''}
        width={fill ? undefined : (width || ctxSize.width || 400)}
        height={fill ? undefined : (height || ctxSize.height || 400)}
        fill={fill}
        priority={priority}
        sizes={defaultSizes}
        loading={priority ? 'eager' : 'lazy'}
        onError={handleError}
        onLoad={handleLoad}
        style={{
          objectFit: 'cover',
          transition: 'opacity 0.3s ease',
          opacity: loaded ? 1 : 0,
          ...(fill ? { position: 'absolute', inset: 0 } : {}),
        }}
        {...rest}
      />
    </div>
  );
}
