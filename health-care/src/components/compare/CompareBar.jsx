'use client';

import { useState } from 'react';
import { useCompare } from '@/context/CompareContext';
import CompareModal from './CompareModal';

/**
 * Floating compare bar — shows at bottom when products are added to compare.
 * Sticky bar with product count + "Compare Now" button.
 * Mobile: Shows list of products with individual remove buttons
 * Desktop: Compact view with count and buttons
 */
export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const [showModal, setShowModal] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  if (compareList.length === 0) return null;

  const getImageUrl = (product) => {
    const img = product.images?.[0];
    return typeof img === 'string' ? img : img?.url;
  };

  return (
    <>
      {/* Mobile View - Expandable with product list */}
      <div className="md:hidden fixed bottom-24 left-4 right-4 z-sticky">
        {isExpanded && (
          <div className="bg-white rounded-t-2xl shadow-lg mb-[-2px] max-h-[300px] overflow-y-auto">
            <div className="p-3 space-y-2">
              {compareList.map((product) => (
                <div key={product._id || product.id} className="flex items-center gap-2 p-2 bg-[var(--color-background-secondary)] rounded-lg">
                  {/* Product Image */}
                  <div className="w-12 h-12 bg-white rounded-md overflow-hidden flex-shrink-0">
                    {getImageUrl(product) ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={getImageUrl(product)}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-2xl">📦</div>
                    )}
                  </div>
                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <div className="text-xs font-medium text-[var(--color-text-primary)] line-clamp-2">
                      {product.name}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-secondary)] mt-0.5">
                      ৳{product.price?.toLocaleString() || 'N/A'}
                    </div>
                  </div>
                  {/* Remove Button */}
                  <button
                    onClick={() => removeFromCompare(product._id || product.id)}
                    className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-danger/10 text-danger flex-shrink-0"
                    aria-label={`Remove ${product.name} from compare`}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Collapsed Bar */}
        <div className="bg-brand-navy text-white rounded-2xl shadow-lg p-3 flex items-center justify-between gap-2 animate-slideUp">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex-1 min-w-0 text-left"
          >
            <div className="text-sm font-semibold mb-0.5">
              {compareList.length} {compareList.length === 1 ? 'Product' : 'Products'} Selected
            </div>
            <div className="text-[10px] text-white/70">
              {isExpanded ? 'Tap to collapse' : 'Tap to view & remove'}
            </div>
          </button>

          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setShowModal(true)}
              className="px-3 py-2 bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white rounded-lg text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Compare
            </button>
            <button
              onClick={clearCompare}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="Clear all"
              title="Clear all"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Desktop View - Compact */}
      <div
        className="hidden md:flex fixed bottom-6 right-6 z-sticky bg-brand-navy text-white rounded-2xl shadow-lg p-4 items-center justify-between gap-3 animate-slideUp"
        style={{ maxWidth: '500px' }}
      >
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold mb-1">
            {compareList.length} {compareList.length === 1 ? 'Product' : 'Products'} Selected
          </div>
          <div className="text-xs text-white/70">
            {compareList.length < 4 ? `Add up to ${4 - compareList.length} more to compare` : 'Maximum reached'}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2.5 bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white rounded-lg text-sm font-semibold transition-colors whitespace-nowrap"
          >
            Compare Now
          </button>
          <button
            onClick={clearCompare}
            className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Clear all"
            title="Clear all"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      {showModal && <CompareModal onClose={() => setShowModal(false)} />}

      <style jsx>{`
        @keyframes slideUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
      `}</style>
    </>
  );
}

