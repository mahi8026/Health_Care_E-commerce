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
  { value: 'cancelled',        label: 'Cancelled',        color: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]',  icon: '✕'  },
];

export default function StatusUpdateModal({ order, onClose, onUpdate }) {
  const containerRef = useRef(null);
  useFocusTrap(containerRef, true, onClose);
  const [selectedStatus, setSelectedStatus] = useState(order.status);
  const [note, setNote] = useState('');
  const [notifyCustomer, setNotifyCustomer] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleUpdate = async () => {
    if (selectedStatus === order.status) {
      setError('Please select a different status');
      return;
    }

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
        body: JSON.stringify({ status: selectedStatus, note, notifyCustomer }),
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

      onUpdate(data.order || data.data || data);
      onClose();
    } catch (err) {
      setError(err.message || 'An unexpected error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const currentStatusIndex = STATUS_OPTIONS.findIndex(s => s.value === order.status);
  const selectedStatusIndex = STATUS_OPTIONS.findIndex(s => s.value === selectedStatus);

  return (
    <div ref={containerRef} role="dialog" aria-modal="true" className="fixed inset-0 bg-black/50 flex items-center justify-center z-modal p-0 sm:p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-none sm:rounded-lg max-w-md w-full h-full sm:h-auto overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-4 sm:px-6 py-4 border-b-[0.5px] border-[var(--color-border-tertiary)] sticky top-0 bg-white z-10">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold font-[family-name:var(--font-plus-jakarta)]">
                Update Order Status
              </h3>
              <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                {order.orderNumber}
              </p>
            </div>
            {/* Mobile close button */}
            <button
              onClick={onClose}
              className="sm:hidden w-11 h-11 flex items-center justify-center rounded-lg hover:bg-[var(--color-background-tertiary)] transition-colors -mr-2"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"/>
                <line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 md:p-6 space-y-4">
          {/* Current Status */}
          <div className="bg-[var(--color-background-tertiary)] rounded-lg p-3">
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">Current Status</div>
            <div className="flex items-center gap-2">
              <span className="text-lg">
                {STATUS_OPTIONS.find(s => s.value === order.status)?.icon}
              </span>
              <span className="text-sm font-semibold capitalize">
                {order.status}
              </span>
            </div>
          </div>

          {/* Status Options */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              New Status
            </label>
            <div className="space-y-2">
              {STATUS_OPTIONS.map((status, index) => {
                const isDisabled = index < currentStatusIndex && status.value !== 'cancelled';
                const isSelected = selectedStatus === status.value;
                
                return (
                  <button
                    key={status.value}
                    onClick={() => !isDisabled && setSelectedStatus(status.value)}
                    disabled={isDisabled}
                    className={`w-full flex items-center gap-3 p-4 md:p-3 rounded-lg border-[0.5px] transition-all min-h-[44px] ${
                      isSelected
                        ? 'border-brand-navy bg-[var(--color-status-info-tint)]'
                        : isDisabled
                        ? 'border-[var(--color-border-tertiary)] bg-[var(--color-background-tertiary)] opacity-50 cursor-not-allowed'
                        : 'border-[var(--color-border-tertiary)] hover:border-brand-navy cursor-pointer'
                    }`}
                  >
                    <span className="text-xl">{status.icon}</span>
                    <div className="flex-1 text-left">
                      <div className="text-xs font-medium">{status.label}</div>
                      {isDisabled && status.value !== 'cancelled' && (
                        <div className="text-xs text-[var(--color-text-tertiary)]">
                          Cannot revert to previous status
                        </div>
                      )}
                    </div>
                    {isSelected && (
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-brand-navy">
                        <polyline points="20 6 9 17 4 12"/>
                      </svg>
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Note */}
          <div>
            <label className="text-sm font-medium mb-2 block">
              Note (Optional)
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Add a note about this status change..."
              className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg resize-none focus:outline-none focus:border-brand-navy min-h-[48px]"
              style={{ fontSize: 'var(--text-base)' }}
              rows="3"
            />
          </div>

          {/* Notify Customer */}
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={notifyCustomer}
              onChange={(e) => setNotifyCustomer(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--color-border-secondary)] text-brand-navy focus:ring-brand-navy"
            />
            <span className="text-xs">
              Send email notification to customer
            </span>
          </label>

          {/* Error */}
          {error && (
            <div className="bg-[var(--color-status-danger-tint)] border-[0.5px] border-[var(--color-status-danger-tint)] rounded-lg p-3 text-xs text-[var(--color-status-danger)]">
              {error}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 md:px-6 py-4 border-t-[0.5px] border-[var(--color-border-tertiary)] flex gap-3 sticky bottom-0 bg-white">
          <button
            onClick={onClose}
            disabled={loading}
            className="flex-1 px-4 py-3 md:py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs font-semibold hover:bg-[var(--color-background-tertiary)] transition-colors disabled:opacity-50 min-h-[44px]"
          >
            Cancel
          </button>
          <button
            onClick={handleUpdate}
            disabled={loading || selectedStatus === order.status}
            className="flex-1 px-4 py-3 md:py-2 bg-brand-navy text-white rounded-lg text-xs font-semibold hover:bg-[var(--color-brand-navy-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[44px]"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white"></div>
                Updating...
              </>
            ) : (
              'Update Status'
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
