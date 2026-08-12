'use client';

import React from 'react';
import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa';

/**
 * Breadcrumb Navigation Component — arrow-style stepper design
 */
export default function Breadcrumb({ items, variant = 'default', className = '' }) {
  if (!items?.length) return null;

  const isCurrent = (item, idx) => idx === items.length - 1 || item.href === '#';

  const renderItems = () =>
    items.map((item, idx) => {
      const current = isCurrent(item, idx);
      const isFirst = idx === 0;
      const isLast = idx === items.length - 1;

      return (
        <React.Fragment key={`${item.label}-${idx}`}>
          {current ? (
            // Current page - plain text with lighter style
            <span
              style={{
                color: '#9CA3AF',
                fontWeight: 500,
                fontSize: '14px',
                lineHeight: '1.3',
                letterSpacing: '0.01em',
                padding: '0 8px',
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                maxWidth: '300px',
              }}
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            // Clickable breadcrumb with arrow shape
            <div
              style={{
                position: 'relative',
                display: 'flex',
                alignItems: 'center',
                marginRight: isLast ? '0' : '-8px',
                zIndex: items.length - idx,
              }}
            >
              <Link
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  height: '36px',
                  paddingLeft: isFirst ? '16px' : '28px',
                  paddingRight: isLast ? '16px' : '36px',
                  background: isFirst ? '#4F46E5' : '#E5E7EB',
                  color: isFirst ? '#FFFFFF' : '#4B5563',
                  fontSize: '14px',
                  fontWeight: 500,
                  textDecoration: 'none',
                  position: 'relative',
                  transition: 'all 0.2s ease',
                  whiteSpace: 'nowrap',
                  clipPath: isFirst
                    ? 'polygon(0 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 0 100%)'
                    : isLast
                    ? 'polygon(12px 0, 100% 0, 100% 100%, 12px 100%, 0 50%)'
                    : 'polygon(12px 0, calc(100% - 12px) 0, 100% 50%, calc(100% - 12px) 100%, 12px 100%, 0 50%)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = isFirst ? '#4338CA' : '#D1D5DB';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = isFirst ? '#4F46E5' : '#E5E7EB';
                }}
              >
                {item.label}
              </Link>
            </div>
          )}
          
          {/* Separator chevron for current item */}
          {!current && !isLast && (
            <FaChevronRight 
              size={10} 
              style={{ 
                color: '#D1D5DB', 
                margin: '0 4px',
                position: 'relative',
                zIndex: 9999,
              }} 
            />
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
    gap: '0',
  };

  if (variant === 'default') {
    return (
      <div
        className={className}
        style={{
          width: '100%',
          background: '#F9FAFB',
          padding: '12px 0',
          borderBottom: '1px solid #E5E7EB',
        }}
      >
        <div style={{ maxWidth: '80rem', margin: '0 auto', padding: '0 16px' }}>
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
    <nav aria-label="Breadcrumb" className={className}>
      <ol style={olStyle}>
        {renderItems()}
      </ol>
    </nav>
  );
}
