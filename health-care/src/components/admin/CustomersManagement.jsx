"use client";

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/constants/api';
const TIERS = ['all', 'Silver', 'Gold', 'Platinum'];

export default function CustomersManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tierFilter, setTierFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('medcore_token');
      const params = new URLSearchParams({ page, limit: 10 });
      if (tierFilter !== 'all') params.set('b2bTier', tierFilter);
      if (search) params.set('search', search);
      const res = await fetch(`${API}/admin/customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      setCustomers(data.data?.customers || data.customers || []);
      setTotal(data.data?.total || data.total || 0);
    } catch (err) {
      showMessage('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, tierFilter, search]);

  useEffect(() => { fetchCustomers(); }, [fetchCustomers]);

  const handleUpdateTier = async (customerId, newTier) => {
    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ b2bTier: newTier }),
      });
      if (!res.ok) throw new Error('Update failed');
      showMessage('Customer tier updated', 'success');
      fetchCustomers();
    } catch {
      showMessage('Failed to update tier', 'error');
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const getTierColor = (tier) => {
    const colors = {
      Platinum: 'bg-[#E0E7FF] text-[#3730A3]',
      Gold: 'bg-[#FEF3C7] text-[#92400E]',
      Silver: 'bg-[#F3F4F6] text-[#374151]',
    };
    return colors[tier] || 'bg-[#F3F4F6] text-[#374151]';
  };

  const getStatusColor = (isActive) =>
    isActive !== false
      ? 'bg-[#D1FAE5] text-[#065F46]'
      : 'bg-[#FEF3C7] text-[#92400E]';

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)]">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Filters */}
      <div className="p-4 border-b-[0.5px] border-[var(--color-border-tertiary)] flex gap-3 flex-wrap">
        <select
          value={tierFilter}
          onChange={e => { setTierFilter(e.target.value); setPage(1); }}
          className="px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white"
        >
          {TIERS.map(t => (
            <option key={t} value={t}>{t === 'all' ? 'All tiers' : t}</option>
          ))}
        </select>
        <form onSubmit={handleSearch} className="flex gap-2 flex-1">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)]"
          />
          <button
            type="submit"
            className="px-3 py-[8px] bg-[#0B2545] text-white rounded-lg text-[12px] font-semibold"
          >
            Search
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px]"
            >
              Clear
            </button>
          )}
        </form>
        <div className="self-center text-[12px] text-[var(--color-text-secondary)]">
          {total} customers
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">Loading customers…</div>
        ) : customers.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">
            {search ? `No customers found for "${search}"` : 'No B2B customers yet'}
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)]">
                {['Customer', 'Email', 'Phone', 'Tier', 'Credit Limit', 'Credit Used', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {customers.map((customer, index) => (
                <tr key={customer._id || `customer-${index}`} className="border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)]">
                  <td className="px-4 py-3">
                    <div className="text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      {customer.companyName || customer.name}
                    </div>
                    {customer.companyName && (
                      <div className="text-[10px] text-[var(--color-text-secondary)]">{customer.name}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[var(--color-text-secondary)]">{customer.email}</td>
                  <td className="px-4 py-3 text-[11px]">{customer.phone || '—'}</td>
                  <td className="px-4 py-3">
                    <select
                      value={customer.b2bTier || 'Silver'}
                      onChange={e => handleUpdateTier(customer._id, e.target.value)}
                      className={`text-[10px] px-2 py-[3px] rounded font-medium border-0 cursor-pointer ${getTierColor(customer.b2bTier)}`}
                    >
                      <option value="Silver">Silver</option>
                      <option value="Gold">Gold</option>
                      <option value="Platinum">Platinum</option>
                    </select>
                  </td>
                  <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                    ৳{(customer.creditLimit || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                    ৳{(customer.creditUsed || 0).toLocaleString()}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-[3px] rounded font-medium ${getStatusColor(customer.isActive)}`}>
                      {customer.isActive !== false ? 'active' : 'inactive'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <button className="text-[11px] text-[#0E8A6E] font-medium hover:underline">
                      View profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

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
          <span className="text-[12px] text-[var(--color-text-secondary)]">Page {page} of {totalPages}</span>
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
  );
}
