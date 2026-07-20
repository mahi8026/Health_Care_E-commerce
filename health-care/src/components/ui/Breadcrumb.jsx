'use client';

import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa';

/**
 * Breadcrumb Navigation Component
 * 
 * Displays hierarchical navigation with consistent alignment across the entire site.
 * Uses max-w-7xl container to match main content width.
 * 
 * @param {Object} props
 * @param {{ label: string, href?: string }[]} props.items — omit href on the current (last) page
 * @param {'default' | 'embedded'} [props.variant] — embedded: no background/border (inside page hero)
 * @param {string} [props.className] — additional CSS classes
 */
export default function Breadcrumb({ items, variant = 'default', className = '' }) {
  if (!items?.length) return null;

  const isCurrent = (item, idx) =>
    idx === items.length - 1 || item.href === '#';

  // For default variant, apply container structure
  if (variant === 'default') {
    return (
      <div className={`bg-white border-b border-gray-100 ${className}`.trim()}>
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-[12px] leading-none m-0 p-0 list-none">
              {items.map((item, idx) => {
                const current = isCurrent(item, idx);
                return (
                  <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
                    {idx > 0 && (
                      <FaChevronRight
                        size={9}
                        className="text-gray-300 flex-shrink-0"
                        aria-hidden
                      />
                    )}
                    {current ? (
                      <span
                        className="text-gray-700 font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-none"
                        aria-current="page"
                      >
                        {item.label}
                      </span>
                    ) : (
                      <Link
                        href={item.href}
                        className="text-gray-500 hover:text-[#0E8A6E] transition-colors truncate max-w-[200px] sm:max-w-[300px] md:max-w-none"
                      >
                        {item.label}
                      </Link>
                    )}
                  </li>
                );
              })}
            </ol>
          </nav>
        </div>
      </div>
    );
  }

  // Embedded variant (minimal styling)
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-[12px] leading-none m-0 p-0 list-none">
        {items.map((item, idx) => {
          const current = isCurrent(item, idx);
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
              {idx > 0 && (
                <FaChevronRight
                  size={9}
                  className="text-gray-300 flex-shrink-0"
                  aria-hidden
                />
              )}
              {current ? (
                <span
                  className="text-gray-700 font-medium truncate max-w-[200px] sm:max-w-[300px] md:max-w-none"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-gray-500 hover:text-[#0E8A6E] transition-colors truncate max-w-[200px] sm:max-w-[300px] md:max-w-none"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
