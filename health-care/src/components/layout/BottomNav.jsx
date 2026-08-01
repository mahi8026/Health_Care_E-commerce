'use client';

import { memo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import {
  FaHome,
  FaThLarge,
  FaShoppingCart,
  FaHeart,
  FaUser,
  FaUserShield,
  FaBuilding,
} from 'react-icons/fa';

const NAV_ITEMS = [
  { icon: FaHome,         label: 'Home',     path: '/',         exactMatch: true  },
  { icon: FaThLarge,      label: 'Products', path: '/products', exactMatch: false },
  { icon: FaShoppingCart, label: 'Cart',     path: '/cart',     showCartBadge: true, exactMatch: false },
  { icon: FaHeart,        label: 'Wishlist', path: '/wishlist', exactMatch: false },
  { icon: FaUser,         label: 'Account',  path: '/account',  requiresAuth: true, authFallback: '/login', exactMatch: false },
];

const ACTIVE_COLOR   = 'var(--color-brand-teal)';
const INACTIVE_COLOR = 'var(--color-text-secondary)';
const ADMIN_COLOR    = '#7C3AED';
const B2B_COLOR      = 'var(--color-brand-teal)';

const BottomNav = memo(function BottomNav() {
  const pathname = usePathname();
  const router   = useRouter();
  const { getCartCount }                                = useCart();
  const { isAuthenticated, isAdmin, isB2BCustomer }     = useAuth();
  const cartCount  = getCartCount();
  const adminUser  = isAdmin();
  const b2bUser    = isB2BCustomer();

  // Hide on admin, B2B, and auth pages
  if (
    pathname?.startsWith('/admin') ||
    pathname?.startsWith('/b2b')   ||
    pathname?.startsWith('/login') ||
    pathname?.startsWith('/register')
  ) return null;

  // Build nav items — swap Account → Admin for admin users, Account → B2B for B2B customers
  const items = adminUser
    ? [
        ...NAV_ITEMS.slice(0, 4),
        { icon: FaUserShield, label: 'Admin', path: '/admin', exactMatch: false, isAdmin: true },
      ]
    : b2bUser
    ? [
        ...NAV_ITEMS.slice(0, 4),
        { icon: FaBuilding, label: 'B2B', path: '/b2b', exactMatch: false, isB2B: true },
      ]
    : NAV_ITEMS;

  const handleNavClick = (item) => {
    if (item.requiresAuth && !isAuthenticated()) {
      router.push(item.authFallback || '/login');
      return;
    }
    router.push(item.path);
  };

  return (
    <nav
      className="bottom-nav-bar fixed bottom-0 left-0 right-0 w-full h-[60px] bg-white border-t border-[var(--color-border-primary)] z-[var(--z-bottom-nav)] flex shadow-[0_-2px_12px_rgba(0,0,0,0.06)] lg:hidden"
      aria-label="Mobile navigation"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      {items.map((item) => {
        const isActive = item.exactMatch
          ? pathname === item.path
          : pathname?.startsWith(item.path);
        const Icon        = item.icon;
        const activeColor = item.isAdmin ? ADMIN_COLOR : item.isB2B ? B2B_COLOR : ACTIVE_COLOR;
        const color       = isActive ? activeColor : INACTIVE_COLOR;

        return (
          <button
            key={item.path}
            onClick={() => handleNavClick(item)}
            aria-label={item.label}
            aria-current={isActive ? 'page' : undefined}
            className="flex-1 flex flex-col items-center justify-center gap-[3px] bg-transparent border-none cursor-pointer relative p-[6px_4px] transition-colors"
            style={{ color }}
          >
            {/* Active indicator */}
            {isActive && (
              <span
                className="absolute top-0 left-1/2 -translate-x-1/2 w-5 h-[2.5px] rounded-b-[3px]"
                style={{ background: activeColor }}
              />
            )}

            {/* Admin badge dot */}
            {item.isAdmin && !isActive && (
              <span
                className="absolute top-[7px] right-[22%] w-[7px] h-[7px] rounded-full border-[1.5px] border-white"
                style={{ background: ADMIN_COLOR }}
              />
            )}

            {/* B2B badge dot */}
            {item.isB2B && !isActive && (
              <span
                className="absolute top-[7px] right-[22%] w-[7px] h-[7px] rounded-full border-[1.5px] border-white"
                style={{ background: B2B_COLOR }}
              />
            )}

            <Icon size={18} />

            <span className={`text-xs tracking-[0.01em] ${isActive ? 'font-semibold' : 'font-normal'}`}>
              {item.label}
            </span>

            {/* Cart badge */}
            {item.showCartBadge && cartCount > 0 && (
              <span
                aria-label={`${cartCount} items in cart`}
                className="absolute top-[5px] right-[18%] bg-[var(--color-status-danger)] text-white rounded-full w-4 h-4 text-xs font-semibold flex items-center justify-center border-[1.5px] border-white leading-none"
              >
                {cartCount > 9 ? '9+' : cartCount}
              </span>
            )}
          </button>
        );
      })}
    </nav>
  );
});

export default BottomNav;

