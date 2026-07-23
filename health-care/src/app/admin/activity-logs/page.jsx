'use client';

import { useState, useEffect, useCallback } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import AdminShell from '@/components/admin/AdminShell';

const ACTION_CATEGORIES = {
  AUTH:         { label: 'Auth',     color: 'bg-blue-100 text-blue-800' },
  ORDER:        { label: 'Orders',   color: 'bg-green-100 text-green-800' },
  PRODUCT:      { label: 'Products', color: 'bg-purple-100 text-purple-800' },
  CATEGORY:     { label: 'Category', color: 'bg-yellow-100 text-yellow-800' },
  MANUFACTURER: { label: 'Brands',   color: 'bg-indigo-100 text-indigo-800' },
  COUPON:       { label: 'Coupons',  color: 'bg-pink-100 text-pink-800' },
  REVIEW:       { label: 'Reviews',  color: 'bg-orange-100 text-orange-800' },
  USER:         { label: 'Users',    color: 'bg-red-100 text-red-800' },
  PAYMENT:      { label: 'Payments', color: 'bg-emerald-100 text-emerald-800' },
  SYSTEM:       { label: 'System',   color: 'bg-gray-100 text-gray-800' },
};

const ROLE_COLORS = {
  admin:        'bg-red-100 text-red-700',
  b2b_customer: 'bg-blue-100 text-blue-700',
  customer:     'bg-green-100 text-green-700',
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
    const id = setInterval(() => { fetchLogs(); fetchStats(); }, 30000);
    return () => clearInterval(id);
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
    } catch { alert('Failed to export logs'); }
  };

  const getCategory = (action) => ACTION_CATEGORIES[action?.split('_')[0]] || ACTION_CATEGORIES.SYSTEM;

  const statCards = stats ? [
    { label: 'Total Today',   value: stats.totalToday,        color: 'text-gray-800' },
    { label: 'Admin Actions', value: stats.adminActionsToday, color: 'text-blue-600' },
    { label: 'Failed',        value: stats.failedToday,       color: 'text-red-600'  },
    { label: 'Active Users',  value: stats.activeUsersToday,  color: 'text-emerald-600' },
  ] : [];

  return (
    <AdminShell title="Activity Logs">
      <div className="p-4 md:p-6">

        {/* Page Header */}
        <div className="mb-5">
          <h1 className="text-[20px] md:text-[24px] font-bold text-gray-900 font-[family-name:var(--font-lora)]">
            Activity Logs
          </h1>
          <p className="text-[12px] text-gray-500 mt-0.5">Monitor user actions and system events</p>
        </div>

        {/* Stats — 2×2 on mobile, 4 cols on md+ */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
            {statCards.map(({ label, value, color }) => (
              <div key={label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                <p className="text-[10px] text-gray-500 uppercase tracking-wide mb-1">{label}</p>
                <p className={`text-[22px] font-bold ${color} font-[family-name:var(--font-plus-jakarta)]`}>{value ?? 0}</p>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 mb-5">
          {/* Row 1: search + category + status */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
            <input
              type="text"
              placeholder="Search user or target..."
              value={filters.search}
              onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
              className="px-3 h-[38px] text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0B2545]/20 focus:border-[#0B2545] col-span-1 sm:col-span-1"
            />
            <select
              value={filters.category}
              onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
              className="px-3 h-[38px] text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B2545]"
            >
              <option value="">All Categories</option>
              {Object.entries(ACTION_CATEGORIES).map(([k, { label }]) => (
                <option key={k} value={k}>{label}</option>
              ))}
            </select>
            <select
              value={filters.status}
              onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
              className="px-3 h-[38px] text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B2545]"
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
              onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
              className="px-3 h-[38px] text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B2545]"
            />
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
              className="px-3 h-[38px] text-[13px] border border-gray-200 rounded-lg focus:outline-none focus:border-[#0B2545]"
            />
            <button
              onClick={handleExport}
              className="h-[38px] px-4 bg-emerald-600 text-white text-[12px] font-semibold rounded-lg hover:bg-emerald-700 transition-colors col-span-2 sm:col-span-1"
            >
              ⬇ Export CSV
            </button>
          </div>

          {/* Row 3: auto-refresh + count */}
          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-100">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded border-gray-300 text-[#0B2545] focus:ring-[#0B2545]/30"
              />
              <span className="text-[12px] text-gray-600">Auto-refresh every 30s</span>
            </label>
            <span className="text-[11px] text-gray-400">{logs.length} of {pagination.total} logs</span>
          </div>
        </div>

        {/* ── Mobile Card List ───────────────────────────────── */}
        <div className="md:hidden space-y-3 mb-5">
          {loading ? (
            <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-[13px] text-gray-400">Loading...</div>
          ) : logs.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-100 p-10 text-center">
              <div className="text-4xl mb-3">📋</div>
              <p className="text-[14px] font-semibold text-gray-700">No logs found</p>
            </div>
          ) : logs.map((log) => {
            const cat = getCategory(log.action);
            return (
              <div key={log._id} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                {/* Top row */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <p className="text-[12px] font-semibold text-gray-800 truncate">{log.userEmail || 'Guest'}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                    </p>
                  </div>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold flex-shrink-0 ${
                    log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                  }`}>
                    {log.status}
                  </span>
                </div>
                {/* Badges row */}
                <div className="flex items-center gap-2 flex-wrap mb-2">
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cat.color}`}>
                    {log.action?.replace(/_/g, ' ')}
                  </span>
                  {log.userRole && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${ROLE_COLORS[log.userRole] || 'bg-gray-100 text-gray-600'}`}>
                      {log.userRole}
                    </span>
                  )}
                </div>
                {/* Bottom row */}
                <div className="flex items-center justify-between">
                  <p className="text-[11px] text-gray-500 truncate">
                    {log.targetModel && `${log.targetModel}: `}{log.targetName || log.ipAddress || '—'}
                  </p>
                  <button
                    type="button"
                    onClick={() => setSelectedLog(log)}
                    className="text-[11px] text-blue-600 font-medium hover:underline flex-shrink-0 ml-2"
                  >
                    Details
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* ── Desktop Table ──────────────────────────────────── */}
        <div className="hidden md:block bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto" style={{ WebkitOverflowScrolling: 'touch' }}>
            <table className="w-full" style={{ minWidth: 900 }}>
              <thead className="bg-gray-50 border-b border-gray-100">
                <tr>
                  {['Timestamp', 'User', 'Action', 'Target', 'IP', 'Status', ''].map((h) => (
                    <th key={h} className="px-4 py-3 text-left text-[11px] font-semibold text-gray-500 uppercase tracking-wide">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="7" className="text-center py-10 text-[13px] text-gray-400">Loading...</td></tr>
                ) : logs.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="text-center py-16">
                      <div className="text-4xl mb-3">📋</div>
                      <p className="text-[14px] font-semibold text-gray-700">No activity logs found</p>
                      <p className="text-[12px] text-gray-400 mt-1">Try adjusting your filters</p>
                    </td>
                  </tr>
                ) : logs.map((log) => {
                  const cat = getCategory(log.action);
                  return (
                    <tr key={log._id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3 text-[12px] text-gray-500 whitespace-nowrap">
                        <span title={format(new Date(log.createdAt), 'PPpp')}>
                          {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <p className="text-[12px] font-medium text-gray-800">{log.userEmail || 'Guest'}</p>
                        {log.userRole && (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${ROLE_COLORS[log.userRole] || 'bg-gray-100 text-gray-600'}`}>
                            {log.userRole}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${cat.color}`}>
                          {log.action?.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-[12px] text-gray-800">{log.targetModel || '—'}</p>
                        <p className="text-[11px] text-gray-400 truncate max-w-[160px]">{log.targetName || '—'}</p>
                      </td>
                      <td className="px-4 py-3 text-[11px] text-gray-400 whitespace-nowrap">{log.ipAddress || '—'}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          log.status === 'success' ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                        }`}>
                          {log.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button type="button" onClick={() => setSelectedLog(log)}
                          className="text-[11px] text-blue-600 hover:underline font-medium">
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
            <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
              <button onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} disabled={filters.page === 1}
                className="px-4 py-2 text-[12px] border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                ← Previous
              </button>
              <span className="text-[12px] text-gray-500">Page {pagination.page} of {pagination.pages}</span>
              <button onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} disabled={filters.page === pagination.pages}
                className="px-4 py-2 text-[12px] border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50 transition-colors">
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Mobile Pagination */}
        {pagination.pages > 1 && (
          <div className="md:hidden flex items-center justify-between mt-4">
            <button onClick={() => setFilters(f => ({ ...f, page: f.page - 1 }))} disabled={filters.page === 1}
              className="px-4 py-2.5 text-[12px] border border-gray-200 rounded-lg disabled:opacity-40 bg-white hover:bg-gray-50">
              ← Previous
            </button>
            <span className="text-[12px] text-gray-500">Page {pagination.page} of {pagination.pages}</span>
            <button onClick={() => setFilters(f => ({ ...f, page: f.page + 1 }))} disabled={filters.page === pagination.pages}
              className="px-4 py-2.5 text-[12px] border border-gray-200 rounded-lg disabled:opacity-40 bg-white hover:bg-gray-50">
              Next →
            </button>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {selectedLog && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
              <h2 className="text-[15px] font-semibold text-gray-800">Log Details</h2>
              <button type="button" onClick={() => setSelectedLog(null)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-500 text-lg transition-colors">
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
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-1">{label}</p>
                  <p className="text-[13px] text-gray-800 break-all">{value}</p>
                </div>
              ))}

              {selectedLog.errorMessage && (
                <div>
                  <p className="text-[11px] font-semibold text-red-400 uppercase tracking-wide mb-1">Error</p>
                  <p className="text-[13px] text-red-600">{selectedLog.errorMessage}</p>
                </div>
              )}

              {selectedLog.changes && (
                <div>
                  <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide mb-2">Changes</p>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium mb-1">Before:</p>
                      <pre className="text-[11px] text-gray-800 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.changes.before, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-medium mb-1">After:</p>
                      <pre className="text-[11px] text-gray-800 overflow-x-auto whitespace-pre-wrap">
                        {JSON.stringify(selectedLog.changes.after, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              <div className="pt-2">
                <button type="button" onClick={() => setSelectedLog(null)}
                  className="w-full h-[42px] bg-gray-100 text-gray-700 text-[13px] font-medium rounded-lg hover:bg-gray-200 transition-colors">
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
