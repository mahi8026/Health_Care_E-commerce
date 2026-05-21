'use client';

import { useRouter, usePathname } from 'next/navigation';

export default function MobileBottomNav() {
  const router = useRouter();
  const pathname = usePathname();

  const tabs = [
    { id: 'home', icon: '🏠', label: 'Home', path: '/' },
    { id: 'products', icon: '📦', label: 'Products', path: '/products' },
    { id: 'cart', icon: '🛒', label: 'Cart', path: '/cart' },
    { id: 'orders', icon: '📋', label: 'Orders', path: '/orders' },
    { id: 'account', icon: '👤', label: 'Account', path: '/account' }
  ];

  // FIX 2: Active tab detection using pathname
  const isActive = (path) => {
    if (path === '/') return pathname === '/';
    return pathname.startsWith(path);
  };

  return (
    // FIX 1: Hidden on desktop, visible on mobile only
    <div className="mobile-bottom-nav fixed bottom-0 left-0 right-0 bg-white border-t-[0.5px] border-[var(--color-border-tertiary)] px-2 py-2 flex justify-around items-center z-[999] shadow-[0_-2px_12px_rgba(0,0,0,0.08)]">
      {tabs.map(tab => {
        const active = isActive(tab.path);
        return (
          <button
            key={tab.id}
            // FIX 3: onClick handler for navigation
            onClick={() => router.push(tab.path)}
            className={`flex flex-col items-center gap-[2px] px-3 py-1 rounded-lg transition-colors ${
              active
                ? 'text-[#0E8A6E] border-t-2 border-[#0E8A6E]'
                : 'text-[var(--color-text-tertiary)] border-t-2 border-transparent'
            }`}
            style={{
              fontWeight: active ? 600 : 400
            }}
          >
            <span className="text-[20px]">{tab.icon}</span>
            <span className="text-[9px] font-medium font-[family-name:var(--font-plus-jakarta)]">
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
