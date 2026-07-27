'use client';

import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa';

/**
 * Breadcrumb Navigation Component — single line, no wrapping.
 */
export default function Breadcrumb({ items, variant = 'default', className = '' }) {
  if (!items?.length) return null;

  const isCurrent = (item, idx) => idx === items.length - 1 || item.href === '#';

  const wrapStyle = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    gap: '4px',
    fontSize: '12px',
    lineHeight: '1',
    overflow: 'hidden',
  };

  const renderItems = () =>
    items.map((item, idx) => {
      const current = isCurrent(item, idx);
      return (
        <div
          key={`${item.label}-${idx}`}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            gap: '4px',
            flexShrink: current ? 1 : 0,
            minWidth: 0,
            whiteSpace: 'nowrap',
          }}
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
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
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
        </div>
      );
    });

  if (variant === 'default') {
    return (
      <div
        style={{
          backgroundColor: '#ffffff',
          borderBottom: '1px solid #f3f4f6',
          width: '100%',
        }}
        className={className || undefined}
      >
        <div
          style={{
            maxWidth: '80rem',
            margin: '0 auto',
            padding: '6px 16px',
          }}
        >
          <nav aria-label="Breadcrumb" style={wrapStyle}>
            {renderItems()}
          </nav>
        </div>
      </div>
    );
  }

  return (
    <nav aria-label="Breadcrumb" style={wrapStyle} className={className || undefined}>
      {renderItems()}
    </nav>
  );
}
