'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { FaArrowLeft, FaChevronRight } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';

/**
 * Shared layout for authenticated account sub-pages.
 */
export default function AccountPageShell({
  title,
  description,
  backHref = '/account',
  backLabel = 'Back to Account',
  children,
}) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated()) {
      const path = typeof window !== 'undefined' ? window.location.pathname : '/account';
      router.replace(`/login?redirect=${encodeURIComponent(path)}`);
    }
  }, [loading, isAuthenticated, router]);

  if (loading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="min-h-screen bg-page">
      <div className="bg-white border-b border-[var(--color-border-tertiary)]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4">
          <Link
            href={backHref}
            className="inline-flex items-center gap-2 text-xs text-[var(--color-text-secondary)] hover:text-brand-teal transition-colors mb-3"
          >
            <FaArrowLeft size={11} />
            {backLabel}
          </Link>
          <h1 className="text-xl sm:text-2xl font-semibold text-brand-navy font-[family-name:var(--font-lora)]">
            {title}
          </h1>
          {description && (
            <p className="text-xs sm:text-sm text-[var(--color-text-secondary)] mt-1">
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 pb-24 sm:pb-8">
        {children}
      </div>
    </div>
  );
}

export function AccountBreadcrumb({ items }) {
  return (
    <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)] mb-4 flex-wrap">
      {items.map((item, i) => (
        <span key={item.href || item.label} className="flex items-center gap-1.5">
          {i > 0 && <FaChevronRight size={8} className="opacity-50" />}
          {item.href ? (
            <Link href={item.href} className="hover:text-brand-teal transition-colors">
              {item.label}
            </Link>
          ) : (
            <span className="text-brand-navy font-medium">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  );
}
