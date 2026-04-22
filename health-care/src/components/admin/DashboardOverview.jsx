"use client";

import { useState, useEffect } from 'react';
import DashboardSkeleton from './DashboardSkeleton';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export default function DashboardOverview({ setActiveTab }) {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('medcore_token');
        const res = await fetch(`${API}/api/admin/dashboard`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) throw new Error('Failed to load dashboard');
        const data = await res.json();
        setStats(data.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  if (loading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="p-6 text-center text-[13px] text-[#E24B4A]">
        Failed to load dashboard: {error}
      </div>
    );
  }

  const kpis = [
    {
      label: 'Total Revenue',
      value: stats?.kpis?.totalRevenue ? `৳${(stats.kpis.totalRevenue / 1000000).toFixed(1)}M` : '৳0',
      change: stats?.kpis?.revenueGrowth != null ? `${stats.kpis.revenueGrowth > 0 ? '+' : ''}${stats.kpis.revenueGrowth}%` : 'N/A',
      trend: (stats?.kpis?.revenueGrowth || 0) >= 0 ? 'up' : 'down',
      icon: '💰'
    },
    {
      label: 'Total Orders',
      value: String(stats?.kpis?.totalOrders ?? 0),
      change: stats?.kpis?.ordersGrowth != null ? `${stats.kpis.ordersGrowth > 0 ? '+' : ''}${stats.kpis.ordersGrowth}% this month` : '',
      trend: 'up',
      icon: '📦'
    },
    {
      label: 'Active B2B Clients',
      value: (stats?.kpis?.activeB2B ?? 0).toLocaleString(),
      change: stats?.kpis?.pendingQuotes ? `${stats.kpis.pendingQuotes} pending quotes` : '',
      trend: 'up',
      icon: '👥'
    },
    {
      label: 'Low Stock Items',
      value: String((stats?.stockAlerts?.lowStock?.length || 0) + (stats?.stockAlerts?.criticalStock?.length || 0)),
      change: 'Needs attention',
      trend: 'warning',
      icon: '⚠️'
    }
  ];

  const recentOrders = stats?.recentOrders || [];
  const stockAlerts = [
    ...(stats?.stockAlerts?.criticalStock || []),
    ...(stats?.stockAlerts?.lowStock || []),
  ].slice(0, 5);

  const getStatusColor = (status) => {
    const colors = {
      placed: 'bg-[#FEF3C7] text-[#92400E]',
      pending: 'bg-[#FEF3C7] text-[#92400E]',
      confirmed: 'bg-[#DBEAFE] text-[#1E40AF]',
      processing: 'bg-[#E0E7FF] text-[#3730A3]',
      shipped: 'bg-[#E0E7FF] text-[#3730A3]',
      delivered: 'bg-[#D1FAE5] text-[#065F46]',
      cancelled: 'bg-[#FEE2E2] text-[#991B1B]'
    };
    return colors[status] || colors.placed;
  };

  return (
    <div>
      {/* KPI Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
            <div className="flex items-start justify-between mb-3">
              <div className="text-[24px]">{kpi.icon}</div>
              {kpi.change && (
                <div className={`text-[10px] px-2 py-[2px] rounded font-medium ${
                  kpi.trend === 'up' ? 'bg-[#D1FAE5] text-[#065F46]' :
                  kpi.trend === 'warning' ? 'bg-[#FEF3C7] text-[#92400E]' :
                  'bg-[#F3F4F6] text-[#6B7280]'
                }`}>
                  {kpi.change}
                </div>
              )}
            </div>
            <div className="text-[24px] font-bold mb-1 font-[family-name:var(--font-plus-jakarta)]">
              {kpi.value}
            </div>
            <div className="text-[11px] text-[var(--color-text-secondary)]">
              {kpi.label}
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-[1fr_320px] gap-4">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
              Recent Orders
            </h3>
            <button
              onClick={() => setActiveTab('orders')}
              className="text-[11px] text-[#0E8A6E] font-medium hover:underline"
            >
              View all →
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-[12px] text-[var(--color-text-secondary)] text-center py-6">No recent orders</p>
          ) : (
            <div className="space-y-3">
              {recentOrders.map(order => (
                <div key={order._id || order.orderNumber} className="flex items-center gap-4 p-3 bg-[var(--color-background-tertiary)] rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                        {order.orderNumber || order.id}
                      </span>
                      <span className={`text-[9px] px-2 py-[2px] rounded font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">
                      {order.user?.name || order.customer || 'Customer'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      ৳{(order.totalAmount || order.total || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-tertiary)]">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD') : ''}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Stock Alerts */}
        <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
              Stock Alerts
            </h3>
            <button
              onClick={() => setActiveTab('products')}
              className="text-[11px] text-[#0E8A6E] font-medium hover:underline"
            >
              Manage →
            </button>
          </div>

          {stockAlerts.length === 0 ? (
            <p className="text-[12px] text-[var(--color-text-secondary)] text-center py-6">No stock alerts</p>
          ) : (
            <div className="space-y-3">
              {stockAlerts.map((alert, index) => (
                <div key={index} className="p-3 bg-[#FEF3C7] rounded-lg border-[0.5px] border-[#FDE68A]">
                  <div className="flex items-start gap-2 mb-2">
                    <span className="text-[16px]">⚠️</span>
                    <div className="flex-1">
                      <div className="text-[11px] font-medium mb-1 font-[family-name:var(--font-plus-jakarta)]">
                        {alert.name || alert.product}
                      </div>
                      <div className="text-[10px] text-[#92400E]">
                        Stock: {alert.stock ?? alert.currentStock} units (Min: {alert.lowStockThreshold || alert.minStock || 10})
                      </div>
                    </div>
                  </div>
                  <button className="w-full text-[10px] px-3 py-[6px] bg-white border-[0.5px] border-[#FDE68A] rounded text-[#92400E] font-medium hover:bg-[#FFFBEB]">
                    Reorder now
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
