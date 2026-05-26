"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/constants/api';
import AdminShell from '@/components/admin/AdminShell';

export default function CouponsPage() {
  const router = useRouter();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  
  // Filters
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const fetchCoupons = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('medcore_token');
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(search && { search }),
        ...(typeFilter && { type: typeFilter }),
        ...(statusFilter && { status: statusFilter })
      });

      const res = await fetch(`${API}/coupons?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success) {
        setCoupons(data.data);
        setTotal(data.pagination.total);
      } else {
        showMessage('Failed to load coupons', 'error');
      }
    } catch (error) {
      showMessage('Failed to load coupons', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, [page, search, typeFilter, statusFilter]);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const toggleActive = async (couponId, currentStatus) => {
    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/coupons/${couponId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ isActive: !currentStatus })
      });

      const data = await res.json();
      if (data.success) {
        showMessage(`Coupon ${!currentStatus ? 'activated' : 'deactivated'}`, 'success');
        fetchCoupons();
      } else {
        showMessage('Failed to update coupon', 'error');
      }
    } catch (error) {
      showMessage('Failed to update coupon', 'error');
    }
  };

  const deleteCoupon = async (couponId) => {
    if (!confirm('Deactivate this coupon?')) return;

    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/coupons/${couponId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        showMessage('Coupon deactivated', 'success');
        fetchCoupons();
      } else {
        showMessage('Failed to delete coupon', 'error');
      }
    } catch (error) {
      showMessage('Failed to delete coupon', 'error');
    }
  };

  const getCouponStatus = (coupon) => {
    const now = new Date();
    const start = new Date(coupon.startDate);
    const end = new Date(coupon.endDate);

    if (!coupon.isActive) {
      return { label: 'Inactive', color: 'bg-[#F3F4F6] text-[#6B7280]' };
    }
    if (now < start) {
      return { label: 'Scheduled', color: 'bg-[#DBEAFE] text-[#1E40AF]' };
    }
    if (now > end) {
      return { label: 'Expired', color: 'bg-[#FEE2E2] text-[#991B1B]' };
    }
    return { label: 'Active', color: 'bg-[#D1FAE5] text-[#065F46]' };
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <AdminShell title="Coupons & Discounts">
    <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-hidden">
      <div className="mb-4 md:mb-6">
        <h1 className="text-[20px] md:text-[24px] font-bold font-[family-name:var(--font-lora)] mb-2">
          Coupons & Discounts
        </h1>
        <p className="text-[12px] md:text-[13px] text-[var(--color-text-secondary)]">
          Manage promotional codes and discount campaigns
        </p>
      </div>

      {/* Message Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 max-w-[calc(100vw-2rem)] ${
          message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] mb-4 overflow-hidden">
        <div className="p-3 md:p-4 space-y-3">
          {/* Row 1: Search */}
          <input
            type="text"
            placeholder="Search by code..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] min-h-[44px] focus:outline-none focus:border-[#0E8A6E]"
          />

          {/* Row 2: Type and Status filters */}
          <div className="grid grid-cols-2 gap-2">
            <select
              value={typeFilter}
              onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] bg-white min-h-[44px] focus:outline-none focus:border-[#0E8A6E]"
            >
              <option value="">All types</option>
              <option value="percentage">Percentage</option>
              <option value="fixed">Fixed Amount</option>
              <option value="buy_x_get_y">Buy X Get Y</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] bg-white min-h-[44px] focus:outline-none focus:border-[#0E8A6E]"
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="expired">Expired</option>
              <option value="scheduled">Scheduled</option>
            </select>
          </div>

          {/* Row 3: Count and Create button */}
          <div className="flex items-center justify-between gap-3">
            <span className="text-[12px] md:text-[13px] text-[var(--color-text-secondary)]">
              {total} coupon{total !== 1 ? 's' : ''} total
            </span>
            <button
              onClick={() => router.push('/admin/coupons/new')}
              className="px-3 md:px-4 py-2 bg-[#0B2545] text-white rounded-lg text-[12px] md:text-[13px] font-semibold hover:bg-[#0d2e56] transition-colors min-h-[44px] whitespace-nowrap"
            >
              <span className="hidden sm:inline">+ Create Coupon</span>
              <span className="sm:hidden">+ Create</span>
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-[13px] text-[var(--color-text-secondary)]">
            Loading coupons...
          </div>
        ) : coupons.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[var(--color-text-secondary)]">
            No coupons found
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
              <table className="w-full" style={{minWidth: '900px'}}>
                <thead>
                  <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)]">
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Code
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Type
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Value
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Usage
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Validity
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Status
                    </th>
                    <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {coupons.map((coupon) => {
                    const status = getCouponStatus(coupon);
                    return (
                      <tr
                        key={coupon._id}
                        className="border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)]"
                      >
                        <td className="px-4 py-3">
                          <div className="font-mono text-[13px] font-semibold text-[#0B2545]">
                            {coupon.code}
                          </div>
                          {coupon.description && (
                            <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                              {coupon.description.substring(0, 50)}
                              {coupon.description.length > 50 && '...'}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[12px] capitalize">
                          {coupon.type.replace('_', ' ')}
                        </td>
                        <td className="px-4 py-3 text-[12px] font-semibold">
                          {coupon.type === 'percentage' && `${coupon.value}%`}
                          {coupon.type === 'fixed' && `৳${coupon.value.toLocaleString()}`}
                          {coupon.type === 'buy_x_get_y' && `Buy ${coupon.buyQuantity} Get ${coupon.getQuantity}`}
                        </td>
                        <td className="px-4 py-3 text-[12px]">
                          <span className="font-semibold">{coupon.usageCount}</span>
                          {coupon.usageLimit > 0 && (
                            <span className="text-[var(--color-text-secondary)]">
                              {' '}/ {coupon.usageLimit}
                            </span>
                          )}
                          {coupon.usageLimit === 0 && (
                            <span className="text-[var(--color-text-secondary)]"> / ∞</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-[11px]">
                          <div>{formatDate(coupon.startDate)}</div>
                          <div className="text-[var(--color-text-secondary)]">
                            to {formatDate(coupon.endDate)}
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] px-2 py-1 rounded font-medium ${status.color}`}>
                            {status.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => router.push(`/admin/coupons/${coupon._id}/edit`)}
                              className="text-[11px] text-[#0E8A6E] font-medium hover:underline"
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => toggleActive(coupon._id, coupon.isActive)}
                              className="text-[11px] text-[#0B2545] font-medium hover:underline"
                            >
                              {coupon.isActive ? 'Deactivate' : 'Activate'}
                            </button>
                            <button
                              onClick={() => deleteCoupon(coupon._id)}
                              className="text-[11px] text-[#E24B4A] font-medium hover:underline"
                            >
                              Delete
                            </button>
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
              {coupons.map((coupon) => {
                const status = getCouponStatus(coupon);
                return (
                  <div key={coupon._id} className="bg-[var(--color-background-secondary)] rounded-lg border border-[var(--color-border-tertiary)] p-4 space-y-3">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="font-mono text-[14px] font-bold text-[#0B2545] truncate">
                          {coupon.code}
                        </div>
                        {coupon.description && (
                          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                            {coupon.description}
                          </div>
                        )}
                      </div>
                      <span className={`text-[10px] px-2 py-1 rounded-full font-semibold flex-shrink-0 ${status.color}`}>
                        {status.label}
                      </span>
                    </div>

                    {/* Details */}
                    <div className="grid grid-cols-2 gap-2 text-[12px]">
                      <div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Type</div>
                        <div className="mt-0.5 capitalize">{coupon.type.replace('_', ' ')}</div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Value</div>
                        <div className="mt-0.5 font-semibold">
                          {coupon.type === 'percentage' && `${coupon.value}%`}
                          {coupon.type === 'fixed' && `৳${coupon.value.toLocaleString()}`}
                          {coupon.type === 'buy_x_get_y' && `Buy ${coupon.buyQuantity} Get ${coupon.getQuantity}`}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Usage</div>
                        <div className="mt-0.5">
                          <span className="font-semibold">{coupon.usageCount}</span>
                          {coupon.usageLimit > 0 ? ` / ${coupon.usageLimit}` : ' / ∞'}
                        </div>
                      </div>
                      <div>
                        <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Validity</div>
                        <div className="mt-0.5 text-[11px]">
                          {formatDate(coupon.startDate)} - {formatDate(coupon.endDate)}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[var(--color-border-tertiary)]">
                      <button
                        onClick={() => router.push(`/admin/coupons/${coupon._id}/edit`)}
                        className="min-h-[40px] px-2 text-[11px] text-[#0E8A6E] font-semibold border border-[#0E8A6E] rounded-lg hover:bg-[#F0FDF9] transition-colors"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => toggleActive(coupon._id, coupon.isActive)}
                        className="min-h-[40px] px-2 text-[11px] text-[#0B2545] font-semibold border border-[#0B2545] rounded-lg hover:bg-[#F0F1F3] transition-colors"
                      >
                        {coupon.isActive ? 'Deactivate' : 'Activate'}
                      </button>
                      <button
                        onClick={() => deleteCoupon(coupon._id)}
                        className="min-h-[40px] px-2 text-[11px] text-[#E24B4A] font-semibold border border-[#E24B4A] rounded-lg hover:bg-[#FEF2F2] transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-3 md:p-4 flex items-center justify-between gap-2 border-t-[0.5px] border-[var(--color-border-tertiary)]">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="text-[12px] px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <span className="hidden sm:inline">← Prev</span>
              <span className="sm:hidden">←</span>
            </button>
            <span className="text-[11px] md:text-[12px] text-[var(--color-text-secondary)]">
              <span className="hidden sm:inline">Page {page} of {totalPages}</span>
              <span className="sm:hidden">{page}/{totalPages}</span>
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="text-[12px] px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <span className="hidden sm:inline">Next →</span>
              <span className="sm:hidden">→</span>
            </button>
          </div>
        )}
      </div>
    </div>
    </AdminShell>
  );
}
