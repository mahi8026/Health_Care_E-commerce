'use client';
import { confirmAction } from '@/components/ui/ConfirmDialog';

import { useState, useEffect } from 'react';
import { FaCheck, FaTimes, FaToggleOn, FaToggleOff, FaSearch, FaBuilding, FaEnvelope, FaPhone } from 'react-icons/fa';
import { API } from '@/constants/api';
import { showToast } from '@/components/ui/Toast';

export default function B2BUsersList() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all'); // all, pending, approved, rejected
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Mediport_token');
      const params = new URLSearchParams({
        page,
        limit: 20,
        ...(filter !== 'all' && { status: filter }),
        ...(search && { search })
      });

      const res = await fetch(`${API}/admin/b2b/users?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Failed to fetch B2B users:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filter, search, page]);

  const handleApprove = async (userId) => {
    if (!await confirmAction('Are you sure you want to approve this B2B application?')) return;

    try {
      setActionLoading(userId);
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/admin/b2b/users/${userId}/approve`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        showToast.success('B2B application approved successfully');
        fetchUsers();
      } else {
        showToast.error(data.message || 'Failed to approve');
      }
    } catch (error) {
      showToast.error('Error approving user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleReject = async (userId) => {
    const reason = prompt('Enter rejection reason (min 10 characters):');
    if (!reason || reason.trim().length < 10) {
      showToast.warning('Rejection reason is required (min 10 characters)');
      return;
    }

    try {
      setActionLoading(userId);
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/admin/b2b/users/${userId}/reject`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });

      const data = await res.json();
      if (data.success) {
        showToast.success('B2B application rejected');
        fetchUsers();
      } else {
        showToast.error(data.message || 'Failed to reject');
      }
    } catch (error) {
      showToast.error('Error rejecting user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleDiscount = async (userId) => {
    try {
      setActionLoading(userId);
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/admin/b2b/users/${userId}/toggle-discount`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });

      const data = await res.json();
      if (data.success) {
        fetchUsers();
      } else {
        showToast.error(data.message || 'Failed to toggle discount');
      }
    } catch (error) {
      showToast.error('Error toggling discount');
    } finally {
      setActionLoading(null);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
      approved: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
      rejected: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
    };

    return (
      <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading && !users.length) {
    return <div className="text-center py-12">Loading B2B users...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <FaSearch className="absolute left-3 top-3 text-[var(--color-text-secondary)]" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, company..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
          />
        </div>

        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="px-4 py-2 border rounded-lg focus:ring-2 focus:ring-brand-teal focus:border-transparent"
        >
          <option value="all">All Status</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[var(--color-border-primary)]">
            <thead className="bg-[var(--color-background-secondary)]">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">User</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">Contact</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">B2B Pricing</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase">Applied</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-[var(--color-text-secondary)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-[var(--color-border-primary)]">
              {users.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-[var(--color-text-secondary)]">
                    No B2B users found
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr key={user._id} className="hover:bg-[var(--color-background-secondary)]">
                    <td className="px-6 py-4">
                      <div>
                        <div className="font-medium text-[var(--color-text-primary)]">{user.name}</div>
                        <div className="text-sm text-[var(--color-text-secondary)] flex items-center gap-1">
                          <FaEnvelope className="w-3 h-3" />
                          {user.email}
                        </div>
                        {user.b2bId && (
                          <div className="text-xs text-[var(--color-text-secondary)] mt-1">ID: {user.b2bId}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <FaBuilding className="text-[var(--color-text-secondary)]" />
                        <div>
                          <div className="font-medium text-sm">{user.companyName || 'N/A'}</div>
                          {user.institutionType && (
                            <div className="text-xs text-[var(--color-text-secondary)]">{user.institutionType}</div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        {user.phone && (
                          <div className="flex items-center gap-1 text-[var(--color-text-secondary)]">
                            <FaPhone className="w-3 h-3" />
                            {user.phone}
                          </div>
                        )}
                        {user.tradeLicense && (
                          <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                            License: {user.tradeLicense}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(user.b2bApprovalStatus)}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => handleToggleDiscount(user._id)}
                        disabled={actionLoading === user._id || user.b2bApprovalStatus !== 'approved'}
                        className={`flex items-center gap-2 px-3 py-1 rounded-lg text-sm ${
                          user.b2bDiscountEnabled
                            ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]'
                            : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]'
                        } ${user.b2bApprovalStatus !== 'approved' ? 'opacity-50 cursor-not-allowed' : ''}`}
                      >
                        {user.b2bDiscountEnabled ? <FaToggleOn /> : <FaToggleOff />}
                        {user.b2bDiscountEnabled ? 'Enabled' : 'Disabled'}
                      </button>
                    </td>
                    <td className="px-6 py-4 text-sm text-[var(--color-text-secondary)]">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      {user.b2bApprovalStatus === 'pending' && (
                        <>
                          <button
                            onClick={() => handleApprove(user._id)}
                            disabled={actionLoading === user._id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-success text-white text-sm rounded hover:bg-success disabled:opacity-50"
                          >
                            <FaCheck /> Approve
                          </button>
                          <button
                            onClick={() => handleReject(user._id)}
                            disabled={actionLoading === user._id}
                            className="inline-flex items-center gap-1 px-3 py-1 bg-danger text-white text-sm rounded hover:bg-danger disabled:opacity-50"
                          >
                            <FaTimes /> Reject
                          </button>
                        </>
                      )}
                      {user.b2bApprovalStatus === 'approved' && (
                        <span className="text-[var(--color-status-success)] text-sm">✓ Approved</span>
                      )}
                      {user.b2bApprovalStatus === 'rejected' && (
                        <span className="text-[var(--color-status-danger)] text-sm">✗ Rejected</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {pagination && pagination.totalPages > 1 && (
          <div className="px-6 py-4 border-t flex items-center justify-between">
            <div className="text-sm text-[var(--color-text-secondary)]">
              Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} users
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={!pagination.hasPrev}
                className="px-4 py-2 border rounded hover:bg-[var(--color-background-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <button
                onClick={() => setPage(p => p + 1)}
                disabled={!pagination.hasNext}
                className="px-4 py-2 border rounded hover:bg-[var(--color-background-secondary)] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
