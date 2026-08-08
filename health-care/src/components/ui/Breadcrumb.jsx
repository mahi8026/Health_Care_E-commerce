'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Breadcrumb Navigation Component — minimal clean design with "/" separators
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
            <span
              style={{
                color: '#9CA3AF',
                fontSize: '16px',
                fontWeight: 300,
                margin: '0 8px',
                lineHeight: '1',
                display: 'inline-block',
                flexShrink: 0,
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
                fontSize: '15px',
                lineHeight: '1',
                letterSpacing: '0.01em',
                display: 'inline-block',
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
                color: '#6B7280',
                fontWeight: 500,
                fontSize: '15px',
                lineHeight: '1',
                textDecoration: 'none',
                letterSpacing: '0.01em',
                transition: 'color 0.2s ease',
                display: 'inline-block',
                whiteSpace: 'nowrap',
              }}
              onMouseEnter={(e) => e.currentTarget.style.color = '#7C3AED'}
              onMouseLeave={(e) => e.currentTarget.style.color = '#6B7280'}
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
        className={className}
        style={{
          width: '100%',
          background: '#FFFFFF',
          padding: '12px 0',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 16px' }}>
          <nav aria-label="Breadcrumb">
            <ol
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'nowrap',
                alignItems: 'center',
                listStyle: 'none',
                margin: 0,
                padding: 0,
                whiteSpace: 'nowrap',
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

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol
        style={{
          display: 'flex',
          flexDirection: 'row',
          flexWrap: 'nowrap',
          alignItems: 'center',
          listStyle: 'none',
          margin: 0,
          padding: 0,
          whiteSpace: 'nowrap',
        }}
      >
        {renderItems()}
      </ol>
    </nav>
  );
}
