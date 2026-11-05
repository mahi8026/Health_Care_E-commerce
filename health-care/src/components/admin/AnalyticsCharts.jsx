'use client';

/**
 * AnalyticsCharts — daily revenue & order breakdown tables fed by live data.
 *
 * Note: Recharts remains disabled due to build compatibility issues with
 * React 19 / Next.js 16, so this renders compact data tables instead of
 * charts. Data comes from GET /api/analytics/sales (revenueByPeriod):
 *   [{ date: 'YYYY-MM-DD', revenue: Number, orderCount: Number }, ...]
 */
export default function AnalyticsCharts({ data = [] }) {
  const rows = Array.isArray(data) ? [...data].sort((a, b) => (a.date < b.date ? -1 : 1)) : [];

  const formatRevenue = (value) => {
    const v = Number(value) || 0;
    if (v >= 1000000) return `৳${(v / 1000000).toFixed(1)}M`;
    if (v >= 1000) return `৳${(v / 1000).toFixed(0)}K`;
    return `৳${v.toLocaleString()}`;
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {/* Revenue by Day */}
      <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
        <h3 className="text-sm font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
          Revenue by Day
        </h3>
        {rows.length === 0 ? (
          <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">No data for this period</p>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {rows.map((item) => (
              <div key={item.date} className="flex items-center justify-between py-2 border-b border-[var(--color-border-tertiary)] last:border-0">
                <span className="text-xs text-[var(--color-text-secondary)]">{item.date}</span>
                <span className="text-sm font-semibold text-brand-teal">{formatRevenue(item.revenue)}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Orders by Day */}
      <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
        <h3 className="text-sm font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
          Orders by Day
        </h3>
        {rows.length === 0 ? (
          <p className="text-xs text-[var(--color-text-secondary)] text-center py-4">No data for this period</p>
        ) : (
          <div className="space-y-2 max-h-[320px] overflow-y-auto">
            {rows.map((item) => (
              <div key={item.date} className="flex items-center justify-between py-2 border-b border-[var(--color-border-tertiary)] last:border-0">
                <span className="text-xs text-[var(--color-text-secondary)]">{item.date}</span>
                <span className="text-sm font-semibold text-[var(--color-status-info)]">{(item.orderCount || 0).toLocaleString()}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}