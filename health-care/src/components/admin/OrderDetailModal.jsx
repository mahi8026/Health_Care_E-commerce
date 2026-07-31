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

  return (
    <div ref={containerRef} role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg max-w-3xl w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 bg-white border-b-[0.5px] border-[var(--color-border-tertiary)] px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-[18px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
              Order Details
            </h2>
            {order && (
              <p className="text-[12px] text-[var(--color-text-secondary)] mt-1">
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0B2545]"></div>
            </div>
          ) : !order ? (
            <div className="text-center py-12 text-[13px] text-[var(--color-text-secondary)]">
              Order not found
            </div>
          ) : (
            <div className="space-y-6">
              {/* Status & Date */}
              <div className="flex items-center justify-between">
                <div>
                  <span className={`inline-block text-[11px] px-3 py-1 rounded font-medium ${getStatusColor(order.status)}`}>
                    {order.status?.toUpperCase()}
                  </span>
                </div>
                <div className="text-[12px] text-[var(--color-text-secondary)]">
                  {order.createdAt ? new Date(order.createdAt).toLocaleString('en-BD') : ''}
                </div>
              </div>

              {/* Customer Info */}
              <div className="bg-[var(--color-background-tertiary)] rounded-lg p-4">
                <h3 className="text-[13px] font-semibold mb-3 font-[family-name:var(--font-plus-jakarta)]">
                  Customer Information
                </h3>
                <div className="grid grid-cols-2 gap-4 text-[12px]">
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
                        <span className="text-[#0E8A6E]">B2B Customer</span>
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
                  <h3 className="text-[13px] font-semibold mb-3 font-[family-name:var(--font-plus-jakarta)]">
                    Shipping Address
                  </h3>
                  <div className="text-[12px] text-[var(--color-text-primary)]">
                    {order.shippingAddress.street && <div>{order.shippingAddress.street}</div>}
                    {order.shippingAddress.city && <div>{order.shippingAddress.city}</div>}
                    {order.shippingAddress.postalCode && <div>{order.shippingAddress.postalCode}</div>}
                    {order.shippingAddress.country && <div>{order.shippingAddress.country}</div>}
                  </div>
                </div>
              )}

              {/* Order Items */}
              <div>
                <h3 className="text-[13px] font-semibold mb-3 font-[family-name:var(--font-plus-jakarta)]">
                  Order Items
                </h3>
                <div className="space-y-2">
                  {(order.items || []).map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 bg-[var(--color-background-tertiary)] rounded-lg">
                      <div className="w-12 h-12 bg-white rounded flex items-center justify-center text-[20px]">
                        {item.product?.images?.[0] || 'ðŸ“¦'}
                      </div>
                      <div className="flex-1">
                        <div className="text-[12px] font-medium mb-1">
                          {item.product?.name || item.name || 'Product'}
                        </div>
                        <div className="text-[11px] text-[var(--color-text-secondary)]">
                          Qty: {item.quantity} Ã— à§³{(item.price || 0).toLocaleString()}
                        </div>
                      </div>
                      <div className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                        à§³{((item.quantity || 0) * (item.price || 0)).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Order Summary */}
              <div className="border-t-[0.5px] border-[var(--color-border-tertiary)] pt-4">
                <div className="space-y-2 text-[12px]">
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                    <span className="font-medium">à§³{(order.subtotal || 0).toLocaleString()}</span>
                  </div>
                  {order.discount > 0 && (
                    <div className="flex justify-between text-[#0E8A6E]">
                      <span>Discount</span>
                      <span className="font-medium">âˆ’à§³{order.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-[var(--color-text-secondary)]">Shipping</span>
                    <span className="font-medium">à§³{(order.shippingCost || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[16px] font-bold pt-2 border-t-[0.5px] border-[var(--color-border-tertiary)]">
                    <span>Total</span>
                    <span className="text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
                      à§³{(order.totalAmount || order.total || 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Payment Info */}
              {order.paymentMethod && (
                <div className="bg-[#E6F1FB] rounded-lg p-4">
                  <h3 className="text-[13px] font-semibold mb-2 font-[family-name:var(--font-plus-jakarta)]">
                    Payment Information
                  </h3>
                  <div className="text-[12px] space-y-1">
                    <div className="flex justify-between">
                      <span className="text-[#0C447C]">Method</span>
                      <span className="font-medium">{order.paymentMethod}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#0C447C]">Status</span>
                      <span className={`font-medium ${order.paymentStatus === 'paid' ? 'text-[#065F46]' : 'text-[#92400E]'}`}>
                        {order.paymentStatus || 'Pending'}
                      </span>
                    </div>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3 pt-4">
                <button 
                  onClick={() => setShowStatusUpdate(true)}
                  className="flex-1 px-4 py-2 bg-[#0B2545] text-white rounded-lg text-[12px] font-semibold hover:bg-[#0d2d52] transition-colors"
                >
                  Update Status
                </button>
                <button 
                  onClick={handlePrintInvoice}
                  disabled={generatingInvoice}
                  className="flex-1 px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-semibold hover:bg-[var(--color-background-tertiary)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
