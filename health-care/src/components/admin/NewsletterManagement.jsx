'use client';
import { confirmAction } from '@/components/ui/ConfirmDialog';

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/constants/api';
import { showToast } from '@/components/ui/Toast';

export default function NewsletterManagement() {
  const [stats, setStats] = useState({ total: 0, active: 0, unsubscribed: 0, thisMonth: 0 });
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [showBroadcastPanel, setShowBroadcastPanel] = useState(false);
  const [broadcastData, setBroadcastData] = useState({ subject: '', htmlContent: '', targetTags: [] });
  const [broadcasting, setBroadcasting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const getToken = () => {
    try { return localStorage.getItem('Mediport_token') || ''; } catch { return ''; }
  };

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${API}/newsletter/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.data) setStats(data.data);
    } catch {
      // silently fail — stats are optional
    }
  }, []);

  const fetchSubscribers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({ page: page.toString(), limit: '20', search });
      if (filterStatus !== 'all') params.append('isSubscribed', filterStatus === 'active' ? 'true' : 'false');
      if (filterSource !== 'all') params.append('source', filterSource);

      const res = await fetch(`${API}/newsletter/subscribers?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` }
      });

      if (!res.ok) {
        setError(`Server error: ${res.status}`);
        setSubscribers([]);
        return;
      }

      const data = await res.json();
      if (data.success && data.data) {
        setSubscribers(Array.isArray(data.data.subscribers) ? data.data.subscribers : []);
        setTotalPages(data.data.pagination?.pages || 1);
      } else {
        setSubscribers([]);
      }
    } catch (err) {
      setError('Failed to load subscribers. The newsletter API may not be available.');
      setSubscribers([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, filterStatus, filterSource]);

  useEffect(() => {
    void Promise.resolve().then(fetchStats);
    void Promise.resolve().then(fetchSubscribers);
  }, [fetchStats, fetchSubscribers]);

  const handleDelete = async (id) => {
    if (!await confirmAction('Delete this subscriber?')) return;
    try {
      const res = await fetch(`${API}/newsletter/subscribers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${getToken()}` }
      });
      const data = await res.json();
      if (data.success) {
        fetchSubscribers();
        fetchStats();
      } else {
        showToast.error(data.message || 'Failed to delete');
      }
    } catch {
      showToast.error('Failed to delete subscriber');
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastData.subject || !broadcastData.htmlContent) {
      showToast.warning('Subject and content are required');
      return;
    }
    if (!await confirmAction(`Send broadcast to ${stats?.active || 0} active subscribers?`)) return;

    setBroadcasting(true);
    try {
      const res = await fetch(`${API}/newsletter/broadcast`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${getToken()}` },
        body: JSON.stringify(broadcastData)
      });
      const data = await res.json();
      if (data.success) {
        setSuccessMsg(`Sent: ${data.data?.sent || 0}, Failed: ${data.data?.failed || 0}`);
        setBroadcastData({ subject: '', htmlContent: '', targetTags: [] });
        setShowBroadcastPanel(false);
        setTimeout(() => setSuccessMsg(''), 5000);
      } else {
        showToast.error(data.message || 'Failed to send broadcast');
      }
    } catch {
      showToast.error('Failed to send broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div>
      {/* Success banner */}
      {successMsg && (
        <div className="mb-4 px-4 py-3 bg-[var(--color-status-success-tint)] border border-[var(--color-status-success-tint)] text-[var(--color-status-success)] rounded-lg text-sm font-medium">
          ✅ Broadcast sent successfully! {successMsg}
        </div>
      )}

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Total Subscribers', value: stats?.total ?? 0, color: 'text-[var(--color-text-primary)]' },
          { label: 'Active', value: stats?.active ?? 0, color: 'text-brand-teal' },
          { label: 'Unsubscribed', value: stats?.unsubscribed ?? 0, color: 'text-danger' },
          { label: 'This Month', value: stats?.thisMonth ?? 0, color: 'text-[var(--color-status-info)]' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-white rounded-lg p-4 border border-[var(--color-border-tertiary)] shadow-sm">
            <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">{label}</div>
            <div className={`text-2xl font-semibold ${color} font-[family-name:var(--font-plus-jakarta)]`}>{value}</div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg p-4 border border-[var(--color-border-tertiary)] shadow-sm mb-4">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search by email or name..."
            className="flex-1 min-w-[200px] px-3 h-[38px] text-sm border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
          />
          <select
            value={filterStatus}
            onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
            className="px-3 h-[38px] text-sm border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-navy"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>
          <select
            value={filterSource}
            onChange={(e) => { setFilterSource(e.target.value); setPage(1); }}
            className="px-3 h-[38px] text-sm border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-navy"
          >
            <option value="all">All Sources</option>
            <option value="footer">Footer</option>
            <option value="popup">Popup</option>
            <option value="checkout">Checkout</option>
            <option value="manual">Manual</option>
          </select>
          <button
            onClick={() => setShowBroadcastPanel(true)}
            className="sm:ml-auto h-[38px] px-4 bg-brand-navy text-white text-xs font-semibold rounded-lg hover:bg-[var(--color-brand-navy-hover)] transition-colors"
          >
            📧 Compose Broadcast
          </button>
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-white rounded-lg border border-[var(--color-border-tertiary)] shadow-sm p-10 text-center mb-4">
          <div className="text-4xl mb-3">📭</div>
          <p className="text-base font-semibold text-[var(--color-text-primary)] mb-1">Newsletter API Unavailable</p>
          <p className="text-sm text-[var(--color-text-secondary)] mb-4 max-w-md mx-auto">{error}</p>
          <button
            onClick={() => { fetchStats(); fetchSubscribers(); }}
            className="px-5 py-2 bg-brand-navy text-white text-sm font-medium rounded-lg hover:bg-[var(--color-brand-navy-hover)] transition-colors"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!error && (
        <div className="bg-white rounded-lg border border-[var(--color-border-tertiary)] shadow-sm overflow-hidden">
          {/* Mobile view */}
          <div className="md:hidden">
            {loading ? (
              <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">Loading...</div>
            ) : subscribers.length === 0 ? (
              <div className="p-10 text-center">
                <div className="text-4xl mb-3">📋</div>
                <p className="text-sm font-semibold text-[var(--color-text-primary)]">No subscribers yet</p>
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">Subscribers will appear here once people sign up</p>
              </div>
            ) : (
              <div className="divide-y divide-[var(--color-border-tertiary)]">
                {subscribers.map((sub) => (
                  <div key={sub._id} className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{sub.email}</p>
                        {sub.name && <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">{sub.name}</p>}
                      </div>
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${
                        sub.isSubscribed ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
                      }`}>
                        {sub.isSubscribed ? 'Active' : 'Unsub'}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-medium capitalize">{sub.source}</span>
                        <span className="text-xs text-[var(--color-text-secondary)]">{new Date(sub.subscribedAt).toLocaleDateString('en-BD')}</span>
                      </div>
                      <button onClick={() => handleDelete(sub._id)} className="text-xs text-[var(--color-status-danger)] hover:text-[var(--color-status-danger)] font-medium">Delete</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full" style={{ minWidth: 700 }}>
              <thead className="bg-[var(--color-background-secondary)] border-b border-[var(--color-border-tertiary)]">
                <tr>
                  {['Email', 'Name', 'Source', 'Subscribed', 'Status', 'Actions'].map((h) => (
                    <th key={h} className={`px-4 py-3 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="6" className="text-center py-10 text-sm text-[var(--color-text-secondary)]">Loading...</td></tr>
                ) : subscribers.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="text-center py-16">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">No subscribers yet</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">Subscribers will appear here once people sign up via the footer or checkout</p>
                    </td>
                  </tr>
                ) : subscribers.map((sub) => (
                  <tr key={sub._id} className="border-b border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)] transition-colors">
                    <td className="px-4 py-3 text-xs text-[var(--color-text-primary)] font-medium">{sub.email}</td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{sub.name || '—'}</td>
                    <td className="px-4 py-3">
                      <span className="text-xs px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700 font-semibold capitalize">{sub.source}</span>
                    </td>
                    <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">{new Date(sub.subscribedAt).toLocaleDateString('en-BD')}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        sub.isSubscribed ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
                      }`}>
                        {sub.isSubscribed ? 'Active' : 'Unsubscribed'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => handleDelete(sub._id)} className="text-xs text-[var(--color-status-danger)] hover:text-[var(--color-status-danger)] hover:underline font-medium">Delete</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-tertiary)]">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 text-xs border border-[var(--color-border-primary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-secondary)] transition-colors">
                ← Previous
              </button>
              <span className="text-xs text-[var(--color-text-secondary)]">Page {page} of {totalPages}</span>
              <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                className="px-4 py-2 text-xs border border-[var(--color-border-primary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-secondary)] transition-colors">
                Next →
              </button>
            </div>
          )}
        </div>
      )}

      {/* Broadcast Modal */}
      {showBroadcastPanel && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-modal p-0 sm:p-4">
          <div className="bg-white rounded-t-lg sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-tertiary)] sticky top-0 bg-white z-10">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">📧 Compose Broadcast</h2>
              <button onClick={() => setShowBroadcastPanel(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)] transition-colors text-lg">×</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">Subject *</label>
                <input
                  type="text"
                  value={broadcastData.subject}
                  onChange={(e) => setBroadcastData({ ...broadcastData, subject: e.target.value })}
                  placeholder="Email subject line..."
                  className="w-full px-3 h-[42px] text-sm border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy"
                />
              </div>
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1.5">HTML Content *</label>
                <textarea
                  value={broadcastData.htmlContent}
                  onChange={(e) => setBroadcastData({ ...broadcastData, htmlContent: e.target.value })}
                  placeholder="<h1>Hello subscribers!</h1><p>Your message here...</p>"
                  rows={12}
                  className="w-full px-3 py-2.5 text-sm border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-navy font-mono resize-y"
                />
                <p className="text-xs text-[var(--color-text-secondary)] mt-1">Unsubscribe link will be added automatically.</p>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-xs text-blue-800 font-medium">
                  📬 Sending to <strong>{stats?.active || 0}</strong> active subscribers
                </p>
                <p className="text-xs text-blue-600 mt-0.5">Emails sent in batches of 50 to avoid rate limits</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={handleBroadcast}
                  disabled={broadcasting || !broadcastData.subject || !broadcastData.htmlContent}
                  className="flex-1 h-[42px] bg-brand-navy text-white text-sm font-semibold rounded-lg hover:bg-[var(--color-brand-navy-hover)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {broadcasting ? 'Sending...' : '📧 Send Broadcast'}
                </button>
                <button onClick={() => setShowBroadcastPanel(false)}
                  className="h-[42px] px-5 border border-[var(--color-border-primary)] text-sm rounded-lg hover:bg-[var(--color-background-secondary)] transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
