'use client';

import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa';

/**
 * Breadcrumb Navigation Component
 *
 * Single-line horizontal breadcrumb with no wrapping.
 */
export default function Breadcrumb({ items, variant = 'default', className = '' }) {
  if (!items?.length) return null;

  const isCurrent = (item, idx) => idx === items.length - 1 || item.href === '#';

  const olStyle = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    columnGap: '4px',
    rowGap: 0,
    margin: 0,
    padding: 0,
    listStyle: 'none',
    listStyleType: 'none',
    fontSize: '12px',
    lineHeight: '1',
    whiteSpace: 'nowrap',
    overflow: 'hidden',
  };

  const liBaseStyle = {
    display: 'flex',
    flexDirection: 'row',
    alignItems: 'center',
    gap: '4px',
    margin: 0,
    padding: 0,
    flexShrink: 0,
    whiteSpace: 'nowrap',
  };

  const liLastStyle = {
    ...liBaseStyle,
    flexShrink: 1,
    overflow: 'hidden',
  };

  const renderItems = () =>
    items.map((item, idx) => {
      const current = isCurrent(item, idx);
      return (
        <li key={`${item.label}-${idx}`} style={current ? liLastStyle : liBaseStyle}>
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
                display: 'block',
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
                textDecoration: 'none',
                flexShrink: 0,
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
      <div
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f3f4f6',
        }}
        className={className || undefined}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '8px 16px',
          }}
        >
          <nav aria-label="Breadcrumb">
            <ol style={olStyle}>
              {renderItems()}
            </ol>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={className || undefined}>
      <ol style={olStyle}>
        {renderItems()}
      </ol>
    </nav>
  );
}
