export default function AdminTabs({ activeTab, setActiveTab }) {
  const tabs = [
    { id: 'dashboard', label: 'Overview', badge: null },
    { id: 'orders', label: 'Orders', badge: '24' },
    { id: 'products', label: 'Products', badge: null },
    { id: 'customers', label: 'Customers', badge: null },
    { id: 'quotes', label: 'Quotations', badge: '8' },
    { id: 'returns', label: 'Returns', badge: null },
    { id: 'analytics', label: 'Analytics', badge: null },
    { id: 'monitoring', label: 'Monitoring', badge: null }
  ];

  return (
    <div className="bg-white border-b-[0.5px] border-[var(--color-border-tertiary)] px-6">
      <div className="flex gap-1">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`relative px-4 py-3 text-[12px] font-medium font-[family-name:var(--font-plus-jakarta)] transition-colors ${
              activeTab === tab.id
                ? 'text-[#0B2545]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            <span className="flex items-center gap-2">
              {tab.label}
              {tab.badge && (
                <span className="bg-[#E24B4A] text-white text-[10px] font-bold px-2 py-[2px] rounded-full min-w-[18px] text-center">
                  {tab.badge}
                </span>
              )}
            </span>
            {activeTab === tab.id && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-[#0B2545]"></div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
