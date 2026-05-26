"use client";

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminShell({ children, title, action, onAction }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [badges, setBadges] = useState({
    orders: 0,
    quotes: 0,
    notifications: 0
  });

  const adminUser = {
    name: user?.name || 'Admin',
    role: user?.role === 'admin' ? 'Administrator' : (user?.role || 'Administrator'),
    initials: (user?.name || 'A').charAt(0).toUpperCase(),
    isOnline: true,
  };

  // Fetch badge counts
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('medcore_token') : null;
        if (!token) return;

        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/badges`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          credentials: 'include'
        });

        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setBadges({
              orders: data.data.pendingOrders || 0,
              quotes: data.data.pendingQuotes || 0,
              notifications: data.data.unreadNotifications || 0
            });
          }
        }
      } catch (error) {
        process.env.NODE_ENV !== "production" && console.error('Failed to fetch badges:', error);
      }
    };

    if (user?.role === 'admin') {
      fetchBadges();
      // Refresh badges every 30 seconds
      const interval = setInterval(fetchBadges, 30000);
      return () => clearInterval(interval);
    }
  }, [user]);

  const menuItems = [
    { id: 'dashboard', path: '/admin', icon: '📊', label: 'Dashboard' },
    { id: 'orders', path: '/admin/orders', icon: '📦', label: 'Orders', badge: badges.orders > 0 ? String(badges.orders) : null },
    { id: 'products', path: '/admin/products', icon: '🏥', label: 'Products' },
    { id: 'banners', path: '/admin/banners', icon: '🖼️', label: 'Banners' },
    { id: 'customers', path: '/admin/customers', icon: '👥', label: 'Customers' },
    { id: 'coupons', path: '/admin/coupons', icon: '🎟️', label: 'Coupons' },
    { id: 'categories', path: '/admin/categories', icon: '📁', label: 'Categories' },
    { id: 'manufacturers', path: '/admin/manufacturers', icon: '🏭', label: 'Manufacturers' },
    { id: 'quotes', path: '/admin/quotes', icon: '📋', label: 'Quotations', badge: badges.quotes > 0 ? String(badges.quotes) : null },
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
    <div className="flex min-h-screen bg-page-muted overflow-x-hidden">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-[899] md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        bg-[#0B2545] text-white flex flex-col h-screen fixed top-0 left-0 z-[900]
        transition-transform duration-300
        w-[240px] md:w-[220px] lg:w-[220px]
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
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
      <div className="flex-1 flex flex-col md:ml-[220px] min-w-0 overflow-x-hidden">
        {/* Top Bar */}
        <div className="bg-white border-b border-[var(--color-border-tertiary)] px-4 md:px-5 py-2.5 flex items-center justify-between gap-2 min-h-[52px]">
          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden w-9 h-9 flex-shrink-0 flex items-center justify-center text-[#0B2545] rounded-lg hover:bg-[var(--color-background-secondary)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-[15px] md:text-[16px] font-semibold font-[family-name:var(--font-plus-jakarta)] truncate">
              {title || 'Admin Panel'}
            </h1>
            <div className="text-[10px] text-[var(--color-text-secondary)] truncate hidden sm:block">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-3 flex-shrink-0">
            <button className="hidden md:flex w-8 h-8 rounded-lg border-[0.5px] border-[var(--color-border-secondary)] items-center justify-center hover:bg-[var(--color-background-secondary)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="11" cy="11" r="8"/>
                <path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            
            <button className="hidden md:flex relative w-8 h-8 rounded-lg border-[0.5px] border-[var(--color-border-secondary)] items-center justify-center hover:bg-[var(--color-background-secondary)]">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                <path d="M13.73 21a2 2 0 01-3.46 0"/>
              </svg>
              {badges.notifications > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#E24B4A] rounded-full text-white text-[9px] flex items-center justify-center">
                  {badges.notifications > 9 ? '9+' : badges.notifications}
                </div>
              )}
            </button>

            <div className="w-8 h-8 md:w-9 md:h-9 bg-[#0B2545] rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0">
              {adminUser.initials}
            </div>

            {action && onAction && (
              <button
                onClick={onAction}
                className="px-3 md:px-4 py-2 bg-[#0B2545] text-white rounded-lg text-[11px] md:text-[12px] font-semibold hover:bg-[#0d2e56] transition-colors whitespace-nowrap"
              >
                <span className="hidden sm:inline">{action}</span>
                <span className="sm:hidden">+</span>
              </button>
            )}
          </div>
        </div>

        {/* Page Content */}
        {children}
      </div>
    </div>
  );
}
