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
                color: '#A5B4FC',
                fontSize: '16px',
                fontWeight: 300,
                margin: '0 10px',
                opacity: 0.6,
              }}
              aria-hidden="true"
            >
              /
            </span>
          )}
          <li
            style={{
              display: 'inline-flex',
              alignItems: 'center',
            }}
          >
            {current ? (
              <span
                style={{
                  color: '#8B5CF6',
                  fontWeight: 500,
                  fontSize: '15px',
                  lineHeight: '1.4',
                  letterSpacing: '0.01em',
                }}
                aria-current="page"
              >
                {item.label}
              </span>
            ) : (
              <Link
                href={item.href}
                style={{
                  color: '#A5B4FC',
                  fontWeight: 400,
                  fontSize: '15px',
                  lineHeight: '1.4',
                  textDecoration: 'none',
                  letterSpacing: '0.01em',
                  transition: 'color 0.2s ease',
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#8B5CF6'}
                onMouseLeave={(e) => e.currentTarget.style.color = '#A5B4FC'}
              >
                {item.label}
              </Link>
            )}
          </li>
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
                flexWrap: 'wrap',
                alignItems: 'center',
                listStyle: 'none',
                margin: 0,
                padding: 0,
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
          flexWrap: 'wrap',
          alignItems: 'center',
          listStyle: 'none',
          margin: 0,
          padding: 0,
        }}
      >
        {renderItems()}
      </ol>
    </nav>
  );
}
