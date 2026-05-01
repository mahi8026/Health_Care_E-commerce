"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';
import { API } from '@/constants/api';
const PAGE_SIZE = 10;

const STATUS_COLORS = {
  placed: 'bg-[#FEF3C7] text-[#92400E]',
  pending: 'bg-[#FEF3C7] text-[#92400E]',
  confirmed: 'bg-[#DBEAFE] text-[#1E40AF]',
  processing: 'bg-[#E0E7FF] text-[#3730A3]',
  shipped: 'bg-[#E0E7FF] text-[#3730A3]',
  out_for_delivery: 'bg-[#E0E7FF] text-[#3730A3]',
  delivered: 'bg-[#D1FAE5] text-[#065F46]',
  cancelled: 'bg-[#FEE2E2] text-[#991B1B]',
};

export default function OrderHistoryPage({ onNavigate, onLoginClick }) {
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!isAuthenticated || !isAuthenticated()) {
      if (onLoginClick) onLoginClick();
    }
  }, [isAuthenticated, onLoginClick]);

  useEffect(() => {
    if (!isAuthenticated || !isAuthenticated()) return;

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('medcore_token');
        const params = new URLSearchParams({ page, limit: PAGE_SIZE, sort: '-createdAt' });
        const res = await fetch(`${API}/api/orders?${params}`, {
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
    if (onNavigate) onNavigate('track', { orderNumber });
  };

  const handleInvoice = (order) => {
    // FIX 8: use order._id (MongoDB ObjectId), not orderNumber
    const invoiceId = order._id;
    window.open(`${API}/api/invoices/${invoiceId}`, '_blank', 'noreferrer');
  };

  const handleRequestReturn = (orderId) => {
    if (onNavigate) {
      onNavigate('return-request', { orderId });
    } else {
      window.location.href = `/returns/request/${orderId}`;
    }
  };

  const canRequestReturn = (order) => {
    // Can request return if:
    // 1. Order is delivered
    // 2. Within 7 days of delivery
    // 3. Not already refunded or cancelled
    if (!order.deliveredAt && order.status !== 'delivered') return false;
    if (order.status === 'refunded' || order.status === 'cancelled') return false;
    
    const deliveryDate = new Date(order.deliveredAt || order.createdAt);
    const daysSince = Math.floor((Date.now() - deliveryDate) / (1000 * 60 * 60 * 24));
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
    <div className="max-w-5xl mx-auto px-6 py-8">
      <h1 className="text-[20px] font-semibold mb-6 font-[family-name:var(--font-lora)]">
        Order History
      </h1>

      {loading ? (
        <div className="flex justify-center py-16">
          <Spinner />
        </div>
      ) : error ? (
        <div className="text-center py-12 text-[13px] text-[#E24B4A]">{error}</div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16">
          <div className="text-[48px] mb-4">📦</div>
          <p className="text-[14px] font-medium mb-2">No orders yet</p>
          <p className="text-[12px] text-[var(--color-text-secondary)] mb-6">
            Your order history will appear here once you place an order.
          </p>
          <button
            onClick={() => onNavigate && onNavigate('reagent')}
            className="px-6 py-3 bg-[#0B2545] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0d2d52]"
          >
            Browse catalog →
          </button>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-tertiary)]">
                  {['Order ID', 'Date', 'Items', 'Total', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {orders.map(order => (
                  <tr key={order._id} className="border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)]">
                    <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      {order.orderNumber}
                    </td>
                    <td className="px-4 py-3 text-[12px] text-[var(--color-text-secondary)]">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </td>
                    <td className="px-4 py-3 text-[12px]">
                      {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                    </td>
                    <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      ৳{(order.totalAmount || order.total || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-[3px] rounded font-medium ${STATUS_COLORS[order.status] || STATUS_COLORS.placed}`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2 flex-wrap">
                        <button
                          onClick={() => handleTrack(order.orderNumber)}
                          className="text-[11px] text-[#0E8A6E] font-medium hover:underline"
                        >
                          Track
                        </button>
                        <span className="text-[var(--color-border-secondary)]">·</span>
                        <button
                          onClick={() => handleInvoice(order)}
                          className="text-[11px] text-[#0B2545] font-medium hover:underline"
                        >
                          Invoice
                        </button>
                        {canRequestReturn(order) && (
                          <>
                            <span className="text-[var(--color-border-secondary)]">·</span>
                            <button
                              onClick={() => handleRequestReturn(order._id)}
                              className="text-[11px] text-[#E24B4A] font-medium hover:underline"
                            >
                              Return
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-4 flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="text-[12px] px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-tertiary)]"
              >
                ← Previous
              </button>
              <span className="text-[12px] text-[var(--color-text-secondary)]">
                Page {page} of {totalPages} · {total} orders
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="text-[12px] px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-tertiary)]"
              >
                Next →
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
