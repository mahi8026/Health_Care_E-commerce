"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/hooks/useT';
import Spinner from '@/components/ui/Spinner';
import WriteReviewModal from '@/components/product/WriteReviewModal';
import { showToast } from '@/components/ui/Toast';
import { API } from '@/constants/api';

const PAGE_SIZE = 10;

const STATUS_COLORS = {
  placed:           'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
  pending:          'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
  confirmed:        'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
  processing:       'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
  shipped:          'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
  out_for_delivery: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
  delivered:        'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
  cancelled:        'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]',
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function getToken() {
  return typeof window !== 'undefined' ? localStorage.getItem('Mediport_token') : null;
}

function canCancel(order) {
  return ['placed', 'pending', 'confirmed'].includes(order.status);
}

function canRequestReturn(order) {
  if (order.status !== 'delivered') return false;
  if (order.status === 'refunded' || order.status === 'cancelled') return false;
  const deliveryDate = new Date(order.deliveredAt || order.updatedAt || order.createdAt);
  const daysSince = Math.floor((Date.now() - deliveryDate.getTime()) / 86_400_000);
  return daysSince <= 7;
}

// ── Separator ─────────────────────────────────────────────────────────────────
function Dot() {
  return <span className="text-[var(--color-border-secondary)] select-none">·</span>;
}

// ── Action Button ─────────────────────────────────────────────────────────────
function ActionBtn({ onClick, disabled, variant = 'teal', children }) {
  const variants = {
    teal:    'text-brand-teal hover:text-[var(--color-brand-teal-hover)]',
    navy:    'text-brand-navy hover:text-[var(--color-brand-navy-hover)]',
    danger:  'text-[var(--color-status-danger)] hover:text-red-700',
    warning: 'text-[var(--color-status-warning)] hover:text-amber-600',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`text-xs font-semibold hover:underline underline-offset-2 transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

// ── Mobile Action Button ──────────────────────────────────────────────────────
function MobileBtn({ onClick, disabled, variant = 'teal', children }) {
  const variants = {
    teal:    'text-brand-teal border-brand-teal hover:bg-[var(--color-brand-teal-tint)]',
    navy:    'text-brand-navy border-brand-navy hover:bg-[var(--color-status-info-tint)]',
    danger:  'text-[var(--color-status-danger)] border-[var(--color-status-danger)] hover:bg-[var(--color-status-danger-tint)]',
    warning: 'text-[var(--color-status-warning)] border-[var(--color-status-warning)] hover:bg-[var(--color-status-warning-tint)]',
  };
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex-1 min-h-[44px] py-2 text-xs font-semibold border-[0.5px] rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]}`}
    >
      {children}
    </button>
  );
}

