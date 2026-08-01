'use client';

import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa';

/**
 * Breadcrumb Navigation Component — matches reference design exactly
 */
export default function Breadcrumb({ items, variant = 'default', className = '' }) {
  if (!items?.length) return null;

  const isCurrent = (item, idx) => idx === items.length - 1 || item.href === '#';

  const renderItems = () =>
    items.map((item, idx) => {
      const current = isCurrent(item, idx);
      return (
        <div
          key={`${item.label}-${idx}`}
          className="flex items-center"
        >
          {idx > 0 && (
            <FaChevronRight
              size={20}
              className="text-blue-400/60 mx-3 md:mx-4 flex-shrink-0"
              aria-hidden="true"
            />
          )}
          {current ? (
            <span
              className="text-brand-navy font-bold text-xl md:text-2xl truncate"
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              className="text-blue-500 hover:text-blue-600 font-semibold text-xl md:text-2xl transition-colors duration-200 whitespace-nowrap flex-shrink-0"
            >
              {item.label}
            </Link>
          )}
        </div>
      );
    });

  if (variant === 'default') {
    return (
      <div
        className={`w-full bg-gradient-to-r from-[#E8F0FE] via-[#E3EFFD] to-[#DCE9FC] border-b border-blue-100 ${className}`}
        style={{
          background: 'linear-gradient(90deg, #E8F0FE 0%, #E3EFFD 50%, #DCE9FC 100%)'
        }}
      >
        <div className="max-w-7xl mx-auto px-6 md:px-8 py-5 md:py-6">
          <nav 
            aria-label="Breadcrumb" 
            className="flex items-center overflow-x-auto scrollbar-hide"
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
      className={`flex items-center overflow-x-auto scrollbar-hide ${className}`}
    >
      {renderItems()}
    </nav>
  );
}
