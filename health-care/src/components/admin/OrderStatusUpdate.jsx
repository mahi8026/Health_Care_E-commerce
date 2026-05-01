'use client';

import { useState } from 'react';
import { API } from '@/constants/api';

const STATUS_OPTIONS = [
  { value: 'placed', label: 'Placed', color: 'bg-[#FEF3C7] text-[#92400E]', icon: '📝' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-[#DBEAFE] text-[#1E40AF]', icon: '✅' },
  { value: 'processing', label: 'Processing', color: 'bg-[#E0E7FF] text-[#3730A3]', icon: '⚙️' },
  { value: 'shipped', label: 'Shipped', color: 'bg-[#E0E7FF] text-[#3730A3]', icon: '🚚' },
  { value: 'delivered', label: 'Delivered', color: 'bg-[#D1FAE5] text-[#065F46]', icon: '✓' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-[#FEE2E2] text-[#991B1B]', icon: '✗' }
];

export default function OrderStatusUpdate({ order, onUpdate, onClose }) {
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
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/orders/${order._id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          status,
          trackingNumber: trackingNumber || undefined,
          courier: courier || undefined
        })
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Failed to update status');
      }

      // Call parent update handler
      if (onUpdate) {
        onUpdate(data.order || data.data);
      }

      // Show success message
      alert('Order status updated successfully!');
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const currentStatusOption = STATUS_OPTIONS.find(opt => opt.value === status);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4" onClick={onClose}>
      <div 
        className="bg-white rounded-lg max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 border-b-[0.5px] border-[var(--color-border-tertiary)] flex items-center justify-between">
          <h3 className="text-[16px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
            Update Order Status
          </h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-[var(--color-background-tertiary)] flex items-center justify-center transition-colors"
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
            <div className="mb-4 p-3 bg-[#FEE2E2] border-[0.5px] border-[#FCA5A5] rounded-lg text-[12px] text-[#991B1B]">
              {error}
            </div>
          )}

          {/* Order Info */}
          <div className="mb-4 p-3 bg-[var(--color-background-tertiary)] rounded-lg">
            <div className="text-[11px] text-[var(--color-text-secondary)] mb-1">Order Number</div>
            <div className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
              {order.orderNumber || order._id}
            </div>
          </div>

          {/* Status Selection */}
          <div className="mb-4">
            <label className="block text-[12px] font-medium mb-2">
              Order Status <span className="text-[#E24B4A]">*</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {STATUS_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setStatus(option.value)}
                  className={`p-3 rounded-lg border-[0.5px] transition-all text-left ${
                    status === option.value
                      ? 'border-[#0B2545] bg-[#E6F1FB]'
                      : 'border-[var(--color-border-tertiary)] hover:border-[var(--color-border-secondary)]'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[16px]">{option.icon}</span>
                    <span className="text-[12px] font-medium">{option.label}</span>
                  </div>
                  {status === option.value && (
                    <div className="text-[10px] text-[#0B2545]">Selected</div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Tracking Info (show for shipped status) */}
          {status === 'shipped' && (
            <div className="space-y-3 mb-4 p-4 bg-[#E0E7FF] rounded-lg">
              <div>
                <label className="block text-[12px] font-medium mb-2 text-[#3730A3]">
                  Tracking Number
                </label>
                <input
                  type="text"
                  value={trackingNumber}
                  onChange={(e) => setTrackingNumber(e.target.value)}
                  placeholder="Enter tracking number"
                  className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] focus:outline-none focus:border-[#0B2545]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium mb-2 text-[#3730A3]">
                  Courier Service
                </label>
                <select
                  value={courier}
                  onChange={(e) => setCourier(e.target.value)}
                  className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] focus:outline-none focus:border-[#0B2545]"
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
            <div className="text-[11px] text-[var(--color-text-secondary)] mb-2">New Status</div>
            <div className="flex items-center gap-2">
              <span className="text-[20px]">{currentStatusOption?.icon}</span>
              <span className={`text-[11px] px-3 py-1 rounded font-medium ${currentStatusOption?.color}`}>
                {currentStatusOption?.label.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-semibold hover:bg-[var(--color-background-tertiary)] transition-colors"
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-[#0B2545] text-white rounded-lg text-[12px] font-semibold hover:bg-[#0d2d52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