// ── Cancel Confirm Dialog (inline, no window.confirm) ─────────────────────────
function CancelConfirmRow({ order, onConfirm, onDismiss, loading }) {
  return (
    <tr className="bg-[var(--color-status-danger-tint)]">
      <td colSpan={6} className="px-4 py-3">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <p className="text-xs font-medium text-[var(--color-status-danger)]">
            Cancel order <span className="font-bold">{order.orderNumber}</span>? This cannot be undone.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onDismiss}
              className="px-3 py-1.5 text-xs border border-[var(--color-border-primary)] rounded-lg bg-white hover:bg-[var(--color-background-secondary)] transition-colors"
            >
              Keep Order
            </button>
            <button
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="px-3 py-1.5 text-xs bg-[var(--color-status-danger)] text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
            >
              {loading ? 'Cancelling…' : 'Yes, Cancel'}
            </button>
          </div>
        </div>
      </td>
    </tr>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────
export default function OrderHistoryPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const t = useT();

  const [orders, setOrders]           = useState([]);
  const [total, setTotal]             = useState(0);
  const [page, setPage]               = useState(1);
  const [loading, setLoading]         = useState(true);
  const [error, setError]             = useState(null);
  const [reviewModal, setReviewModal] = useState(null); // { productId, productName }
  const [confirmCancelId, setConfirmCancelId] = useState(null);
  const [cancellingId, setCancellingId]       = useState(null);
  const [downloadingId, setDownloadingId]     = useState(null);
  const [refreshKey, setRefreshKey]           = useState(0);

  // ── Auth guard ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!isAuthenticated?.()) router.push('/login');
  }, [isAuthenticated, router]);

  // ── Fetch orders ──────────────────────────────────────────────────────────
  // Exposed so Retry button can call it too
  const fetchOrders = useCallback(() => setRefreshKey(k => k + 1), []);

  useEffect(() => {
    if (!isAuthenticated?.()) return;
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = getToken();
        const params = new URLSearchParams({ page, limit: PAGE_SIZE, sort: '-createdAt' });
        const res = await fetch(`${API}/orders?${params}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!res.ok) throw new Error('Failed to load orders');
        const data = await res.json();
        if (!cancelled) {
          setOrders(data.data?.orders || data.orders || []);
          setTotal(data.data?.total || data.total || 0);
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => { cancelled = true; };
   
  }, [page, isAuthenticated, refreshKey]);

  // ── Track ─────────────────────────────────────────────────────────────────
  const handleTrack = (orderNumber) => {
    router.push(`/track?order=${orderNumber}`);
  };

  // ── Invoice — authenticated download, not window.open ─────────────────────
  const handleInvoice = async (order) => {
    const id = order._id;
    if (!id) { showToast.error('Order ID missing'); return; }
    setDownloadingId(id);
    try {
      const token = getToken();
      if (!token) throw new Error('Not authenticated. Please log in.');
      const res = await fetch(`${API}/invoices/${id}`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
        credentials: 'include',
      });
      if (!res.ok) {
        let msg = 'Failed to download invoice';
        try { const err = await res.json(); msg = err.message || msg; } catch { /* ignore */ }
        throw new Error(msg);
      }
      const blob = await res.blob();
      if (!blob || blob.size === 0) throw new Error('Received empty PDF');
      const url = URL.createObjectURL(blob);
      const a   = document.createElement('a');
      a.href     = url;
      a.download = `Invoice-${order.orderNumber || id}.pdf`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showToast.success('Invoice downloaded');
    } catch (err) {
      showToast.error(err.message || 'Could not download invoice');
    } finally {
      setDownloadingId(null);
    }
  };

  // ── Return ────────────────────────────────────────────────────────────────
  const handleRequestReturn = (orderId) => {
    router.push(`/returns/request/${orderId}`);
  };

  // ── Cancel (two-step: confirm row, then API call) ─────────────────────────
  const handleCancelConfirm = async (order) => {
    setCancellingId(order._id);
    try {
      const token = getToken();
      const res = await fetch(`${API}/orders/${order._id}/cancel`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to cancel order');
      setOrders(prev =>
        prev.map(o => o._id === order._id ? { ...o, status: 'cancelled' } : o)
      );
      setConfirmCancelId(null);
      showToast.success(`Order ${order.orderNumber} cancelled`);
    } catch (err) {
      showToast.error(err.message);
    } finally {
      setCancellingId(null);
    }
  };

  const totalPages = Math.ceil(total / PAGE_SIZE);

  if (!isAuthenticated?.()) {
    return <div className="flex items-center justify-center min-h-[400px]"><Spinner /></div>;
  }

  return (
    <div className="max-w-5xl mx-auto px-4 md:px-6 py-4 md:py-6">
      <h1 className="text-xl md:text-2xl font-semibold text-text-primary mb-4">
        {t('orders.title')}
      </h1>

      {/* ── Loading ─────────────────────────────────────────────────────── */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-xl p-4 border border-[var(--color-border-tertiary)] animate-pulse">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-5 bg-[var(--color-background-muted)] rounded-full w-32" />
                <div className="h-5 bg-[var(--color-background-muted)] rounded-full w-24" />
              </div>
              <div className="h-4 bg-[var(--color-background-muted)] rounded-full w-48 mb-3" />
              <div className="h-6 bg-[var(--color-background-muted)] rounded-lg w-full" />
            </div>
          ))}
        </div>

      /* ── Error ───────────────────────────────────────────────────────── */
      ) : error ? (
        <div className="text-center py-8">
          <p className="text-sm text-[var(--color-status-danger)] mb-4">{error}</p>
          <button
            onClick={fetchOrders}
            className="px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-brand-navy-hover)]"
          >
            Retry
          </button>
        </div>

      /* ── Empty ───────────────────────────────────────────────────────── */
      ) : orders.length === 0 ? (
        <div className="text-center py-10">
          <div className="text-5xl mb-4">📦</div>
          <p className="text-sm font-medium mb-2">{t('orders.noOrders')}</p>
          <p className="text-xs text-[var(--color-text-secondary)] mb-6">{t('orders.noOrdersDesc')}</p>
          <button
            onClick={() => router.push('/products')}
            className="px-5 py-2.5 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-brand-navy-hover)]"
          >
            {t('orders.browseCatalog')}
          </button>
        </div>

      /* ── Orders list ─────────────────────────────────────────────────── */
      ) : (
        <>
          {/* ── Desktop Table ────────────────────────────────────────────── */}
          <div className="hidden md:block overflow-x-auto bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--color-border-tertiary)] bg-[var(--color-background-tertiary)]">
                  {[
                    t('orders.orderId'),
                    t('orders.date'),
                    t('orders.items'),
                    t('orders.total'),
                    t('orders.status'),
                    t('orders.actions'),
                  ].map(h => (
                    <th
                      key={h}
                      className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <React.Fragment key={order._id}>
                    <tr
                      className="border-b border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)] transition-colors"
                    >
                      {/* Order ID */}
                      <td className="px-4 py-3 text-xs font-semibold">{order.orderNumber}</td>

                      {/* Date */}
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                        {order.createdAt
                          ? new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })
                          : '—'}
                      </td>

                      {/* Items */}
                      <td className="px-4 py-3 text-xs">
                        {order.items?.length ?? 0} {t('orders.items')}
                      </td>

                      {/* Total */}
                      <td className="px-4 py-3 text-xs font-semibold">
                        <div className="flex flex-col gap-0.5">
                          <span>৳{(order.totalAmount || order.total || 0).toLocaleString()}</span>
                          {order.isB2BOrder && order.b2bDiscount > 0 && (
                        <span className="text-xs text-purple-600 font-medium">
                              B2B saved ৳{order.b2bDiscount.toLocaleString()}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[order.status] || STATUS_COLORS.placed}`}>
                          {order.status}
                        </span>
                      </td>

                      {/* Actions */}
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {/* Track */}
                          <ActionBtn variant="teal" onClick={() => handleTrack(order.orderNumber)}>
                            {t('orders.track')}
                          </ActionBtn>

                          {/* Invoice */}
                          <Dot />
                          <ActionBtn
                            variant="navy"
                            disabled={downloadingId === order._id}
                            onClick={() => handleInvoice(order)}
                          >
                            {downloadingId === order._id ? 'Downloading…' : t('orders.invoice')}
                          </ActionBtn>

                          {/* Return */}
                          {canRequestReturn(order) && (
                            <>
                              <Dot />
                              <ActionBtn variant="danger" onClick={() => handleRequestReturn(order._id)}>
                                {t('orders.return')}
                              </ActionBtn>
                            </>
                          )}

                          {/* Cancel */}
                          {canCancel(order) && (
                            <>
                              <Dot />
                              <ActionBtn
                                variant="danger"
                                disabled={cancellingId === order._id}
                                onClick={() =>
                                  setConfirmCancelId(
                                    confirmCancelId === order._id ? null : order._id
                                  )
                                }
                              >
                                {t('orders.cancel')}
                              </ActionBtn>
                            </>
                          )}

                          {/* Write Review — for all delivered products */}
                          {order.status === 'delivered' &&
                            order.items?.map((item, idx) => (
                              <span key={item.product?._id || item.product || idx} className="flex items-center gap-2">
                                <Dot />
                                <ActionBtn
                                  variant="warning"
                                  onClick={() =>
                                    setReviewModal({
                                      productId:   item.product?._id || item.product,
                                      productName: item.product?.name || item.name || 'Product',
                                    })
                                  }
                                >
                                  ★ {item.product?.name || item.name
                                    ? `Review ${(item.product?.name || item.name).split(' ').slice(0, 2).join(' ')}`
                                    : t('orders.writeReview')}
                                </ActionBtn>
                              </span>
                            ))}
                        </div>
                      </td>
                    </tr>

                    {/* Inline cancel confirmation row */}
                    {confirmCancelId === order._id && (
                      <CancelConfirmRow
                        order={order}
                        loading={cancellingId === order._id}
                        onConfirm={() => handleCancelConfirm(order)}
                        onDismiss={() => setConfirmCancelId(null)}
                      />
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* ── Mobile Cards ──────────────────────────────────────────────── */}
          <div className="md:hidden space-y-3">
            {orders.map(order => (
              <div
                key={order._id}
                className="bg-white rounded-xl border border-[var(--color-border-tertiary)] p-4 shadow-sm"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="text-sm font-semibold mb-0.5">{order.orderNumber}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' })
                        : '—'}
                    </div>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold capitalize ${STATUS_COLORS[order.status] || STATUS_COLORS.placed}`}>
                    {order.status}
                  </span>
                </div>

                {/* Summary */}
                <div className="flex items-center justify-between mb-3 pb-3 border-b border-[var(--color-border-tertiary)]">
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    {order.items?.length ?? 0} {t('orders.items')}
                  </span>
                  <div className="flex flex-col items-end">
                    <span className="text-sm font-semibold">
                      ৳{(order.totalAmount || order.total || 0).toLocaleString()}
                    </span>
                    {order.isB2BOrder && order.b2bDiscount > 0 && (
                      <span className="text-xs text-purple-600 font-medium">
                        B2B saved ৳{order.b2bDiscount.toLocaleString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex gap-2 flex-wrap">
                  <MobileBtn variant="teal" onClick={() => handleTrack(order.orderNumber)}>
                    {t('orders.track')}
                  </MobileBtn>

                  <MobileBtn
                    variant="navy"
                    disabled={downloadingId === order._id}
                    onClick={() => handleInvoice(order)}
                  >
                    {downloadingId === order._id ? '…' : t('orders.invoice')}
                  </MobileBtn>

                  {canRequestReturn(order) && (
                    <MobileBtn variant="danger" onClick={() => handleRequestReturn(order._id)}>
                      {t('orders.return')}
                    </MobileBtn>
                  )}

                  {canCancel(order) && (
                    <MobileBtn
                      variant="danger"
                      disabled={cancellingId === order._id}
                      onClick={() =>
                        setConfirmCancelId(confirmCancelId === order._id ? null : order._id)
                      }
                    >
                      {t('orders.cancel')}
                    </MobileBtn>
                  )}

                  {order.status === 'delivered' &&
                    order.items?.map((item, idx) => (
                      <MobileBtn
                        key={item.product?._id || item.product || idx}
                        variant="warning"
                        onClick={() =>
                          setReviewModal({
                            productId:   item.product?._id || item.product,
                            productName: item.product?.name || item.name || 'Product',
                          })
                        }
                      >
                        ★ {item.product?.name || item.name
                          ? `Review ${(item.product?.name || item.name).split(' ').slice(0, 2).join(' ')}`
                          : t('orders.writeReview')}
                      </MobileBtn>
                    ))}
                </div>

                {/* Inline cancel confirm (mobile) */}
                {confirmCancelId === order._id && (
                  <div className="mt-3 p-3 bg-[var(--color-status-danger-tint)] rounded-lg">
                    <p className="text-xs font-medium text-[var(--color-status-danger)] mb-2">
                      Cancel <span className="font-bold">{order.orderNumber}</span>? This cannot be undone.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setConfirmCancelId(null)}
                        className="flex-1 py-2 text-xs border border-[var(--color-border-primary)] rounded-lg bg-white hover:bg-[var(--color-background-secondary)]"
                      >
                        Keep Order
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCancelConfirm(order)}
                        disabled={cancellingId === order._id}
                        className="flex-1 py-2 text-xs bg-[var(--color-status-danger)] text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                      >
                        {cancellingId === order._id ? 'Cancelling…' : 'Yes, Cancel'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* ── Pagination ────────────────────────────────────────────────── */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="min-h-[44px] text-xs px-4 py-2 border border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-tertiary)] transition-colors"
              >
                {t('orders.previous')}
              </button>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {t('orders.page')} {page} {t('orders.of')} {totalPages} · {total} orders
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="min-h-[44px] text-xs px-4 py-2 border border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-tertiary)] transition-colors"
              >
                {t('orders.next')}
              </button>
            </div>
          )}
        </>
      )}

      {/* ── Write Review Modal ───────────────────────────────────────────── */}
      {reviewModal && (
        <WriteReviewModal
          productId={reviewModal.productId}
          onClose={() => setReviewModal(null)}
          onSuccess={() => setReviewModal(null)}
        />
      )}
    </div>
  );
}
