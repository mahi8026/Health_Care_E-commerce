'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Breadcrumb Navigation Component — Compact inline style
 * Shows "Home / Category / Page Title" format
 */
export default function Breadcrumb({ items, variant = 'default', className = '' }) {
  if (!items?.length) return null;

  if (variant === 'default') {
    return (
      <div
        className={`w-full bg-gray-50 border-b border-gray-200 ${className}`}
        style={{ padding: '8px 0' }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <nav aria-label="Breadcrumb">
            <div className="text-xs">
              {items.map((item, idx) => {
                const isLast = idx === items.length - 1;
                const isCurrent = isLast || item.href === '#' || !item.href;

                return (
                  <React.Fragment key={`${item.label}-${idx}`}>
                    {isCurrent ? (
                      <span className="text-gray-500" aria-current="page">
                        {item.label}
                      </span>
                    ) : (
                      <Link href={item.href} className="text-gray-600 hover:text-brand-teal transition-colors">
                        {item.label}
                      </Link>
                    )}
                    {!isLast && <span className="text-gray-400 mx-1.5">/</span>}
                  </React.Fragment>
                );
              })}
            </div>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <div className="text-xs">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const isCurrent = isLast || item.href === '#' || !item.href;

          return (
            <React.Fragment key={`${item.label}-${idx}`}>
              {isCurrent ? (
                <span className="text-gray-500" aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link href={item.href} className="text-gray-600 hover:text-brand-teal transition-colors">
                  {item.label}
                </Link>
              )}
              {!isLast && <span className="text-gray-400 mx-1.5">/</span>}
            </React.Fragment>
          );
        })}
      </div>
    </nav>
  );
}
