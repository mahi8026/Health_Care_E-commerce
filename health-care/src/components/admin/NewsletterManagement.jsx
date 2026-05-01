'use client';

import { useState, useEffect } from 'react';
import { API } from '@/constants/api';

export default function NewsletterManagement() {
  const [stats, setStats] = useState(null);
  const [subscribers, setSubscribers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterSource, setFilterSource] = useState('all');
  const [showBroadcastPanel, setShowBroadcastPanel] = useState(false);
  const [broadcastData, setBroadcastData] = useState({
    subject: '',
    htmlContent: '',
    targetTags: []
  });
  const [broadcasting, setBroadcasting] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);

  useEffect(() => {
    fetchStats();
    fetchSubscribers();
  }, [page, search, filterStatus, filterSource]);

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/newsletter/stats`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const fetchSubscribers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('medcore_token');
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        search
      });
      
      if (filterStatus !== 'all') {
        params.append('isSubscribed', filterStatus === 'active' ? 'true' : 'false');
      }
      if (filterSource !== 'all') {
        params.append('source', filterSource);
      }

      const res = await fetch(`${API}/newsletter/subscribers?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setSubscribers(data.data.subscribers);
        setTotalPages(data.data.pagination.pages);
      }
    } catch (error) {
      console.error('Failed to fetch subscribers:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this subscriber?')) return;

    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/newsletter/subscribers/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        fetchSubscribers();
        fetchStats();
      } else {
        alert(data.message || 'Failed to delete subscriber');
      }
    } catch (error) {
      alert('Failed to delete subscriber');
    }
  };

  const handleBroadcast = async () => {
    if (!broadcastData.subject || !broadcastData.htmlContent) {
      alert('Subject and content are required');
      return;
    }

    if (!confirm(`Send broadcast to ${stats?.active || 0} active subscribers?`)) return;

    setBroadcasting(true);
    setBroadcastResult(null);

    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/newsletter/broadcast`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(broadcastData)
      });
      const data = await res.json();
      
      if (data.success) {
        setBroadcastResult(data.data);
        setBroadcastData({ subject: '', htmlContent: '', targetTags: [] });
        alert(`Broadcast sent successfully! Sent: ${data.data.sent}, Failed: ${data.data.failed}`);
      } else {
        alert(data.message || 'Failed to send broadcast');
      }
    } catch (error) {
      alert('Failed to send broadcast');
    } finally {
      setBroadcasting(false);
    }
  };

  return (
    <div>
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
          <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">Total Subscribers</div>
          <div className="text-[24px] font-bold text-[var(--color-text-primary)] font-[family-name:var(--font-plus-jakarta)]">
            {stats?.total || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
          <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">Active</div>
          <div className="text-[24px] font-bold text-[#0E8A6E] font-[family-name:var(--font-plus-jakarta)]">
            {stats?.active || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
          <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">Unsubscribed</div>
          <div className="text-[24px] font-bold text-[#E24B4A] font-[family-name:var(--font-plus-jakarta)]">
            {stats?.unsubscribed || 0}
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
          <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">This Month</div>
          <div className="text-[24px] font-bold text-[#3730A3] font-[family-name:var(--font-plus-jakarta)]">
            {stats?.thisMonth || 0}
          </div>
        </div>
      </div>

      {/* Filters and Actions */}
      <div className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)] mb-4">
        <div className="flex items-center gap-3 flex-wrap">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by email or name..."
            className="flex-1 min-w-[250px] px-3 py-2 text-[12px] border border-[var(--color-border-secondary)] rounded focus:outline-none focus:border-[#0B2545]"
          />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 text-[12px] border border-[var(--color-border-secondary)] rounded focus:outline-none focus:border-[#0B2545]"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="unsubscribed">Unsubscribed</option>
          </select>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-2 text-[12px] border border-[var(--color-border-secondary)] rounded focus:outline-none focus:border-[#0B2545]"
          >
            <option value="all">All Sources</option>
            <option value="footer">Footer</option>
            <option value="popup">Popup</option>
            <option value="checkout">Checkout</option>
            <option value="manual">Manual</option>
          </select>

          <button
            onClick={() => setShowBroadcastPanel(true)}
            className="ml-auto px-4 py-2 bg-[#0B2545] text-white text-[12px] font-medium rounded hover:bg-[#0d2d52] transition-colors"
          >
            📧 Compose Broadcast
          </button>
        </div>
      </div>

      {/* Subscribers Table */}
      <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] overflow-hidden">
        <div className="overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
          <table className="w-full" style={{minWidth: '800px'}}>
          <thead>
            <tr className="bg-[var(--color-background-secondary)] border-b border-[var(--color-border-tertiary)]">
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Email</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Name</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Source</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Subscribed</th>
              <th className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Status</th>
              <th className="text-right px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-[13px] text-[var(--color-text-secondary)]">
                  Loading...
                </td>
              </tr>
            ) : subscribers.length === 0 ? (
              <tr>
                <td colSpan="6" className="text-center py-8 text-[13px] text-[var(--color-text-secondary)]">
                  No subscribers found
                </td>
              </tr>
            ) : (
              subscribers.map((sub) => (
                <tr key={sub._id} className="border-b border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)] transition-colors">
                  <td className="px-4 py-3 text-[12px] text-[var(--color-text-primary)]">{sub.email}</td>
                  <td className="px-4 py-3 text-[12px] text-[var(--color-text-secondary)]">{sub.name || '-'}</td>
                  <td className="px-4 py-3">
                    <span className="text-[10px] px-2 py-1 rounded bg-[#E0E7FF] text-[#3730A3] font-medium">
                      {sub.source}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[12px] text-[var(--color-text-secondary)]">
                    {new Date(sub.subscribedAt).toLocaleDateString('en-BD')}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-1 rounded font-medium ${
                      sub.isSubscribed 
                        ? 'bg-[#D1FAE5] text-[#065F46]' 
                        : 'bg-[#FEE2E2] text-[#991B1B]'
                    }`}>
                      {sub.isSubscribed ? 'Active' : 'Unsubscribed'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => handleDelete(sub._id)}
                      className="text-[11px] text-[#E24B4A] hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-tertiary)]">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1 text-[12px] border border-[var(--color-border-secondary)] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-background-secondary)]"
            >
              Previous
            </button>
            <span className="text-[12px] text-[var(--color-text-secondary)]">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1 text-[12px] border border-[var(--color-border-secondary)] rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--color-background-secondary)]"
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Broadcast Panel */}
      {showBroadcastPanel && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-[var(--color-border-tertiary)] flex items-center justify-between">
              <h2 className="text-[16px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                Compose Broadcast Email
              </h2>
              <button
                onClick={() => setShowBroadcastPanel(false)}
                className="text-[20px] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
              >
                ×
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <label className="block text-[12px] font-medium text-[var(--color-text-primary)] mb-2">
                  Subject *
                </label>
                <input
                  type="text"
                  value={broadcastData.subject}
                  onChange={(e) => setBroadcastData({ ...broadcastData, subject: e.target.value })}
                  placeholder="Enter email subject..."
                  className="w-full px-3 py-2 text-[13px] border border-[var(--color-border-secondary)] rounded focus:outline-none focus:border-[#0B2545]"
                />
              </div>

              <div>
                <label className="block text-[12px] font-medium text-[var(--color-text-primary)] mb-2">
                  HTML Content *
                </label>
                <textarea
                  value={broadcastData.htmlContent}
                  onChange={(e) => setBroadcastData({ ...broadcastData, htmlContent: e.target.value })}
                  placeholder="Enter HTML content..."
                  rows={12}
                  className="w-full px-3 py-2 text-[13px] border border-[var(--color-border-secondary)] rounded focus:outline-none focus:border-[#0B2545] font-mono"
                />
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                  Use HTML tags for formatting. Unsubscribe link will be added automatically.
                </p>
              </div>

              <div className="bg-[#E6F1FB] border border-[#0B2545]/20 rounded p-3">
                <p className="text-[12px] text-[var(--color-text-primary)]">
                  <strong>Recipients:</strong> {stats?.active || 0} active subscribers
                </p>
                <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                  Emails will be sent in batches of 50 to avoid rate limits
                </p>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={handleBroadcast}
                  disabled={broadcasting || !broadcastData.subject || !broadcastData.htmlContent}
                  className="flex-1 px-4 py-2 bg-[#0B2545] text-white text-[13px] font-medium rounded hover:bg-[#0d2d52] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {broadcasting ? 'Sending...' : '📧 Send Broadcast'}
                </button>
                <button
                  onClick={() => setShowBroadcastPanel(false)}
                  className="px-4 py-2 border border-[var(--color-border-secondary)] text-[13px] rounded hover:bg-[var(--color-background-secondary)] transition-colors"
                >
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
