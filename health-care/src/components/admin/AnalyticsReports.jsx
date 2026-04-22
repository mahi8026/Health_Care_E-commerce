import dynamic from 'next/dynamic';
import ChartSkeleton from './ChartSkeleton';

/**
 * Lazy-load AnalyticsCharts so the recharts bundle is only fetched when the
 * analytics tab is rendered, keeping it out of the initial page bundle.
 * Requirements: 3.3, 3.5
 */
const AnalyticsCharts = dynamic(
  () => import('./AnalyticsCharts'),
  {
    loading: () => (
      <div className="grid grid-cols-2 gap-4 mb-6">
        <ChartSkeleton />
        <ChartSkeleton />
      </div>
    ),
    ssr: false,
  }
);

export default function AnalyticsReports() {
  const metrics = [
    { label: 'Total Revenue', value: '৳12.5M', period: 'This month', change: '+12.5%', trend: 'up' },
    { label: 'Total Orders', value: '1,248', period: 'This month', change: '+8.2%', trend: 'up' },
    { label: 'Avg Order Value', value: '৳10,016', period: 'This month', change: '+4.1%', trend: 'up' },
    { label: 'Customer Retention', value: '87%', period: 'This quarter', change: '+2.3%', trend: 'up' }
  ];

  const topProducts = [
    { name: 'Siemens Cardiostat ECG', sales: 45, revenue: 4275000 },
    { name: 'Roche HbA1c reagent kit', sales: 320, revenue: 2720000 },
    { name: 'Abbott Troponin I reagent', sales: 98, revenue: 2156000 },
    { name: 'Beckman CBC reagent pack', sales: 156, revenue: 2808000 },
    { name: 'BD blood culture media', sales: 210, revenue: 2058000 }
  ];

  const topCustomers = [
    { name: 'United Hospital', orders: 48, spent: 3200000 },
    { name: 'Square Hospital', orders: 42, spent: 2450000 },
    { name: 'Apollo Hospitals', orders: 38, spent: 1890000 },
    { name: 'Ibn Sina Hospital', orders: 32, spent: 1560000 },
    { name: 'Labaid Diagnostics', orders: 28, spent: 980000 }
  ];

  return (
    <div>
      {/* Metrics Grid */}
      <div className="grid grid-cols-4 gap-4 mb-6">
        {metrics.map((metric, index) => (
          <div key={index} className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
            <div className="text-[11px] text-[var(--color-text-secondary)] mb-2">
              {metric.label}
            </div>
            <div className="text-[24px] font-bold mb-1 font-[family-name:var(--font-plus-jakarta)]">
              {metric.value}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-[#0E8A6E] font-medium">
                {metric.change}
              </span>
              <span className="text-[10px] text-[var(--color-text-tertiary)]">
                {metric.period}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Lazy-loaded recharts visualisations */}
      <AnalyticsCharts />

      <div className="grid grid-cols-2 gap-4">
        {/* Top Products */}
        <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
          <h3 className="text-[14px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
            Top Products by Revenue
          </h3>
          <div className="space-y-3">
            {topProducts.map((product, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--color-background-tertiary)] rounded-lg flex items-center justify-center text-[11px] font-bold text-[var(--color-text-secondary)]">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-medium mb-[2px] font-[family-name:var(--font-plus-jakarta)]">
                    {product.name}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)]">
                    {product.sales} units sold
                  </div>
                </div>
                <div className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                  ৳{(product.revenue / 1000).toFixed(0)}K
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top Customers */}
        <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
          <h3 className="text-[14px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
            Top Customers by Spending
          </h3>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div key={index} className="flex items-center gap-3">
                <div className="w-8 h-8 bg-[var(--color-background-tertiary)] rounded-lg flex items-center justify-center text-[11px] font-bold text-[var(--color-text-secondary)]">
                  #{index + 1}
                </div>
                <div className="flex-1">
                  <div className="text-[12px] font-medium mb-[2px] font-[family-name:var(--font-plus-jakarta)]">
                    {customer.name}
                  </div>
                  <div className="text-[10px] text-[var(--color-text-secondary)]">
                    {customer.orders} orders
                  </div>
                </div>
                <div className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                  ৳{(customer.spent / 1000).toFixed(0)}K
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
