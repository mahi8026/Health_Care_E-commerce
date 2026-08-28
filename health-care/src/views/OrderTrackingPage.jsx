'use client';
import { showToast } from '@/components/ui/Toast';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaWhatsapp } from 'react-icons/fa';
import api from '@/utils/api';
import { CONTACT } from '@/constants/api';
import { ButtonLoader } from '@/components/ui/Spinner';

const TRACKING_STEPS = [
  { key: 'placed', icon: '🛒', label: 'Order Placed', desc: 'Your order has been received' },
  { key: 'confirmed', icon: '✅', label: 'Confirmed', desc: 'Payment verified, processing started' },
  { key: 'processing', icon: '📦', label: 'Processing', desc: 'Items being packed in our warehouse' },
  { key: 'shipped', icon: '🚚', label: 'Shipped', desc: 'Order dispatched from warehouse' },
  { key: 'out_for_delivery', icon: '🏍️', label: 'Out for Delivery', desc: 'Your order is on the way' },
  { key: 'delivered', icon: '🎉', label: 'Delivered', desc: 'Order successfully delivered' },
];

const ORDER_STATUS_INDEX = {
  placed: 0,
  confirmed: 1,
  processing: 2,
  shipped: 3,
  out_for_delivery: 4,
  delivered: 5,
  cancelled: -1,
};

