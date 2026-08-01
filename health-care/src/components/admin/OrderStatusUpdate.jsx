'use client';

import { useState, useRef, useEffect } from 'react';
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

const STATUS_OPTIONS = [
  { value: 'placed',           label: 'Placed',           color: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',  icon: '📝' },
  { value: 'confirmed',        label: 'Confirmed',        color: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',  icon: '✅' },
  { value: 'processing',       label: 'Processing',       color: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',  icon: '⚙️' },
  { value: 'shipped',          label: 'Shipped',          color: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',  icon: '🚚' },
  { value: 'out_for_delivery', label: 'Out for Delivery', color: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',  icon: '🛵' },
  { value: 'delivered',        label: 'Delivered',        color: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',  icon: '✓'  },
  { value: 'cancelled',        label: 'Cancelled',        color: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]',  icon: '✗'  },
];

export default function OrderStatusUpdate({ order, onUpdate, onClose }) {
  const containerRef = useRef(null);
  useFocusTrap(containerRef, true, onClose);
  const [status, setStatus] = useState(order.status);
  const [trackingNumber, setTrackingNumber] = useState(order.trackingNumber || '');
  const [courier, setCourier] = useState(order.courier || '');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('Mediport_token');
      if (!token) throw new Error('Not authenticated. Please log in again.');

      const orderId = order._id || order.id;
      if (!orderId) throw new Error('Order ID is missing');

      const res = await fetch(`${API}/orders/${orderId}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber || undefined,
          courier: courier || undefined,
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        throw new Error(`Server returned ${res.status} — invalid response`);
      }

      if (!res.ok) {
        throw new Error(data.message || data.error || `Failed to update status (${res.status})`);
      }

      if (onUpdate) onUpdate(data.order || data.data || data);
      onClose();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentStatusOption = STATUS_OPTIONS.find(opt => opt.value === status);

  return (
    <div ref={containerRef} role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b-[0.5px] border-[var(--color-border-tertiary)] flex items-center justify-between">
          <h3 className="text-base font-semibold font-[family-name:var(--font-plus-jakarta)]">
            Update Order Status
          </h3>
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
        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-[var(--color-status-danger-tint)] border-[0.5px] border-[var(--color-status-danger-tint)] rounded-lg text-xs text-[var(--color-status-danger)]">
              {error}
            </div>
          )}

          {/* Order Info */}
          <div className="mb-4 p-3 bg-[var(--color-background-tertiary)] rounded-lg">
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">Order Number</div>
            <div className="text-sm font-semibold font-[family-name:var(--font-plus-jakarta)]">
              {order.orderNumber || order._id}
            </div>
          </div>

          {/* Status Selection */}
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">
              Order Status <span className="text-danger">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`p-3 rounded-lg border-[0.5px] transition-all text-left ${
                    status === option.value
                      ? 'border-brand-navy bg-[var(--color-status-info-tint)]'
                      : 'border-[var(--color-border-tertiary)] hover:border-[var(--color-border-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-base">{option.icon}</span>
                    <span className="text-xs font-medium">{option.label}</span>
                  </div>
                  {status === option.value && (
                    <div className="text-xs text-brand-navy">Selected</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tracking Info (show for shipped status) */}
          {status === 'shipped' && (
            <div className="space-y-3 mb-4 p-4 bg-[var(--color-status-info-tint)] rounded-lg">
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-status-info)]">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs focus:outline-none focus:border-brand-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2 text-[var(--color-status-info)]">
                  Courier Service
                </label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs focus:outline-none focus:border-brand-navy"
                >
                  <option value="">Select courier</option>
                  <option value="Sundarban Courier">Sundarban Courier</option>
                  <option value="SA Paribahan">SA Paribahan</option>
                  <option value="Pathao Courier">Pathao Courier</option>
                  <option value="Redx">Redx</option>
                  <option value="Steadfast">Steadfast</option>
                  <option value="eCourier">eCourier</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>
          )}

          {/* Current Status Preview */}
          <div className="mb-6 p-3 bg-[var(--color-background-tertiary)] rounded-lg">
            <div className="text-xs text-[var(--color-text-secondary)] mb-2">New Status</div>
            <div className="flex items-center gap-2">
              <span className="text-xl">{currentStatusOption?.icon}</span>
              <span className={`text-xs px-3 py-1 rounded font-medium ${currentStatusOption?.color}`}>
                {currentStatusOption?.label.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs font-semibold hover:bg-[var(--color-background-tertiary)] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-brand-navy text-white rounded-lg text-xs font-semibold hover:bg-[var(--color-brand-navy-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={loading}
            >
              {loading ? 'Updating...' : 'Update Status'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
