'use client';

import { useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import AccountMenu from './AccountMenu';
import WishlistButton from '../wishlist/WishlistButton';
import MobileMenu from './MobileMenu';
import { FaSearch, FaShoppingCart, FaBars } from 'react-icons/fa';

const NAV_LINKS = [
  { label: 'Products',      href: '/products' },
  { label: 'Reagent Store', href: '/reagent-store' },
  { label: 'B2B Portal',    href: '/b2b' },
  { label: 'Track Order',   href: '/track' },
];

export default function Header({ onLoginClick, onRegisterClick, onLogout, onCartClick, onNavigate }) {
  const router   = useRouter();
  const pathname = usePathname();
  const { getCartCount } = useCart();
  const { user, isAuthenticated } = useAuth();
  const cartCount = getCartCount();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/');

  return (
    <>
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-14 flex items-center gap-4 md:gap-6">

          {/* ── Logo ── */}
          <button
            onClick={() => router.push('/')}
            className="font-[family-name:var(--font-lora)] text-[20px] font-bold text-[#0B2545] flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          >
            MedCore<span className="text-[#0E8A6E]">BD</span>
          </button>

          {/* ── Desktop Nav Links ── */}
          <div className="hidden md:flex items-center gap-1 flex-1">
            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`px-3 py-1.5 rounded-lg text-[13px] font-medium transition-colors whitespace-nowrap ${
                  isActive(href)
                    ? 'bg-[#0B2545]/8 text-[#0B2545] font-semibold'
                    : 'text-gray-600 hover:text-[#0B2545] hover:bg-gray-100'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* ── Right side actions ── */}
          <div className="flex items-center gap-2 ml-auto">

            {/* Search icon — navigates to /products */}
            <button
              onClick={() => router.push('/products')}
              aria-label="Search products"
              className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center hover:bg-gray-50 hover:border-[#0E8A6E] transition-colors"
            >
              <FaSearch size={14} className="text-gray-600" />
            </button>

            {/* Wishlist */}
            <div className="hidden md:block">
              <WishlistButton />
            </div>

            {/* Cart */}
            <button
              onClick={onCartClick}
              aria-label={cartCount > 0 ? `Cart — ${cartCount} items` : 'Cart'}
              className="w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center relative hover:bg-gray-50 hover:border-[#0E8A6E] transition-colors"
            >
              <FaShoppingCart size={15} className="text-gray-600" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-[#E24B4A] text-white text-[9px] min-w-[16px] h-4 px-0.5 rounded-full flex items-center justify-center border-2 border-white font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Account menu (desktop) */}
            <div className="hidden md:block">
              <AccountMenu
                onNavigate={onNavigate}
                onLoginClick={onLoginClick}
                onLogout={onLogout}
              />
            </div>

            {/* Auth buttons (desktop) */}
            <div className="hidden lg:flex items-center gap-2">
              {isAuthenticated() ? (
                <>
                  {user?.name && (
                    <span className="text-[12px] text-gray-600 max-w-[100px] truncate">{user.name}</span>
                  )}
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => router.push('/admin')}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-[11px] font-semibold transition-colors"
                    >
                      Admin
                    </button>
                  )}
                  <button
                    onClick={onLogout}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-[12px] hover:bg-gray-50 transition-colors"
                  >
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={onLoginClick}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 text-gray-700 text-[12px] hover:bg-gray-50 transition-colors"
                  >
                    Log in
                  </button>
                  <button
                    onClick={onRegisterClick}
                    className="px-3 py-1.5 rounded-lg bg-[#0B2545] hover:bg-[#0d2d52] text-white text-[12px] font-semibold transition-colors"
                  >
                    Register
                  </button>
                </>
              )}

              <button
                onClick={() => router.push('/b2b')}
                className="px-4 py-1.5 bg-[#0E8A6E] hover:bg-[#0c7a61] text-white rounded-lg text-[12px] font-semibold transition-colors"
              >
                B2B Portal
              </button>
            </div>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-9 h-9 rounded-lg border border-gray-200 bg-white flex items-center justify-center"
              aria-label="Open menu"
            >
              <FaBars size={16} className="text-gray-700" />
            </button>
          </div>
        </div>
      </nav>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
