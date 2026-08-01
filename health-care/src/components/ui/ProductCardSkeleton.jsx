/**
 * ProductCardSkeleton — shimmer placeholder rendered while product data loads.
 * Maintains identical dimensions to ProductCard to prevent layout shift (CLS).
 *
 * Requirements: 2.10, 3.3
 */

/**
 * Single skeleton card placeholder.
 */
export default function ProductCardSkeleton() {
  return (
    <div
      className="skeleton-card rounded-xl overflow-hidden border border-[var(--color-border-tertiary,#ddeef7)]"
      aria-hidden="true"
      style={{ minHeight: '320px' }}
    >
      {/* Image area */}
      <div className="skeleton" style={{ aspectRatio: '1 / 1', width: '100%', borderRadius: 0 }} />

      {/* Content area */}
      <div style={{ padding: '1rem' }}>
        {/* Category badge */}
        <div className="skeleton" style={{ height: '14px', width: '38%', marginBottom: '10px' }} />

        {/* Product name — two lines */}
        <div className="skeleton" style={{ height: '18px', width: '88%', marginBottom: '6px' }} />
        <div className="skeleton" style={{ height: '18px', width: '65%', marginBottom: '14px' }} />

        {/* Price */}
        <div className="skeleton" style={{ height: '22px', width: '45%', marginBottom: '18px' }} />

        {/* CTA button */}
        <div className="skeleton" style={{ height: '40px', width: '100%', borderRadius: '8px' }} />
      </div>
    </div>
  );
}

/**
 * Renders a responsive grid of skeleton cards while products are loading.
 *
 * @param {{ count?: number }} props
 * @param {number} [props.count=8] - Number of placeholders to render
 */
export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div
      className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
      role="status"
      aria-label="Loading products"
      aria-live="polite"
    >
      <span className="sr-only">Loading products, please wait…</span>
      {Array.from({ length: count }, (_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
