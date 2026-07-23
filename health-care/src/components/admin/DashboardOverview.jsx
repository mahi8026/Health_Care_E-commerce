'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import DashboardSkeleton from './DashboardSkeleton';
import OrderDetailModal from './OrderDetailModal';
import KPIDetailModal from './KPIDetailModal';
import { API } from '@/constants/api';
import { formatBdt, formatPrice, formatGrowthBadge } from '@/utils/formatBdt';

function KPICard({ label, value, subtitle, badge, trend, icon, accent, onClick }) {
  const badgeStyles = {
    up: 'bg-emerald-50 text-emerald-800 border border-emerald-100',
    down: 'bg-red-50 text-red-800 border border-red-100',
    neutral: 'bg-gray-50 text-gray-600 border border-gray-100',
    warning: 'bg-amber-50 text-amber-800 border border-amber-100',
  };

  return (
    <button
      type="button"
      onClick={onClick}
      className="group text-left bg-white rounded-xl border border-gray-100 p-5 hover:border-[#0E8A6E]/40 hover:shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-[#0E8A6E]/20"
    >
      <div className="flex items-start justify-between gap-3 mb-4">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: `${accent}18`, color: accent }}
        >
          {icon}
        </div>
        {badge?.text && (
          <span
            className={`text-[10px] font-semibold px-2 py-1 rounded-full whitespace-nowrap ${badgeStyles[badge.variant] || badgeStyles.neutral}`}
          >
            {badge.text}
          </span>
        )}
      </div>
      <p className="text-[26px] font-bold text-[#0B2545] leading-none tracking-tight font-[family-name:var(--font-plus-jakarta)] group-hover:text-[#0E8A6E] transition-colors">
        {value}
      </p>
      <p className="text-[13px] font-semibold text-[#374151] mt-2">{label}</p>
      {subtitle && (
        <p className="text-[11px] text-[#6B7280] mt-0.5">{subtitle}</p>
      )}
    </button>
  );
}

