'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import AccountPageShell from '@/components/account/AccountPageShell';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';
import EmptyState from '@/components/ui/EmptyState';
import { API } from '@/constants/api';
import { FaFileInvoiceDollar, FaLongArrowAltRight } from 'react-icons/fa';

const STATUS_META = {
  pending:   { label: 'Pending',   cls: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]' },
  sent:      { label: 'Sent',      cls: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]' },
  approved:  { label: 'Approved',  cls: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' },
  converted: { label: 'Converted', cls: 'bg-[#EDE9FE] text-[#5B21B6]' },
  expired:   { label: 'Expired',   cls: 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]' },
  rejected:  { label: 'Rejected',  cls: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]' },
};

const FILTERS = ['all', 'pending', 'sent', 'approved', 'converted', 'expired', 'rejected'];

const fmtMoney = (n) => `৳${(Number(n) || 0).toLocaleString('en-BD')}`;

function QuoteCard({ quote }) {
  const meta = STATUS_META[quote.status] || { label: quote.status, cls: 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]' };
  const itemCount = quote.items?.length || 0;
  const expired = quote.status === 'expired';

  return (
    <Link
      href={`/account/quotes/${quote._id}`}
      className="block bg-white rounded-xl border border-[var(--color-border-primary)] hover:border-brand-teal/40 hover:shadow-sm transition-all"
    >
      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[var(--color-status-info-tint)] flex items-center justify-center flex-shrink-0">
              <FaFileInvoiceDollar className="text-[var(--color-status-info)]" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-semibold text-brand-navy font-[family-name:var(--font-plus-jakarta)] truncate">
                {quote.quoteNumber || quote.quoteId}
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)]">
                {quote.createdAt ? new Date(quote.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
              </div>
            </div>
          </div>
          <span className={`text-xs px-2.5 py-1 rounded-full font-semibold flex-shrink-0 ${meta.cls}`}>
            {meta.label}
          </span>
        </div>

        <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
          <div>
            <div className="text-[var(--color-text-tertiary)] mb-0.5">Items</div>
            <div className="font-semibold text-[var(--color-text-primary)]">{itemCount}</div>
          </div>
          <div>
            <div className="text-[var(--color-text-tertiary)] mb-0.5">Total</div>
            <div className="font-semibold text-brand-navy">{fmtMoney(quote.finalAmount)}</div>
          </div>
          <div>
            <div className="text-[var(--color-text-tertiary)] mb-0.5">Valid until</div>
            <div className={`font-semibold ${expired ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-text-primary)]'}`}>
              {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function QuotationsPage() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const router = useRouter();
  const [quotes, setQuotes] = useState([]);
  const [pagination, setPagination] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [page, setPage] = useState(1);

  useEffect(() => {
    if (!isAuthenticated()) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setLoading(true);
    const token = localStorage.getItem('Mediport_token');
    const params = new URLSearchParams({ page, limit: 10 });
    if (filter !== 'all') params.set('status', filter);

    fetch(`${API}/quotes?${params}`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (cancelled || !data) return;
        setQuotes(Array.isArray(data.data) ? data.data : []);
        setPagination(data.pagination || null);
      })
      .catch(() => { if (!cancelled) setQuotes([]); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [isAuthenticated, filter, page]);

  const changeFilter = useCallback((f) => {
    setFilter(f);
    setPage(1);
  }, []);

  if (authLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <Spinner />
      </div>
    );
  }

  return (
    <AccountPageShell
      title="My Quotations"
      description="Track your quotation requests and approvals"
      backHref="/account"
      backLabel="Back to Account"
    >
      {/* Status filters */}
      <div className="flex gap-2 overflow-x-auto pb-2 mb-4 -mx-1 px-1">
        {FILTERS.map(f => (
          <button
            key={f}
            onClick={() => changeFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap border transition-colors ${
              filter === f
                ? 'bg-brand-navy text-white border-brand-navy'
                : 'bg-white text-[var(--color-text-secondary)] border-[var(--color-border-primary)] hover:border-brand-teal/40'
            }`}
          >
            {f === 'all' ? 'All' : STATUS_META[f]?.label || f}
          </button>
        ))}
      </div>

      {/* New request CTA */}
      <button
        onClick={() => router.push('/quotes/request')}
        className="w-full mb-4 flex items-center justify-center gap-2 px-4 py-3 bg-[var(--color-status-success-tint)] text-brand-navy rounded-xl text-sm font-semibold border border-brand-teal/20 hover:border-brand-teal/50 transition-colors"
      >
        Request a New Quotation
        <FaLongArrowAltRight className="text-brand-teal" />
      </button>

      {loading ? (
        <div className="py-12 flex justify-center">
          <Spinner size="lg" />
        </div>
      ) : quotes.length === 0 ? (
        <EmptyState
          icon="📋"
          title={filter === 'all' ? 'No quotations yet' : `No ${STATUS_META[filter]?.label.toLowerCase() || filter} quotations`}
          description="Request a quotation to get exclusive B2B pricing on bulk orders."
          action={{ label: 'Request a Quotation', onClick: () => router.push('/quotes/request') }}
        />
      ) : (
        <>
          <div className="space-y-3">
            {quotes.map(q => <QuoteCard key={q._id} quote={q} />)}
          </div>

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-between text-xs text-[var(--color-text-secondary)]">
              <span>Page {pagination.page} of {pagination.totalPages}</span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  disabled={!pagination.hasPrev}
                  className="px-3 py-2 border border-[var(--color-border-primary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-tertiary)]"
                >
                  ← Prev
                </button>
                <button
                  onClick={() => setPage(p => p + 1)}
                  disabled={!pagination.hasNext}
                  className="px-3 py-2 border border-[var(--color-border-primary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-tertiary)]"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </AccountPageShell>
  );
}