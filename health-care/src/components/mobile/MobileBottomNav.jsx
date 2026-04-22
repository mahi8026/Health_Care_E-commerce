export default function MobileBottomNav({ activeTab = 'home' }) {
  const tabs = [
    { id: 'home', icon: '🏠', label: 'Home' },
    { id: 'categories', icon: '📂', label: 'Categories' },
    { id: 'orders', icon: '📦', label: 'Orders' },
    { id: 'b2b', icon: '🏢', label: 'B2B' },
    { id: 'account', icon: '👤', label: 'Account' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t-[0.5px] border-[var(--color-border-tertiary)] px-2 py-2 flex justify-around items-center">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`flex flex-col items-center gap-[2px] px-3 py-1 rounded-lg transition-colors ${
            activeTab === tab.id
              ? 'text-[#0E8A6E]'
              : 'text-[var(--color-text-tertiary)]'
          }`}
        >
          <span className="text-[18px]">{tab.icon}</span>
          <span className="text-[9px] font-medium font-[family-name:var(--font-plus-jakarta)]">
            {tab.label}
          </span>
        </button>
      ))}
    </div>
  );
}
