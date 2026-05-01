'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';

const NAV_ITEMS = [
  { 
    icon: '🏠', 
    label: 'Home', 
    path: '/',
    exactMatch: true
  },
  { 
    icon: '📦', 
    label: 'Products', 
    path: '/products',
    exactMatch: false
  },
  { 
    icon: '🛒', 
    label: 'Cart', 
    path: '/cart', 
    showBadge: true,
    exactMatch: false
  },
  { 
    icon: '📋', 
    label: 'Orders', 
    path: '/account',
    exactMatch: false
  },
  { 
    icon: '👤', 
    label: 'Account', 
    path: '/login',
    requiresAuth: true,
    exactMatch: false
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const { getCartCount } = useCart();
  const { isAuthenticated } = useAuth();
  const cartCount = getCartCount();

  // Hide on admin pages and B2B pages
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/b2b')) {
    return null;
  }

  const handleNavClick = (item) => {
    // If requires auth and not authenticated, go to login
    if (item.requiresAuth && !isAuthenticated()) {
      router.push('/login');
      return;
    }
    
    // For orders, go to account page if authenticated
    if (item.label === 'Orders') {
      if (isAuthenticated()) {
        router.push('/account');
      } else {
        router.push('/login');
      }
      return;
    }
    
    router.push(item.path);
  };

  return (
    <nav 
      className="bottom-nav-mobile"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        height: 60,
        background: '#fff',
        borderTop: '1px solid #E5E7EB',
        zIndex: 1000,
        paddingBottom: 'env(safe-area-inset-bottom)',
        boxShadow: '0 -2px 10px rgba(0,0,0,0.05)',
        width: '100%',
      }}
    >
      {NAV_ITEMS.map(item => {
        const isActive = item.exactMatch 
          ? pathname === item.path
          : pathname?.startsWith(item.path);

        return (
          <button
            key={item.path}
            onClick={() => handleNavClick(item)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 2,
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              position: 'relative',
              color: isActive ? '#0E8A6E' : '#6B7280',
              transition: 'all 0.2s',
              padding: '8px 4px',
            }}
            aria-label={item.label}
          >
            <span style={{ fontSize: 20 }}>{item.icon}</span>
            <span 
              style={{ 
                fontSize: 9, 
                fontWeight: isActive ? 600 : 400,
                letterSpacing: '0.02em'
              }}
            >
              {item.label}
            </span>
            
            {/* Cart Badge */}
            {item.showBadge && cartCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 6,
                  right: '22%',
                  background: '#E24B4A',
                  color: '#fff',
                  borderRadius: '50%',
                  width: 16,
                  height: 16,
                  fontSize: 9,
                  fontWeight: 700,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1.5px solid #fff',
                }}
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
}
