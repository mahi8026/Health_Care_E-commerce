'use client';

import React from 'react';
import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa';

/**
 * Breadcrumb Navigation Component — compact single-line design
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
              size={9}
              style={{ color: 'rgba(96,165,250,0.7)', flexShrink: 0, margin: '0 6px' }}
              aria-hidden="true"
            />
          )}
          {current ? (
            <span
              style={{
                color: '#0b2545',
                fontWeight: 600,
                fontSize: '13px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '300px',
                flexShrink: 1,
                display: 'inline-block',
              }}
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            <Link
              href={item.href}
              style={{
                color: '#3B82F6',
                fontWeight: 500,
                fontSize: '13px',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                flexShrink: 0,
              }}
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
        className={`w-full ${className}`}
        style={{
          background: 'linear-gradient(90deg, #E8F0FE 0%, #E3EFFD 50%, #DCE9FC 100%)',
          borderBottom: '1px solid #DBEAFE',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '8px 16px' }}>
          <nav
            aria-label="Breadcrumb"
            style={{
              display: 'flex',
              flexDirection: 'row',
              flexWrap: 'nowrap',
              alignItems: 'center',
              overflow: 'hidden',
            }}
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
      style={{
        display: 'flex',
        flexDirection: 'row',
        flexWrap: 'nowrap',
        alignItems: 'center',
        overflow: 'hidden',
      }}
      className={className}
    >
      {renderItems()}
    </nav>
  );
}
