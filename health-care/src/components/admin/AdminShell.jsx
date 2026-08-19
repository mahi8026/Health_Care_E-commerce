"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

export default function AdminShell({ children, title, action, onAction }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef(null);
  const notifRef  = useRef(null);
  const userRef   = useRef(null);
  const [badges, setBadges] = useState({ orders: 0, quotes: 0, b2b: 0, notifications: 0 });
  const [notifications, setNotifications] = useState([]);

  const adminUser = {
    name:     user?.name     || 'Admin',
    email:    user?.email    || '',
    role:     user?.role === 'admin' ? 'Administrator' : (user?.role || 'Administrator'),
    initials: (user?.name || 'A').charAt(0).toUpperCase(),
    isOnline: true,
  };

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) setShowSearch(false);
      if (notifRef.current  && !notifRef.current.contains(e.target))  setShowNotifications(false);
      if (userRef.current   && !userRef.current.contains(e.target))   setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Fetch badge counts
  useEffect(() => {
    const fetchBadges = async () => {
      try {
        const token = typeof window !== 'undefined' ? localStorage.getItem('Mediport_token') : null;
        if (!token) return;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/admin/badges`, {
          headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          credentials: 'include'
        });
        if (response.ok) {
          const data = await response.json();
          if (data.success) {
            setBadges({
              orders:        data.data.pendingOrders       || 0,
              quotes:        data.data.pendingQuotes       || 0,
              b2b:           data.data.pendingB2B          || 0,
              notifications: data.data.unreadNotifications || 0,
            });
          }
        }
      } catch { /* silent */ }
    };
    if (user?.role === 'admin') {
      fetchBadges();
      // Visibility-aware polling — skip ticks in hidden tabs, refresh on return
      const tick = () => { if (!document.hidden) fetchBadges(); };
      const id = setInterval(tick, 30000);
      document.addEventListener('visibilitychange', tick);
      return () => {
        clearInterval(id);
        document.removeEventListener('visibilitychange', tick);
      };
    }
  }, [user]);

  // Quick search — navigate pages
  const SEARCH_PAGES = [
    { label: 'Dashboard',     path: '/admin' },
    { label: 'Orders',        path: '/admin/orders' },
    { label: 'Products',      path: '/admin/products' },
    { label: 'Flash Deals',   path: '/admin/flash-deals' },
    { label: 'Banners',       path: '/admin/banners' },
    { label: 'Customers',     path: '/admin/customers' },
    { label: 'B2B Management', path: '/admin/b2b' },
    { label: 'Categories',    path: '/admin/categories' },
    { label: 'Manufacturers', path: '/admin/manufacturers' },
    { label: 'Coupons',       path: '/admin/coupons' },
    { label: 'Quotations',    path: '/admin/quotes' },
    { label: 'Returns',       path: '/admin/returns' },
    { label: 'Reviews',       path: '/admin/reviews' },
    { label: 'Newsletter',    path: '/admin/newsletter' },
    { label: 'Loyalty Points', path: '/admin/loyalty' },
    { label: 'Activity Logs', path: '/admin/activity-logs' },
    { label: 'Analytics',     path: '/admin/analytics' },
    { label: 'Security',      path: '/admin/security' },
    { label: 'WhatsApp',      path: '/admin/whatsapp' },
    { label: 'SMS Settings',  path: '/admin/sms-settings' },
    { label: 'Monitoring',    path: '/admin/monitoring' },
    { label: 'Push Notifications', path: '/admin/push' },
  ];
  const filteredPages = searchQuery.trim()
    ? SEARCH_PAGES.filter(p => p.label.toLowerCase().includes(searchQuery.toLowerCase()))
    : SEARCH_PAGES.slice(0, 6);

  const menuItems = [
    { id: 'dashboard',      path: '/admin',                   icon: '📊', label: 'Dashboard' },
    { id: 'orders',         path: '/admin/orders',            icon: '📦', label: 'Orders',       badge: badges.orders > 0 ? String(badges.orders) : null },
    { id: 'products',       path: '/admin/products',          icon: '🏥', label: 'Products' },
    { id: 'flash-deals',    path: '/admin/flash-deals',       icon: '🔥', label: 'Flash Deals' },
    { id: 'banners',        path: '/admin/banners',           icon: '🖼️', label: 'Banners' },
    { id: 'customers',      path: '/admin/customers',         icon: '👥', label: 'Customers' },
    { id: 'b2b',            path: '/admin/b2b',               icon: '🛡️', label: 'B2B Management', badge: badges.b2b > 0 ? String(badges.b2b) : null },
    { id: 'whatsapp',       path: '/admin/whatsapp',          icon: '💬', label: 'WhatsApp' },
    { id: 'chat',           path: '/admin/chat',              icon: '🗨️', label: 'Live Chat' },
    { id: 'coupons',        path: '/admin/coupons',           icon: '🎟️', label: 'Coupons' },
    { id: 'categories',     path: '/admin/categories',        icon: '📁', label: 'Categories' },
    { id: 'manufacturers',  path: '/admin/manufacturers',     icon: '🏭', label: 'Manufacturers' },
    { id: 'quotes',         path: '/admin/quotes',            icon: '📋', label: 'Quotations',   badge: badges.quotes > 0 ? String(badges.quotes) : null },
    { id: 'returns',        path: '/admin/returns',           icon: '↩️', label: 'Returns' },
    { id: 'reviews',        path: '/admin/reviews',           icon: '⭐', label: 'Reviews' },
    { id: 'newsletter',     path: '/admin/newsletter',        icon: '📧', label: 'Newsletter' },
    { id: 'loyalty',        path: '/admin/loyalty',           icon: '🎁', label: 'Loyalty Points' },
    { id: 'activity-logs',  path: '/admin/activity-logs',     icon: '📋', label: 'Activity Logs' },
    { id: 'sms-settings',   path: '/admin/sms-settings',      icon: '📱', label: 'SMS Settings' },
    { id: 'security',       path: '/admin/security',          icon: '🔒', label: 'Security' },
    { id: 'analytics',      path: '/admin/analytics',         icon: '📈', label: 'Analytics' },
    { id: 'monitoring',     path: '/admin/monitoring',        icon: '🔍', label: 'Monitoring' },
    { id: 'push',           path: '/admin/push',              icon: '🔔', label: 'Push Notifications' },
  ];

  const isActive    = (path) => path === '/admin' ? pathname === '/admin' : pathname?.startsWith(path);
  const handleLogout = () => { logout(); router.push('/'); };

  return (
    <div className="flex min-h-screen bg-page-muted overflow-x-hidden">
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-modal md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        bg-brand-navy text-white flex flex-col h-screen fixed top-0 left-0 z-drawer
        transition-transform duration-300
        w-[240px] md:w-[220px] lg:w-[220px]
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0
      `}>
        {/* Logo */}
        <div className="p-5 border-b border-white/10">
          <div 
            onClick={() => router.push('/admin')}
            className="font-[family-name:var(--font-lora)] text-lg font-semibold cursor-pointer hover:opacity-80 transition-opacity"
          >
            Mediport<span className="text-brand-teal-light">BD</span>
          </div>
          <div className="text-xs text-white/60 mt-1">Admin Panel</div>
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
            <span className="text-xs font-medium font-[family-name:var(--font-plus-jakarta)]">
              Back to Store
            </span>
          </button>
        </div>

        {/* User Info */}
        <div className="p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-teal-light rounded-full flex items-center justify-center text-brand-navy font-semibold text-sm">
              {adminUser.initials}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-xs font-semibold truncate">{adminUser.name}</div>
              <div className="text-xs text-white/60 truncate">{adminUser.role}</div>
            </div>
            {adminUser.isOnline && (
              <div className="w-2 h-2 bg-brand-teal-light rounded-full"></div>
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
              <span className="text-lg">{item.icon}</span>
              <span className="flex-1 text-left text-xs font-medium font-[family-name:var(--font-plus-jakarta)]">
                {item.label}
              </span>
              {item.badge && (
                <span className="bg-danger text-white text-xs font-semibold px-2 py-[2px] rounded-full min-w-[20px] text-center">
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
            <span className="text-lg">🚪</span>
            <span className="text-xs font-medium font-[family-name:var(--font-plus-jakarta)]">
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
            className="md:hidden w-9 h-9 flex-shrink-0 flex items-center justify-center text-brand-navy rounded-lg hover:bg-[var(--color-background-secondary)]"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <div className="flex-1 min-w-0">
            <h1 className="text-base md:text-base font-semibold font-[family-name:var(--font-plus-jakarta)] truncate">
              {title || 'Admin Panel'}
            </h1>
            <div className="text-xs text-[var(--color-text-secondary)] truncate hidden sm:block">
              {new Date().toLocaleDateString('en-US', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
          
          <div className="flex items-center gap-1.5 md:gap-2 flex-shrink-0">

            {/* ── Search ── */}
            <div ref={searchRef} className="relative">
              <button
                type="button"
                onClick={() => { setShowSearch(v => !v); setShowNotifications(false); setShowUserMenu(false); }}
                className="w-8 h-8 rounded-lg border border-[var(--color-border-primary)] flex items-center justify-center hover:bg-[var(--color-background-secondary)] transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                </svg>
              </button>
              {showSearch && (
                <div className="absolute right-0 top-10 w-72 bg-white rounded-xl border border-[var(--color-border-primary)] shadow-xl z-dropdown overflow-hidden">
                  <div className="p-3 border-b border-[var(--color-border-tertiary)]">
                    <div className="flex items-center gap-2 px-3 py-2 bg-[var(--color-background-secondary)] rounded-lg">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
                      </svg>
                      <input
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        placeholder="Search admin pages..."
                        className="flex-1 bg-transparent text-sm focus:outline-none text-[var(--color-text-primary)] placeholder-gray-400"
                      />
                    </div>
                  </div>
                  <div className="py-1 max-h-64 overflow-y-auto">
                    <p className="px-3 py-1.5 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      {searchQuery ? 'Results' : 'Quick Links'}
                    </p>
                    {filteredPages.map(page => (
                      <button
                        key={page.path}
                        type="button"
                        onClick={() => { router.push(page.path); setShowSearch(false); setSearchQuery(''); }}
                        className="w-full text-left px-3 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] flex items-center gap-2 transition-colors"
                      >
                        <span className="text-[var(--color-text-secondary)]">→</span>
                        {page.label}
                      </button>
                    ))}
                    {filteredPages.length === 0 && (
                      <p className="px-3 py-4 text-xs text-[var(--color-text-secondary)] text-center">No pages found</p>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* ── Notifications ── */}
            <div ref={notifRef} className="relative">
              <button
                type="button"
                onClick={() => { setShowNotifications(v => !v); setShowSearch(false); setShowUserMenu(false); }}
                className="w-8 h-8 rounded-lg border border-[var(--color-border-primary)] flex items-center justify-center hover:bg-[var(--color-background-secondary)] transition-colors relative"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                  <path d="M13.73 21a2 2 0 01-3.46 0"/>
                </svg>
                {badges.notifications > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[var(--color-status-danger-tint)] rounded-full text-white text-xs flex items-center justify-center font-semibold">
                    {badges.notifications > 9 ? '9+' : badges.notifications}
                  </span>
                )}
              </button>
              {showNotifications && (
                <div className="absolute right-0 top-10 w-80 bg-white rounded-xl border border-[var(--color-border-primary)] shadow-xl z-dropdown overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-tertiary)]">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)]">Notifications</p>
                    {badges.notifications > 0 && (
                      <span className="text-xs px-2 py-0.5 bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] rounded-full font-semibold">
                        {badges.notifications} new
                      </span>
                    )}
                  </div>
                  <div className="divide-y divide-[var(--color-border-tertiary)] max-h-72 overflow-y-auto">
                    {badges.orders > 0 && (
                      <button type="button" onClick={() => { router.push('/admin/orders'); setShowNotifications(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-[var(--color-background-secondary)] transition-colors">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">📦 {badges.orders} pending order{badges.orders > 1 ? 's' : ''}</p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Require your attention</p>
                      </button>
                    )}
                    {badges.quotes > 0 && (
                      <button type="button" onClick={() => { router.push('/admin/quotes'); setShowNotifications(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-[var(--color-background-secondary)] transition-colors">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">📋 {badges.quotes} pending quote{badges.quotes > 1 ? 's' : ''}</p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Awaiting response</p>
                      </button>
                    )}
                    {badges.b2b > 0 && (
                      <button type="button" onClick={() => { router.push('/admin/b2b'); setShowNotifications(false); }}
                        className="w-full text-left px-4 py-3 hover:bg-[var(--color-background-secondary)] transition-colors">
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">🛡️ {badges.b2b} pending B2B application{badges.b2b > 1 ? 's' : ''}</p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">Awaiting approval</p>
                      </button>
                    )}
                    {badges.orders === 0 && badges.quotes === 0 && badges.b2b === 0 && (
                      <div className="px-4 py-8 text-center">
                        <p className="text-3xl mb-2">🎉</p>
                        <p className="text-sm font-medium text-[var(--color-text-primary)]">All caught up!</p>
                        <p className="text-xs text-[var(--color-text-secondary)] mt-0.5">No pending actions</p>
                      </div>
                    )}
                  </div>
                  <div className="px-4 py-2.5 border-t border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)]">
                    <button type="button" onClick={() => { router.push('/admin/activity-logs'); setShowNotifications(false); }}
                      className="text-xs text-blue-600 hover:underline font-medium">
                      View activity logs →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* ── User Menu ── */}
            <div ref={userRef} className="relative">
              <button
                type="button"
                onClick={() => { setShowUserMenu(v => !v); setShowSearch(false); setShowNotifications(false); }}
                className="w-8 h-8 md:w-9 md:h-9 bg-brand-navy rounded-lg flex items-center justify-center text-white text-xs font-semibold hover:bg-[var(--color-brand-navy-hover)] transition-colors flex-shrink-0"
              >
                {adminUser.initials}
              </button>
              {showUserMenu && (
                <div className="absolute right-0 top-11 w-56 bg-white rounded-xl border border-[var(--color-border-primary)] shadow-xl z-dropdown overflow-hidden">
                  <div className="px-4 py-3 border-b border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)]">
                    <p className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{adminUser.name}</p>
                    <p className="text-xs text-[var(--color-text-secondary)] truncate">{adminUser.email}</p>
                    <span className="inline-block mt-1 text-xs px-2 py-0.5 bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] rounded-full font-semibold">
                      {adminUser.role}
                    </span>
                  </div>
                  <div className="py-1">
                    <button type="button" onClick={() => { router.push('/admin'); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] flex items-center gap-2 transition-colors">
                      📊 Dashboard
                    </button>
                    <button type="button" onClick={() => { router.push('/admin/security'); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] flex items-center gap-2 transition-colors">
                      🔒 Security Settings
                    </button>
                    <button type="button" onClick={() => { router.push('/admin/activity-logs'); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] flex items-center gap-2 transition-colors">
                      📋 Activity Logs
                    </button>
                    <button type="button" onClick={() => { router.push('/'); setShowUserMenu(false); }}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] flex items-center gap-2 transition-colors">
                      🏠 Back to Store
                    </button>
                  </div>
                  <div className="border-t border-[var(--color-border-tertiary)] py-1">
                    <button type="button" onClick={handleLogout}
                      className="w-full text-left px-4 py-2.5 text-sm text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger-tint)] flex items-center gap-2 transition-colors font-medium">
                      🚪 Logout
                    </button>
                  </div>
                </div>
              )}
            </div>

            {action && onAction && (
              <button onClick={onAction}
                className="px-3 md:px-4 py-2 bg-brand-navy text-white rounded-lg text-xs md:text-xs font-semibold hover:bg-[var(--color-brand-navy-hover)] transition-colors whitespace-nowrap">
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
