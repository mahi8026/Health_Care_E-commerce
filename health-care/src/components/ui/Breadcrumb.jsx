'use client';

import Link from 'next/link';
import { FaChevronRight } from 'react-icons/fa';

/**
 * @param {Object} props
 * @param {{ label: string, href?: string }[]} props.items — omit href on the current (last) page
 * @param {'default' | 'embedded'} [props.variant] — embedded: no bar border (inside page hero)
 * @param {string} [props.className]
 */
export default function Breadcrumb({ items, variant = 'default', className = '' }) {
  if (!items?.length) return null;

  const isCurrent = (item, idx) =>
    idx === items.length - 1 || item.href === '#';

  const barClass =
    variant === 'embedded'
      ? 'py-0'
      : 'px-3 sm:px-5 md:px-7 py-3 sm:py-3.5 bg-[var(--color-background-primary)] border-b border-[var(--color-border-tertiary)]';

  return (
    <nav aria-label="Breadcrumb" className={`${barClass} ${className}`.trim()}>
      <ol className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-[12px] leading-none m-0 p-0 list-none">
        {items.map((item, idx) => {
          const current = isCurrent(item, idx);
          return (
            <li key={`${item.label}-${idx}`} className="flex items-center gap-1.5">
              {idx > 0 && (
                <FaChevronRight
                  size={9}
                  className="text-[#9CA3AF] flex-shrink-0"
                  aria-hidden
                />
              )}
              {current ? (
                <span
                  className="text-[#0B2545] font-medium truncate max-w-[200px] sm:max-w-none"
                  aria-current="page"
                >
                  {item.label}
                </span>
              ) : (
                <Link
                  href={item.href}
                  className="text-[#6B7280] hover:text-[#0E8A6E] transition-colors truncate max-w-[200px] sm:max-w-none"
                >
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
