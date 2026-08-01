'use client';

/**
 * AnalyticsCharts — Simple fallback charts for analytics.
 * 
 * Note: Recharts has been temporarily disabled due to build compatibility issues
 * with React 19 and Next.js 16. This component shows placeholder charts until
 * the recharts dependency is updated or replaced.
 */
export default function AnalyticsCharts() {
  const monthlyData = [
    { month: 'Jan', revenue: 8200000, orders: 820 },
    { month: 'Feb', revenue: 9100000, orders: 910 },
    { month: 'Mar', revenue: 10500000, orders: 1050 },
    { month: 'Apr', revenue: 9800000, orders: 980 },
    { month: 'May', revenue: 11200000, orders: 1120 },
    { month: 'Jun', revenue: 12500000, orders: 1248 },
  ];

  const formatRevenue = (value) => {
    if (value >= 1000000) return `৳${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `৳${(value / 1000).toFixed(0)}K`;
    return `৳${value}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {/* Monthly Revenue Table */}
      <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
        <h3 className="text-sm font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
          Monthly Revenue
        </h3>
        <div className="space-y-2">
          {monthlyData.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-[var(--color-border-tertiary)] last:border-0">
              <span className="text-xs text-[var(--color-text-secondary)]">{item.month}</span>
              <span className="text-sm font-semibold text-brand-teal">{formatRevenue(item.revenue)}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Monthly Orders Table */}
      <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
        <h3 className="text-sm font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
          Monthly Orders
        </h3>
        <div className="space-y-2">
          {monthlyData.map((item, index) => (
            <div key={index} className="flex items-center justify-between py-2 border-b border-[var(--color-border-tertiary)] last:border-0">
              <span className="text-xs text-[var(--color-text-secondary)]">{item.month}</span>
              <span className="text-sm font-semibold text-[var(--color-status-info)]">{item.orders.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
