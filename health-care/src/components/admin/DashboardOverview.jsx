"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSkeleton from './DashboardSkeleton';
import OrderDetailModal from './OrderDetailModal';
import KPIDetailModal from './KPIDetailModal';
import { API } from '@/constants/api';

export default function DashboardOverview() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedKPI, setSelectedKPI] = useState(null);
  const [abandonedCartStats, setAbandonedCartStats] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('medcore_token');
        const res = await fetch(`${API}/admin/dashboard`, {
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

  useEffect(() => {
    const fetchAbandonedCartStats = async () => {
      try {
        const token = localStorage.getItem('medcore_token');
        const res = await fetch(`${API}/cart/admin/stats`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setAbandonedCartStats(data.data);
        }
      } catch (err) {
        console.error('Failed to load abandoned cart stats:', err);
      }
    };
    fetchAbandonedCartStats();
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
      icon: '💰',
      action: (kpi) => setSelectedKPI(kpi)
    },
    {
      label: 'Total Orders',
      value: String(stats?.kpis?.totalOrders ?? 0),
      change: stats?.kpis?.ordersGrowth != null ? `${stats.kpis.ordersGrowth > 0 ? '+' : ''}${stats.kpis.ordersGrowth}% this month` : '',
      trend: 'up',
      icon: '📦',
      action: (kpi) => setSelectedKPI(kpi)
    },
    {
      label: 'Active B2B Clients',
      value: (stats?.kpis?.activeB2B ?? 0).toLocaleString(),
      change: stats?.kpis?.pendingQuotes ? `${stats.kpis.pendingQuotes} pending quotes` : '',
      trend: 'up',
      icon: '👥',
      action: (kpi) => setSelectedKPI(kpi)
    },
    {
      label: 'Abandoned Carts',
      value: String(abandonedCartStats?.totalAbandoned ?? 0),
      change: abandonedCartStats?.totalValueAtRisk ? `৳${(abandonedCartStats.totalValueAtRisk / 1000).toFixed(0)}K at risk` : 'No data',
      trend: 'warning',
      icon: '🛒',
      action: (kpi) => setSelectedKPI(kpi)
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
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
        {kpis.map((kpi, index) => (
          <button
            key={index}
            onClick={() => kpi.action(kpi)}
            className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)] hover:border-[#0B2545] hover:shadow-md transition-all cursor-pointer text-left group"
          >
            <div className="flex items-start justify-between mb-3">
              <div className="text-[24px] group-hover:scale-110 transition-transform">{kpi.icon}</div>
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
            <div className="text-[24px] font-bold mb-1 font-[family-name:var(--font-plus-jakarta)] group-hover:text-[#0B2545] transition-colors">
              {kpi.value}
            </div>
            <div className="text-[11px] text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)] transition-colors">
              {kpi.label}
            </div>
          </button>
        ))}
      </div>

      {/* Modals */}
      {selectedOrder && (
        <OrderDetailModal 
          orderId={selectedOrder}
          onClose={() => setSelectedOrder(null)}
        />
      )}

      {selectedKPI && (
        <KPIDetailModal
          kpi={selectedKPI}
          onClose={() => setSelectedKPI(null)}
          onNavigate={(tab) => router.push(`/admin/${tab}`)}
        />
      )}

      <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-4">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg p-4 md:p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
              Recent Orders
            </h3>
            <button
              onClick={() => router.push('/admin/orders')}
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
                <button
                  key={order._id || order.orderNumber}
                  onClick={() => setSelectedOrder(order._id || order.orderNumber)}
                  className="w-full flex items-center gap-4 p-3 bg-[var(--color-background-tertiary)] rounded-lg hover:bg-[#E6F1FB] hover:border-[#0B2545] border-[0.5px] border-transparent transition-all cursor-pointer text-left group"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)] group-hover:text-[#0B2545]">
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
                    <div className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)] group-hover:text-[#0B2545]">
                      ৳{(order.totalAmount || order.total || 0).toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-tertiary)]">
                      {order.createdAt ? new Date(order.createdAt).toLocaleDateString('en-BD') : ''}
                    </div>
                  </div>
                  <svg 
                    width="16" 
                    height="16" 
                    viewBox="0 0 24 24" 
                    fill="none" 
                    stroke="currentColor" 
                    strokeWidth="2"
                    className="text-[var(--color-text-tertiary)] group-hover:text-[#0B2545] group-hover:translate-x-1 transition-all"
                  >
                    <polyline points="9 18 15 12 9 6"/>
                  </svg>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Abandoned Cart Stats */}
        <div className="bg-white rounded-lg p-4 md:p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[14px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
              Cart Recovery
            </h3>
          </div>

          {abandonedCartStats ? (
            <div className="space-y-4">
              <div className="p-3 bg-[#FEF3C7] rounded-lg">
                <div className="text-[10px] text-[#92400E] mb-1 uppercase tracking-wide">Total Abandoned</div>
                <div className="text-[20px] font-bold text-[#92400E] font-[family-name:var(--font-plus-jakarta)]">
                  {abandonedCartStats.totalAbandoned}
                </div>
              </div>

              <div className="p-3 bg-[#FEE2E2] rounded-lg">
                <div className="text-[10px] text-[#991B1B] mb-1 uppercase tracking-wide">Value at Risk</div>
                <div className="text-[20px] font-bold text-[#991B1B] font-[family-name:var(--font-plus-jakarta)]">
                  ৳{(abandonedCartStats.totalValueAtRisk / 1000).toFixed(0)}K
                </div>
              </div>

              <div className="p-3 bg-[#D1FAE5] rounded-lg">
                <div className="text-[10px] text-[#065F46] mb-1 uppercase tracking-wide">Recovery Rate</div>
                <div className="text-[20px] font-bold text-[#065F46] font-[family-name:var(--font-plus-jakarta)]">
                  {abandonedCartStats.recoveryRate}%
                </div>
              </div>

              <div className="p-3 bg-[#E0E7FF] rounded-lg">
                <div className="text-[10px] text-[#3730A3] mb-1 uppercase tracking-wide">Emails Sent</div>
                <div className="text-[20px] font-bold text-[#3730A3] font-[family-name:var(--font-plus-jakarta)]">
                  {abandonedCartStats.emailsSent}
                </div>
              </div>

              <div className="text-[10px] text-[var(--color-text-secondary)] pt-2 border-t border-[var(--color-border-tertiary)]">
                Recovery emails sent automatically 1 hour after cart abandonment
              </div>
            </div>
          ) : (
            <p className="text-[12px] text-[var(--color-text-secondary)] text-center py-6">Loading stats...</p>
          )}
        </div>
      </div>

      {/* Stock Alerts Section */}
      <div className="mt-4 bg-white rounded-lg p-4 md:p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[14px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
            Stock Alerts
          </h3>
          <button
            onClick={() => router.push('/admin/products')}
            className="text-[11px] text-[#0E8A6E] font-medium hover:underline"
          >
            Manage →
          </button>
        </div>

        {stockAlerts.length === 0 ? (
          <p className="text-[12px] text-[var(--color-text-secondary)] text-center py-6">No stock alerts</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {stockAlerts.map((alert, index) => (
              <div key={index} className="p-3 bg-[#FEF3C7] rounded-lg border-[0.5px] border-[#FDE68A]">
                <div className="flex items-start gap-2 mb-2">
                  <span className="text-[16px]">⚠️</span>
                  <div className="flex-1">
                    <div className="text-[11px] font-medium mb-1 font-[family-name:var(--font-plus-jakarta)]">
                      {alert.name || alert.product}
                    </div>
                    <div className="text-[10px] text-[#92400E]">
                      Stock: {alert.stock ?? alert.currentStock} units
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => router.push('/admin/products')}
                  className="w-full text-[10px] px-3 py-[6px] bg-white border-[0.5px] border-[#FDE68A] rounded text-[#92400E] font-medium hover:bg-[#FFFBEB] hover:border-[#FCD34D] transition-all"
                >
                  Reorder
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
