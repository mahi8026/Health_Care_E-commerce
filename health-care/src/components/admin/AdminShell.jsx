"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminShell({ children, title, action, onAction }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const adminUser = {
    name: user?.name || 'Admin',
    role: user?.role === 'admin' ? 'Administrator' : (user?.role || 'Administrator'),
    initials: (user?.name || 'A').charAt(0).toUpperCase(),
    isOnline: true,
  };

  const menuItems = [
    { id: 'dashboard', path: '/admin', icon: '📊', label: 'Dashboard' },
    { id: 'orders', path: '/admin/orders', icon: '📦', label: 'Orders', badge: '24' },
    { id: 'products', path: '/admin/products', icon: '🏥', label: 'Products' },
    { id: 'customers', path: '/admin/customers', icon: '👥', label: 'Customers' },
    { id: 'coupons', path: '/admin/coupons', icon: '🎟️', label: 'Coupons' },
    { id: 'categories', path: '/admin/categories', icon: '📁', label: 'Categories' },
    { id: 'manufacturers', path: '/admin/manufacturers', icon: '🏭', label: 'Manufacturers' },
    { id: 'quotes', path: '/admin/quotes', icon: '📋', label: 'Quotations', badge: '8' },
    { id: 'returns', path: '/admin/returns', icon: '↩️', label: 'Returns' },
    { id: 'reviews', path: '/admin/reviews', icon: '⭐', label: 'Reviews' },
    { id: 'newsletter', path: '/admin/newsletter', icon: '📧', label: 'Newsletter' },
    { id: 'activity-logs', path: '/admin/activity-logs', icon: '📋', label: 'Activity Logs' },
    { id: 'sms-settings', path: '/admin/sms-settings', icon: '📱', label: 'SMS Settings' },
    { id: 'security', path: '/admin/security', icon: '🔒', label: 'Security' },
    { id: 'analytics', path: '/admin/analytics', icon: '📈', label: 'Analytics' },
    { id: 'monitoring', path: '/admin/monitoring', icon: '🔍', label: 'Monitoring' }
  ];

  const isActive = (path) => {
    if (path === '/admin') {
      return pathname === '/admin';
    }
    return pathname?.startsWith(path);
  };

  const handleLogout = () => {
    logout();
    router.push('/');
  };

  return (
    <div className="grid grid-cols-[220px_1fr] min-h-screen bg-[var(--color-background-tertiary)]">
      {/* Sidebar */}
      <div className="bg-[#0B2545] text-white flex flex-col h-screen sticky top-0">
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div 
            onClick={() => router.push('/admin')}
            className="font-[family-name:var(--font-lora)] text-[18px] font-semibold cursor-pointer hover:opacity-80 transition-opacity"
          >
            MedCore<span className="text-[#4DDBB8]">BD</span>
          </div>
          <div className="text-[10px] text-white/60 mt-1">Admin Panel</div>
        </div>

        {/* Back to Home Button */}
        <div className="px-4 pt-3 pb-2">
          <button
            onClick={() => router.push('/')}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors border border-white/10"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M19 12H5M12 19l-7-7 7-7"/>
            </svg>
            <span className="text-[11px] font-medium font-[family-name:var(--font-plus-jakarta)]">
              Back to Store
            </span>
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#4DDBB8] rounded-full flex items-center justify-center text-[#0B2545] font-bold text-[13px]">
              {adminUser.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-semibold truncate">{adminUser.name}</div>
              <div className="text-[10px] text-white/60 truncate">{adminUser.role}</div>
            </div>
            {adminUser.isOnline && (
              <div className="w-2 h-2 bg-[#4DDBB8] rounded-full"></div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-3 overflow-y-auto">
          {menuItems.map(item => (
            <button
              key={item.id}
              onClick={() => router.push(item.path)}
              className={`w-full flex items-center gap-3 px-3 py-[10px] rounded-lg mb-1 transition-colors ${
                isActive(item.path)
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
          <button 
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-[10px] rounded-lg text-white/70 hover:bg-white/5 hover:text-white transition-colors"
          >
            <span className="text-[18px]">🚪</span>
            <span className="text-[12px] font-medium font-[family-name:var(--font-plus-jakarta)]">
              Logout
            </span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col">
        {/* Top Bar */}
        <div className="bg-white border-b-[0.5px] border-[var(--color-border-tertiary)] px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <div>
            <h1 className="text-[16px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
              {title || 'Admin Panel'}
            </h1>
            <div className="text-[11px] text-[var(--color-text-secondary)] mt-1">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button className="w-8 h-8 rounded-lg border-[0.5px] border-[var(--color-border-secondary)] flex items-center justify-center hover:bg-[var(--color-background-secondary)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            
            <button className="relative w-8 h-8 rounded-lg border-[0.5px] border-[var(--color-border-secondary)] flex items-center justify-center hover:bg-[var(--color-background-secondary)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#E24B4A] rounded-full text-white text-[9px] flex items-center justify-center">
                3
              </div>
            </button>

            <div className="w-8 h-8 bg-[#0B2545] rounded-lg flex items-center justify-center text-white text-[11px] font-bold">
              {adminUser.initials}
            </div>

            {action && onAction && (
              <button
                onClick={onAction}
                className="px-4 py-2 bg-[#0B2545] text-white rounded-lg text-[12px] font-semibold hover:bg-[#0d2e56] transition-colors"
              >
                {action}
              </button>
            )}
          </div>
        </div>

        {/* Page Content */}
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </div>
    </div>
  );
}
