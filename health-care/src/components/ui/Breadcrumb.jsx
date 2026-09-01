'use client';

import React from 'react';
import Link from 'next/link';

/**
 * Breadcrumb Navigation Component — Compact inline style
 * Shows "Home / Category / Page Title" format
 */
export default function Breadcrumb({ items, variant = 'default', className = '' }) {
  if (!items?.length) return null;

  const renderItems = () =>
    items.map((item, idx) => {
      const isLast = idx === items.length - 1;
      const isCurrent = isLast || item.href === '#' || !item.href;

      return (
        <React.Fragment key={`${item.label}-${idx}`}>
          {isCurrent ? (
            // Current page - plain text
            <span
              className="text-gray-500 text-xs"
              aria-current="page"
            >
              {item.label}
            </span>
          ) : (
            // Clickable breadcrumb link
            <Link
              href={item.href}
              className="text-gray-600 hover:text-brand-teal text-xs transition-colors"
            >
              {item.label}
            </Link>
          )}
          
          {/* Separator */}
          {!isLast && (
            <span className="text-gray-400 text-xs mx-2">/</span>
          )}
        </React.Fragment>
      );
    });

  if (variant === 'default') {
    return (
      <div
        className={`w-full bg-gray-50 border-b border-gray-200 ${className}`}
        style={{ padding: '6px 0' }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6">
          <nav aria-label="Breadcrumb">
            <ol className="flex items-center flex-wrap gap-0 list-none m-0 p-0">
              {renderItems()}
            </ol>
          </nav>
        </div>
      </div>
    );
  }

  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="flex items-center flex-wrap gap-0 list-none m-0 p-0">
        {renderItems()}
      </ol>
    </nav>
  );
}
