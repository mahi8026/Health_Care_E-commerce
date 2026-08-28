'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { API } from '@/constants/api';

const STATUS_COLORS = {
  pending:   'bg-[var(--color-status-warning-tint)] text-warning-ink border-[var(--color-status-warning-tint)]',
  approved:  'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)] border-[var(--color-status-success-tint)]',
  rejected:  'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] border-[var(--color-status-danger-tint)]',
  refunded:  'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)] border-[var(--color-border-primary)]',
};

const STATUS_ICONS = {
  pending:   '⏳',
  approved:  '✅',
  rejected:  '❌',
  refunded:  '💰',
  cancelled: '🚫',
};

export default function MyReturnsClient() {
  const router = useRouter();
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  const fetchReturns = async () => {
    try {
      const token = localStorage.getItem('Mediport_token');
      if (!token) {
        router.push('/login?redirect=/returns/my-returns');
        return;
      }
      const res = await fetch(`${API}/returns/my-returns`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      if (data.success) setReturns(data.data);
    } catch (err) {
      process.env.NODE_ENV !== 'production' && console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    (async () => {
      await fetchReturns();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredReturns =
    filter === 'all' ? returns : returns.filter((r) => r.status === filter);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy mx-auto mb-4" />
          <p className="text-[var(--color-text-secondary)]">Loading your returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-page py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">My Return Requests</h1>
          <p className="text-[var(--color-text-secondary)]">Track and manage your product return requests</p>
        </div>

        {/* Filter Tabs */}
        <div className="bg-white rounded-lg border border-[var(--color-border-primary)] p-2 mb-6 flex gap-2 overflow-x-auto">
          {['all', 'pending', 'approved', 'rejected', 'refunded'].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                filter === status
                  ? 'bg-brand-teal text-white'
                  : 'text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)]'
              }`}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)}
              {status !== 'all' && (
                <span className="ml-2 text-xs">
                  ({returns.filter((r) => r.status === status).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Returns List */}
        {filteredReturns.length === 0 ? (
          <div className="bg-white rounded-lg border border-[var(--color-border-primary)] p-12 text-center">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-brand-navy mb-2">
              {filter === 'all' ? 'No return requests yet' : `No ${filter} returns`}
            </h3>
            <p className="text-[var(--color-text-secondary)] mb-6">
              {filter === 'all'
                ? 'When you request a return, it will appear here'
                : `You don't have any ${filter} return requests`}
            </p>
            <Link
              href="/orders"
              className="inline-block px-6 py-3 bg-brand-teal text-white rounded-lg font-medium hover:bg-[var(--color-brand-teal-hover)] transition-colors"
            >
              View Orders
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredReturns.map((returnRequest) => (
              <div
                key={returnRequest._id}
                className="bg-white rounded-lg border border-[var(--color-border-primary)] p-6 hover:shadow-md transition-shadow"
              >
                {/* Header */}
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h3 className="font-semibold text-lg text-brand-navy">
                        Order #{returnRequest.order?.orderNumber}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium border ${
                          STATUS_COLORS[returnRequest.status]
                        }`}
                      >
                        {STATUS_ICONS[returnRequest.status]}{' '}
                        {returnRequest.status.charAt(0).toUpperCase() +
                          returnRequest.status.slice(1)}
                      </span>
                    </div>
                    <p className="text-sm text-[var(--color-text-secondary)]">
                      Requested on{' '}
                      {new Date(returnRequest.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-[var(--color-text-secondary)]">Refund Amount</p>
                    <p className="text-xl font-semibold text-brand-teal">
                      ৳{returnRequest.refundAmount?.toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* Products */}
                <div className="border-t border-b py-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {returnRequest.products?.slice(0, 2).map((item, idx) => {
                      const imgUrl = item.product?.images?.[0]?.url;
                      return (
                        <div key={idx} className="flex gap-3 items-center">
                          <div className="relative w-16 h-16 rounded-lg border overflow-hidden flex-shrink-0 bg-[var(--color-background-secondary)]">
                            {imgUrl ? (
                              <Image
                                src={imgUrl}
                                alt={item.product?.name || 'Return item'}
                                fill
                                sizes="64px"
                                className="object-cover"
                              />
                            ) : (
                              <div className="flex items-center justify-center w-full h-full text-2xl text-[var(--color-text-tertiary)]">
                                📦
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-sm text-brand-navy truncate">
                              {item.product?.name}
                            </h4>
                            <p className="text-xs text-[var(--color-text-secondary)]">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {returnRequest.products?.length > 2 && (
                    <p className="text-sm text-[var(--color-text-secondary)] mt-2">
                      +{returnRequest.products.length - 2} more item(s)
                    </p>
                  )}
                </div>

                {/* Reason */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">Reason:</p>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    {returnRequest.reason
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </p>
                </div>

                {/* Description */}
                <div className="mb-4">
                  <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">Description:</p>
                  <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                    {returnRequest.description}
                  </p>
                </div>

                {/* Admin Notes */}
                {returnRequest.adminNotes && (
                  <div className="bg-[var(--color-background-secondary)] rounded-lg p-3 mb-4 border border-[var(--color-border-primary)]">
                    <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">Admin Response:</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">{returnRequest.adminNotes}</p>
                  </div>
                )}

                {/* Status Timeline */}
                {returnRequest.status !== 'pending' && (
                  <div className="bg-blue-50 rounded-lg p-3 mb-4 border border-blue-200">
                    <div className="flex items-center gap-2 text-sm">
                      {returnRequest.approvedAt && (
                        <span className="text-[var(--color-text-primary)]">
                          ✓ Reviewed on{' '}
                          {new Date(returnRequest.approvedAt).toLocaleDateString()}
                        </span>
                      )}
                      {returnRequest.refundedAt && (
                        <span className="text-[var(--color-text-primary)]">
                          • Refunded on{' '}
                          {new Date(returnRequest.refundedAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-sm text-[var(--color-text-secondary)]">
                    Return ID: {returnRequest._id.slice(-8).toUpperCase()}
                  </div>
                  <Link
                    href={`/returns/${returnRequest._id}`}
                    className="text-brand-teal hover:text-[var(--color-brand-teal-hover)] font-medium text-sm flex items-center gap-1"
                  >
                    View Details
                    <svg
                      width="16"
                      height="16"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <path d="M5 12h14M12 5l7 7-7 7" />
                    </svg>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Help Section */}
        <div className="mt-8 bg-white rounded-lg border border-[var(--color-border-primary)] p-6">
          <h3 className="font-semibold text-brand-navy mb-3">Need Help?</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div>
              <p className="font-medium text-[var(--color-text-primary)] mb-1">📧 Email Support</p>
              <a href="mailto:mahimrahman07@gmail.com" className="text-brand-teal hover:underline">
                mahimrahman07@gmail.com
              </a>
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)] mb-1">📞 Phone Support</p>
              <a href="tel:+8801234567890" className="text-brand-teal hover:underline">
                +880 1234-567890
              </a>
            </div>
            <div>
              <p className="font-medium text-[var(--color-text-primary)] mb-1">⏰ Business Hours</p>
              <p className="text-[var(--color-text-secondary)]">Sun–Thu: 9 AM – 6 PM</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
