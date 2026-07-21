'use client';

import { useState, useEffect } from 'react';
import { FaUsers, FaCheckCircle, FaTimesCircle, FaClock, FaChartLine } from 'react-icons/fa';
import { API } from '@/constants/api';

export default function B2BStatistics() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('medcore_token');
        const res = await fetch(`${API}/admin/b2b/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const data = await res.json();
        if (data.success) {
          setStats(data.data);
        }
      } catch (error) {
        console.error('Failed to fetch B2B stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return <div className="text-center py-12">Loading statistics...</div>;
  }

  if (!stats) {
    return <div className="text-center py-12 text-gray-500">No statistics available</div>;
  }

  const statCards = [
    {
      label: 'Total B2B Applications',
      value: stats.totalB2B,
      icon: FaUsers,
      color: 'blue'
    },
    {
      label: 'Pending Approval',
      value: stats.pendingApplications,
      icon: FaClock,
      color: 'yellow'
    },
    {
      label: 'Approved',
      value: stats.approvedB2B,
      icon: FaCheckCircle,
      color: 'green'
    },
    {
      label: 'Rejected',
      value: stats.rejectedB2B,
      icon: FaTimesCircle,
      color: 'red'
    },
    {
      label: 'Active B2B Customers',
      value: stats.activeB2B,
      icon: FaChartLine,
      color: 'purple'
    }
  ];

  const colorClasses = {
    blue: 'bg-blue-100 text-blue-600',
    yellow: 'bg-yellow-100 text-yellow-600',
    green: 'bg-green-100 text-green-600',
    red: 'bg-red-100 text-red-600',
    purple: 'bg-purple-100 text-purple-600'
  };

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`p-4 rounded-lg ${colorClasses[stat.color]}`}>
                  <Icon className="w-8 h-8" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Approval Rate */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Approval Rate</h3>
        <div className="space-y-3">
          {stats.approvedB2B + stats.rejectedB2B > 0 && (
            <>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Approved</span>
                  <span className="text-sm font-medium text-green-600">
                    {((stats.approvedB2B / (stats.approvedB2B + stats.rejectedB2B)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-green-600 h-2 rounded-full"
                    style={{ width: `${(stats.approvedB2B / (stats.approvedB2B + stats.rejectedB2B)) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-600">Rejected</span>
                  <span className="text-sm font-medium text-red-600">
                    {((stats.rejectedB2B / (stats.approvedB2B + stats.rejectedB2B)) * 100).toFixed(1)}%
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-red-600 h-2 rounded-full"
                    style={{ width: `${(stats.rejectedB2B / (stats.approvedB2B + stats.rejectedB2B)) * 100}%` }}
                  />
                </div>
              </div>
            </>
          )}
          {stats.approvedB2B + stats.rejectedB2B === 0 && (
            <p className="text-center text-gray-500 py-4">No applications processed yet</p>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-[#0E8A6E] to-[#0c7a5f] rounded-lg shadow p-6 text-white">
        <h3 className="text-lg font-semibold mb-2">Need Attention</h3>
        <p className="text-white/90 mb-4">
          You have <strong>{stats.pendingApplications}</strong> B2B applications waiting for review
        </p>
        {stats.pendingApplications > 0 && (
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-white text-[#0E8A6E] rounded-lg hover:bg-gray-100 font-medium"
          >
            Review Applications
          </button>
        )}
      </div>
    </div>
  );
}
