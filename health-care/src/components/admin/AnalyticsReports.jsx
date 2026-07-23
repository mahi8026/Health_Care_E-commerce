"use client";

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import ChartSkeleton from './ChartSkeleton';
import { API } from '@/constants/api';

const AnalyticsCharts = dynamic(
  () => import('./AnalyticsCharts'),
  {
    loading: () => (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    ),
    ssr: false,
  }
);

const PERIODS = [
  { value: 'week', label: 'This Week' },
  { value: 'month', label: 'This Month' },
  { value: 'quarter', label: 'This Quarter' },
  { value: 'year', label: 'This Year' },
];

export default function AnalyticsReports() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [period, setPeriod] = useState('month');

  useEffect(() => {
    const fetchAnalytics = async () => {
      setLoading(true);
      setError(null);
      try {
        const token = localStorage.getItem('Mediport_token');
        const headers = { Authorization: `Bearer ${token}` };

        // Build date range from period
        const now = new Date();
        const endDate = now.toISOString().split('T')[0];
        let startDate;
        if (period === 'week') {
          const d = new Date(now); d.setDate(d.getDate() - 7);
          startDate = d.toISOString().split('T')[0];
        } else if (period === 'month') {
          const d = new Date(now); d.setMonth(d.getMonth() - 1);
          startDate = d.toISOString().split('T')[0];
        } else if (period === 'quarter') {
          const d = new Date(now); d.setMonth(d.getMonth() - 3);
          startDate = d.toISOString().split('T')[0];
        } else {
          const d = new Date(now); d.setFullYear(d.getFullYear() - 1);
          startDate = d.toISOString().split('T')[0];
        }

        const params = `startDate=${startDate}&endDate=${endDate}`;

        const [salesRes, ordersRes, customersRes, productsRes, paymentsRes] = await Promise.all([
          fetch(`${API}/analytics/sales?${params}&groupBy=day`, { headers }),
          fetch(`${API}/analytics/orders?${params}`, { headers }),
          fetch(`${API}/analytics/customers?${params}`, { headers }),
          fetch(`${API}/analytics/products?${params}&limit=5`, { headers }),
          fetch(`${API}/analytics/payments?${params}`, { headers }),
        ]);

        const [sales, orders, customers, products, payments] = await Promise.all([
          salesRes.json(),
          ordersRes.json(),
          customersRes.json(),
          productsRes.json(),
          paymentsRes.json(),
        ]);

        setAnalytics({
          totalRevenue: sales.data?.totalRevenue ?? 0,
          totalOrders: orders.data?.totalOrders ?? 0,
          avgOrderValue: sales.data?.avgOrderValue ?? 0,
          retentionRate: customers.data?.retentionRate ?? 0,
          revenueGrowth: sales.data?.revenueGrowth ?? null,
          ordersGrowth: orders.data?.ordersGrowth ?? null,
          topProducts: products.data?.topProducts || [],
          topCustomers: customers.data?.topCustomers || [],
          revenueByPeriod: sales.data?.data || [],
          paymentBreakdown: payments.data?.breakdown || [],
        });
      } catch (err) {
        setError('Failed to load analytics. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchAnalytics();
  }, [period]);

  const fmt = (n) => {
    if (n >= 1_000_000) return `৳${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `৳${(n / 1_000).toFixed(0)}K`;
    return `৳${n.toLocaleString()}`;
  };

  const fmtChange = (v) => {
    if (v == null) return null;
    return `${v > 0 ? '+' : ''}${v}%`;
  };

  if (loading) {
    return (
      <div>
        <div className="flex flex-wrap gap-2 mb-6">
          {PERIODS.map(p => (
            <div key={p.value} className="h-11 w-24 bg-[var(--color-background-tertiary)] rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-24 bg-[var(--color-background-tertiary)] rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
          <ChartSkeleton />
          <ChartSkeleton />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-[13px] text-[#E24B4A]">
        {error}
        <button
          onClick={() => setPeriod(p => p)}
          className="block mx-auto mt-3 text-[12px] text-[#0E8A6E] hover:underline"
        >
          Retry
        </button>
      </div>
    );
  }

  const metrics = [
    {
      label: 'Total Revenue',
      value: fmt(analytics?.totalRevenue || 0),
      change: fmtChange(analytics?.revenueGrowth),
      period: PERIODS.find(p => p.value === period)?.label,
    },
    {
      label: 'Total Orders',
      value: (analytics?.totalOrders || 0).toLocaleString(),
      change: fmtChange(analytics?.ordersGrowth),
      period: PERIODS.find(p => p.value === period)?.label,
    },
    {
      label: 'Avg Order Value',
      value: fmt(analytics?.avgOrderValue || 0),
      change: null,
      period: PERIODS.find(p => p.value === period)?.label,
    },
    {
      label: 'Customer Retention',
      value: analytics?.retentionRate ? `${analytics.retentionRate}%` : '—',
      change: null,
      period: 'Rolling 90 days',
    },
  ];

  return (
    <div>
      {/* Period Selector */}
      <div className="flex flex-wrap gap-2 mb-6">
        {PERIODS.map(p => (
          <button
            key={p.value}
            onClick={() => setPeriod(p.value)}
            className={`min-h-[44px] px-4 py-2 rounded-lg text-[12px] font-medium transition-colors ${
              period === p.value
                ? 'bg-[#0B2545] text-white'
                : 'bg-white border-[0.5px] border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)]'
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
            <div className="text-[11px] text-[var(--color-text-secondary)] mb-2">
              {metric.label}
            </div>
            <div className="text-[24px] font-bold mb-1 font-[family-name:var(--font-plus-jakarta)]">
              {metric.value}
            </div>
            <div className="flex items-center gap-2">
              {metric.change && (
                <span className={`text-[10px] font-medium ${
                  metric.change.startsWith('+') ? 'text-[#0E8A6E]' : 'text-[#E24B4A]'
                }`}>
                  {metric.change}
                </span>
              )}
              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                {metric.period}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <AnalyticsCharts />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
          <h3 className="text-[14px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
            Top Products by Revenue
          </h3>
          {analytics?.topProducts?.length === 0 ? (
            <p className="text-[12px] text-[var(--color-text-secondary)] text-center py-4">No data for this period</p>
          ) : (
            <div className="space-y-3">
              {(analytics?.topProducts || []).map((product, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--color-background-tertiary)] rounded-lg flex items-center justify-center text-[11px] font-bold text-[var(--color-text-secondary)]">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-medium mb-[2px] font-[family-name:var(--font-plus-jakarta)]">
                      {product.name || product._id}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-secondary)]">
                      {product.totalSold || product.sales || 0} units sold
                    </div>
                  </div>
                  <div className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                    {fmt(product.totalRevenue || product.revenue || 0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
          <h3 className="text-[14px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
            Top Customers by Spending
          </h3>
          {analytics?.topCustomers?.length === 0 ? (
            <p className="text-[12px] text-[var(--color-text-secondary)] text-center py-4">No data for this period</p>
          ) : (
            <div className="space-y-3">
              {(analytics?.topCustomers || []).map((customer, index) => (
                <div key={index} className="flex items-center gap-3">
                  <div className="w-8 h-8 bg-[var(--color-background-tertiary)] rounded-lg flex items-center justify-center text-[11px] font-bold text-[var(--color-text-secondary)]">
                    #{index + 1}
                  </div>
                  <div className="flex-1">
                    <div className="text-[12px] font-medium mb-[2px] font-[family-name:var(--font-plus-jakarta)]">
                      {customer.name || customer._id}
                    </div>
                    <div className="text-[10px] text-[var(--color-text-secondary)]">
                      {customer.totalOrders || customer.orders || 0} orders
                    </div>
                  </div>
                  <div className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                    {fmt(customer.totalSpent || customer.spent || 0)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
