"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/hooks/useT';
import Spinner, { ProductCardSkeleton } from '@/components/ui/Spinner';
import WriteReviewModal from '@/components/product/WriteReviewModal';
import { API } from '@/constants/api';
const PAGE_SIZE = 10;

const STATUS_COLORS = {
  placed: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
  pending: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
  confirmed: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
  processing: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
  shipped: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
  out_for_delivery: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
  delivered: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
  cancelled: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]',
};

export default function OrderHistoryPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuth();
  const t = useT();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  // Review modal state
  const [reviewModal, setReviewModal] = useState(null); // { productId, productName }

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !isAuthenticated()) {
      router.push('/login');
    }
  }, [isAuthenticated, router]);

  useEffect(() => {
    if (!isAuthenticated || !isAuthenticated()) return;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('Mediport_token');
        const params = new URLSearchParams({ page, limit: PAGE_SIZE, sort: '-createdAt' });
        const res = await fetch(`${API}/orders?${params}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        setOrders(data.data?.orders || data.orders || []);
        setTotal(data.data?.total || data.total || 0);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [page, isAuthenticated]);

  const handleTrack = (orderNumber) => {
    router.push(`/track?order=${orderNumber}`);
  };

  const handleInvoice = (order) => {
    // Use order._id (MongoDB ObjectId), not orderNumber
    const invoiceId = order._id;
    window.open(`${API}/invoices/${invoiceId}`, '_blank', 'noreferrer');
  };

  const handleRequestReturn = (orderId) => {
    router.push(`/returns/request/${orderId}`);
  };

  const canRequestReturn = (order) => {
    // Can request return if:
    // 1. Order is delivered
    // 2. Within 7 days of delivery
    // 3. Not already refunded or cancelled
    if (!order.deliveredAt && order.status !== 'delivered') return false;
    if (order.status === 'refunded' || order.status === 'cancelled') return false;
    
    const deliveryDate = new Date(order.deliveredAt || order.createdAt);
    const now = new Date();
    const daysSince = Math.floor((now.getTime() - deliveryDate.getTime()) / (1000 * 60 * 60 * 24));
    return daysSince <= 7;
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!isAuthenticated || !isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6">
      <h1 className="text-xl md:text-2xl font-semibold text-text-primary mb-4">
        {t('orders.title')}
      </h1>

      {loading ? (
        <div className="space-y-4 animate-fade-in">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-[var(--color-border-tertiary)] animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-5 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-full w-32 animate-shimmer" />
                <div className="h-5 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-full w-24 animate-shimmer" />
              </div>
              <div className="h-4 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-full w-48 mb-3 animate-shimmer" />
              <div className="h-6 bg-gradient-to-r from-[var(--color-background-muted)] via-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded-lg w-full animate-shimmer" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-8 text-sm text-danger">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-5xl mb-4">ðŸ“¦</div>
          <p className="text-sm font-medium mb-2">{t('orders.noOrders')}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mb-6">
            {t('orders.noOrdersDesc')}
          </p>
          <button
            onClick={() => router.push('/reagent-store')}
            className="px-5 py-2.5 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-brand-navy-hover)]"
          >
            {t('orders.browseCatalog')}
          </button>
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)]">
            <table className="w-full">
              <thead>
                <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-tertiary)]">
                  {[t('orders.orderId'), t('orders.date'), t('orders.items'), t('orders.total'), t('orders.status'), t('orders.actions')].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id} className="border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)]">
                    <td className="px-4 py-3 text-xs font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : 'â€”'}
                    </td>
                    <td className="px-4 py-3 text-xs">
                      {order.items?.length || 0} {(order.items?.length || 0) !== 1 ? t('orders.items') : t('orders.items')}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      <div className="flex flex-col gap-0.5">
                        <span>à§³{(order.totalAmount || order.total || 0).toLocaleString()}</span>
                        {order.isB2BOrder && order.b2bDiscount > 0 && (
                          <span className="text-xs text-[#7C3AED] font-medium flex items-center gap-1">
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z"/>
                            </svg>
                            B2B saved à§³{order.b2bDiscount.toLocaleString()}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-[3px] rounded font-medium ${STATUS_COLORS[order.status] || STATUS_COLORS.placed}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleTrack(order.orderNumber)}
                          className="text-xs text-brand-teal font-medium hover:underline"
                        >
                          {t('orders.track')}
                        </button>
                        <span className="text-[var(--color-border-secondary)]">Â·</span>
                        <button
                          onClick={() => handleInvoice(order)}
                          className="text-xs text-brand-navy font-medium hover:underline"
                        >
                          {t('orders.invoice')}
                        </button>
                        {canRequestReturn(order) && (
                          <>
                            <span className="text-[var(--color-border-secondary)]">Â·</span>
                            <button
                              onClick={() => handleRequestReturn(order._id)}
                              className="text-xs text-danger font-medium hover:underline"
                            >
                              {t('orders.return')}
                            </button>
                          </>
                        )}
                        {order.status === 'delivered' && order.items?.slice(0, 1).map(item => (
                          <span key={item.product?._id || item.product} className="flex items-center gap-1">
                            <span className="text-[var(--color-border-secondary)]">Â·</span>
                            <button
                              onClick={() => setReviewModal({
                                productId: item.product?._id || item.product,
                                productName: item.product?.name || item.name || 'Product'
                              })}
                              className="text-xs text-warning font-medium hover:underline flex items-center gap-0.5"
                            >
                              â˜… {t('orders.writeReview')}
                            </button>
                          </span>
                        ))}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card List */}
          <div className="md:hidden space-y-3">
            {orders.map(order => (
              <div key={order._id} className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold font-[family-name:var(--font-plus-jakarta)] mb-1">
                      {order.orderNumber}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : 'â€”'}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-[3px] rounded font-medium ${STATUS_COLORS[order.status] || STATUS_COLORS.placed}`}>
                    {order.status}
                  </span>
                </div>
                
                <div className="flex items-center justify-between mb-3 pb-3 border-b-[0.5px] border-[var(--color-border-tertiary)]">
                  <div className="text-xs text-[var(--color-text-secondary)]">
                    {order.items?.length || 0} {t('orders.items')}
                  </div>
                  <div className="flex flex-col items-end gap-0.5">
                    <div className="text-sm font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      à§³{(order.totalAmount || order.total || 0).toLocaleString()}
                    </div>
                    {order.isB2BOrder && order.b2bDiscount > 0 && (
                      <div className="text-xs text-[#7C3AED] font-medium flex items-center gap-1">
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z"/>
                        </svg>
                        B2B saved à§³{order.b2bDiscount.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleTrack(order.orderNumber)}
                    className="flex-1 min-h-[44px] py-2 text-xs text-brand-teal font-medium border-[0.5px] border-brand-teal rounded-lg hover:bg-brand-teal-tint transition-colors"
                  >
                    {t('orders.track')}
                  </button>
                  <button
                    onClick={() => handleInvoice(order)}
                    className="flex-1 min-h-[44px] py-2 text-xs text-brand-navy font-medium border-[0.5px] border-brand-navy rounded-lg hover:bg-[var(--color-status-info-tint)] transition-colors"
                  >
                    {t('orders.invoice')}
                  </button>
                  {canRequestReturn(order) && (
                    <button
                      onClick={() => handleRequestReturn(order._id)}
                      className="flex-1 min-h-[44px] py-2 text-xs text-danger font-medium border-[0.5px] border-danger rounded-lg hover:bg-[var(--color-status-danger-tint)] transition-colors"
                    >
                      {t('orders.return')}
                    </button>
                  )}
                  {order.status === 'delivered' && order.items?.[0] && (
                    <button
                      onClick={() => setReviewModal({
                        productId: order.items[0].product?._id || order.items[0].product,
                        productName: order.items[0].product?.name || order.items[0].name || 'Product'
                      })}
                      className="flex-1 min-h-[44px] py-2 text-xs text-warning font-medium border-[0.5px] border-warning rounded-lg hover:bg-[var(--color-status-warning-tint)] transition-colors"
                    >
                      â˜… {t('orders.writeReview')}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="min-h-[44px] text-xs px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-tertiary)] transition-colors"
              >
                {t('orders.previous')}
              </button>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {t('orders.page')} {page} {t('orders.of')} {totalPages} Â· {total} orders
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="min-h-[44px] text-xs px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-tertiary)] transition-colors"
              >
                {t('orders.next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* Write Review Modal */}
      {reviewModal && (
        <WriteReviewModal
          productId={reviewModal.productId}
          onClose={() => setReviewModal(null)}
          onSuccess={() => {
            setReviewModal(null);
          }}
        />
      )}
    </div>
  );
}
