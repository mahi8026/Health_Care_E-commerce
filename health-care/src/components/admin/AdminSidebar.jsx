export default function AdminSidebar({ user, activeTab, setActiveTab }) {
  const menuItems = [
    { id: 'dashboard', icon: '📊', label: 'Dashboard', badge: null },
    { id: 'orders', icon: '📦', label: 'Orders', badge: '24' },
    { id: 'products', icon: '🏥', label: 'Products', badge: null },
    { id: 'customers', icon: '👥', label: 'Customers', badge: null },
    { id: 'loyalty', icon: '⭐', label: 'Loyalty Program', badge: null },
    { id: 'coupons', icon: '🎟️', label: 'Coupons', badge: null },
    { id: 'quotes', icon: '📋', label: 'Quotations', badge: '8' },
    { id: 'returns', icon: '↩️', label: 'Returns', badge: null },
    { id: 'analytics', icon: '📈', label: 'Analytics', badge: null },
    { id: 'monitoring', icon: '🔍', label: 'Monitoring', badge: null }
  ];

  return (
    <div className="bg-gradient-dark text-white flex flex-col h-screen w-full md:w-64 lg:w-72">
      {/* Logo */}
      <div className="p-4 md:p-5 border-b border-white/10 bg-gradient-to-r from-blue-600/30 to-cyan-500/30">
        <div className="font-[family-name:var(--font-lora)] text-[16px] md:text-[18px] font-semibold">
          Mediport<span className="text-cyan-400 drop-shadow-lg">BD</span>
        </div>
        <div className="text-[10px] text-white/60 mt-1">Admin Panel</div>
      </div>

      {/* User Info */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-br from-cyan-400 to-blue-500 rounded-full flex items-center justify-center text-white font-bold text-[13px] shadow-lg">
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
            className={`w-full flex items-center gap-3 px-3 py-3 rounded-lg mb-1 transition-all min-h-[48px] ${
              activeTab === item.id
                ? 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-lg shadow-blue-500/50'
                : 'text-white/70 hover:bg-white/10 hover:text-white hover:shadow-md'
            }`}
          >
            <span className="text-[18px] flex-shrink-0">{item.icon}</span>
            <span className="flex-1 text-left text-[12px] font-medium font-[family-name:var(--font-plus-jakarta)]">
              {item.label}
            </span>
            {item.badge && (
              <span className="bg-[#E24B4A] text-white text-[10px] font-bold px-2 py-[2px] rounded-full min-w-[20px] text-center flex-shrink-0">
                {item.badge}
              </span>
            )}
          </button>
        ))}
      </nav>

      {/* Logout */}
      <div className="p-4 border-t border-white/10">
        <button className="w-full flex items-center gap-3 px-3 py-3 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors min-h-[48px]">
          <span className="text-[18px]">🚪</span>
          <span className="text-[12px] font-medium font-[family-name:var(--font-plus-jakarta)]">
            Logout
          </span>
        </button>
      </div>
    </div>
  );
}
