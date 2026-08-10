'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Breadcrumb Navigation Component — mobile-friendly with truncation
 */
export default function Breadcrumb({ items, variant = 'default', className = '' }) {
  if (!items?.length) return null;

  const isCurrent = (item, idx) => idx === items.length - 1 || item.href === '#';

  const renderItems = () =>
    items.map((item, idx) => {
      const current = isCurrent(item, idx);
      const isLast = idx === items.length - 1;

      return (
        <React.Fragment key={`${item.label}-${idx}`}>
          {idx > 0 && (
            <span
              style={{
                color: '#9CA3AF',
                fontSize: '13px',
                fontWeight: 300,
                margin: '0 4px',
                lineHeight: '1',
                flexShrink: 0,         // separator never shrinks
              }}
              aria-hidden="true"
            >
              /
            </span>
          )}
          {current ? (
            <span
              style={{
                color: '#7C3AED',
                fontWeight: 600,
                fontSize: '13px',
                lineHeight: '1.3',
                letterSpacing: '0.01em',
                // Last crumb truncates with ellipsis on mobile
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
                minWidth: 0,           // needed for flex child to shrink
                flexShrink: isLast ? 1 : 0,
              }}
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              style={{
                color: '#6B7280',
                fontWeight: 500,
                fontSize: '13px',
                lineHeight: '1.3',
                textDecoration: 'none',
                letterSpacing: '0.01em',
                transition: 'color 0.2s ease',
                whiteSpace: 'nowrap',
                flexShrink: 0,         // middle crumbs don't shrink
              }}
              onMouseEnter={(e) => (e.currentTarget.style.color = '#7C3AED')}
              onMouseLeave={(e) => (e.currentTarget.style.color = '#6B7280')}
            >
              {item.label}
            </Link>
          )}
        </React.Fragment>
      );
    });

  const olStyle = {
    display: 'flex',
    flexDirection: 'row',
    flexWrap: 'nowrap',
    alignItems: 'center',
    listStyle: 'none',
    margin: 0,
    padding: 0,
    minWidth: 0,        // allow flex container to shrink
    overflow: 'hidden', // clip anything that still overflows
  };

  if (variant === 'default') {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          background: '#FFFFFF',
          padding: '10px 0',
          minWidth: 0,
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 16px', minWidth: 0 }}>
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
    <nav aria-label="Breadcrumb" className={className} style={{ minWidth: 0 }}>
      <ol style={olStyle}>
        {renderItems()}
      </ol>
    </nav>
  );
}
