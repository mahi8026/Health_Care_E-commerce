'use client';

import { useState } from 'react';
import { useCompare } from '@/context/CompareContext';
import CompareModal from './CompareModal';

/**
 * Floating compare bar — shows at bottom when products are added to compare.
 * Sticky bar with product count + "Compare Now" button.
 */
export default function CompareBar() {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const [showModal, setShowModal] = useState(false);

  if (compareList.length === 0) return null;

  return (
    <>
      <div
        className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 z-sticky bg-brand-navy text-white rounded-2xl shadow-lg p-4 flex items-center justify-between gap-3 animate-slideUp"
        style={{ maxWidth: 'min(500px, calc(100vw - 32px))' }}
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

