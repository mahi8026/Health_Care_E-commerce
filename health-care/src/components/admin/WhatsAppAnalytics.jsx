'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function WhatsAppAnalytics() {
  const router = useRouter();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [dateRange, setDateRange] = useState('last_7_days');
  const [customDates, setCustomDates] = useState({ startDate: '', endDate: '' });

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);

      let params = {};
      
      if (dateRange === 'custom' && customDates.startDate && customDates.endDate) {
        params.startDate = customDates.startDate;
        params.endDate = customDates.endDate;
      } else if (dateRange !== 'all_time') {
        const now = new Date();
        const days = {
          today: 0,
          last_7_days: 7,
          last_30_days: 30
        }[dateRange] || 7;
        
        const startDate = new Date(now);
        startDate.setDate(startDate.getDate() - days);
        params.startDate = startDate.toISOString();
        params.endDate = now.toISOString();
      }

      const queryString = new URLSearchParams(params).toString();
      const response = await api.get(`/whatsapp/analytics${queryString ? `?${queryString}` : ''}`);
      
      if (response.data.success) {
        setAnalytics(response.data.analytics);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchAnalytics);
  }, [dateRange, customDates]);

  const formatNumber = (num) => {
    return num?.toLocaleString() || 0;
  };

  const formatTime = (seconds) => {
    if (!seconds) return '0m';
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const getStatusData = () => {
    if (!analytics?.byStatus) return [];
    return analytics.byStatus.map(item => ({
      label: item._id || 'Unknown',
      value: item.count,
      color: {
        active: 'bg-[var(--color-status-success-tint)]',
        resolved: 'bg-blue-500',
        pending: 'bg-[var(--color-status-warning-tint)]',
        escalated: 'bg-[var(--color-status-danger-tint)]',
        closed: 'bg-[var(--color-background-secondary)]'
      }[item._id] || 'bg-[var(--color-background-secondary)]'
    }));
  };

  const getCategoryData = () => {
    if (!analytics?.byCategory) return [];
    return analytics.byCategory.map(item => ({
      label: item._id?.replace(/_/g, ' ') || 'Unknown',
      value: item.count
    })).sort((a, b) => b.value - a.value);
  };

  const getBotVsHumanData = () => {
    if (!analytics?.botVsHuman) return [];
    return analytics.botVsHuman.map(item => ({
      label: item._id ? 'Bot' : 'Human',
      value: item.count,
      color: item._id ? 'bg-purple-500' : 'bg-cyan-500'
    }));
  };

  const getMessageDirectionData = () => {
    if (!analytics?.messagesByDirection) return [];
    return analytics.messagesByDirection.map(item => ({
      label: item._id === 'inbound' ? 'Inbound' : 'Outbound',
      value: item.count,
      color: item._id === 'inbound' ? 'bg-blue-500' : 'bg-[var(--color-status-success-tint)]'
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--color-background-secondary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-[var(--color-text-secondary)] mt-4">Loading analytics...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[var(--color-background-secondary)] flex items-center justify-center p-4">
        <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full text-center">
          <span className="text-6xl">⚠️</span>
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mt-4">Error Loading Analytics</h2>
          <p className="text-[var(--color-text-secondary)] mt-2">{error}</p>
          <button
            onClick={fetchAnalytics}
            className="mt-6 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background-secondary)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* Date Range Filter */}
        <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] p-4 mb-6">
          <div className="flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px]">
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Date Range</label>
              <select
                value={dateRange}
                onChange={(e) => setDateRange(e.target.value)}
                className="w-full px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
              >
                <option value="today">Today</option>
                <option value="last_7_days">Last 7 Days</option>
                <option value="last_30_days">Last 30 Days</option>
                <option value="all_time">All Time</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            {dateRange === 'custom' && (
              <>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">Start Date</label>
                  <input
                    type="date"
                    value={customDates.startDate}
                    onChange={(e) => setCustomDates(prev => ({ ...prev, startDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
                <div className="flex-1 min-w-[200px]">
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">End Date</label>
                  <input
                    type="date"
                    value={customDates.endDate}
                    onChange={(e) => setCustomDates(prev => ({ ...prev, endDate: e.target.value }))}
                    className="w-full px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  />
                </div>
              </>
            )}
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Total Conversations</p>
                <p className="text-3xl font-semibold text-[var(--color-text-primary)] mt-2">
                  {formatNumber(analytics?.totalConversations)}
                </p>
              </div>
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">💬</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Total Messages</p>
                <p className="text-3xl font-semibold text-[var(--color-text-primary)] mt-2">
                  {formatNumber(analytics?.totalMessages)}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-status-success-tint)] rounded-lg flex items-center justify-center">
                <span className="text-2xl">📨</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Avg Response Time</p>
                <p className="text-3xl font-semibold text-[var(--color-text-primary)] mt-2">
                  {formatTime(analytics?.avgResponseTime)}
                </p>
              </div>
              <div className="w-12 h-12 bg-[var(--color-status-warning-tint)] rounded-lg flex items-center justify-center">
                <span className="text-2xl">⏱️</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-[var(--color-text-secondary)]">Bot Conversations</p>
                <p className="text-3xl font-semibold text-[var(--color-text-primary)] mt-2">
                  {formatNumber(getBotVsHumanData().find(d => d.label === 'Bot')?.value || 0)}
                </p>
              </div>
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <span className="text-2xl">🤖</span>
              </div>
            </div>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversations by Status */}
          <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Conversations by Status</h3>
            <div className="space-y-3">
              {getStatusData().map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[var(--color-text-primary)] capitalize">{item.label}</span>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{item.value}</span>
                  </div>
                  <div className="w-full bg-[var(--color-background-muted)] rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${(item.value / analytics.totalConversations) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Messages by Direction */}
          <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Messages by Direction</h3>
            <div className="space-y-3">
              {getMessageDirectionData().map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</span>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{item.value}</span>
                  </div>
                  <div className="w-full bg-[var(--color-background-muted)] rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${(item.value / analytics.totalMessages) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Bot vs Human */}
          <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Bot vs Human Conversations</h3>
            <div className="space-y-3">
              {getBotVsHumanData().map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.label}</span>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{item.value}</span>
                  </div>
                  <div className="w-full bg-[var(--color-background-muted)] rounded-full h-2">
                    <div
                      className={`${item.color} h-2 rounded-full transition-all`}
                      style={{ width: `${(item.value / analytics.totalConversations) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Conversations by Category */}
          <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] p-6">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Top Categories</h3>
            <div className="space-y-3">
              {getCategoryData().slice(0, 5).map((item, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-[var(--color-text-primary)] capitalize">{item.label}</span>
                    <span className="text-sm font-semibold text-[var(--color-text-primary)]">{item.value}</span>
                  </div>
                  <div className="w-full bg-[var(--color-background-muted)] rounded-full h-2">
                    <div
                      className="bg-indigo-500 h-2 rounded-full transition-all"
                      style={{ width: `${(item.value / analytics.totalConversations) * 100}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* All Categories Table */}
        <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-primary)] mt-6 overflow-hidden">
          <div className="p-6 border-b border-[var(--color-border-primary)]">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">All Categories</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-[var(--color-background-secondary)]">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Count
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-[var(--color-border-primary)]">
                {getCategoryData().map((item, index) => (
                  <tr key={index} className="hover:bg-[var(--color-background-secondary)]">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-[var(--color-text-primary)] capitalize">
                      {item.label}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                      {item.value}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-[var(--color-text-primary)]">
                      {((item.value / analytics.totalConversations) * 100).toFixed(1)}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
