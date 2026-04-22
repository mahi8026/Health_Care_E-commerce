export default function AdminSidebar({ user, activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', badge: null },
    { id: 'orders', icon: '📦', label: 'Orders', badge: '24' },
    { id: 'products', icon: '🏥', label: 'Products', badge: null },
    { id: 'customers', icon: '👥', label: 'Customers', badge: null },
    { id: 'quotes', icon: '📋', label: 'Quotations', badge: '8' },
    { id: 'analytics', icon: '📈', label: 'Analytics', badge: null }
  ];

  return (
    <div className="bg-[#0B2545] text-white flex flex-col h-screen">
      {/* Logo */}
      <div className="p-5 border-b border-white/10">
        <div className="font-[family-name:var(--font-lora)] text-[18px] font-semibold">
          MedCore<span className="text-[#4DDBB8]">BD</span>
        </div>
        <div className="text-[10px] text-white/60 mt-1">Admin Panel</div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-[#4DDBB8] rounded-full flex items-center justify-center text-[#0B2545] font-bold text-[13px]">
            {user.initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[12px] font-semibold truncate">{user.name}</div>
            <div className="text-[10px] text-white/60 truncate">{user.role}</div>
          </div>
          {user.isOnline && (
            <div className="w-2 h-2 bg-[#4DDBB8] rounded-full"></div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 overflow-y-auto">
        {menuItems.map(item => (
          <button
            key={item.id}
            onClick={() => setActiveTab(item.id)}
            className={`w-full flex items-center gap-3 px-3 py-[10px] rounded-lg mb-1 transition-colors ${
              activeTab === item.id
                ? 'bg-white/10 text-white'
                : 'text-white/70 hover:bg-white/5 hover:text-white'
            }`}
          >
            <span className="text-[18px]">{item.icon}</span>
            <span className="flex-1 text-left text-[12px] font-medium font-[family-name:var(--font-plus-jakarta)]">
              {item.label}
            </span>
            {item.badge && (
              <span className="bg-[#E24B4A] text-white text-[10px] font-bold px-2 py-[2px] rounded-full min-w-[20px] text-center">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button className="w-full flex items-center gap-3 px-3 py-[10px] rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors">
          <span className="text-[18px]">🚪</span>
          <span className="text-[12px] font-medium font-[family-name:var(--font-plus-jakarta)]">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
