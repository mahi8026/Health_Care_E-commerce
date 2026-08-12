'use client';

import { useState, useEffect, useRef } from 'react';
import OrderStatusUpdate from './OrderStatusUpdate';
import { InvoiceGenerator } from '@/utils/invoiceGenerator';
import { showToast } from '@/components/ui/Toast';
import { API } from '@/constants/api';

function useFocusTrap(containerRef, isActive, onClose) {
  useEffect(() => {
    if (!isActive) return;
    const container = containerRef.current;
    if (!container) return;

    document.body.style.overflow = 'hidden';

    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (first) first.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onClose, containerRef]);
}

export default function OrderDetailModal({ orderId, onClose }) {
  const containerRef = useRef(null);
  useFocusTrap(containerRef, true, onClose);
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showStatusUpdate, setShowStatusUpdate] = useState(false);
  const [generatingInvoice, setGeneratingInvoice] = useState(false);
  const [steadfastBalance, setSteadfastBalance] = useState(null);
  const [shipping, setShipping] = useState(null);
  const [shippingViaSteadfast, setShippingViaSteadfast] = useState(false);

  useEffect(() => {
    const fetchBalance = async () => {
      try {
        const token = localStorage.getItem('Mediport_token');
        const res = await fetch(`${API}/orders/steadfast/balance`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setSteadfastBalance(data.data?.balance ?? null);
        }
      } catch {
        setSteadfastBalance(null);
      }
    };
    fetchBalance();
  }, []);

  const handleShipViaSteadfast = async () => {
    try {
      setShippingViaSteadfast(true);
      const token = localStorage.getItem('Mediport_token');
      if (!token) throw new Error('Not authenticated. Please log in again.');
      const res = await fetch(`${API}/orders/${orderId}/steadfast/ship`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });
      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned ${res.status} — invalid response`);
      }
      if (!res.ok) {
        throw new Error(data.message || data.error || `Failed to book shipment (${res.status})`);
      }
      const updated = data.order || data.data?.order || data.data;
      if (updated) setOrder(updated);
      setShipping(data.shipment || data.data?.shipment || null);
      showToast.success('SteadFast shipment booked');
    } catch (err) {
      showToast.error(err.message || 'Failed to book SteadFast shipment');
    } finally {
      setShippingViaSteadfast(false);
    }
  };

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const token = localStorage.getItem('Mediport_token');
        const res = await fetch(`${API}/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        if (!res.ok) {
          throw new Error(`Failed to fetch order: ${res.status}`);
        }
        
        const data = await res.json();
        const orderData = data.data || data.order || data;
        setOrder(orderData);
      } catch (err) {
        console.error('Failed to load order:', err);
        showToast.error('Failed to load order: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    if (orderId) fetchOrder();
  }, [orderId]);

  const handleStatusUpdate = (updatedOrder) => {
    setOrder(updatedOrder);
    setShowStatusUpdate(false);
  };

  const handlePrintInvoice = async () => {
    try {
      setGeneratingInvoice(true);
      await InvoiceGenerator.generateInvoice(order);
    } catch (error) {
      showToast.error('Failed to generate invoice: ' + error.message);
    } finally {
      setGeneratingInvoice(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
      pending: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
      confirmed: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
      processing: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
      shipped: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
      delivered: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
      cancelled: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
    };
    return colors[status] || colors.placed;
  };

  return (
    <div ref={containerRef} role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-[0.5px] border-[var(--color-border-tertiary)] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold font-[family-name:var(--font-plus-jakarta)]">
              Order Details
            </h2>
            {order && (
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {order.orderNumber || order._id}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-11 h-11 rounded-full hover:bg-[var(--color-background-tertiary)] flex items-center justify-center transition-colors"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-navy"></div>
            </div>
          ) : !order ? (
            <div className="text-center py-12 text-sm text-[var(--color-text-secondary)]">
              Order not found
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status & Date */}
              <div className="flex items-center justify-between">
                <div>
                  <span className={`inline-block text-xs px-3 py-1 rounded font-medium ${getStatusColor(order.status)}`}>
                    {order.status?.toUpperCase()}
                  </span>
                </div>
                <div className="text-xs text-[var(--color-text-secondary)]">
                  {order.createdAt ? new Date(order.createdAt).toLocaleString('en-BD') : ''}
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-[var(--color-background-tertiary)] rounded-lg p-4">
                <h3 className="text-sm font-semibold mb-3 font-[family-name:var(--font-plus-jakarta)]">
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <div className="text-[var(--color-text-secondary)] mb-1">Name</div>
                    <div className="font-medium">{order.user?.name || order.customer || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[var(--color-text-secondary)] mb-1">Email</div>
                    <div className="font-medium">{order.user?.email || order.email || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[var(--color-text-secondary)] mb-1">Phone</div>
                    <div className="font-medium">{order.shippingAddress?.phone || order.phone || 'N/A'}</div>
                  </div>
                  <div>
                    <div className="text-[var(--color-text-secondary)] mb-1">Customer Type</div>
                    <div className="font-medium">
                      {order.user?.role === 'b2b' ? (
                        <span className="text-brand-teal">B2B Customer</span>
                      ) : (
                        'Retail'
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Shipping Address */}
              {order.shippingAddress && (
                <div className="bg-[var(--color-background-tertiary)] rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-3 font-[family-name:var(--font-plus-jakarta)]">
                    Shipping Address
                  </h3>
                  <div className="text-xs text-[var(--color-text-primary)]">
                    {order.shippingAddress.street && <div>{order.shippingAddress.street}</div>}
                    {order.shippingAddress.city && <div>{order.shippingAddress.city}</div>}
                    {order.shippingAddress.postalCode && <div>{order.shippingAddress.postalCode}</div>}
                    {order.shippingAddress.country && <div>{order.shippingAddress.country}</div>}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="text-sm font-semibold mb-3 font-[family-name:var(--font-plus-jakarta)]">
                  Order Items
                </h3>
                <div className="space-y-2">
                  {(order.items || []).map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-[var(--color-background-tertiary)] rounded-lg">
                      <div className="w-12 h-12 bg-white rounded flex items-center justify-center text-xl overflow-hidden">
                        {(() => {
                          const img = item.product?.images?.[0];
                          if (!img) return '📦';
                          const src = typeof img === 'string' ? img : (img.url || img.secure_url || '');
                          return src ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={src} alt={item.product?.name || 'Product'} className="w-full h-full object-cover" />
                          ) : '📦';
                        })()}
                      </div>
                      <div className="flex-1">
                        <div className="text-xs font-medium mb-1">
                          {item.product?.name || item.name || 'Product'}
                        </div>
                        <div className="text-xs text-[var(--color-text-secondary)]">
                          Qty: {item.quantity} × ৳{(item.price || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-sm font-semibold font-[family-name:var(--font-plus-jakarta)]">
                        ৳{((item.quantity || 0) * (item.price || 0)).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t-[0.5px] border-[var(--color-border-tertiary)] pt-4">
                <div className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                    <span className="font-medium">৳{(order.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-brand-teal">
                      <span>Discount</span>
                      <span className="font-medium">−৳{order.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Shipping</span>
                    <span className="font-medium">৳{(order.shippingCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-base font-semibold pt-2 border-t-[0.5px] border-[var(--color-border-tertiary)]">
                    <span>Total</span>
                    <span className="text-brand-navy font-[family-name:var(--font-plus-jakarta)]">
                      ৳{(order.totalAmount || order.total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              {order.paymentMethod && (
                <div className="bg-[var(--color-status-info-tint)] rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-2 font-[family-name:var(--font-plus-jakarta)]">
                    Payment Information
                  </h3>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-status-info)]">Method</span>
                      <span className="font-medium">{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--color-status-info)]">Status</span>
                      <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-[var(--color-status-success)]' : 'text-[var(--color-status-warning)]'}`}>
                        {order.paymentStatus || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* SteadFast Courier */}
              {order.tracking?.courier === 'SteadFast' || shipping ? (
                <div className="bg-[var(--color-status-success-tint)] rounded-lg p-4">
                  <h3 className="text-sm font-semibold mb-2 font-[family-name:var(--font-plus-jakarta)]">
                    SteadFast Shipment
                  </h3>
                  <div className="text-xs space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[var(--color-status-success)]">Tracking Code</span>
                      <span className="font-mono font-semibold">
                        {order.trackingNumber || order.tracking?.trackingNumber || shipping?.trackingCode}
                      </span>
                    </div>
                    {order.tracking?.consignmentId && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-status-success)]">Consignment ID</span>
                        <span className="font-mono">{order.tracking.consignmentId}</span>
                      </div>
                    )}
                    {(order.tracking?.steadfastStatus || shipping?.status) && (
                      <div className="flex justify-between">
                        <span className="text-[var(--color-status-success)]">Courier Status</span>
                        <span className="font-medium capitalize">
                          {(order.tracking?.steadfastStatus || shipping?.status).replace(/_/g, ' ')}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="bg-[var(--color-background-tertiary)] rounded-lg p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <div>
                      <h3 className="text-sm font-semibold font-[family-name:var(--font-plus-jakarta)]">SteadFast Courier</h3>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                        {steadfastBalance !== null && steadfastBalance !== undefined
                          ? `Account balance: ৳${Number(steadfastBalance).toLocaleString()}`
                          : 'Balance unavailable'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleShipViaSteadfast}
                      disabled={shippingViaSteadfast || order.status === 'cancelled' || order.status === 'delivered'}
                      className="px-4 py-2 bg-brand-teal text-white rounded-lg text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {shippingViaSteadfast ? 'Booking...' : 'Book SteadFast Shipment'}
                    </button>
                  </div>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    Books a consignment on demand using the order&apos;s shipping address (COD amount applies for COD orders).
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowStatusUpdate(true)}
                  className="flex-1 px-4 py-2 bg-brand-navy text-white rounded-lg text-xs font-semibold hover:bg-[var(--color-brand-navy-hover)] transition-colors"
                >
                  Update Status
                </button>
                <button 
                  onClick={handlePrintInvoice}
                  disabled={generatingInvoice}
                  className="flex-1 px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs font-semibold hover:bg-[var(--color-background-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {generatingInvoice ? 'Generating...' : 'Print Invoice'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusUpdate && order && (
        <OrderStatusUpdate
          order={order}
          onUpdate={handleStatusUpdate}
          onClose={() => setShowStatusUpdate(false)}
        />
      )}
    </div>
  );
}