export default function DashboardOverview() {
  const router = useRouter();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedKPI, setSelectedKPI] = useState(null);

  const fetchDashboard = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/admin/dashboard`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: 'no-store',
      });
      if (!res.ok) throw new Error('Failed to load dashboard');
      const data = await res.json();
      setStats(data.data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
    const interval = setInterval(fetchDashboard, 60_000);
    return () => clearInterval(interval);
  }, [fetchDashboard]);

  if (loading && !stats) return <DashboardSkeleton />;

  if (error && !stats) {
    return (
      <div className="p-8 text-center bg-white rounded-xl border border-red-100">
        <p className="text-[14px] text-[#991B1B] mb-3">Failed to load dashboard: {error}</p>
        <button
          type="button"
          onClick={fetchDashboard}
          className="px-4 py-2 bg-[#0B2545] text-white rounded-lg text-[13px] font-semibold"
        >
          Retry
        </button>
      </div>
    );
  }

  const k = stats?.kpis || {};
  const revenueBadge = formatGrowthBadge(k.revenueGrowth, k.revenueGrowthTrend);
  const ordersBadge = formatGrowthBadge(k.ordersGrowth, k.ordersGrowthTrend);

  const kpis = [
    {
      label: 'Revenue (YTD)',
      value: formatBdt(k.totalRevenue),
      subtitle: `${formatBdt(k.thisMonthRevenue ?? 0)} this month`,
      badge: revenueBadge,
      icon: '💰',
      accent: '#0E8A6E',
      detail: { stats: k, type: 'revenue' },
      navigate: 'analytics',
    },
    {
      label: 'Total Orders',
      value: (k.totalOrders ?? 0).toLocaleString('en-BD'),
      subtitle: `${k.ordersThisMonth ?? 0} orders this month`,
      badge: ordersBadge,
      icon: '📦',
      accent: '#2563EB',
      detail: { stats: k, type: 'orders' },
      navigate: 'orders',
    },
    {
      label: 'Active B2B Clients',
      value: (k.activeB2B ?? 0).toLocaleString('en-BD'),
      subtitle: k.pendingQuotes
        ? `${k.pendingQuotes} pending quote${k.pendingQuotes === 1 ? '' : 's'}`
        : 'No pending quotes',
      badge: k.pendingQuotes
        ? { text: `${k.pendingQuotes} pending`, variant: 'warning' }
        : { text: 'All clear', variant: 'neutral' },
      icon: '👥',
      accent: '#7C3AED',
      detail: { stats: k, type: 'b2b' },
      navigate: 'customers',
    },
    {
      label: 'Abandoned Carts',
      value: String(k.abandonedCarts ?? 0),
      subtitle:
        (k.abandonedCartValue ?? 0) > 0
          ? `${formatPrice(k.abandonedCartValue)} at risk`
          : 'No carts at risk',
      badge:
        (k.abandonedCarts ?? 0) > 0
          ? { text: `${k.cartRecoveryRate ?? 0}% recovered`, variant: 'warning' }
          : { text: 'Healthy', variant: 'up' },
      icon: '🛒',
      accent: '#D97706',
      detail: { stats: k, type: 'carts' },
      navigate: 'orders',
    },
  ];

  const recentOrders = stats?.recentOrders || [];
  const stockAlerts = [
    ...(stats?.stockAlerts?.criticalStock || []),
    ...(stats?.stockAlerts?.lowStock || []),
  ].slice(0, 5);

  const abandonedCartPanel = {
    totalAbandoned: k.abandonedCarts ?? 0,
    totalValueAtRisk: k.abandonedCartValue ?? 0,
    recoveryRate: k.cartRecoveryRate ?? 0,
    emailsSent: k.cartEmailsSent ?? 0,
  };

  const getStatusColor = (status) => {
    const colors = {
      placed: 'bg-[#FEF3C7] text-[#92400E]',
      pending: 'bg-[#FEF3C7] text-[#92400E]',
      confirmed: 'bg-[#DBEAFE] text-[#1E40AF]',
      processing: 'bg-[#E0E7FF] text-[#3730A3]',
      shipped: 'bg-[#E0E7FF] text-[#3730A3]',
      delivered: 'bg-[#D1FAE5] text-[#065F46]',
      cancelled: 'bg-[#FEE2E2] text-[#991B1B]',
    };
    return colors[status] || colors.placed;
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
        <p className="text-[11px] text-[#6B7280]">
          Live metrics
          {lastUpdated && (
            <span className="text-[#9CA3AF]">
              {' · '}
              Updated {lastUpdated.toLocaleTimeString('en-BD', { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
        </p>
        <button
          type="button"
          onClick={fetchDashboard}
          disabled={loading}
          className="px-3 py-1.5 text-[11px] font-semibold text-[#0B2545] border border-gray-200 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          {loading ? 'Refreshing…' : 'Refresh'}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 mb-6">
        {kpis.map((kpi) => (
          <KPICard
            key={kpi.label}
            label={kpi.label}
            value={kpi.value}
            subtitle={kpi.subtitle}
            badge={kpi.badge}
            icon={kpi.icon}
            accent={kpi.accent}
            onClick={() =>
              setSelectedKPI({
                label: kpi.label,
                value: kpi.value,
                change: kpi.badge?.text,
                icon: kpi.icon,
                detailStats: kpi.detail,
              })
            }
          />
        ))}
      </div>

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
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[15px] font-semibold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
              Recent Orders
            </h3>
            <button
              type="button"
              onClick={() => router.push('/admin/orders')}
              className="text-[12px] text-[#0E8A6E] font-semibold hover:underline"
            >
              View all →
            </button>
          </div>

          {recentOrders.length === 0 ? (
            <p className="text-[13px] text-[#6B7280] text-center py-8">No orders yet</p>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <button
                  key={order._id || order.orderNumber}
                  type="button"
                  onClick={() => setSelectedOrder(order._id || order.orderNumber)}
                  className="w-full flex items-center gap-4 p-3.5 rounded-lg border border-gray-50 bg-surface-subtle hover:border-[#0E8A6E]/30 hover:bg-[#F0FBF8] transition-all text-left group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-[13px] font-semibold text-[#0B2545] group-hover:text-[#0E8A6E]">
                        {order.orderNumber || order.id}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    </div>
                    <p className="text-[12px] text-[#6B7280] truncate">
                      {order.user?.name || order.user?.companyName || order.customer || 'Customer'}
                    </p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-[14px] font-bold text-[#0B2545]">
                      {formatPrice(order.totalAmount || order.total || 0)}
                    </p>
                    <p className="text-[11px] text-[#9CA3AF]">
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString('en-BD', {
                            day: 'numeric',
                            month: 'short',
                          })
                        : ''}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h3 className="text-[15px] font-semibold text-[#0B2545] mb-4 font-[family-name:var(--font-plus-jakarta)]">
            Cart Recovery
          </h3>
          <div className="space-y-3">
            <div className="p-3.5 rounded-lg bg-amber-50 border border-amber-100">
              <p className="text-[10px] font-semibold text-amber-800 uppercase tracking-wide">Abandoned</p>
              <p className="text-[22px] font-bold text-amber-900 mt-1">{abandonedCartPanel.totalAbandoned}</p>
            </div>
            <div className="p-3.5 rounded-lg bg-red-50 border border-red-100">
              <p className="text-[10px] font-semibold text-red-800 uppercase tracking-wide">Value at risk</p>
              <p className="text-[22px] font-bold text-red-900 mt-1">
                {formatPrice(abandonedCartPanel.totalValueAtRisk)}
              </p>
            </div>
            <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-100">
              <p className="text-[10px] font-semibold text-emerald-800 uppercase tracking-wide">Recovery rate</p>
              <p className="text-[22px] font-bold text-emerald-900 mt-1">{abandonedCartPanel.recoveryRate}%</p>
            </div>
            <div className="p-3.5 rounded-lg bg-indigo-50 border border-indigo-100">
              <p className="text-[10px] font-semibold text-indigo-800 uppercase tracking-wide">Emails sent</p>
              <p className="text-[22px] font-bold text-indigo-900 mt-1">{abandonedCartPanel.emailsSent}</p>
            </div>
          </div>
          <p className="text-[11px] text-[#6B7280] mt-4 pt-3 border-t border-gray-100">
            Recovery emails run automatically for carts inactive over 1 hour.
          </p>
        </div>
      </div>

      <div className="mt-4 bg-white rounded-xl p-5 border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-[15px] font-semibold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
            Stock Alerts
          </h3>
          <button
            type="button"
            onClick={() => router.push('/admin/products')}
            className="text-[12px] text-[#0E8A6E] font-semibold hover:underline"
          >
            Manage →
          </button>
        </div>

        {stockAlerts.length === 0 ? (
          <p className="text-[13px] text-[#6B7280] text-center py-8">All products adequately stocked</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {stockAlerts.map((alert, index) => (
              <div
                key={alert._id || alert.sku || index}
                className="p-3.5 rounded-lg bg-amber-50 border border-amber-100"
              >
                <p className="text-[12px] font-semibold text-[#0B2545] line-clamp-2 mb-1">
                  {alert.name || alert.product}
                </p>
                <p className="text-[11px] text-amber-800 font-medium">
                  {alert.stock ?? alert.currentStock} units left
                </p>
                <button
                  type="button"
                  onClick={() => router.push('/admin/products')}
                  className="mt-2 w-full text-[11px] py-1.5 bg-white border border-amber-200 rounded-md text-amber-900 font-medium hover:bg-amber-50"
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
