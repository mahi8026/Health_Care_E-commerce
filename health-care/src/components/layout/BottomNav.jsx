'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  FaHome,
  FaThLarge,
  FaShoppingCart,
  FaHeart,
  FaUser,
} from 'react-icons/fa';

const NAV_ITEMS = [
  { icon: FaHome,         label: 'Home',     path: '/',         exactMatch: true  },
  { icon: FaThLarge,      label: 'Products', path: '/products', exactMatch: false },
  { icon: FaShoppingCart, label: 'Cart',     path: '/cart',     showCartBadge: true, exactMatch: false },
  { icon: FaHeart,        label: 'Wishlist', path: '/wishlist', exactMatch: false },
  { icon: FaUser,         label: 'Account',  path: '/account',  requiresAuth: true, authFallback: '/login', exactMatch: false },
];

const ACTIVE_COLOR  = '#0E8A6E';
const INACTIVE_COLOR = '#9CA3AF';

export default function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const { getCartCount }  = useCart();
  const { isAuthenticated } = useAuth();
  const cartCount = getCartCount();

  // Hide on admin, B2B, and auth pages
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/b2b')   ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register')
  ) return null;

  const handleNavClick = (item) => {
    if (item.requiresAuth && !isAuthenticated()) {
      router.push(item.authFallback || '/login');
      return;
    }
    router.push(item.path);
  };

  return (
    <>
      {/* Scoped style — hides the bar on screens ≥ 1024 px no matter what */}
      <style>{`
        @media (min-width: 1024px) {
          .bottom-nav-bar { display: none !important; }
        }
      `}</style>

      <nav
        className="bottom-nav-bar"
        aria-label="Mobile navigation"
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
          boxShadow: '0 -2px 12px rgba(0,0,0,0.06)',
          width: '100%',
          display: 'flex',
        }}
      >
        {NAV_ITEMS.map((item) => {
          const isActive = item.exactMatch
            ? pathname === item.path
            : pathname?.startsWith(item.path);
          const Icon  = item.icon;
          const color = isActive ? ACTIVE_COLOR : INACTIVE_COLOR;

          return (
            <button
              key={item.path}
              onClick={() => handleNavClick(item)}
              aria-label={item.label}
              aria-current={isActive ? 'page' : undefined}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                position: 'relative',
                color,
                transition: 'color 0.2s',
                padding: '6px 4px',
              }}
            >
              {/* Active indicator bar */}
              {isActive && (
                <span style={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: 20,
                  height: 2.5,
                  background: ACTIVE_COLOR,
                  borderRadius: '0 0 3px 3px',
                }} />
              )}

              <Icon size={18} />

              <span style={{ fontSize: 9.5, fontWeight: isActive ? 700 : 400, letterSpacing: '0.01em' }}>
                {item.label}
              </span>

              {/* Cart badge */}
              {item.showCartBadge && cartCount > 0 && (
                <span
                  aria-label={`${cartCount} items in cart`}
                  style={{
                    position: 'absolute',
                    top: 5,
                    right: '18%',
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
                    lineHeight: 1,
                  }}
                >
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </>
  );
}