// Improved Timeline Component
function TrackingTimeline({ status, timeline }) {
  const currentIdx = ORDER_STATUS_INDEX[status] ?? 0;

  return (
    <div style={{ padding: '24px 0' }}>
      {TRACKING_STEPS.map((step, idx) => {
        const isDone = idx < currentIdx;
        const isCurrent = idx === currentIdx;
        const isPending = idx > currentIdx;
        const timeEntry = timeline?.find(t => t.status === step.key || t.key === step.key);

        return (
          <div key={step.key} style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
            {/* Icon + connector line */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
              <div style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: isDone ? 'var(--color-brand-teal)' : isCurrent ? 'var(--color-brand-navy)' : 'var(--color-background-tertiary)',
                border: isCurrent ? '3px solid var(--color-brand-teal)' : '2px solid transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: isPending ? 16 : 20,
                boxShadow: isCurrent ? '0 0 0 4px rgba(14,138,110,0.15)' : 'none',
                transition: 'all 0.3s',
                color: isPending ? 'var(--color-text-tertiary)' : '#fff',
                filter: isPending ? 'grayscale(100%)' : 'none',
                animation: isCurrent ? 'pulse 2s ease-in-out infinite' : 'none',
              }}>
                {isDone ? '✓' : step.icon}
              </div>
              {idx < TRACKING_STEPS.length - 1 && (
                <div style={{
                  width: 2,
                  height: 32,
                  background: isDone ? 'var(--color-brand-teal)' : 'var(--color-background-muted)',
                  transition: 'background 0.5s',
                }} />
              )}
            </div>

            {/* Content */}
            <div style={{ paddingTop: 8, paddingBottom: idx < TRACKING_STEPS.length - 1 ? 24 : 0 }}>
              <div style={{
                fontSize: 'var(--text-sm)',
                fontWeight: isCurrent ? 700 : isDone ? 600 : 400,
                color: isPending ? 'var(--color-text-secondary)' : 'var(--color-brand-navy)',
                marginBottom: 2,
              }}>
                {step.label}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)' }}>{step.desc}</div>
              {timeEntry?.timestamp && (
                <div style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 4 }}>
                  {new Date(timeEntry.timestamp).toLocaleString('en-GB', {
                    day: 'numeric',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderTrackingPage({ orderNumber: initialOrderNumber }) {
  const router = useRouter();
  const [orderNumber, setOrderNumber] = useState(initialOrderNumber || '');
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const [shareToast, setShareToast] = useState(false);

  const handleShare = () => {
    const url = `${window.location.origin}/track/${order.orderNumber}`;
    if (navigator.share) {
      navigator.share({
        title: `Track Order ${order.orderNumber}`,
        text: `Track my MediportBD order`,
        url,
      }).catch(() => { if (process.env.NODE_ENV !== 'production') console.warn('Failed to share order link'); });
    } else {
      navigator.clipboard.writeText(url);
      setShareToast(true);
      setTimeout(() => setShareToast(false), 2000);
    }
  };

  const handleTrack = async (orderNum = orderNumber) => {
    if (!orderNum.trim()) {
      setError('Please enter an order number');
      return;
    }

    setLoading(true);
    setError(null);
    
    try {
      const result = await api.trackOrder(orderNum.trim());
      setOrder(result.data);
      
      // Update URL if tracking from search
      if (!initialOrderNumber) {
        router.push(`/track/${orderNum.trim()}`);
      }
    } catch (err) {
      setError(err.message || 'Order not found. Please check your order number.');
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialOrderNumber) {
      void Promise.resolve().then(() => handleTrack(initialOrderNumber));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialOrderNumber]);

  const handleDownloadInvoice = async () => {
    if (!order?._id) return;
    
    setDownloading(true);
    try {
      const blob = await api.downloadInvoice(order._id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${order.orderNumber}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      // Failed to download invoice
      showToast.error('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleTrack();
  };

  const getStatusColor = (status) => {
    const colors = {
      completed: 'text-brand-teal',
      active: 'text-brand-navy',
      pending: 'text-[var(--color-text-secondary)]'
    };
    return colors[status] || 'text-[var(--color-text-secondary)]';
  };

  const getStatusBgColor = (status) => {
    const colors = {
      completed: 'bg-brand-teal-tint',
      active: 'bg-brand-navy/10',
      pending: 'bg-[var(--color-background-tertiary)]'
    };
    return colors[status] || 'bg-[var(--color-background-tertiary)]';
  };

  const formatDate = (date) => {
    if (!date) return '';
    return new Date(date).toLocaleString('en-BD', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getEstimatedDelivery = () => {
    if (order?.estimatedDelivery) {
      return formatDate(order.estimatedDelivery);
    }
    if (order?.status === 'delivered') {
      return 'Delivered';
    }
    return '2-5 business days';
  };

  return (
    <div className="min-h-screen bg-page py-8 px-4">
      <style jsx>{`
        @keyframes pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
      `}</style>

      {/* Share Toast */}
      {shareToast && (
        <div className="fixed top-4 right-4 z-toast px-4 py-3 bg-[var(--color-status-success-tint)] text-[var(--color-status-success)] rounded-xl shadow-lg text-sm font-semibold flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
          Tracking link copied!
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-5">
          <h1 className="text-xl md:text-2xl font-semibold text-text-primary mb-2">Track Your Order</h1>
          <p className="text-[var(--color-text-secondary)]">Enter your order number to see real-time tracking</p>
        </div>

        {/* Search Box */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="Enter order number (e.g., ORD-00001)"
              className="flex-1 px-4 py-3 border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-teal focus:border-transparent"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={loading}
              className="w-full sm:w-auto px-8 py-3 bg-brand-teal text-white rounded-lg font-semibold hover:bg-[var(--color-brand-teal-hover)] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <ButtonLoader />
                  Tracking...
                </>
              ) : (
                'Track Order'
              )}
            </button>
          </form>
          
          {error && (
            <div className="mt-4 p-4 bg-[var(--color-status-danger-tint)] border border-[var(--color-status-danger-tint)] rounded-lg text-[var(--color-status-danger)] text-sm">
              {error}
            </div>
          )}
        </div>

        {/* Order Details */}
        {order && (
          <div className="space-y-4">
            {/* Order Info Card */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-xl font-semibold text-brand-navy mb-1">
                    Order {order.orderNumber}
                  </h2>
                  <p className="text-sm text-[var(--color-text-secondary)]">
                    Placed on {formatDate(order.createdAt)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleShare}
                    className="px-3 py-2 bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)] rounded-lg text-xs font-medium hover:bg-[var(--color-background-muted)] transition-colors flex items-center gap-2"
                  >
                    🔗 Share
                  </button>
                  <div className="text-right">
                    <div className="text-sm text-[var(--color-text-secondary)] mb-1">Status</div>
                    <span className={`inline-block px-4 py-2 rounded-full text-sm font-semibold ${
                      order.status === 'delivered' ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' :
                      order.status === 'cancelled' ? 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]' :
                      'bg-blue-100 text-blue-700'
                    }`}>
                      {order.status.replace(/_/g, ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Estimated Delivery */}
              {order.status !== 'delivered' && order.status !== 'cancelled' && (
                <div className="bg-[var(--color-status-info-tint)] border border-[var(--color-status-info)] rounded-lg p-4 mb-6">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">📅</span>
                    <div>
                      <div className="text-sm text-[var(--color-status-info)] font-semibold">Estimated Delivery</div>
                      <div className="text-[var(--color-status-info)]">{getEstimatedDelivery()}</div>
                    </div>
                  </div>
                </div>
              )}

              {/* Timeline */}
              <div className="space-y-4">
                <h3 className="font-semibold text-brand-navy mb-4">Order Timeline</h3>
                <TrackingTimeline status={order.status} timeline={order.timeline} />
              </div>
            </div>

            {/* Shipping Details */}
            {order.tracking && (order.tracking.courier || order.tracking.trackingNumber) && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-brand-navy mb-4">Shipping Details</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {order.tracking.courier && (
                    <div>
                      <div className="text-sm text-[var(--color-text-secondary)] mb-1">Courier</div>
                      <div className="font-semibold">{order.tracking.courier}</div>
                    </div>
                  )}
                  {order.tracking.trackingNumber && (
                    <div>
                      <div className="text-sm text-[var(--color-text-secondary)] mb-1">Tracking Number</div>
                      <div className="font-mono text-sm font-semibold">{order.tracking.trackingNumber}</div>
                    </div>
                  )}
                  {order.tracking.dispatchedAt && (
                    <div>
                      <div className="text-sm text-[var(--color-text-secondary)] mb-1">Dispatched At</div>
                      <div className="font-semibold">{formatDate(order.tracking.dispatchedAt)}</div>
                    </div>
                  )}
                  {order.courierStatus && order.courierStatus.status && (
                    <div>
                      <div className="text-sm text-[var(--color-text-secondary)] mb-1">Courier Status</div>
                      <div className="font-semibold capitalize">{order.courierStatus.status.replace(/_/g, ' ')}</div>
                    </div>
                  )}
                </div>
                {order.coldChain && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center gap-2">
                    <span className="text-xl">❄️</span>
                    <span className="text-sm text-blue-700 font-semibold">Cold Chain Delivery</span>
                  </div>
                )}
              </div>
            )}

            {/* Delivery Address */}
            {order.deliveryAddress && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-brand-navy mb-4">Delivery Address</h3>
                <div className="text-[var(--color-text-primary)]">
                  {order.deliveryAddress.name && <div className="font-semibold">{order.deliveryAddress.name}</div>}
                  {order.deliveryAddress.phone && <div className="text-sm">{order.deliveryAddress.phone}</div>}
                  <div className="mt-2">
                    {order.deliveryAddress.street && <div>{order.deliveryAddress.street}</div>}
                    {order.deliveryAddress.thana && <div>{order.deliveryAddress.thana}</div>}
                    {order.deliveryAddress.district && <div>{order.deliveryAddress.district}</div>}
                    {order.deliveryAddress.postcode && <div>{order.deliveryAddress.postcode}</div>}
                  </div>
                </div>
              </div>
            )}

            {/* Order Items */}
            {order.items && order.items.length > 0 && (
              <div className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="font-semibold text-brand-navy mb-4">Order Items</h3>
                <div className="space-y-3">
                  {order.items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center py-3 border-b last:border-b-0">
                      <div className="flex-1">
                        <div className="font-semibold text-[var(--color-text-primary)]">{item.name}</div>
                        {item.sku && <div className="text-sm text-[var(--color-text-secondary)]">SKU: {item.sku}</div>}
                        {item.brand && <div className="text-sm text-[var(--color-text-secondary)]">{item.brand}</div>}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-[var(--color-text-secondary)]">Qty: {item.qty || item.quantity}</div>
                        <div className="font-semibold">৳{(item.price || 0).toLocaleString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
                
                {/* Order Summary */}
                <div className="mt-6 pt-4 border-t space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                    <span>৳{(order.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {order.isB2BOrder && order.b2bDiscount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="flex items-center gap-1 text-purple-700">
                        <span>💼</span>
                        <span>B2B Discount ({order.b2bDiscountPct || 0}%)</span>
                      </span>
                      <span className="font-semibold text-purple-700">-৳{order.b2bDiscount.toLocaleString()}</span>
                    </div>
                  )}
                  {order.deliveryFee > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-secondary)]">Delivery Fee</span>
                      <span>৳{order.deliveryFee.toLocaleString()}</span>
                    </div>
                  )}
                  {order.vatAmount > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--color-text-secondary)]">VAT (5%)</span>
                      <span>৳{order.vatAmount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold text-lg pt-2 border-t">
                    <span>Total</span>
                    <span className="text-brand-teal">৳{(order.totalAmount || order.total || 0).toLocaleString()}</span>
                  </div>
                  {order.isB2BOrder && order.b2bDiscount > 0 && (
                    <div className="flex justify-center pt-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-purple-50 text-purple-700 rounded-full text-xs font-semibold">
                        <span>💼</span>
                        <span>You saved ৳{order.b2bDiscount.toLocaleString()} with B2B pricing!</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 justify-center">
              <button
                onClick={handleDownloadInvoice}
                disabled={downloading}
                className="w-full sm:w-auto px-6 py-3 border border-brand-teal text-brand-teal rounded-lg font-semibold hover:bg-brand-teal-tint transition-colors disabled:opacity-50"
              >
                {downloading ? (
                  <>
                    <ButtonLoader />
                    Downloading...
                  </>
                ) : (
                  '⬇️ Download Invoice'
                )}
              </button>
              <button
                onClick={() => router.push('/')}
                className="w-full sm:w-auto px-6 py-3 border border-[var(--color-border-primary)] rounded-lg font-semibold hover:bg-[var(--color-background-secondary)] transition-colors"
              >
                Continue Shopping
              </button>
              <a
                href={`https://wa.me/${CONTACT.whatsapp}?text=I need help with order ${order.orderNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-6 py-3 bg-[var(--color-status-success)] text-white rounded-lg font-semibold hover:bg-green-600 transition-colors flex items-center justify-center gap-2"
              >
                <FaWhatsapp size={16} />
                WhatsApp Support
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
