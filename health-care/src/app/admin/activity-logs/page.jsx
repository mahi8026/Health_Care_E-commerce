'use client';

import { useState, useEffect } from 'react';
import { format, formatDistanceToNow } from 'date-fns';
import AdminShell from '@/components/admin/AdminShell';

const ACTION_CATEGORIES = {
  AUTH: { label: 'Authentication', color: 'bg-blue-100 text-blue-800' },
  ORDER: { label: 'Orders', color: 'bg-green-100 text-green-800' },
  PRODUCT: { label: 'Products', color: 'bg-purple-100 text-purple-800' },
  CATEGORY: { label: 'Categories', color: 'bg-yellow-100 text-yellow-800' },
  MANUFACTURER: { label: 'Manufacturers', color: 'bg-indigo-100 text-indigo-800' },
  COUPON: { label: 'Coupons', color: 'bg-pink-100 text-pink-800' },
  REVIEW: { label: 'Reviews', color: 'bg-orange-100 text-orange-800' },
  USER: { label: 'Users', color: 'bg-red-100 text-red-800' },
  PAYMENT: { label: 'Payments', color: 'bg-emerald-100 text-emerald-800' },
  SYSTEM: { label: 'System', color: 'bg-gray-100 text-gray-800' }
};

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedLog, setSelectedLog] = useState(null);
  const [showModal, setShowModal] = useState(false);
  
  // Filters
  const [filters, setFilters] = useState({
    page: 1,
    limit: 50,
    search: '',
    category: '',
    action: '',
    status: '',
    startDate: '',
    endDate: ''
  });

  const [pagination, setPagination] = useState({
    page: 1,
    pages: 1,
    total: 0
  });

  // Auto-refresh
  const [autoRefresh, setAutoRefresh] = useState(true);

  useEffect(() => {
    fetchLogs();
    fetchStats();
  }, [filters]);

  useEffect(() => {
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      fetchLogs();
      fetchStats();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, [autoRefresh, filters]);

  const fetchLogs = async () => {
    try {
      const token = localStorage.getItem('medcore_token');
      const queryParams = new URLSearchParams();
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value) queryParams.append(key, value);
      });

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setLogs(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Failed to fetch activity logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('medcore_token');
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity-logs/stats`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const data = await response.json();
      
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Failed to fetch stats:', error);
    }
  };

  const handleExport = async () => {
    try {
      const token = localStorage.getItem('medcore_token');
      const queryParams = new URLSearchParams();
      
      if (filters.startDate) queryParams.append('startDate', filters.startDate);
      if (filters.endDate) queryParams.append('endDate', filters.endDate);

      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/activity-logs/export?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `activity-logs-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Failed to export logs:', error);
      alert('Failed to export logs');
    }
  };

  const viewDetails = (log) => {
    setSelectedLog(log);
    setShowModal(true);
  };

  const getActionCategory = (action) => {
    const category = action.split('_')[0];
    return ACTION_CATEGORIES[category] || ACTION_CATEGORIES.SYSTEM;
  };

  const getRoleBadgeColor = (role) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      b2b_customer: 'bg-blue-100 text-blue-800',
      customer: 'bg-green-100 text-green-800'
    };
    return colors[role] || 'bg-gray-100 text-gray-800';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <AdminShell title="Activity Logs">
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Activity Logs</h1>
        <p className="text-gray-600 mt-1">Monitor user actions and system events</p>
      </div>

      {/* Stats Row */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Total Actions Today</div>
            <div className="text-2xl font-bold text-gray-900">{stats.totalToday}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Admin Actions Today</div>
            <div className="text-2xl font-bold text-blue-600">{stats.adminActionsToday}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Failed Actions Today</div>
            <div className="text-2xl font-bold text-red-600">{stats.failedToday}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="text-sm text-gray-600">Active Users Today</div>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsersToday}</div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <input
            type="text"
            placeholder="Search user or target..."
            value={filters.search}
            onChange={(e) => setFilters({ ...filters, search: e.target.value, page: 1 })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          
          <select
            value={filters.category}
            onChange={(e) => setFilters({ ...filters, category: e.target.value, page: 1 })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Categories</option>
            {Object.entries(ACTION_CATEGORIES).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          <select
            value={filters.status}
            onChange={(e) => setFilters({ ...filters, status: e.target.value, page: 1 })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>

          <input
            type="date"
            value={filters.startDate}
            onChange={(e) => setFilters({ ...filters, startDate: e.target.value, page: 1 })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Start Date"
          />

          <input
            type="date"
            value={filters.endDate}
            onChange={(e) => setFilters({ ...filters, endDate: e.target.value, page: 1 })}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="End Date"
          />

          <button
            onClick={handleExport}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
          >
            Export CSV
          </button>
        </div>

        <div className="mt-4 flex items-center justify-between">
          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={autoRefresh}
              onChange={(e) => setAutoRefresh(e.target.checked)}
              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">Auto-refresh every 30s</span>
          </label>

          <div className="text-sm text-gray-600">
            Showing {logs.length} of {pagination.total} logs
          </div>
        </div>
      </div>

      {/* Activity Logs Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
          <table className="min-w-full divide-y divide-gray-200" style={{minWidth: '1000px'}}>
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Timestamp
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Action
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Target
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  IP Address
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {logs.map((log) => {
                const actionCategory = getActionCategory(log.action);
                return (
                  <tr key={log._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div title={format(new Date(log.createdAt), 'PPpp')}>
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {log.userEmail || 'Guest'}
                      </div>
                      {log.userRole && (
                        <span className={`inline-flex text-xs px-2 py-1 rounded-full ${getRoleBadgeColor(log.userRole)}`}>
                          {log.userRole}
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex text-xs px-2 py-1 rounded-full ${actionCategory.color}`}>
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{log.targetModel || 'N/A'}</div>
                      <div className="text-sm text-gray-500">{log.targetName || 'N/A'}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.ipAddress || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex text-xs px-2 py-1 rounded-full ${
                        log.status === 'success' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {log.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <button
                        onClick={() => viewDetails(log)}
                        className="text-blue-600 hover:text-blue-900"
                      >
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
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                disabled={filters.page === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                disabled={filters.page === pagination.pages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Page <span className="font-medium">{pagination.page}</span> of{' '}
                  <span className="font-medium">{pagination.pages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                    disabled={filters.page === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                    disabled={filters.page === pagination.pages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {showModal && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Activity Log Details</h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-500">Timestamp</label>
                  <p className="text-gray-900">{format(new Date(selectedLog.createdAt), 'PPpp')}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">User</label>
                  <p className="text-gray-900">{selectedLog.userEmail || 'Guest'}</p>
                  {selectedLog.userRole && (
                    <span className={`inline-flex text-xs px-2 py-1 rounded-full mt-1 ${getRoleBadgeColor(selectedLog.userRole)}`}>
                      {selectedLog.userRole}
                    </span>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Action</label>
                  <p className="text-gray-900">{selectedLog.action.replace(/_/g, ' ')}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Target</label>
                  <p className="text-gray-900">{selectedLog.targetModel || 'N/A'}: {selectedLog.targetName || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">IP Address</label>
                  <p className="text-gray-900">{selectedLog.ipAddress || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">User Agent</label>
                  <p className="text-gray-900 text-sm break-all">{selectedLog.userAgent || 'N/A'}</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-500">Status</label>
                  <p>
                    <span className={`inline-flex text-xs px-2 py-1 rounded-full ${
                      selectedLog.status === 'success' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {selectedLog.status}
                    </span>
                  </p>
                </div>

                {selectedLog.errorMessage && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Error Message</label>
                    <p className="text-red-600">{selectedLog.errorMessage}</p>
                  </div>
                )}

                {selectedLog.changes && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Changes</label>
                    <div className="mt-2 bg-gray-50 rounded p-3">
                      <div className="mb-2">
                        <div className="text-xs font-medium text-gray-500 mb-1">Before:</div>
                        <pre className="text-xs text-gray-900 overflow-x-auto">
                          {JSON.stringify(selectedLog.changes.before, null, 2)}
                        </pre>
                      </div>
                      <div>
                        <div className="text-xs font-medium text-gray-500 mb-1">After:</div>
                        <pre className="text-xs text-gray-900 overflow-x-auto">
                          {JSON.stringify(selectedLog.changes.after, null, 2)}
                        </pre>
                      </div>
                    </div>
                  </div>
                )}

                {selectedLog.metadata && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">Metadata</label>
                    <pre className="mt-2 bg-gray-50 rounded p-3 text-xs text-gray-900 overflow-x-auto">
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
    </AdminShell>
  );
}
