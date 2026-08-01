"use client";

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/constants/api';
const TIERS = ['all', 'Silver', 'Gold', 'Platinum'];
const ROLES = [
  { value: 'customer', label: 'Customer' },
  { value: 'b2b_customer', label: 'B2B Customer' },
  { value: 'admin', label: 'Admin' }
];
const ROLE_FILTERS = [
  { value: 'all', label: 'All Roles' },
  { value: 'customer', label: 'Customers' },
  { value: 'b2b_customer', label: 'B2B Customers' },
  { value: 'admin', label: 'Admins' }
];

export default function CustomersManagement() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [tierFilter, setTierFilter] = useState('all');
  const [roleFilter, setRoleFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedCustomers, setSelectedCustomers] = useState([]);
  const [deleteConfirm, setDeleteConfirm] = useState(null); // { id: string, name: string } or 'bulk'
  const [editingCustomer, setEditingCustomer] = useState(null);

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Mediport_token');
      const params = new URLSearchParams({ page, limit: 10 });
      if (tierFilter !== 'all') params.set('tier', tierFilter);
      if (roleFilter !== 'all') params.set('role', roleFilter);
      if (search) params.set('search', search);
      const res = await fetch(`${API}/admin/customers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      const customersList = data.data?.customers || data.customers || [];
      setCustomers(customersList);
      setTotal(data.data?.total || data.total || 0);
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('Failed to load customers:', err);
      showMessage('Failed to load customers', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, tierFilter, roleFilter, search]);

  useEffect(() => { 
    (async () => {
      await fetchCustomers();
    })();
  }, [fetchCustomers]);

  const handleUpdateTier = async (customerId, newTier) => {
    try {
      const token = localStorage.getItem('Mediport_token');
      
      const res = await fetch(`${API}/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ b2bTier: newTier }),
      });
      
      // Try to parse response as JSON
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        process.env.NODE_ENV !== "production" && console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      if (!res.ok) {
        process.env.NODE_ENV !== "production" && console.error('Tier update error:', data);
        throw new Error(data.message || `Update failed with status ${res.status}`);
      }
      
      showMessage('Customer tier updated', 'success');
      fetchCustomers();
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Tier update failed:', error);
      showMessage(error.message || 'Failed to update tier', 'error');
    }
  };

  const handleUpdateRole = async (customerId, newRole) => {
    try {
      const token = localStorage.getItem('Mediport_token');
      
      const res = await fetch(`${API}/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ role: newRole }),
      });
      
      // Try to parse response as JSON
      let data;
      const contentType = res.headers.get('content-type');
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        process.env.NODE_ENV !== "production" && console.error('Non-JSON response:', text);
        throw new Error('Server returned non-JSON response');
      }
      
      if (!res.ok) {
        process.env.NODE_ENV !== "production" && console.error('Role update error:', data);
        throw new Error(data.message || `Update failed with status ${res.status}`);
      }
      
      showMessage('Customer role updated', 'success');
      fetchCustomers();
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Role update failed:', error);
      showMessage(error.message || 'Failed to update role', 'error');
    }
  };

  const handleUpdateDiscount = async (customerId, enabled, pct) => {
    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/admin/customers/${customerId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ b2bDiscountEnabled: enabled, b2bDiscountPct: pct }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Update failed');
      showMessage(`B2B discount ${enabled ? 'enabled at ' + pct + '%' : 'disabled'}`, 'success');
      fetchCustomers();
    } catch (error) {
      showMessage(error.message || 'Failed to update discount', 'error');
    }
  };

  const handleDeleteCustomer = async (customerId) => {
    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/admin/customers/${customerId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Delete failed');
      }
      showMessage('Customer deleted successfully', 'success');
      setDeleteConfirm(null);
      setSelectedCustomers(prev => prev.filter(id => id !== customerId));
      fetchCustomers();
    } catch (error) {
      showMessage(error.message || 'Failed to delete customer', 'error');
    }
  };

  const handleBulkDelete = async () => {
    if (!selectedCustomers.length) return;
    try {
      const token = localStorage.getItem('Mediport_token');
      await Promise.all(
        selectedCustomers.map(id =>
          fetch(`${API}/admin/customers/${id}`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` },
          })
        )
      );
      showMessage(`${selectedCustomers.length} customer(s) deleted successfully`, 'success');
      setDeleteConfirm(null);
      setSelectedCustomers([]);
      fetchCustomers();
    } catch (error) {
      showMessage('Failed to delete customers', 'error');
    }
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === customers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(customers.map(c => c._id || c.id));
    }
  };

  const toggleSelectCustomer = (customerId) => {
    setSelectedCustomers(prev =>
      prev.includes(customerId)
        ? prev.filter(id => id !== customerId)
        : [...prev, customerId]
    );
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  };

  const getTierColor = (tier) => {
    const colors = {
      Platinum: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
      Gold: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
      Silver: 'bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)]',
    };
    return colors[tier] || 'bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)]';
  };

  const getRoleColor = (role) => {
    const colors = {
      admin: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]',
      b2b_customer: 'bg-[var(--color-status-info-tint)] text-[var(--color-status-info)]',
      customer: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
    };
    return colors[role] || 'bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)]';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      b2b_customer: 'B2B Customer',
      customer: 'Customer',
    };
    return labels[role] || role;
  };

  const getStatusColor = (isActive) =>
    isActive !== false
      ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]'
      : 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]';

  const totalPages = Math.ceil(total / 10);

  return (
    <div className="p-3 sm:p-4 md:p-6 max-w-full">
    <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] overflow-hidden">
      {/* Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-toast max-w-[calc(100vw-2rem)] ${
          message.type === 'success' ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-modal flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-lg max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-[var(--color-status-danger-tint)] flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-[var(--color-status-danger)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-brand-navy">Confirm Delete</h3>
                <p className="text-sm text-[var(--color-text-secondary)] mt-1">
                  {deleteConfirm === 'bulk'
                    ? `Delete ${selectedCustomers.length} customer(s)?`
                    : `Delete ${deleteConfirm.name}?`}
                </p>
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-secondary)] mb-6">
              This action cannot be undone. All customer data, orders, and history will be permanently deleted.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 px-4 py-2.5 border border-[var(--color-border-primary)] text-[var(--color-text-primary)] rounded-lg font-semibold hover:bg-[var(--color-background-secondary)] transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteConfirm === 'bulk' ? handleBulkDelete() : handleDeleteCustomer(deleteConfirm.id)}
                className="flex-1 px-4 py-2.5 bg-danger text-white rounded-lg font-semibold hover:bg-[#B91C1C] transition-colors"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selectedCustomers.length > 0 && (
        <div className="bg-[var(--color-status-info-tint)] border-b border-[var(--color-status-info-tint)] px-4 py-3 flex items-center justify-between">
          <span className="text-sm font-semibold text-[var(--color-status-info)]">
            {selectedCustomers.length} customer{selectedCustomers.length > 1 ? 's' : ''} selected
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setSelectedCustomers([])}
              className="text-sm px-3 py-1.5 text-[var(--color-status-info)] hover:underline"
            >
              Clear
            </button>
            <button
              onClick={() => setDeleteConfirm('bulk')}
              className="text-sm px-4 py-1.5 bg-danger text-white rounded-lg font-semibold hover:bg-[#B91C1C]"
            >
              Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-3 sm:p-4 border-b-[0.5px] border-[var(--color-border-tertiary)] space-y-2">
        {/* Row 1: Role and Tier filters */}
        <div className="grid grid-cols-2 gap-2">
          <select
            value={roleFilter}
            onChange={e => { setRoleFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm font-[family-name:var(--font-plus-jakarta)] bg-white min-h-[44px]"
          >
            {ROLE_FILTERS.map(r => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <select
            value={tierFilter}
            onChange={e => { setTierFilter(e.target.value); setPage(1); }}
            className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm font-[family-name:var(--font-plus-jakarta)] bg-white min-h-[44px]"
          >
            {TIERS.map(t => (
              <option key={t} value={t}>{t === 'all' ? 'All tiers' : t}</option>
            ))}
          </select>
        </div>
        
        {/* Row 2: Search */}
        <form onSubmit={handleSearch} className="flex gap-2">
          <input
            type="text"
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            placeholder="Search by name or email..."
            className="flex-1 px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm font-[family-name:var(--font-plus-jakarta)] min-h-[44px]"
          />
          <button
            type="submit"
            className="px-3 sm:px-4 py-2 bg-brand-navy text-white rounded-lg text-xs font-semibold min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <span className="hidden sm:inline">Search</span>
            <span className="sm:hidden">🔍</span>
          </button>
          {search && (
            <button
              type="button"
              onClick={() => { setSearch(''); setSearchInput(''); setPage(1); }}
              className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              ✕
            </button>
          )}
        </form>
        
        {/* Row 3: Count */}
        <div className="text-center text-xs text-[var(--color-text-secondary)] py-1">
          {total} customer{total !== 1 ? 's' : ''}
        </div>
      </div>

      {/* Loading / Empty */}
      {loading ? (
        <div className="p-8 text-center text-xs text-[var(--color-text-secondary)]">Loading customers…</div>
      ) : customers.length === 0 ? (
        <div className="p-8 text-center text-xs text-[var(--color-text-secondary)]">
          {search ? `No customers found for "${search}"` : 'No B2B customers yet'}
        </div>
      ) : (
        <>
          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
            <table className="w-full" style={{minWidth: '900px'}}>
              <thead>
                <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)]">
                  <th className="px-4 py-3 w-12">
                    <input
                      type="checkbox"
                      checked={selectedCustomers.length === customers.length && customers.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 accent-brand-teal cursor-pointer"
                    />
                  </th>
                  {['Customer', 'Email', 'Phone', 'Role', 'Tier', 'B2B Discount', 'Credit Limit', 'Credit Used', 'Status', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {customers.map((customer, index) => {
                  const customerId = customer._id || customer.id;
                  const isSelected = selectedCustomers.includes(customerId);
                  return (
                  <tr key={customerId || `customer-${index}`} className={`border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)] ${isSelected ? 'bg-[var(--color-status-info-tint)]' : ''}`}>
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleSelectCustomer(customerId)}
                        className="w-4 h-4 accent-brand-teal cursor-pointer"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-xs font-semibold font-[family-name:var(--font-plus-jakarta)]">
                        {customer.companyName || customer.name}
                      </div>
                      {customer.companyName && (
                        <div className="text-xs text-[var(--color-text-secondary)]">{customer.name}</div>
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{customer.email}</td>
                    <td className="px-4 py-3 text-xs">{customer.phone || '—'}</td>
                    <td className="px-4 py-3">
                      <select
                        value={customer.role || 'customer'}
                        onChange={e => handleUpdateRole(customerId, e.target.value)}
                        disabled={!customerId}
                        className={`text-xs px-2 py-[3px] rounded font-medium border-0 cursor-pointer ${getRoleColor(customer.role)}`}
                      >
                        {ROLES.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        value={customer.b2bTier || 'Silver'}
                        onChange={e => handleUpdateTier(customerId, e.target.value)}
                        disabled={!customerId}
                        className={`text-xs px-2 py-[3px] rounded font-medium border-0 cursor-pointer ${getTierColor(customer.b2bTier)}`}
                      >
                        <option value="Silver">Silver</option>
                        <option value="Gold">Gold</option>
                        <option value="Platinum">Platinum</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={!!customer.b2bDiscountEnabled}
                          onChange={e => handleUpdateDiscount(customerId, e.target.checked, customer.b2bDiscountPct || 0)}
                          className="w-4 h-4 accent-brand-teal cursor-pointer"
                          title="Enable B2B discount"
                        />
                        <input
                          type="number"
                          min="0" max="100"
                          defaultValue={customer.b2bDiscountPct || 0}
                          onBlur={e => handleUpdateDiscount(customerId, !!customer.b2bDiscountEnabled, Number(e.target.value))}
                          disabled={!customer.b2bDiscountEnabled}
                          className="w-14 text-xs px-1 py-[3px] border border-[var(--color-border-primary)] rounded text-center disabled:opacity-40"
                        />
                        <span className="text-xs text-[var(--color-text-secondary)]">%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      ৳{(customer.creditLimit || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-xs font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      ৳{(customer.creditUsed || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-[3px] rounded font-medium ${getStatusColor(customer.isActive)}`}>
                        {customer.isActive !== false ? 'active' : 'inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setEditingCustomer(customer)}
                          className="text-xs text-brand-teal font-medium hover:underline"
                          title="Edit customer"
                        >
                          Edit
                        </button>
                        <span className="border-[var(--color-border-primary)]">|</span>
                        <button
                          onClick={() => setDeleteConfirm({ id: customerId, name: customer.companyName || customer.name })}
                          className="text-xs text-[var(--color-status-danger)] font-medium hover:underline"
                          title="Delete customer"
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
            {customers.map((customer, index) => {
              const customerId = customer._id || customer.id;
              const isSelected = selectedCustomers.includes(customerId);
              return (
                <div key={customerId || `customer-${index}`} className={`bg-[var(--color-background-secondary)] rounded-lg border p-4 space-y-3 ${isSelected ? 'border-[var(--color-status-info)] bg-[var(--color-status-info-tint)]' : 'border-[var(--color-border-tertiary)]'}`}>
                  {/* Header with checkbox */}
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => toggleSelectCustomer(customerId)}
                      className="w-5 h-5 accent-brand-teal cursor-pointer mt-0.5 flex-shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-brand-navy font-[family-name:var(--font-plus-jakarta)] truncate">
                        {customer.companyName || customer.name}
                      </div>
                      {customer.companyName && (
                        <div className="text-xs text-[var(--color-text-secondary)]">{customer.name}</div>
                      )}
                      <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 truncate">{customer.email}</div>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${getStatusColor(customer.isActive)}`}>
                      {customer.isActive !== false ? 'Active' : 'Inactive'}
                    </span>
                  </div>

                  {/* Phone */}
                  {customer.phone && (
                    <div className="text-xs text-[var(--color-text-secondary)]">
                      📞 {customer.phone}
                    </div>
                  )}

                  {/* Credit info */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg p-2.5 border border-[var(--color-border-tertiary)]">
                      <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Credit Limit</div>
                      <div className="text-sm font-semibold text-brand-navy mt-0.5">৳{(customer.creditLimit || 0).toLocaleString()}</div>
                    </div>
                    <div className="bg-white rounded-lg p-2.5 border border-[var(--color-border-tertiary)]">
                      <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Credit Used</div>
                      <div className="text-sm font-semibold text-brand-navy mt-0.5">৳{(customer.creditUsed || 0).toLocaleString()}</div>
                    </div>
                  </div>

                  {/* Role & Tier selectors */}
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold block mb-1">Role</label>
                      <select
                        value={customer.role || 'customer'}
                        onChange={e => handleUpdateRole(customerId, e.target.value)}
                        disabled={!customerId}
                        className={`w-full text-xs px-2 py-2 rounded-lg font-medium border cursor-pointer min-h-[44px] ${getRoleColor(customer.role)}`}
                      >
                        {ROLES.map(role => (
                          <option key={role.value} value={role.value}>{role.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold block mb-1">Tier</label>
                      <select
                        value={customer.b2bTier || 'Silver'}
                        onChange={e => handleUpdateTier(customerId, e.target.value)}
                        disabled={!customerId}
                        className={`w-full text-xs px-2 py-2 rounded-lg font-medium border cursor-pointer min-h-[44px] ${getTierColor(customer.b2bTier)}`}
                      >
                        <option value="Silver">Silver</option>
                        <option value="Gold">Gold</option>
                        <option value="Platinum">Platinum</option>
                      </select>
                    </div>
                  </div>

                  {/* B2B Discount control */}
                  <div className="bg-white rounded-lg p-3 border border-[var(--color-border-tertiary)]">
                    <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold mb-2">B2B Discount</div>
                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={!!customer.b2bDiscountEnabled}
                          onChange={e => handleUpdateDiscount(customerId, e.target.checked, customer.b2bDiscountPct || 0)}
                          className="w-4 h-4 accent-brand-teal"
                        />
                        <span className="text-xs font-medium text-brand-navy">Enable</span>
                      </label>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0" max="100"
                          defaultValue={customer.b2bDiscountPct || 0}
                          onBlur={e => handleUpdateDiscount(customerId, !!customer.b2bDiscountEnabled, Number(e.target.value))}
                          disabled={!customer.b2bDiscountEnabled}
                          className="w-16 text-sm px-2 py-1 border border-[var(--color-border-primary)] rounded-lg text-center disabled:opacity-40 min-h-[36px]"
                        />
                        <span className="text-sm text-[var(--color-text-secondary)] font-medium">%</span>
                      </div>
                    </div>
                  </div>

                  {/* Action */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setEditingCustomer(customer)}
                      className="min-h-[48px] px-4 py-2 border border-brand-teal text-brand-teal rounded-lg text-sm font-semibold hover:bg-brand-teal-tint transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => setDeleteConfirm({ id: customerId, name: customer.companyName || customer.name })}
                      className="min-h-[48px] px-4 py-2 border border-[var(--color-status-danger)] text-[var(--color-status-danger)] rounded-lg text-sm font-semibold hover:bg-[var(--color-status-danger-tint)] transition-colors"
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
        <div className="p-3 sm:p-4 flex items-center justify-between gap-2 border-t-[0.5px] border-[var(--color-border-tertiary)]">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-xs px-3 sm:px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 font-medium min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <span className="hidden sm:inline">← Prev</span>
            <span className="sm:hidden">←</span>
          </button>
          <span className="text-xs sm:text-xs text-[var(--color-text-secondary)]">
            <span className="hidden sm:inline">Page {page} of {totalPages}</span>
            <span className="sm:hidden">{page}/{totalPages}</span>
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-xs px-3 sm:px-4 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg disabled:opacity-40 font-medium min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <span className="hidden sm:inline">Next →</span>
            <span className="sm:hidden">→</span>
          </button>
        </div>
      )}
    </div>
    </div>
  );
}
