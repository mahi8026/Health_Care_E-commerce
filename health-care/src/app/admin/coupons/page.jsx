"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { API } from '@/constants/api';

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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-[24px] font-bold font-[family-name:var(--font-lora)] mb-2">
          Coupons & Discounts
        </h1>
        <p className="text-[13px] text-[var(--color-text-secondary)]">
          Manage promotional codes and discount campaigns
        </p>
      </div>

      {/* Message Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters & Actions */}
      <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] mb-4">
        <div className="p-4 flex gap-3 items-center flex-wrap">
          <input
            type="text"
            placeholder="Search by code..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] w-64 focus:outline-none focus:border-[#0E8A6E]"
          />

          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E]"
          >
            <option value="">All types</option>
            <option value="percentage">Percentage</option>
            <option value="fixed">Fixed Amount</option>
            <option value="buy_x_get_y">Buy X Get Y</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E]"
          >
            <option value="">All status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="expired">Expired</option>
            <option value="scheduled">Scheduled</option>
          </select>

          <div className="ml-auto flex items-center gap-3">
            <span className="text-[13px] text-[var(--color-text-secondary)]">
              {total} coupons total
            </span>
            <button
              onClick={() => router.push('/admin/coupons/new')}
              className="px-4 py-2 bg-[#0B2545] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0d2e56] transition-colors"
            >
              + Create Coupon
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
          <div className="overflow-x-auto">
            <table className="w-full">
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
        )}

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
    </div>
  );
}
