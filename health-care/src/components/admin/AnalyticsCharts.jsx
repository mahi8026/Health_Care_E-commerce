'use client';

let BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer;

try {
  const recharts = require('recharts');
  BarChart = recharts.BarChart;
  Bar = recharts.Bar;
  LineChart = recharts.LineChart;
  Line = recharts.Line;
  XAxis = recharts.XAxis;
  YAxis = recharts.YAxis;
  CartesianGrid = recharts.CartesianGrid;
  Tooltip = recharts.Tooltip;
  Legend = recharts.Legend;
  ResponsiveContainer = recharts.ResponsiveContainer;
} catch (error) {
  console.warn('Recharts failed to load:', error.message);
}

/**
 * Monthly revenue and order data for the analytics charts.
 * In a real application this would be fetched from the API.
 */
const monthlyData = [
  { month: 'Jan', revenue: 8200000, orders: 820 },
  { month: 'Feb', revenue: 9100000, orders: 910 },
  { month: 'Mar', revenue: 10500000, orders: 1050 },
  { month: 'Apr', revenue: 9800000, orders: 980 },
  { month: 'May', revenue: 11200000, orders: 1120 },
  { month: 'Jun', revenue: 12500000, orders: 1248 },
];

/**
 * Format large BDT values for chart axis labels (e.g. 12500000 → "৳12.5M")
 */
function formatRevenue(value) {
  if (value >= 1000000) return `৳${(value / 1000000).toFixed(1)}M`;
  if (value >= 1000) return `৳${(value / 1000).toFixed(0)}K`;
  return `৳${value}`;
}

/**
 * Custom tooltip for the revenue bar chart
 */
function RevenueTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-[var(--color-border-tertiary)] rounded-lg p-3 shadow-sm text-[12px]">
      <p className="font-semibold mb-1 font-[family-name:var(--font-plus-jakarta)]">{label}</p>
      <p className="text-[#0E8A6E]">Revenue: {formatRevenue(payload[0].value)}</p>
    </div>
  );
}

/**
 * Custom tooltip for the orders line chart
 */
function OrdersTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-white border border-[var(--color-border-tertiary)] rounded-lg p-3 shadow-sm text-[12px]">
      <p className="font-semibold mb-1 font-[family-name:var(--font-plus-jakarta)]">{label}</p>
      <p className="text-[#3B82F6]">Orders: {payload[0].value.toLocaleString()}</p>
    </div>
  );
}

/**
 * AnalyticsCharts — recharts-powered visualisations for the analytics tab.
 *
 * This component is intentionally kept separate from AnalyticsReports so that
 * the recharts bundle is only loaded when the analytics section is rendered
 * (via next/dynamic lazy loading).
 */
export default function AnalyticsCharts() {
  // If recharts failed to load, show fallback
  if (!BarChart || !LineChart) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
          <h3 className="text-[14px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
            Monthly Revenue
          </h3>
          <div className="h-[200px] flex items-center justify-center text-[12px] text-[var(--color-text-secondary)]">
            Chart unavailable
          </div>
        </div>
        <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
          <h3 className="text-[14px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
            Monthly Orders
          </h3>
          <div className="h-[200px] flex items-center justify-center text-[12px] text-[var(--color-text-secondary)]">
            Chart unavailable
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
      {/* Monthly Revenue Bar Chart */}
      <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
        <h3 className="text-[14px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
          Monthly Revenue
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatRevenue}
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={52}
            />
            <Tooltip content={<RevenueTooltip />} />
            <Bar dataKey="revenue" fill="#0E8A6E" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Monthly Orders Line Chart */}
      <div className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]">
        <h3 className="text-[14px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
          Monthly Orders
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={monthlyData} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#F0F0F0" />
            <XAxis
              dataKey="month"
              tick={{ fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={40}
            />
            <Tooltip content={<OrdersTooltip />} />
            <Legend wrapperStyle={{ fontSize: 11 }} />
            <Line
              type="monotone"
              dataKey="orders"
              stroke="#3B82F6"
              strokeWidth={2}
              dot={{ r: 4, fill: '#3B82F6' }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
