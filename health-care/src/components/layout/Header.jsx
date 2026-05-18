'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import AccountMenu from './AccountMenu';
import WishlistButton from '../wishlist/WishlistButton';
import MobileMenu from './MobileMenu';
import {
  FaSearch,
  FaShoppingCart,
  FaBars,
  FaChevronDown,
  FaFlask,
  FaStethoscope,
  FaSyringe,
  FaHospital,
  FaMicroscope,
  FaShieldAlt,
  FaTooth,
  FaBone,
  FaTimes,
} from 'react-icons/fa';

const PRODUCT_CATEGORIES = [
  { label: 'Diagnostic Equipment', href: '/products?category=Diagnostic+Equipment', icon: <FaStethoscope size={14} />, desc: 'ECG, ultrasound, monitors' },
  { label: 'Surgical Instruments', href: '/products?category=Surgical+Instruments', icon: <FaSyringe size={14} />, desc: 'Scalpels, forceps, retractors' },
  { label: 'Laboratory Reagents', href: '/reagent-store', icon: <FaFlask size={14} />, desc: 'HbA1c, CBC, chemistry kits' },
  { label: 'Hospital Machines', href: '/products?category=Hospital+Machines', icon: <FaHospital size={14} />, desc: 'Ventilators, infusion pumps' },
  { label: 'Lab Equipment', href: '/products?category=Lab+Equipment', icon: <FaMicroscope size={14} />, desc: 'Centrifuges, analyzers' },
  { label: 'PPE & Safety', href: '/products?category=PPE+%26+Safety', icon: <FaShieldAlt size={14} />, desc: 'Gloves, masks, gowns' },
  { label: 'Dental Equipment', href: '/products?category=Dental+Equipment', icon: <FaTooth size={14} />, desc: 'Chairs, handpieces, X-ray' },
  { label: 'Implants & Ortho', href: '/products?category=Implants+%26+Ortho', icon: <FaBone size={14} />, desc: 'Orthopedic implants, fixators' },
];

const NAV_LINKS = [
  { label: 'Reagent Store', href: '/reagent-store' },
  { label: 'B2B Portal', href: '/b2b' },
  { label: 'Track Order', href: '/track' },
];

