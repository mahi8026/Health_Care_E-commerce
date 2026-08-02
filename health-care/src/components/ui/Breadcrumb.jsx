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
        <li
          key={`${item.label}-${idx}`}
          style={{
            display: 'flex',
            alignItems: 'center',
            flexShrink: current ? 1 : 0,
            minWidth: 0,
          }}
        >
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
                lineHeight: '1.4',
                display: 'block',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                minWidth: 0,
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
                lineHeight: '1.4',
                whiteSpace: 'nowrap',
                textDecoration: 'none',
                flexShrink: 0,
              }}
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
        className={className}
        style={{
          width: '100%',
          background: 'linear-gradient(90deg, #E8F0FE 0%, #E3EFFD 50%, #DCE9FC 100%)',
          borderBottom: '1px solid #DBEAFE',
          overflow: 'hidden',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '8px 16px' }}>
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
                overflow: 'hidden',
                width: '100%',
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
          overflow: 'hidden',
          width: '100%',
        }}
      >
        {renderItems()}
      </ol>
    </nav>
  );
}
