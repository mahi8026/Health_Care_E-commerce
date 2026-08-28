'use client';

import { useRef, useEffect } from 'react';
import { useCompare } from '@/context/CompareContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

function useFocusTrap(containerRef, isActive, onClose) {
  useEffect(() => {
    if (!isActive) return;
    const container = containerRef.current;
    if (!container) return;

    document.body.style.overflow = 'hidden';

    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (first) first.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onClose, containerRef]);
}

/**
 * Full-screen comparison modal — side-by-side product specs table.
 */
export default function CompareModal({ onClose }) {
  const containerRef = useRef(null);
  useFocusTrap(containerRef, true, onClose);
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const router = useRouter();

  const specs = [
    { key: 'price', label: 'Price' },
    { key: 'brand', label: 'Brand' },
    { key: 'category', label: 'Category' },
    { key: 'stock', label: 'Availability' },
    { key: 'rating', label: 'Rating' },
    { key: 'warranty', label: 'Warranty' },
    { key: 'certification', label: 'Certification' },
    { key: 'specifications', label: 'Specifications', isNested: true },
  ];

  const getImageUrl = (product) => {
    const img = product.images?.[0];
    return typeof img === 'string' ? img : img?.url;
  };

  const getBrandName = (product) => {
    return typeof product.brand === 'object' ? product.brand?.name : product.brand;
  };

  const renderSpecValue = (product, spec) => {
    if (spec.key === 'price') {
      return product.price > 0 ? `৳${product.price.toLocaleString()}` : 'Contact for Price';
    }
    if (spec.key === 'brand') {
      return getBrandName(product) || '—';
    }
    if (spec.key === 'category') {
      const cat = typeof product.category === 'object' ? product.category?.name : product.category;
      return cat || '—';
    }
    if (spec.key === 'stock') {
      return product.stock > 0 ? (
        <span className="text-brand-teal font-medium">✓ In Stock</span>
      ) : (
        <span className="text-danger">Out of Stock</span>
      );
    }
    if (spec.key === 'rating') {
      const rating = typeof product.rating === 'object' ? product.rating?.average : product.rating;
      return rating ? `${rating.toFixed(1)} ★` : 'No reviews';
    }
    if (spec.key === 'warranty') {
      return product.warranty || product.warrantyPeriod || '1 Year';
    }
    if (spec.key === 'certification') {
      const cert = product.certifications?.join(', ') || product.certification;
      return cert || 'DGDA Registered';
    }
    if (spec.isNested && product.specifications) {
      return (
        <div className="space-y-1 text-xs">
          {Object.entries(product.specifications).slice(0, 5).map(([k, v]) => (
            <div key={k}>
              <span className="font-medium">{k}:</span> {v}
            </div>
          ))}
        </div>
      );
    }
    return product[spec.key] || '—';
  };

  return (
    <div ref={containerRef} role="dialog" aria-modal="true" className="fixed inset-0 z-modal bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-lg w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-primary)]">
          <div>
            <h2 className="text-xl font-semibold text-brand-navy">Compare Products</h2>
            <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
              {compareList.length} {compareList.length === 1 ? 'product' : 'products'} selected
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearCompare}
              className="px-4 py-2 text-xs text-danger hover:bg-[var(--color-status-danger-tint)] rounded-lg transition-colors font-medium"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-[var(--color-background-tertiary)] transition-colors"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white z-10 w-40 p-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] border-b-2 border-[var(--color-border-primary)]">
                    Feature
                  </th>
                  {compareList.map((product) => (
                    <th key={product._id || product.id} className="p-3 border-b-2 border-[var(--color-border-primary)] min-w-[220px]">
                      <div className="flex flex-col items-center gap-3">
                        {/* Image */}
                        <div className="w-32 h-32 bg-[var(--color-background-tertiary)] rounded-lg overflow-hidden flex items-center justify-center">
                          {getImageUrl(product) ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={getImageUrl(product)}
                              alt={`${product.name}${product.brand ? ` — ${product.brand}` : ''} — Price ৳${product.price?.toLocaleString() || ''} Bangladesh`}
                              loading="lazy"
                              decoding="async"
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-5xl">📦</span>
                          )}
                        </div>
                        {/* Name */}
                        <div className="text-sm font-semibold text-brand-navy text-center line-clamp-2 min-h-[40px]">
                          {product.name}
                        </div>
                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              addToCart(product, 1);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white rounded-lg text-xs font-semibold transition-colors"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => removeFromCompare(product._id || product.id)}
                            className="px-3 py-1.5 border border-[var(--color-border-primary)] hover:bg-[var(--color-background-secondary)] text-[var(--color-text-primary)] rounded-lg text-xs font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specs.map((spec, idx) => (
                  <tr key={spec.key} className={idx % 2 === 0 ? 'bg-[var(--color-background-secondary)]' : 'bg-white'}>
                    <td className="sticky left-0 bg-inherit z-10 p-3 text-xs font-semibold text-[var(--color-text-primary)] border-b border-[var(--color-border-primary)]">
                      {spec.label}
                    </td>
                    {compareList.map((product) => (
                      <td
                        key={product._id || product.id}
                        className="p-3 text-xs text-[var(--color-text-secondary)] text-center border-b border-[var(--color-border-primary)]"
                      >
                        {renderSpecValue(product, spec)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] flex items-center justify-between">
          <p className="text-xs text-[var(--color-text-secondary)]">
            Tip: Click &ldquo;Add to Cart&rdquo; to purchase any product directly from here.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-brand-navy hover:bg-[var(--color-brand-navy-hover)] text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

