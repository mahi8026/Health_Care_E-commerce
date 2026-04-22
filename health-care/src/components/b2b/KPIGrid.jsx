"use client";

export default function KPIGrid({ accountData }) {
  const kpis = [
    { label: 'Total Spend', value: `৳${accountData?.totalSpend?.toLocaleString() || '0'}`, color: 'blue' },
    { label: 'Active Orders', value: accountData?.activeOrders || 0, color: 'green' },
    { label: 'In Delivery', value: accountData?.ordersInDelivery || 0, color: 'orange' },
    { label: 'Discount Rate', value: `${accountData?.discount || 0}%`, color: 'purple' }
  ];

  return (
    <div className="grid grid-cols-4 gap-4 mb-6">
      {kpis.map((kpi, index) => (
        <div key={index} className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)]">
          <div className="text-[11px] text-[var(--color-text-secondary)] mb-2">{kpi.label}</div>
          <div className="text-[20px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
            {kpi.value}
          </div>
        </div>
      ))}
    </div>
  );
}
