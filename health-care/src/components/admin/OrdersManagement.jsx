"use client";

import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';
import { API } from '@/constants/api';

const STATUS_OPTIONS = ['All', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('medcore_token');
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set('status', statusFilter);
      const res = await fetch(`${API}/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setOrders(data.data?.orders || data.orders || []);
      setTotal(data.data?.total || data.total || 0);
    } catch (err) {
      showMessage('Failed to load orders', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [`status-${orderId}`]: true }));
    try {
      const token = localStorage.getItem('medcore_token');
      await fetch(`${API}/orders/${orderId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      showMessage('Order status updated', 'success');
      fetchOrders();
    } catch {
      showMessage('Failed to update status', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`status-${orderId}`]: false }));
    }
  };

  const handleDownloadInvoice = async (orderId) => {
    setActionLoading(prev => ({ ...prev, [`invoice-${orderId}`]: true }));
    try {
      const blob = await api.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      showMessage('Invoice downloaded successfully', 'success');
    } catch (error) {
      showMessage(error.message || 'Failed to download invoice', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`invoice-${orderId}`]: false }));
    }
  };

  const handleSendNotification = async (type, orderId) => {
    setActionLoading(prev => ({ ...prev, [`${type}-${orderId}`]: true }));
    try {
      switch (type) {
        case 'confirmation': await api.sendOrderConfirmation(orderId); break;
        case 'payment': await api.sendPaymentReceipt(orderId); break;
        case 'shipping': await api.sendShippingNotification(orderId); break;
        case 'delivery': await api.sendDeliveryConfirmation(orderId); break;
      }
      showMessage(`${type.charAt(0).toUpperCase() + type.slice(1)} notification sent`, 'success');
    } catch (error) {
      showMessage(error.message || 'Failed to send notification', 'error');
    } finally {
      setActionLoading(prev => ({ ...prev, [`${type}-${orderId}`]: false }));
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: 'bg-[#FEF3C7] text-[#92400E]',
      pending: 'bg-[#FEF3C7] text-[#92400E]',
      confirmed: 'bg-[#DBEAFE] text-[#1E40AF]',
      processing: 'bg-[#E0E7FF] text-[#3730A3]',
      shipped: 'bg-[#E0E7FF] text-[#3730A3]',
      delivered: 'bg-[#D1FAE5] text-[#065F46]',
      cancelled: 'bg-[#FEE2E2] text-[#991B1B]'
    };
    return colors[status] || colors.placed;
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)]">
      {/* Message Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="p-4 border-b-[0.5px] border-[var(--color-border-tertiary)] flex gap-3">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value === 'All' ? '' : e.target.value); setPage(1); }}
          className="px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s === 'All' ? '' : s}>{s === 'All' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <div className="ml-auto text-[12px] text-[var(--color-text-secondary)] self-center">
          {total} orders total
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">Loading orders…</div>
        ) : orders.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">No orders found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)]">
                {['Order ID', 'Customer', 'Items', 'Amount', 'Status', 'Date', 'Invoice', 'Notifications'].map(h => (
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
                  <td className="px-4 py-3 text-[12px]">{order.user?.name || order.user?.email || '—'}</td>
                  <td className="px-4 py-3 text-[12px]">{order.items?.length || 0} items</td>
                  <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                    ৳{(order.totalAmount || order.total || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <select
                      value={order.status}
                      onChange={e => handleStatusChange(order._id, e.target.value)}
                      disabled={actionLoading[`status-${order._id}`]}
                      className={`text-[10px] px-2 py-[3px] rounded font-medium border-0 cursor-pointer ${getStatusColor(order.status)}`}
                    >
                      {['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map(s => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[var(--color-text-secondary)]">
                    {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD') : '—'}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => handleDownloadInvoice(order._id)}
                      disabled={actionLoading[`invoice-${order._id}`]}
                      className="text-[11px] text-[#0E8A6E] font-medium hover:underline disabled:opacity-50"
                    >
                      {actionLoading[`invoice-${order._id}`] ? 'Downloading…' : '📄 Download'}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {[
                        { type: 'confirmation', icon: '📧', title: 'Send order confirmation' },
                        { type: 'payment', icon: '💳', title: 'Send payment receipt' },
                        { type: 'shipping', icon: '🚚', title: 'Send shipping notification' },
                        { type: 'delivery', icon: '✅', title: 'Send delivery confirmation' },
                      ].map(({ type, icon, title }) => (
                        <button
                          key={type}
                          onClick={() => handleSendNotification(type, order._id)}
                          disabled={actionLoading[`${type}-${order._id}`]}
                          title={title}
                          className="text-[10px] px-2 py-1 bg-[#F3F4F6] text-[#374151] rounded hover:bg-[#E5E7EB] disabled:opacity-50"
                        >
                          {icon}
                        </button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 flex items-center justify-between border-t-[0.5px] border-[var(--color-border-tertiary)]">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-[12px] px-3 py-1 border-[0.5px] border-[var(--color-border-secondary)] rounded disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-[12px] text-[var(--color-text-secondary)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-[12px] px-3 py-1 border-[0.5px] border-[var(--color-border-secondary)] rounded disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
