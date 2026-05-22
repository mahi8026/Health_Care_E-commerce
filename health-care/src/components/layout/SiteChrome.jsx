'use client';

import { usePathname } from 'next/navigation';
import TopBar from '@/components/layout/TopBar';
import HeaderWrapper from '@/components/layout/HeaderWrapper';
import Footer from '@/components/layout/Footer';
import BottomNav from '@/components/layout/BottomNav';
import NavScrollEffect from '@/components/layout/NavScrollEffect';

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

  return (
    <>
      {showStoreNav && <NavScrollEffect />}
      {showStoreNav && (
        <div className="site-nav-shell">
          <TopBar />
          <HeaderWrapper />
        </div>
      )}
      <main className={showStoreNav ? 'site-main' : 'site-main site-main--bare'}>
        {children}
      </main>
      {showFooter && <Footer />}
      {showStoreNav && pathname !== '/checkout' && pathname !== '/cart' && <BottomNav />}
    </>
  );
}
