'use client';
import { showToast } from '@/components/ui/Toast';

import { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import AdminShell from '@/components/admin/AdminShell';

const ACTION_CATEGORIES = {
  AUTH:         { label: 'Auth',     color: 'bg-blue-100 text-blue-800' },
  ORDER:        { label: 'Orders',   color: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' },
  PRODUCT:      { label: 'Products', color: 'bg-purple-100 text-purple-800' },
  CATEGORY:     { label: 'Category', color: 'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]' },
  MANUFACTURER: { label: 'Brands',   color: 'bg-indigo-100 text-indigo-800' },
  COUPON:       { label: 'Coupons',  color: 'bg-pink-100 text-pink-800' },
  REVIEW:       { label: 'Reviews',  color: 'bg-orange-100 text-orange-800' },
  USER:         { label: 'Users',    color: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]' },
  PAYMENT:      { label: 'Payments', color: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' },
  SYSTEM:       { label: 'System',   color: 'bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)]' },
};

const ROLE_COLORS = {
  admin:        'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]',
  b2b_customer: 'bg-blue-100 text-blue-700',
  customer:     'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
};

export default function ActivityLogsPage() {
  const [logs, setLogs]           = useState([]);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [filters, setFilters] = useState({
    page: 1, limit: 50,
    search: '', category: '', status: '', startDate: '', endDate: '',
  });
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });

  const getToken = () => { try { return localStorage.getItem('Mediport_token') || ''; } catch { return ''; } };

  const fetchLogs = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity-logs?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) { setLogs(data.data || []); setPagination(data.pagination || { page: 1, pages: 1, total: 0 }); }
    } catch { /* silent */ }
    finally { setLoading(false); }
  }, [filters]);

  const fetchStats = useCallback(async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity-logs/stats`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch { /* silent */ }
  }, []);

  useEffect(() => {
    // Wrap in async IIFE to prevent setState-in-effect warning
    (async () => {
      await Promise.all([fetchLogs(), fetchStats()]);
    })();
  }, [fetchLogs, fetchStats]);

  useEffect(() => {
    if (!autoRefresh) return;
    // Visibility-aware polling: skip ticks while the tab is hidden and
    // refresh immediately when it becomes visible again.
    let isActive = true;
    const tick = () => {
      if (!isActive || document.hidden) return;
      fetchLogs(); fetchStats();
    };
    const id = setInterval(tick, 30000);
    document.addEventListener('visibilitychange', tick);
    return () => {
      clearInterval(id);
      document.removeEventListener('visibilitychange', tick);
      isActive = false;
    };
  }, [autoRefresh, fetchLogs, fetchStats]);

  const handleExport = async () => {
    try {
      const params = new URLSearchParams();
      if (filters.startDate) params.append('startDate', filters.startDate);
      if (filters.endDate)   params.append('endDate', filters.endDate);
      const res  = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity-logs/export?${params}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      const blob = await res.blob();
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href = url; a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a); a.click();
      URL.revokeObjectURL(url); document.body.removeChild(a);
    } catch { showToast.error('Failed to export logs'); }
  };

  const getCategory = (action) => ACTION_CATEGORIES[action?.split('_')[0]] || ACTION_CATEGORIES.SYSTEM;

  const statCards = stats ? [
    { label: 'Total Today',   value: stats.totalToday,        color: 'text-[var(--color-text-primary)]' },
    { label: 'Admin Actions', value: stats.adminActionsToday, color: 'text-blue-600' },
    { label: 'Failed',        value: stats.failedToday,       color: 'text-[var(--color-status-danger)]'  },
    { label: 'Active Users',  value: stats.activeUsersToday,  color: 'text-[var(--color-status-success)]' },
  ] : [];

  return (
    <AdminShell title="Activity Logs">
      <div className="p-4 md:p-6">

        {/* Page Header */}
        <div className="mb-5">
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">
            Activity Logs
          </h1>
          <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Monitor user actions and system events</p>
        </div>

        {/* Stats — 2×2 on mobile, 4 cols on md+ */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {statCards.map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm p-4">
                <p className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">{label}</p>
                <p className={`text-2xl font-semibold ${color} font-[family-name:var(--font-plus-jakarta)]`}>{value ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm p-4 mb-5">
          {/* Row 1: search + category + status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              placeholder="Search user or target..."
              aria-label="Search activity logs"
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="px-3 h-[38px] text-sm border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-navy/20 focus:border-brand-navy col-span-1 sm:col-span-1"
            />
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
              aria-label="Filter by category"
              className="px-3 h-[38px] text-sm border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-navy"
            >
              <option value="">All Categories</option>
              {Object.entries(ACTION_CATEGORIES).map(([k, { label }]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              aria-label="Filter by status"
              className="px-3 h-[38px] text-sm border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-navy"
            >
              <option value="">All Status</option>
              <option value="success">Success</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          {/* Row 2: dates + export */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 items-center">
            <input
              type="date"
              value={filters.startDate}
              aria-label="Start date"
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              className="px-3 h-[38px] text-sm border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-navy"
            />
            <input
              type="date"
              value={filters.endDate}
              aria-label="End date"
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              className="px-3 h-[38px] text-sm border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-navy"
            />
            <button
              onClick={handleExport}
              className="h-[38px] px-4 bg-success text-white text-xs font-semibold rounded-lg hover:bg-success transition-colors col-span-2 sm:col-span-1"
            >
              ⬇ Export CSV
            </button>
          </div>

          {/* Row 3: auto-refresh + count */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-[var(--color-border-tertiary)]">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-[var(--color-border-primary)] text-brand-navy focus:ring-brand-navy/30"
              />
              <span className="text-xs text-[var(--color-text-secondary)]">Auto-refresh every 30s</span>
            </label>
            <span className="text-xs text-[var(--color-text-secondary)]">{logs.length} of {pagination.total} logs</span>
          </div>
        </div>

        {/* ── Mobile Card List ───────────────────────────────── */}
        <div className="md:hidden space-y-3 mb-5">
          {loading ? (
            <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] p-8 text-center text-sm text-[var(--color-text-secondary)]">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-xl border border-[var(--color-border-tertiary)] p-10 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-sm font-semibold text-[var(--color-text-primary)]">No logs found</p>
            </div>
          ) : logs.map((log) => {
            const cat = getCategory(log.action);
            return (
              <div key={log._id} className="bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm p-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[var(--color-text-primary)] truncate">{log.userEmail || 'Guest'}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                    log.status === 'success' ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
                  }`}>
                    {log.status}
                  </span>
                </div>
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>
                    {log.action?.replace(/_/g, ' ')}
                  </span>
                  {log.userRole && (
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[log.userRole] || 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]'}`}>
                      {log.userRole}
                    </span>
                  )}
                </div>
                {/* Bottom row */}
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[var(--color-text-secondary)] truncate">
                    {log.targetModel && `${log.targetModel}: `}{log.targetName || log.ipAddress || '—'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedLog(log)}
                    className="text-xs text-blue-600 font-medium hover:underline flex-shrink-0 ml-2"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Desktop Table ──────────────────────────────────── */}
        <div className="hidden md:block bg-white rounded-xl border border-[var(--color-border-tertiary)] shadow-sm overflow-hidden">
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full" style={{ minWidth: 900 }}>
              <thead className="bg-[var(--color-background-secondary)] border-b border-[var(--color-border-tertiary)]">
                <tr>
                  {['Timestamp', 'User', 'Action', 'Target', 'IP', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-10 text-sm text-[var(--color-text-secondary)]">Loading...</td></tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-sm font-semibold text-[var(--color-text-primary)]">No activity logs found</p>
                      <p className="text-xs text-[var(--color-text-secondary)] mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : logs.map((log) => {
                  const cat = getCategory(log.action);
                  return (
                    <tr key={log._id} className="border-b border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-secondary)] transition-colors">
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)] whitespace-nowrap">
                        <span title={format(new Date(log.createdAt), 'PPpp')}>
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-xs font-medium text-[var(--color-text-primary)]">{log.userEmail || 'Guest'}</p>
                        {log.userRole && (
                          <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[log.userRole] || 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]'}`}>
                            {log.userRole}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${cat.color}`}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-xs text-[var(--color-text-primary)]">{log.targetModel || '—'}</p>
                        <p className="text-xs text-[var(--color-text-secondary)] truncate max-w-[160px]">{log.targetName || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)] whitespace-nowrap">{log.ipAddress || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                          log.status === 'success' ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button type="button" onClick={() => setSelectedLog(log)}
                          className="text-xs text-blue-600 hover:underline font-medium">
                          Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {pagination.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-[var(--color-border-tertiary)]">
              <button onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} disabled={filters.page === 1}
                className="px-4 py-2 text-xs border border-[var(--color-border-primary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-secondary)] transition-colors">
                ← Previous
              </button>
              <span className="text-xs text-[var(--color-text-secondary)]">Page {pagination.page} of {pagination.pages}</span>
              <button onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} disabled={filters.page === pagination.pages}
                className="px-4 py-2 text-xs border border-[var(--color-border-primary)] rounded-lg disabled:opacity-40 hover:bg-[var(--color-background-secondary)] transition-colors">
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Mobile Pagination */}
        {pagination.pages > 1 && (
          <div className="md:hidden flex items-center justify-between mt-4">
            <button onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} disabled={filters.page === 1}
              className="px-4 py-2.5 text-xs border border-[var(--color-border-primary)] rounded-lg disabled:opacity-40 bg-white hover:bg-[var(--color-background-secondary)]">
              ← Previous
            </button>
            <span className="text-xs text-[var(--color-text-secondary)]">Page {pagination.page} of {pagination.pages}</span>
            <button onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} disabled={filters.page === pagination.pages}
              className="px-4 py-2.5 text-xs border border-[var(--color-border-primary)] rounded-lg disabled:opacity-40 bg-white hover:bg-[var(--color-background-secondary)]">
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-modal p-0 sm:p-4">
          <div className="bg-white rounded-t-lg sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-lg">
            <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--color-border-tertiary)] sticky top-0 bg-white z-10">
              <h2 className="text-base font-semibold text-[var(--color-text-primary)]">Log Details</h2>
              <button type="button" onClick={() => setSelectedLog(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)] text-lg transition-colors">
                ×
              </button>
            </div>
            <div className="p-5 space-y-4">
              {[
                { label: 'Timestamp', value: format(new Date(selectedLog.createdAt), 'PPpp') },
                { label: 'User',      value: selectedLog.userEmail || 'Guest' },
                { label: 'Role',      value: selectedLog.userRole || '—' },
                { label: 'Action',    value: selectedLog.action?.replace(/_/g, ' ') },
                { label: 'Target',    value: `${selectedLog.targetModel || '—'}: ${selectedLog.targetName || '—'}` },
                { label: 'IP Address', value: selectedLog.ipAddress || '—' },
                { label: 'Status',    value: selectedLog.status },
                { label: 'User Agent', value: selectedLog.userAgent || '—' },
              ].map(({ label, value }) => (
                <div key={label}>
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-sm text-[var(--color-text-primary)] break-all">{value}</p>
                </div>
              ))}

              {selectedLog.errorMessage && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-status-danger)] uppercase tracking-wide mb-1">Error</p>
                  <p className="text-sm text-[var(--color-status-danger)]">{selectedLog.errorMessage}</p>
                </div>
              )}

              {selectedLog.changes && (
                <div>
                  <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide mb-2">Changes</p>
                  <div className="bg-[var(--color-background-secondary)] rounded-lg p-3 space-y-2">
                    <div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium mb-1">Before:</p>
                      <pre className="text-xs text-[var(--color-text-primary)] overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.changes.before, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--color-text-secondary)] font-medium mb-1">After:</p>
                      <pre className="text-xs text-[var(--color-text-primary)] overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.changes.after, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button type="button" onClick={() => setSelectedLog(null)}
                  className="w-full h-[42px] bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)] text-sm font-medium rounded-lg hover:bg-[var(--color-background-muted)] transition-colors">
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
