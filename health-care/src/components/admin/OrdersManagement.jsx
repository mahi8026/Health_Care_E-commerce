"use client";

import { confirmAction } from '@/components/ui/ConfirmDialog';
import { showToast } from '@/components/ui/Toast';
import { useState, useEffect, useCallback, useRef } from 'react';
import api from '@/utils/api';
import { API } from '@/constants/api';

const STATUS_OPTIONS = ['All', 'placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

// Mirrors the backend transition table (orderController.validTransitions) so
// admins can only pick legal next statuses — prevents 400 "Cannot transition"
// errors from the select.
const STATUS_TRANSITIONS = {
  // legacy alias kept in sync with backend constants/orderStatus.js
  pending:          ['placed', 'cancelled'],
  placed:           ['confirmed', 'cancelled'],
  confirmed:        ['processing', 'shipped', 'cancelled'],
  processing:       ['shipped', 'cancelled'],
  shipped:          ['out_for_delivery', 'cancelled'],
  out_for_delivery: ['delivered', 'cancelled'],
  delivered:        [],
  cancelled:        [],
};

const nextStatusOptions = (current) => STATUS_TRANSITIONS[current] || [];

// Every status the backend knows about, shown in all dropdowns at once.
// Illegal targets stay visible but disabled so admins can see the full
// lifecycle without triggering 400 "Cannot transition" errors.
const ALL_STATUSES = ['pending', 'placed', 'confirmed', 'processing', 'shipped', 'out_for_delivery', 'delivered', 'cancelled'];

const isAllowedTransition = (current, next) =>
  next === current || nextStatusOptions(current).includes(next);

const statusLabel = (s) => s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ');

// Mirrors getStatusColor() below so badges render identically in the list
// rows and inside the detail modal.
const STATUS_COLORS = {
  pending:          { bg: 'var(--color-status-warning-tint)', color: 'var(--color-status-warning)' },
  placed:           { bg: 'var(--color-status-warning-tint)', color: 'var(--color-status-warning)' },
  confirmed:        { bg: 'var(--color-status-info-tint)', color: 'var(--color-status-info)' },
  processing:       { bg: 'var(--color-status-info-tint)', color: 'var(--color-status-info)' },
  shipped:          { bg: 'var(--color-status-info-tint)', color: 'var(--color-status-info)' },
  out_for_delivery: { bg: '#FED7AA', color: '#9A3412' },
  delivered:        { bg: 'var(--color-status-success-tint)', color: 'var(--color-status-success)' },
  cancelled:        { bg: 'var(--color-status-danger-tint)', color: 'var(--color-status-danger)' },
};

// Order Detail Modal Component
function OrderDetailModal({ order, onClose, onUpdate }) {
  const [status, setStatus] = useState(order.status);
  const [adminNote, setAdminNote] = useState(order.adminNote || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/orders/${order._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast.error(data.message || 'Failed to update order');
        return;
      }
      if ((adminNote || '') !== (order.adminNote || '')) {
        const noteRes = await fetch(`${API}/orders/${order._id}/notes`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ note: adminNote }),
        });
        const noteData = await noteRes.json().catch(() => ({}));
        if (!noteRes.ok) {
          showToast.error(noteData.message || 'Status saved, but failed to save note');
        }
      }
      showToast.success('Order updated');
      onUpdate();
      onClose();
    } catch (err) {
      showToast.error('Failed to update order');
    } finally {
      setSaving(false);
    }
  };

  const handleVerifyPayment = async () => {
    if (!await confirmAction('Confirm that bank transfer has been received?')) return;
    setSaving(true);
    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/orders/${order._id}/verify-payment`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        showToast.error(data.message || 'Failed to verify payment');
        return;
      }
      showToast.success('Payment verified');
      onUpdate();
      onClose();
    } catch (err) {
      showToast.error('Failed to verify payment');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
      zIndex: 'var(--z-modal)', display: 'flex', alignItems: 'flex-start',
      justifyContent: 'center', padding: 20, overflowY: 'auto' }}>
      <div style={{ background: '#fff', borderRadius: 12, width: '100%',
        maxWidth: 680, margin: '20px auto', border: '0.5px solid var(--color-border-primary)',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)' }}>
        
        {/* Header */}
        <div style={{ padding: '16px 20px', borderBottom: '0.5px solid var(--color-background-tertiary)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontFamily: 'var(--font-lora)', fontSize: 'var(--text-base)',
              fontWeight: 600, color: 'var(--color-brand-navy)' }}>
              Order {order.orderNumber}
            </div>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)', marginTop: 2 }}>
              {new Date(order.createdAt).toLocaleString('en-GB')}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 'var(--text-xs)', padding: '4px 10px', borderRadius: 20,
              fontWeight: 600,
              background: STATUS_COLORS[order.status]?.bg || 'var(--color-background-tertiary)',
              color: STATUS_COLORS[order.status]?.color || 'var(--color-text-primary)' }}>
              {order.status?.replace(/_/g, ' ').toUpperCase()}
            </span>
            <button onClick={onClose} style={{ background: 'none', border: 'none',
              fontSize: 'var(--text-xl)', cursor: 'pointer', color: 'var(--color-text-tertiary)' }}>×</button>
          </div>
        </div>

        <div style={{ padding: '16px 20px' }}>
          {/* Two column layout */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
            marginBottom: 16 }}>
            {/* Customer info */}
            <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '12px' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-brand-teal)', fontWeight: 600,
                textTransform: 'uppercase', marginBottom: 8 }}>Customer</div>
              <div style={{ fontSize: 'var(--text-xs)', fontWeight: 600 }}>
                {order.user?.name || order.guestName || 'Guest'}
              </div>
              {order.user?.companyName && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{order.user.companyName}</div>
              )}
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                {order.user?.phone || order.deliveryAddress?.phone}<br/>
                {order.user?.email}
              </div>
            </div>

            {/* Delivery address */}
            <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '12px' }}>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-brand-teal)', fontWeight: 600,
                textTransform: 'uppercase', marginBottom: 8 }}>Delivery Address</div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)', lineHeight: 1.6 }}>
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
          <div style={{ border: '0.5px solid var(--color-border-primary)', borderRadius: 8,
            overflow: 'hidden', marginBottom: 16 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--color-background-secondary)' }}>
                  {['Product', 'Qty', 'Unit Price', 'Total'].map(h => (
                    <th key={h} style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', padding: '8px 12px',
                      textAlign: h === 'Product' ? 'left' : 'right',
                      fontWeight: 500, borderBottom: '0.5px solid var(--color-border-primary)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {order.items?.map((item, idx) => (
                  <tr key={idx} style={{ borderBottom: '0.5px solid var(--color-background-tertiary)' }}>
                    <td style={{ padding: '8px 12px', fontSize: 'var(--text-xs)' }}>
                      <div style={{ fontWeight: 500 }}>{item.name}</div>
                      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-tertiary)' }}>SKU: {item.sku}</div>
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 'var(--text-xs)', textAlign: 'right' }}>
                      {item.quantity}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 'var(--text-xs)', textAlign: 'right' }}>
                      ৳{item.price?.toLocaleString()}
                    </td>
                    <td style={{ padding: '8px 12px', fontSize: 'var(--text-xs)', fontWeight: 600,
                      textAlign: 'right', color: 'var(--color-brand-navy)' }}>
                      ৳{((item.price || 0) * (item.quantity || 0)).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Order totals */}
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '12px',
            marginBottom: 16 }}>
            {[
              { label: 'Subtotal', val: order.subtotal || order.totalAmount },
              order.discount > 0 && { label: 'Discount', val: -order.discount, color: 'var(--color-brand-teal)' },
              order.couponDiscount > 0 && { label: `Coupon (${order.promoCode})`, val: -order.couponDiscount, color: 'var(--color-brand-teal)' },
              { label: 'Delivery', val: order.deliveryFee || 0 },
              { label: 'VAT (5%)', val: order.vatAmount || 0 },
            ].filter(Boolean).map((row, i) => (
              <div key={i} style={{ display: 'flex', justifyContent: 'space-between',
                fontSize: 'var(--text-xs)', marginBottom: 4 }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>{row.label}</span>
                <span style={{ fontWeight: 500, color: row.color || 'var(--color-text-primary)' }}>
                  ৳{Math.abs(row.val)?.toLocaleString()}
                </span>
              </div>
            ))}
            <div style={{ display: 'flex', justifyContent: 'space-between',
              fontSize: 'var(--text-base)', fontWeight: 600, color: 'var(--color-brand-navy)', marginTop: 8,
              paddingTop: 8, borderTop: '1px solid var(--color-border-primary)' }}>
              <span>Total</span>
              <span>৳{order.totalAmount?.toLocaleString()}</span>
            </div>
          </div>

          {/* Payment info */}
          <div style={{ background: 'var(--color-background-secondary)', borderRadius: 8, padding: '12px',
            marginBottom: 16 }}>
            <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-brand-teal)', fontWeight: 600,
              textTransform: 'uppercase', marginBottom: 8 }}>Payment</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-primary)' }}>
                Method: <strong>{order.paymentMethod?.replace(/_/g, ' ')}</strong>
              </span>
              <span style={{ fontSize: 'var(--text-xs)', padding: '3px 8px', borderRadius: 20,
                background: order.paymentStatus === 'paid' ? 'var(--color-brand-teal-tint)' : 'var(--color-status-warning-tint)',
                color: order.paymentStatus === 'paid' ? 'var(--color-status-success)' : 'var(--color-status-warning)',
                fontWeight: 600 }}>
                {order.paymentStatus?.toUpperCase()}
              </span>
            </div>
            {order.transactionId && (
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                Ref: {order.transactionId}
              </div>
            )}
            {order.paymentMethod === 'bank_transfer' && order.paymentStatus === 'pending' && (
              <button
                onClick={handleVerifyPayment}
                disabled={saving}
                style={{ marginTop: 8, width: '100%', padding: '6px 12px',
                  background: 'var(--color-brand-teal)', color: '#fff', border: 'none',
                  borderRadius: 6, fontSize: 'var(--text-xs)', fontWeight: 600,
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
              <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 4,
                display: 'block' }}>Update status</label>
              <select value={status} onChange={e => setStatus(e.target.value)}
                style={{ width: '100%', border: '0.5px solid var(--color-border-primary)', borderRadius: 7,
                  padding: '8px 12px', fontSize: 'var(--text-xs)', fontFamily: 'inherit',
                  outline: 'none', cursor: 'pointer' }}>
                {ALL_STATUSES.map(s => {
                  const allowed = isAllowedTransition(order.status, s);
                  return (
                    <option key={s} value={s} disabled={!allowed}>
                      {statusLabel(s)}{s === order.status ? ' (current)' : allowed ? '' : ' — not allowed'}
                    </option>
                  );
                })}
              </select>
            </div>
            <div>
              <label style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginBottom: 4,
                display: 'block' }}>Admin note</label>
              <input value={adminNote} onChange={e => setAdminNote(e.target.value)}
                placeholder="Internal note..."
                style={{ width: '100%', border: '0.5px solid var(--color-border-primary)', borderRadius: 7,
                  padding: '8px 12px', fontSize: 'var(--text-xs)', fontFamily: 'inherit', outline: 'none' }} />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '14px 20px', borderTop: '0.5px solid var(--color-background-tertiary)',
          display: 'flex', gap: 10, justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', gap: 8 }}>
            <a href={`${API}/invoices/${order._id}`}
              target="_blank" rel="noreferrer"
              style={{ padding: '8px 16px', background: 'var(--color-background-tertiary)', color: 'var(--color-text-primary)',
                borderRadius: 7, fontSize: 'var(--text-xs)', fontWeight: 500, textDecoration: 'none',
                display: 'flex', alignItems: 'center', gap: 6 }}>
              📄 Invoice PDF
            </a>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={onClose}
              style={{ padding: '8px 18px', background: 'transparent',
                border: '0.5px solid var(--color-border-primary)', borderRadius: 7, fontSize: 'var(--text-xs)',
                cursor: 'pointer', color: 'var(--color-text-secondary)' }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving}
              style={{ padding: '8px 22px', background: 'var(--color-brand-navy)', color: '#fff',
                border: 'none', borderRadius: 7, fontSize: 'var(--text-xs)', fontWeight: 600,
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
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [selectedOrders, setSelectedOrders] = useState([]);
  const [bulkAction, setBulkAction] = useState('');
  const [bulkUpdating, setBulkUpdating] = useState(false);
  const fetchSeq = useRef(0);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const fetchOrders = useCallback(async () => {
    // Ignore responses that resolve after a newer request (rapid filter/page flips)
    const seq = ++fetchSeq.current;
    try {
      setLoading(true);
      const token = localStorage.getItem('Mediport_token');
      const params = new URLSearchParams({ page, limit: 20 });
      if (statusFilter) params.set('status', statusFilter);
      if (search) params.set('search', search);
      if (dateFrom) params.set('dateFrom', dateFrom);
      if (dateTo) params.set('dateTo', dateTo);
      if (paymentFilter) params.set('paymentStatus', paymentFilter);
      const res = await fetch(`${API}/orders?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (seq !== fetchSeq.current) return;
      const data = await res.json();
      if (seq !== fetchSeq.current) return;
      const ordersList = data.data?.orders || data.orders || [];
      setOrders(ordersList);
      setTotal(data.data?.total || data.total || 0);
    } catch (err) {
      if (seq !== fetchSeq.current) return;
      console.error('Fetch orders error:', err);
      setMessage({ text: 'Failed to load orders', type: 'error' });
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    } finally {
      if (seq === fetchSeq.current) setLoading(false);
    }
  }, [page, statusFilter, search, dateFrom, dateTo, paymentFilter]);

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  // Drop stale selections whenever the visible order set changes (page/filter/refresh)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { setSelectedOrders(current => current.filter(id => orders.some(o => o._id === id))); }, [orders]);

  const handleStatusChange = async (orderId, newStatus) => {
    setActionLoading(prev => ({ ...prev, [`status-${orderId}`]: true }));
    try {
      const token = localStorage.getItem('Mediport_token');
      const url = `${API}/orders/${orderId}/status`;
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: newStatus })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || `Failed with status ${response.status}`);
      }
      
      showMessage('Order status updated', 'success');
      fetchOrders();
    } catch (error) {
      console.error('Status update error:', error);
      showMessage(error.message || 'Failed to update status', 'error');
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

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const toggleSelectAll = () => {
    if (selectedOrders.length === orders.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(orders.map(o => o._id));
    }
  };

  const toggleSelectOrder = (orderId) => {
    setSelectedOrders(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleBulkAction = async () => {
    if (!bulkAction || selectedOrders.length === 0 || bulkUpdating) return;
    setBulkUpdating(true);

    try {
      const token = localStorage.getItem('Mediport_token');
      const results = await Promise.allSettled(
        selectedOrders.map(async orderId => {
          const res = await fetch(`${API}/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({ status: bulkAction })
          });
          if (!res.ok) {
            const data = await res.json().catch(() => ({}));
            throw new Error(data.message || `Failed with status ${res.status}`);
          }
          return orderId;
        })
      );
      const okCount = results.filter(r => r.status === 'fulfilled').length;
      const failCount = results.length - okCount;
      if (okCount > 0) {
        showMessage(`${okCount} order(s) updated to ${bulkAction}${failCount > 0 ? `, ${failCount} failed (invalid transition for their current status)` : ''}`, failCount > 0 ? 'error' : 'success');
      } else {
        showMessage('No orders were updated — check each order\'s allowed transitions', 'error');
      }
      setSelectedOrders([]);
      setBulkAction('');
      fetchOrders();
    } catch (error) {
      showMessage('Failed to update orders', 'error');
    } finally {
      setBulkUpdating(false);
    }
  };

  const [bulkShipping, setBulkShipping] = useState(false);

  const handleBulkShip = async (ids, label) => {
    if (ids.length === 0) {
      showToast.warning('No orders to ship');
      return;
    }
    const confirmed = await confirmAction(
      `${label}. This books a SteadFast consignment with a cash-collection fee for each eligible order. Continue?`
    );
    if (!confirmed) return;

    setBulkShipping(true);
    try {
      const token = localStorage.getItem('Mediport_token');
      const response = await fetch(`${API}/orders/steadfast/bulk-ship`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ ids }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || 'Bulk shipping failed');
      }
      const { booked, skipped, failed, results = [] } = data.data || {};
      if (booked > 0) {
        showToast.success(`Bulk shipping complete: ${booked} booked, ${skipped} skipped, ${failed} failed`);
      } else if (failed > 0) {
        showToast.error(`Bulk shipping failed: ${failed} failed, ${skipped} skipped`);
      } else {
        showToast.info(`No eligible orders to ship (${skipped} skipped)`);
      }
      const fraudFlagged = results.filter(r => r.skipReason === 'fraud_flagged');
      if (fraudFlagged.length > 0) {
        showToast.warning(`${fraudFlagged.length} order(s) skipped: SteadFast flags the phone as fraud — review before shipping manually`);
      }
      setSelectedOrders([]);
      fetchOrders();
    } catch (error) {
      showToast.error(error.message || 'Failed to run bulk shipping');
    } finally {
      setBulkShipping(false);
    }
  };

  const clearFilters = () => {
    setStatusFilter('');
    setSearch('');
    setSearchInput('');
    setDateFrom('');
    setDateTo('');
    setPaymentFilter('');
    setPage(1);
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
      pending: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
      confirmed: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
      processing: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
      shipped: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
      out_for_delivery: 'bg-[#FED7AA] text-[#9A3412]',
      delivered: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
      cancelled: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
    };
    return colors[status] || colors.placed;
  };

  const getPaymentColor = (status) => {
    return status === 'paid' 
      ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' 
      : 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]';
  };

  const hasActiveFilters = statusFilter || search || dateFrom || dateTo || paymentFilter;

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] overflow-hidden">
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
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-toast max-w-[calc(100vw-2rem)] ${
          message.type === 'success' ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedOrders.length > 0 && (
        <div className="bg-[var(--color-status-info-tint)] border-b border-[var(--color-status-info-tint)] px-4 py-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <span className="text-sm font-semibold text-[var(--color-status-info)]">
            {selectedOrders.length} order{selectedOrders.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
            <select
              value={bulkAction}
              onChange={e => setBulkAction(e.target.value)}
              className="flex-1 sm:flex-none text-sm px-3 py-1.5 border border-[var(--color-status-info-tint)] rounded-lg bg-white min-h-[36px]"
            >
              <option value="">Select action...</option>
              <option value="confirmed">Mark as Confirmed</option>
              <option value="processing">Mark as Processing</option>
              <option value="shipped">Mark as Shipped</option>
              <option value="delivered">Mark as Delivered</option>
              <option value="cancelled">Mark as Cancelled</option>
            </select>
            <button
              onClick={handleBulkAction}
              disabled={!bulkAction || bulkUpdating}
              className="text-sm px-4 py-1.5 bg-brand-teal text-white rounded-lg font-semibold hover:bg-[var(--color-brand-teal-hover)] disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]"
            >
              {bulkUpdating ? 'Applying…' : 'Apply'}
            </button>
            <button
              onClick={() => handleBulkShip(selectedOrders, `Ship ${selectedOrders.length} selected order(s) via SteadFast`)}
              disabled={bulkShipping}
              className="text-sm px-4 py-1.5 bg-brand-navy text-white rounded-lg font-semibold hover:bg-[#0a1e3a] disabled:opacity-40 disabled:cursor-not-allowed min-h-[36px]"
              title="Book SteadFast consignments for selected orders"
            >
              {bulkShipping ? 'Shipping…' : '🚚 Bulk Ship'}
            </button>
            <button
              onClick={() => setSelectedOrders([])}
              className="text-sm px-3 py-1.5 text-[var(--color-status-info)] hover:underline min-h-[36px]"
            >
              Clear
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-3 sm:p-4 border-b-[0.5px] border-[var(--color-border-tertiary)] space-y-3">
        {/* Row 1: Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by order ID, customer name, or email..."
            className="flex-1 px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm font-[family-name:var(--font-plus-jakarta)] min-h-[44px]"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-brand-navy text-white rounded-lg text-xs font-semibold min-h-[44px] min-w-[44px] sm:min-w-[80px] flex items-center justify-center"
          >
            <span className="hidden sm:inline">Search</span>
            <span className="sm:hidden">🔍</span>
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs min-h-[44px] min-w-[44px] flex items-center justify-center hover:bg-[var(--color-background-tertiary)]"
            >
              ✕
            </button>
          )}
        </form>

        {/* Row 2: Status, Payment, Date filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
          <select
            value={statusFilter}
            onChange={e => { setStatusFilter(e.target.value === 'All' ? '' : e.target.value); setPage(1); }}
            className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs font-[family-name:var(--font-plus-jakarta)] bg-white min-h-[44px]"
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s === 'All' ? '' : s}>
                {s === 'All' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1).replace(/_/g, ' ')}
              </option>
            ))}
          </select>

          <select
            value={paymentFilter}
            onChange={e => { setPaymentFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs font-[family-name:var(--font-plus-jakarta)] bg-white min-h-[44px]"
          >
            <option value="">All payments</option>
            <option value="paid">Paid</option>
            <option value="pending">Pending</option>
          </select>

          <input
            type="date"
            value={dateFrom}
            onChange={e => { setDateFrom(e.target.value); setPage(1); }}
            placeholder="From date"
            className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs font-[family-name:var(--font-plus-jakarta)] min-h-[44px]"
          />

          <input
            type="date"
            value={dateTo}
            onChange={e => { setDateTo(e.target.value); setPage(1); }}
            placeholder="To date"
            className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs font-[family-name:var(--font-plus-jakarta)] min-h-[44px]"
          />
        </div>

        {/* Row 3: Count and Clear */}
        <div className="flex items-center justify-between">
          <div className="text-xs text-[var(--color-text-secondary)]">
            {total} order{total !== 1 ? 's' : ''} total
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleBulkShip([], `Ship all eligible orders${statusFilter ? ` (status: ${statusFilter})` : ''} via SteadFast`)}
              disabled={bulkShipping}
              className="text-xs font-semibold text-brand-teal hover:underline disabled:opacity-40"
              title="Books SteadFast consignments for all currently eligible orders (max 200)"
            >
              {bulkShipping ? 'Shipping…' : '🚚 Bulk Ship (eligible)'}
            </button>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-xs text-[var(--color-status-danger)] font-medium hover:underline"
              >
                Clear all filters
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Loading/Empty States */}
      {loading ? (
        <div className="p-8 text-center text-xs text-[var(--color-text-secondary)]">
          <div className="inline-block w-8 h-8 border-4 border-[var(--color-border-primary)] border-t-brand-teal rounded-full animate-spin mb-2"></div>
          <div>Loading orders…</div>
        </div>
      ) : orders.length === 0 ? (
        <div className="p-12 text-center">
          <div className="text-5xl mb-4">📦</div>
          <div className="text-sm font-semibold text-brand-navy mb-2">No orders found</div>
          <div className="text-xs text-[var(--color-text-secondary)]">
            {search || hasActiveFilters
              ? 'Try adjusting your filters'
              : 'Orders will appear here once customers place them'}
          </div>
          {hasActiveFilters && (
            <button
              onClick={clearFilters}
              className="mt-4 text-xs text-brand-teal font-medium hover:underline"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Desktop Table - allows horizontal scroll for better column spacing */}
          <div className="hidden md:block overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
            <table className="w-full" style={{minWidth: '1200px'}}>
              <thead>
                <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)]">
                  <th className="px-3 py-3" style={{width: '48px'}}>
                    <input
                      type="checkbox"
                      checked={selectedOrders.length === orders.length && orders.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-brand-teal cursor-pointer"
                    />
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)] uppercase tracking-wide whitespace-nowrap" style={{width: '140px'}}>
                    Order ID
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)] uppercase tracking-wide whitespace-nowrap" style={{width: '200px'}}>
                    Customer
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)] uppercase tracking-wide whitespace-nowrap" style={{width: '70px'}}>
                    Items
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)] uppercase tracking-wide whitespace-nowrap" style={{width: '120px'}}>
                    Amount
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)] uppercase tracking-wide whitespace-nowrap" style={{width: '100px'}}>
                    Payment
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)] uppercase tracking-wide whitespace-nowrap" style={{width: '150px'}}>
                    Status
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)] uppercase tracking-wide whitespace-nowrap" style={{width: '100px'}}>
                    Date
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)] uppercase tracking-wide whitespace-nowrap" style={{width: '80px'}}>
                    Invoice
                  </th>
                  <th className="text-left px-3 py-3 text-xs font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)] uppercase tracking-wide whitespace-nowrap" style={{width: '150px'}}>
                    Notifications
                  </th>
                </tr>
              </thead>
              <tbody>
                {orders.map((order, index) => {
                  const isSelected = selectedOrders.includes(order._id);
                  return (
                  <tr key={order._id}
                    className={`border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)] transition-colors ${isSelected ? 'bg-[var(--color-status-info-tint)]' : ''}`}>
                    <td className="px-3 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectOrder(order._id)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-4 h-4 accent-brand-teal cursor-pointer"
                      />
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <button
                        onClick={() => setSelectedOrder(order)}
                        className="text-xs font-semibold font-[family-name:var(--font-plus-jakarta)] text-brand-teal hover:underline text-left"
                        title={order.orderNumber}
                      >
                        {order.orderNumber}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="text-xs font-medium">{order.user?.name || '—'}</div>
                      <div className="text-xs text-[var(--color-text-secondary)]">{order.user?.email || '—'}</div>
                    </td>
                    <td className="px-3 py-3 text-xs text-center whitespace-nowrap">
                      {order.items?.length || 0}
                    </td>
                    <td className="px-3 py-3 text-xs font-semibold font-[family-name:var(--font-plus-jakarta)] text-brand-navy whitespace-nowrap">
                      ৳{(order.totalAmount || order.total || 0).toLocaleString()}
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded font-medium inline-block ${getPaymentColor(order.paymentStatus)}`}>
                        {order.paymentStatus === 'paid' ? 'Paid' : 'Pending'}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <select
                        value={order.status}
                        onChange={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          handleStatusChange(order._id, e.target.value);
                        }}
                        onClick={(e) => e.stopPropagation()}
                        disabled={actionLoading[`status-${order._id}`]}
                        className={`text-xs px-2 py-1 rounded font-medium border-0 cursor-pointer ${getStatusColor(order.status)}`}
                      >
                        {ALL_STATUSES.map(s => {
                          const allowed = isAllowedTransition(order.status, s);
                          return (
                            <option key={s} value={s} disabled={!allowed}>
                              {statusLabel(s)}{s === order.status ? ' (current)' : allowed ? '' : ' — not allowed'}
                            </option>
                          );
                        })}
                      </select>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <div className="text-xs">
                        {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      </div>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <button
                        onClick={(e) => { e.stopPropagation(); handleDownloadInvoice(order._id); }}
                        disabled={actionLoading[`invoice-${order._id}`]}
                        className="text-xs px-2 py-1 bg-[var(--color-background-tertiary)] rounded hover:border-[var(--color-border-primary)] disabled:opacity-50 transition-colors font-medium text-brand-teal"
                        title="Download Invoice PDF"
                      >
                        {actionLoading[`invoice-${order._id}`] ? '...' : '📄 PDF'}
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex items-center gap-1.5">
                        {[
                          { type: 'confirmation', icon: '📧', title: 'Order confirmation' },
                          { type: 'payment', icon: '💳', title: 'Payment receipt' },
                          { type: 'shipping', icon: '🚚', title: 'Shipping notification' },
                        ].map(({ type, icon, title }) => (
                          <button
                            key={type}
                            onClick={(e) => { e.stopPropagation(); handleSendNotification(type, order._id); }}
                            disabled={actionLoading[`${type}-${order._id}`]}
                            title={title}
                            className="text-sm w-7 h-7 bg-[var(--color-background-tertiary)] rounded hover:border-[var(--color-border-primary)] disabled:opacity-50 transition-colors flex items-center justify-center flex-shrink-0"
                          >
                            {icon}
                          </button>
                        ))}
                      </div>
                    </td>
                  </tr>
                );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3 p-3">
            {orders.map((order, index) => {
              const isSelected = selectedOrders.includes(order._id);
              return (
              <div key={order._id}
                className={`bg-[var(--color-background-secondary)] rounded-lg border p-4 space-y-3 ${isSelected ? 'border-[var(--color-status-info)] bg-[var(--color-status-info-tint)]' : 'border-[var(--color-border-tertiary)]'}`}>
                {/* Header with checkbox */}
                <div className="flex items-start gap-3">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelectOrder(order._id)}
                    className="w-5 h-5 accent-brand-teal cursor-pointer mt-0.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => setSelectedOrder(order)}
                      className="text-sm font-semibold text-brand-teal font-[family-name:var(--font-plus-jakarta)] hover:underline text-left"
                    >
                      {order.orderNumber}
                    </button>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-GB', { 
                        day: 'numeric', month: 'short', year: 'numeric', 
                        hour: '2-digit', minute: '2-digit' 
                      }) : '—'}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-base font-semibold text-brand-navy font-[family-name:var(--font-plus-jakarta)]">
                      ৳{(order.totalAmount || order.total || 0).toLocaleString()}
                    </div>
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      {order.items?.length || 0} items
                    </div>
                  </div>
                </div>

                {/* Customer */}
                <div className="bg-white rounded-lg p-3 border border-[var(--color-border-tertiary)]">
                  <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold mb-1">Customer</div>
                  <div className="text-xs font-medium">{order.user?.name || '—'}</div>
                  {order.user?.companyName && (
                    <div className="text-xs text-[var(--color-text-secondary)]">{order.user.companyName}</div>
                  )}
                  <div className="text-xs text-[var(--color-text-secondary)]">{order.user?.email || '—'}</div>
                </div>

                {/* Payment & Status */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="bg-white rounded-lg p-3 border border-[var(--color-border-tertiary)]">
                    <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold mb-2">Payment</div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold inline-block ${getPaymentColor(order.paymentStatus)}`}>
                      {order.paymentStatus?.toUpperCase()}
                    </span>
                    <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                      {order.paymentMethod?.replace(/_/g, ' ')}
                    </div>
                  </div>
                  <div className="bg-white rounded-lg p-3 border border-[var(--color-border-tertiary)]">
                    <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold mb-2">Order Status</div>
                    <select
                      value={order.status}
                      onChange={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStatusChange(order._id, e.target.value);
                      }}
                      disabled={actionLoading[`status-${order._id}`]}
                      className={`w-full text-xs px-2 py-1.5 rounded-lg font-medium border cursor-pointer ${getStatusColor(order.status)}`}
                    >
                      {ALL_STATUSES.map(s => {
                        const allowed = isAllowedTransition(order.status, s);
                        return (
                          <option key={s} value={s} disabled={!allowed}>
                            {statusLabel(s)}{s === order.status ? ' (current)' : allowed ? '' : ' — not allowed'}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 pt-2 border-t border-[var(--color-border-tertiary)]">
                  <button
                    onClick={() => setSelectedOrder(order)}
                    className="w-full min-h-[48px] px-4 py-2 bg-brand-navy text-white rounded-lg text-sm font-semibold hover:bg-[#0a1e3a] flex items-center justify-center gap-2"
                  >
                    📋 View Details
                  </button>
                  
                  <button
                    onClick={() => handleDownloadInvoice(order._id)}
                    disabled={actionLoading[`invoice-${order._id}`]}
                    className="w-full min-h-[48px] px-4 py-2 bg-brand-teal text-white rounded-lg text-sm font-semibold hover:bg-[var(--color-brand-teal-hover)] disabled:opacity-50 flex items-center justify-center gap-2"
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
                        className="min-h-[44px] px-3 py-2 bg-white border border-[var(--color-border-secondary)] text-[var(--color-text-primary)] rounded-lg text-xs font-medium hover:bg-[var(--color-background-tertiary)] disabled:opacity-50 flex items-center justify-center gap-1.5"
                      >
                        <span>{icon}</span>
                        <span>{label}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            );
            })}
          </div>
        </>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-3 sm:p-4 flex items-center justify-between gap-2 border-t-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)]">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs sm:text-xs px-3 sm:px-4 py-2 sm:py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 font-medium min-h-[44px] min-w-[44px] flex items-center justify-center bg-white hover:bg-[var(--color-background-tertiary)] disabled:hover:bg-white transition-colors"
          >
            <span className="hidden sm:inline">← Previous</span>
            <span className="sm:hidden">←</span>
          </button>
          <div className="flex items-center gap-2">
            <span className="text-xs sm:text-xs text-[var(--color-text-secondary)] font-medium">
              <span className="hidden sm:inline">Page {page} of {totalPages}</span>
              <span className="sm:hidden">{page}/{totalPages}</span>
            </span>
            {totalPages <= 7 ? (
              // Show all pages if 7 or fewer
              <div className="hidden sm:flex gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      p === page
                        ? 'bg-brand-teal text-white'
                        : 'bg-white border border-[var(--color-border-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            ) : (
              // Show page numbers with ellipsis for many pages
              <div className="hidden sm:flex gap-1">
                {page > 3 && (
                  <>
                    <button
                      onClick={() => setPage(1)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-[var(--color-border-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)]"
                    >
                      1
                    </button>
                    {page > 4 && <span className="px-2 text-[var(--color-text-tertiary)]">…</span>}
                  </>
                )}
                {[page - 1, page, page + 1].filter(p => p > 0 && p <= totalPages).map(p => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      p === page
                        ? 'bg-brand-teal text-white'
                        : 'bg-white border border-[var(--color-border-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)]'
                    }`}
                  >
                    {p}
                  </button>
                ))}
                {page < totalPages - 2 && (
                  <>
                    {page < totalPages - 3 && <span className="px-2 text-[var(--color-text-tertiary)]">…</span>}
                    <button
                      onClick={() => setPage(totalPages)}
                      className="px-3 py-1.5 rounded-lg text-xs font-medium bg-white border border-[var(--color-border-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)]"
                    >
                      {totalPages}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-xs sm:text-xs px-3 sm:px-4 py-2 sm:py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 font-medium min-h-[44px] min-w-[44px] flex items-center justify-center bg-white hover:bg-[var(--color-background-tertiary)] disabled:hover:bg-white transition-colors"
          >
            <span className="hidden sm:inline">Next →</span>
            <span className="sm:hidden">→</span>
          </button>
        </div>
      )}
    </div>
  );
}
