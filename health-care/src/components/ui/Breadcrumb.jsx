'use client';

import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa';

/**
 * Breadcrumb Navigation Component
 *
 * Displays hierarchical navigation on a single line across the entire site.
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

  const renderItems = () =>
    items.map((item, idx) => {
      const current = isCurrent(item, idx);
      return (
        <li
          key={`${item.label}-${idx}`}
          style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: current ? 1 : 0, minWidth: 0 }}
        >
          {idx > 0 && (
            <FaChevronRight
              size={8}
              style={{ color: '#d1d5db', flexShrink: 0 }}
              aria-hidden
            />
          )}
          {current ? (
            <span
              style={{
                color: '#374151',
                fontWeight: 500,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              style={{
                color: '#6b7280',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                textDecoration: 'none',
              }}
              className="hover:text-[#0E8A6E] transition-colors"
            >
              {item.label}
            </Link>
          )}
        </li>
      );
    });

  if (variant === 'default') {
    return (
      <div className={`bg-white border-b border-gray-100 ${className}`.trim()}>
        <div className="max-w-7xl mx-auto px-4 md:px-6" style={{ paddingTop: '8px', paddingBottom: '8px' }}>
          <nav aria-label="Breadcrumb">
            <ol
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                alignItems: 'center',
                gap: '2px',
                margin: 0,
                padding: 0,
                listStyle: 'none',
                fontSize: '12px',
                lineHeight: 1,
                overflow: 'hidden',
              }}
            >
              {renderItems()}
            </ol>
          </nav>
        </div>
      </div>
    );
  }

  // Embedded variant
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'center',
          gap: '2px',
          margin: 0,
          padding: 0,
          listStyle: 'none',
          fontSize: '12px',
          lineHeight: 1,
          overflow: 'hidden',
        }}
      >
        {renderItems()}
      </ol>
    </nav>
  );
}
