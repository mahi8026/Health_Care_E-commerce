"use client";

import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';
import { API } from '@/constants/api';

const STATUS_OPTIONS = ['All', 'placed', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const STATUS_COLORS = {
  placed:           { bg: '#EFF6FF', color: '#1D4ED8' },
  confirmed:        { bg: '#FAEEDA', color: '#633806' },
  processing:       { bg: '#FAF5FF', color: '#6D28D9' },
  shipped:          { bg: '#E6F1FB', color: '#0C447C' },
  out_for_delivery: { bg: '#FFF7ED', color: '#B45309' },
  delivered:        { bg: '#E1F5EE', color: '#065F46' },
  cancelled:        { bg: '#FCEBEB', color: '#791F1F' },
};

// Order Detail Modal Component
function OrderDetailModal({ order, onClose, onUpdate }) {
  const [status, setStatus] = useState(order.status);
  const [adminNote, setAdminNote] = useState(order.adminNote || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('medcore_token');
      await fetch(`${API}/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status, adminNote }),
      });
      onUpdate();
      onClose();
    } catch (err) {
      alert('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!confirm('Confirm that bank transfer has been received?')) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('medcore_token');
      await fetch(`${API}/orders/${order._id}/verify-payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ paymentStatus: 'paid', status: 'confirmed' }),
      });
      onUpdate();
      onClose();
    } catch (err) {
      alert('Failed to verify payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 1000, display: 'flex', alignItems: 'flex-start',
      justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%',
        maxWidth: 680, margin: '20px auto', border: '0.5px solid #E5E7EB',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid #F3F4F6',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-lora)', fontSize: 16,
              fontWeight: 700, color: '#0B2545' }}>
              Order {order.orderNumber}
            </div>
            <div style={{ fontSize: 11, color: '#9CA3AF', marginTop: 2 }}>
              {new Date(order.createdAt).toLocaleString('en-GB')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 20,
              fontWeight: 600,
              background: STATUS_COLORS[order.status]?.bg || '#F3F4F6',
              color: STATUS_COLORS[order.status]?.color || '#374151' }}>
              {order.status?.replace(/_/g, ' ').toUpperCase()}
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none',
              fontSize: 20, cursor: 'pointer', color: '#9CA3AF' }}>×</button>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Two column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
            marginBottom: 16 }}>
            {/* Customer info */}
            <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px' }}>
              <div style={{ fontSize: 10, color: '#0E8A6E', fontWeight: 700,
                textTransform: 'uppercase', marginBottom: 8 }}>Customer</div>
              <div style={{ fontSize: 12, fontWeight: 600 }}>
                {order.user?.name || order.guestName || 'Guest'}
              </div>
              {order.user?.companyName && (
                <div style={{ fontSize: 11, color: '#6B7280' }}>{order.user.companyName}</div>
              )}
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                {order.user?.phone || order.deliveryAddress?.phone}<br/>
                {order.user?.email}
              </div>
            </div>

            {/* Delivery address */}
            <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px' }}>
              <div style={{ fontSize: 10, color: '#0E8A6E', fontWeight: 700,
                textTransform: 'uppercase', marginBottom: 8 }}>Delivery Address</div>
              <div style={{ fontSize: 11, color: '#374151', lineHeight: 1.6 }}>
                {order.deliveryAddress?.fullName || order.deliveryAddress?.name}<br/>
                {order.deliveryAddress?.street || order.deliveryAddress?.address}<br/>
                {order.deliveryAddress?.thana && `${order.deliveryAddress.thana}, `}
                {order.deliveryAddress?.district}<br/>
                {order.deliveryAddress?.postcode && `${order.deliveryAddress.postcode}`}<br/>
                {order.deliveryAddress?.phone}
              </div>
            </div>
          </div>

          {/* Items table */}
          <div style={{ border: '0.5px solid #E5E7EB', borderRadius: 8,
            overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#F9FAFB' }}>
                  {['Product', 'Qty', 'Unit Price', 'Total'].map(h => (
                    <th key={h} style={{ fontSize: 10, color: '#6B7280', padding: '8px 12px',
                      textAlign: h === 'Product' ? 'left' : 'right',
                      fontWeight: 500, borderBottom: '0.5px solid #E5E7EB' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '0.5px solid #F3F4F6' }}>
                    <td style={{ padding: '8px 12px', fontSize: 12 }}>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: 10, color: '#9CA3AF' }}>SKU: {item.sku}</div>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'right' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12, textAlign: 'right' }}>
                      ৳{item.price?.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 12, fontWeight: 600,
                      textAlign: 'right', color: '#0B2545' }}>
                      ৳{(item.price * item.quantity)?.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order totals */}
          <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px',
            marginBottom: 16 }}>
            {[
              { label: 'Subtotal', val: order.subtotal || order.totalAmount },
              order.discount > 0 && { label: 'Discount', val: -order.discount, color: '#0E8A6E' },
              order.couponDiscount > 0 && { label: `Coupon (${order.promoCode})`, val: -order.couponDiscount, color: '#0E8A6E' },
              { label: 'Delivery', val: order.deliveryFee || 0 },
              { label: 'VAT (5%)', val: order.vatAmount || 0 },
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                fontSize: 12, marginBottom: 4 }}>
                <span style={{ color: '#6B7280' }}>{row.label}</span>
                <span style={{ fontWeight: 500, color: row.color || '#374151' }}>
                  ৳{Math.abs(row.val)?.toLocaleString()}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between',
              fontSize: 15, fontWeight: 700, color: '#0B2545', marginTop: 8,
              paddingTop: 8, borderTop: '1px solid #E5E7EB' }}>
              <span>Total</span>
              <span>৳{order.totalAmount?.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment info */}
          <div style={{ background: '#F9FAFB', borderRadius: 8, padding: '12px',
            marginBottom: 16 }}>
            <div style={{ fontSize: 10, color: '#0E8A6E', fontWeight: 700,
              textTransform: 'uppercase', marginBottom: 8 }}>Payment</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 12, color: '#374151' }}>
                Method: <strong>{order.paymentMethod?.replace(/_/g, ' ')}</strong>
              </span>
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 20,
                background: order.paymentStatus === 'paid' ? '#E1F5EE' : '#FAEEDA',
                color: order.paymentStatus === 'paid' ? '#065F46' : '#633806',
                fontWeight: 600 }}>
                {order.paymentStatus?.toUpperCase()}
              </span>
            </div>
            {order.transactionId && (
              <div style={{ fontSize: 11, color: '#6B7280', marginTop: 4 }}>
                Ref: {order.transactionId}
              </div>
            )}
            {order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending' && (
              <button
                onClick={handleVerifyPayment}
                disabled={saving}
                style={{ marginTop: 8, width: '100%', padding: '6px 12px',
                  background: '#0E8A6E', color: '#fff', border: 'none',
                  borderRadius: 6, fontSize: 12, fontWeight: 600,
                  cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}
              >
                ✓ Verify Payment
              </button>
            )}
          </div>

          {/* Admin actions */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12,
            marginBottom: 16 }}>
            <div>
              <label style={{ fontSize: 11, color: '#6B7280', marginBottom: 4,
                display: 'block' }}>Update status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                style={{ width: '100%', border: '0.5px solid #D1D5DB', borderRadius: 7,
                  padding: '8px 12px', fontSize: 12, fontFamily: 'inherit',
                  outline: 'none', cursor: 'pointer' }}>
                {['placed','confirmed','processing','shipped','out_for_delivery','delivered','cancelled']
                  .map(s => (
                    <option key={s} value={s}>
                      {s.replace(/_/g, ' ').charAt(0).toUpperCase() + s.replace(/_/g, ' ').slice(1)}
                    </option>
                  ))}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 11, color: '#6B7280', marginBottom: 4,
                display: 'block' }}>Admin note</label>
              <input value={adminNote} onChange={e => setAdminNote(e.target.value)}
                placeholder="Internal note..."
                style={{ width: '100%', border: '0.5px solid #D1D5DB', borderRadius: 7,
                  padding: '8px 12px', fontSize: 12, fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '0.5px solid #F3F4F6',
          display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`${API}/invoices/${order._id}`}
              target="_blank" rel="noreferrer"
              style={{ padding: '8px 16px', background: '#F3F4F6', color: '#374151',
                borderRadius: 7, fontSize: 12, fontWeight: 500, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 6 }}>
              📄 Invoice PDF
            </a>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose}
              style={{ padding: '8px 18px', background: 'transparent',
                border: '0.5px solid #D1D5DB', borderRadius: 7, fontSize: 12,
                cursor: 'pointer', color: '#6B7280' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '8px 22px', background: '#0B2545', color: '#fff',
                border: 'none', borderRadius: 7, fontSize: 12, fontWeight: 600,
                cursor: saving ? 'wait' : 'pointer', opacity: saving ? 0.7 : 1 }}>
              {saving ? 'Saving...' : 'Save changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function OrdersManagement() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState({});
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);

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
      {/* Order Detail Modal */}
      {selectedOrder && (
        <OrderDetailModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={() => {
            fetchOrders();
            setSelectedOrder(null);
          }}
        />
      )}

      {/* Message Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="p-3 sm:p-4 border-b-[0.5px] border-[var(--color-border-tertiary)] flex flex-col sm:flex-row gap-2 sm:gap-3">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value === 'All' ? '' : e.target.value); setPage(1); }}
          className="px-3 py-2 sm:py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white min-h-[48px]"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s === 'All' ? '' : s}>{s === 'All' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
          ))}
        </select>
        <div className="sm:ml-auto text-[11px] sm:text-[12px] text-[var(--color-text-secondary)] self-center text-center sm:text-left">
          {total} orders total
        </div>
      </div>

      {/* Loading/Empty States */}
      {loading ? (
        <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">Loading orders…</div>
      ) : orders.length === 0 ? (
        <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">No orders found</div>
      ) : (
        <>
          {/* Desktop Table - Hidden on mobile */}
          <div className="hidden md:block overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
            <table className="w-full" style={{minWidth: '900px'}}>
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
                  <tr key={order._id}
                    onClick={() => setSelectedOrder(order)}
                    className="border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)] cursor-pointer">
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
                            className="text-[10px] px-2 py-1 bg-[#F3F4F6] text-[#374151] rounded hover:bg-[#E5E7EB] disabled:opacity-50 min-w-[44px] min-h-[44px]"
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
          </div>

          {/* Mobile Card View - Hidden on desktop */}
          <div className="md:hidden space-y-3 p-3">
            {orders.map(order => (
              <div key={order._id}
                onClick={() => setSelectedOrder(order)}
                className="bg-[var(--color-background-secondary)] rounded-lg border border-[var(--color-border-tertiary)] p-4 space-y-3 cursor-pointer hover:border-[#0E8A6E]">
                {/* Header */}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[13px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
                      {order.orderNumber}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] mt-0.5">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[15px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
                      ৳{(order.totalAmount || order.total || 0).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">
                      {order.items?.length || 0} items
                    </div>
                  </div>
                </div>

                {/* Customer */}
                <div className="text-[12px] text-[var(--color-text-primary)]">
                  <span className="text-[var(--color-text-secondary)]">Customer:</span> {order.user?.name || order.user?.email || '—'}
                </div>

                {/* Status Selector */}
                <div>
                  <label className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold block mb-1">
                    Status
                  </label>
                  <select
                    value={order.status}
                    onChange={e => handleStatusChange(order._id, e.target.value)}
                    disabled={actionLoading[`status-${order._id}`]}
                    className={`w-full text-[12px] px-3 py-2 rounded-lg font-medium border cursor-pointer min-h-[48px] ${getStatusColor(order.status)}`}
                  >
                    {['placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'].map(s => (
                      <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace('_', ' ')}</option>
                    ))}
                  </select>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border-tertiary)]">
                  <button
                    onClick={() => handleDownloadInvoice(order._id)}
                    disabled={actionLoading[`invoice-${order._id}`]}
                    className="w-full min-h-[48px] px-4 py-2 bg-[#0E8A6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0a6b55] disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    📄 {actionLoading[`invoice-${order._id}`] ? 'Downloading…' : 'Download Invoice'}
                  </button>
                  
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      { type: 'confirmation', icon: '📧', label: 'Confirm' },
                      { type: 'payment', icon: '💳', label: 'Receipt' },
                      { type: 'shipping', icon: '🚚', label: 'Shipping' },
                      { type: 'delivery', icon: '✅', label: 'Delivery' },
                    ].map(({ type, icon, label }) => (
                      <button
                        key={type}
                        onClick={() => handleSendNotification(type, order._id)}
                        disabled={actionLoading[`${type}-${order._id}`]}
                        className="min-h-[48px] px-3 py-2 bg-white border border-[var(--color-border-secondary)] text-[#374151] rounded-lg text-[12px] font-medium hover:bg-[#F3F4F6] disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <span>{icon}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 sm:p-4 flex items-center justify-between gap-2 border-t-[0.5px] border-[var(--color-border-tertiary)]">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-[11px] sm:text-[12px] px-3 sm:px-4 py-2 sm:py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 font-medium min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <span className="hidden sm:inline">← Prev</span>
            <span className="sm:hidden">←</span>
          </button>
          <span className="text-[11px] sm:text-[12px] text-[var(--color-text-secondary)] font-medium">
            <span className="hidden sm:inline">Page {page} of {totalPages}</span>
            <span className="sm:hidden">{page}/{totalPages}</span>
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-[11px] sm:text-[12px] px-3 sm:px-4 py-2 sm:py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 font-medium min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <span className="hidden sm:inline">Next →</span>
            <span className="sm:hidden">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
