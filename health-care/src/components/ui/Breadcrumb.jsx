'use client';

import React from 'react';
import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa';

/**
 * Breadcrumb Navigation Component — compact inline design with gradient background
 */
export default function Breadcrumb({ items, variant = 'default', className = '' }) {
  if (!items?.length) return null;

  const isCurrent = (item, idx) => idx === items.length - 1 || item.href === '#';

  const renderItems = () =>
    items.map((item, idx) => {
      const current = isCurrent(item, idx);
      return (
        <React.Fragment key={`${item.label}-${idx}`}>
          {idx > 0 && (
            <FaChevronRight
              size={10}
              className="text-blue-400/60 mx-1.5 flex-shrink-0"
              aria-hidden="true"
            />
          )}
          {current ? (
            <span
              className="text-brand-navy font-semibold text-xs md:text-sm whitespace-nowrap flex-shrink-0"
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="text-blue-500 hover:text-blue-600 font-medium text-xs md:text-sm transition-colors duration-200 whitespace-nowrap flex-shrink-0"
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      );
    });

  if (variant === 'default') {
    return (
      <div
        className={`w-full border-b border-blue-100 ${className}`}
        style={{
          background: 'linear-gradient(90deg, #E8F0FE 0%, #E3EFFD 50%, #DCE9FC 100%)'
        }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-2 md:py-2.5">
          <nav 
            aria-label="Breadcrumb" 
            className="flex flex-row items-center gap-0 overflow-x-auto scrollbar-hide"
          >
            {renderItems()}
          </nav>
        </div>
      </div>
    );
  }

  // Inline variant
  return (
    <nav 
      aria-label="Breadcrumb" 
      className={`flex flex-row items-center gap-0 overflow-x-auto scrollbar-hide ${className}`}
    >
      {renderItems()}
    </nav>
  );
}