export default function Header({ onLoginClick, onRegisterClick, onLogout, onCartClick, onNavigate }) {
  const router = useRouter();
  const pathname = usePathname();
  const { getCartCount } = useCart();
  const { user, isAuthenticated } = useAuth();
  const cartCount = getCartCount();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const megaMenuRef = useRef(null);
  const searchRef = useRef(null);
  const searchInputRef = useRef(null);

  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/');
  const authed = isAuthenticated();

  // Close mega menu on outside click
  useEffect(() => {
    const handleClick = (e) => {
      if (megaMenuRef.current && !megaMenuRef.current.contains(e.target)) {
        setMegaMenuOpen(false);
      }
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setSearchOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery('');
    }
  };

  return (
    <>
      <header
        className="bg-white border-b border-gray-100 sticky top-0 z-50"
        style={{ boxShadow: '0 1px 12px rgba(11,37,69,0.07)' }}
      >
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-[62px] flex items-center gap-3 md:gap-4">

          {/* ── Logo ── */}
          <button
            onClick={() => router.push('/')}
            className="flex-shrink-0 cursor-pointer group"
            aria-label="MedCoreBD home"
          >
            <span className="font-[family-name:var(--font-lora)] text-[22px] font-bold text-[#0B2545] group-hover:opacity-80 transition-opacity">
              MedCore<span className="text-[#0E8A6E]">BD</span>
            </span>
          </button>

          {/* ── Divider ── */}
          <div className="hidden md:block w-px h-6 bg-gray-200 flex-shrink-0" />

          {/* ── Desktop Nav ── */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1" aria-label="Main navigation">

            {/* Products mega-menu trigger */}
            <div className="relative" ref={megaMenuRef}>
              <button
                onClick={() => setMegaMenuOpen((v) => !v)}
                onMouseEnter={() => setMegaMenuOpen(true)}
                className={`relative flex items-center gap-1.5 px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
                  isActive('/products') || megaMenuOpen
                    ? 'text-[#0E8A6E] font-semibold bg-[#F0FBF8]'
                    : 'text-[#374151] hover:text-[#0B2545] hover:bg-[#F3F4F6]'
                }`}
                aria-expanded={megaMenuOpen}
                aria-haspopup="true"
              >
                Products
                <FaChevronDown
                  size={10}
                  className={`transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`}
                />
                {(isActive('/products') && !megaMenuOpen) && (
                  <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-[#0E8A6E] rounded-full" />
                )}
              </button>

              {/* Mega Menu */}
              {megaMenuOpen && (
                <div
                  className="absolute top-[calc(100%+8px)] left-0 w-[560px] bg-white rounded-xl border border-gray-100 shadow-xl z-50 p-4"
                  onMouseLeave={() => setMegaMenuOpen(false)}
                  role="menu"
                >
                  <div className="grid grid-cols-2 gap-1">
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <button
                        key={cat.href}
                        onClick={() => { router.push(cat.href); setMegaMenuOpen(false); }}
                        className="flex items-start gap-3 p-3 rounded-lg hover:bg-[#F0FBF8] transition-colors text-left group"
                        role="menuitem"
                      >
                        <span className="mt-0.5 text-[#0E8A6E] flex-shrink-0 group-hover:scale-110 transition-transform">
                          {cat.icon}
                        </span>
                        <div>
                          <div className="text-[13px] font-semibold text-[#111827] group-hover:text-[#0E8A6E] transition-colors">
                            {cat.label}
                          </div>
                          <div className="text-[11px] text-[#6B7280] mt-0.5">{cat.desc}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <button
                      onClick={() => { router.push('/products'); setMegaMenuOpen(false); }}
                      className="w-full py-2 text-center text-[12px] font-semibold text-[#0E8A6E] hover:bg-[#F0FBF8] rounded-lg transition-colors"
                    >
                      View All Products →
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Other nav links */}
            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`relative px-3.5 py-2 rounded-lg text-[13px] font-medium transition-all whitespace-nowrap ${
                  isActive(href)
                    ? 'text-[#0E8A6E] font-semibold'
                    : 'text-[#374151] hover:text-[#0B2545] hover:bg-[#F3F4F6]'
                }`}
              >
                {label}
                {isActive(href) && (
                  <span className="absolute bottom-0 left-3.5 right-3.5 h-0.5 bg-[#0E8A6E] rounded-full" />
                )}
              </button>
            ))}
          </nav>

          {/* ── Right side ── */}
          <div className="flex items-center gap-1 ml-auto">

            {/* Search — expandable */}
            <div className="relative" ref={searchRef}>
              {searchOpen ? (
                <form
                  onSubmit={handleSearch}
                  className="flex items-center gap-1 bg-[#F3F4F6] rounded-xl px-3 py-1.5 border border-gray-200 focus-within:border-[#0E8A6E] transition-colors"
                  style={{ width: 220 }}
                >
                  <FaSearch size={13} className="text-[#9CA3AF] flex-shrink-0" />
                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search products…"
                    className="flex-1 bg-transparent text-[13px] text-[#111827] placeholder-[#9CA3AF] outline-none min-w-0"
                    aria-label="Search products"
                  />
                  <button
                    type="button"
                    onClick={() => { setSearchOpen(false); setSearchQuery(''); }}
                    className="text-[#9CA3AF] hover:text-[#374151] transition-colors"
                    aria-label="Close search"
                  >
                    <FaTimes size={11} />
                  </button>
                </form>
              ) : (
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  title="Search products"
                  className="w-9 h-9 flex items-center justify-center rounded-xl text-[#6B7280] hover:text-[#0B2545] hover:bg-[#F3F4F6] transition-colors"
                >
                  <FaSearch size={15} />
                </button>
              )}
            </div>

            {/* Wishlist */}
            <div className="hidden md:flex items-center justify-center w-9 h-9">
              <WishlistButton />
            </div>

            {/* Cart */}
            <button
              onClick={onCartClick}
              aria-label={cartCount > 0 ? `Cart — ${cartCount} items` : 'Cart'}
              className="relative w-9 h-9 flex items-center justify-center rounded-xl text-[#6B7280] hover:text-[#0B2545] hover:bg-[#F3F4F6] transition-colors"
            >
              <FaShoppingCart size={16} />
              {cartCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-[#E24B4A] text-white text-[9px] min-w-[17px] h-[17px] px-0.5 rounded-full flex items-center justify-center border-2 border-white font-bold leading-none">
                  {cartCount > 9 ? '9+' : cartCount}
                </span>
              )}
            </button>

            {/* Divider */}
            <div className="hidden lg:block w-px h-6 bg-gray-200 mx-1" />

            {/* Auth section */}
            {authed ? (
              <div className="hidden lg:flex items-center gap-2">
                <AccountMenu
                  onNavigate={onNavigate}
                  onLoginClick={onLoginClick}
                  onLogout={onLogout}
                />
                {user?.name && (
                  <span className="text-[12px] text-[#374151] font-medium max-w-[90px] truncate">
                    {user.name}
                  </span>
                )}
                {user?.role === 'admin' && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="px-3 py-1.5 rounded-lg bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-[11px] font-bold transition-colors"
                  >
                    Admin
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-lg border border-gray-200 text-[#374151] text-[12px] font-medium hover:bg-[#F3F4F6] hover:border-gray-300 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="hidden lg:flex items-center gap-2">
                <AccountMenu
                  onNavigate={onNavigate}
                  onLoginClick={onLoginClick}
                  onLogout={onLogout}
                />
                <button
                  onClick={onLoginClick}
                  className="px-3.5 py-1.5 rounded-lg border border-gray-200 text-[#374151] text-[12px] font-medium hover:bg-[#F3F4F6] hover:border-gray-300 transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={onRegisterClick}
                  className="px-3.5 py-1.5 rounded-lg bg-[#0B2545] hover:bg-[#0d2d52] text-white text-[12px] font-semibold transition-colors"
                >
                  Register
                </button>
              </div>
            )}

            {/* B2B CTA */}
            <button
              onClick={() => router.push('/b2b')}
              className="hidden lg:flex items-center gap-1.5 px-4 py-2 bg-[#0E8A6E] hover:bg-[#0c7a61] active:bg-[#0a6b55] text-white rounded-xl text-[12px] font-bold transition-colors ml-1 shadow-sm"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              B2B Portal
            </button>

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden w-9 h-9 flex items-center justify-center rounded-xl text-[#374151] hover:bg-[#F3F4F6] transition-colors"
              aria-label="Open menu"
            >
              <FaBars size={17} />
            </button>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
