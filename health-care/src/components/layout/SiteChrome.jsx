'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import HeaderWrapper from '@/components/layout/HeaderWrapper';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import NavScrollEffect from '@/components/layout/NavScrollEffect';
import FloatingCartButton from '@/components/ui/FloatingCartButton';
import CartSidebar from '@/components/ui/CartSidebar';
import CompareBar from '@/components/compare/CompareBar';

/** Routes with their own layout — no store footer / bottom nav. */
function isMinimalChromeRoute(pathname) {
  if (!pathname) return false;
  return (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/mobile-app') ||
    pathname === '/checkout' ||
    pathname === '/cart'
  );
}

export default function SiteChrome({ children }) {
  const pathname = usePathname();
  const showStoreNav = !pathname?.startsWith('/admin') && !pathname?.startsWith('/mobile-app');
  const showFooter = showStoreNav && !isMinimalChromeRoute(pathname);
  const [cartSidebarOpen, setCartSidebarOpen] = useState(false);

  // Don't show floating widgets on admin, checkout, or cart pages
  const showFloatingWidgets = showStoreNav && pathname !== '/checkout' && pathname !== '/cart';

  return (
    <>
      {showStoreNav && <NavScrollEffect />}
      {showStoreNav && (
        <div className="site-nav-shell">
          <HeaderWrapper onCartClick={() => setCartSidebarOpen(true)} />
        </div>
      )}
      <main className={showStoreNav ? 'site-main' : 'site-main site-main--bare'}>
        {children}
      </main>
      {showFooter && <Footer />}
      {showStoreNav && pathname !== '/checkout' && pathname !== '/cart' && <BottomNav />}
      
      {/* Floating Widgets */}
      {showFloatingWidgets && (
        <>
          <FloatingCartButton onClick={() => setCartSidebarOpen(true)} />
          <CartSidebar isOpen={cartSidebarOpen} onClose={() => setCartSidebarOpen(false)} />
          <CompareBar />
        </>
      )}
    </>
  );
}
