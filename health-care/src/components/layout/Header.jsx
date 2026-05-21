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

  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMegaMenuOpen(false);
        setSearchOpen(false);
        setSearchQuery('');
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

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
      <header className="glass-nav">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-[62px] nav-header-row gap-3 md:gap-4">

          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex-shrink-0 cursor-pointer group"
            aria-label="MedCoreBD home"
          >
            <span className="nav-logo font-[family-name:var(--font-lora)] text-[22px] font-bold group-hover:opacity-85 transition-opacity">
              MedCore<span className="nav-logo-accent">BD</span>
            </span>
          </button>

          <div className="hidden md:block nav-divider" />

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-0.5 flex-1" aria-label="Main navigation">
            <div className="relative" ref={megaMenuRef}>
              <button
                onClick={() => setMegaMenuOpen((v) => !v)}
                onMouseEnter={() => setMegaMenuOpen(true)}
                className={`nav-link flex items-center gap-1.5 ${
                  isActive('/products') || megaMenuOpen ? 'nav-mega-trigger-active' : ''
                }`}
                aria-expanded={megaMenuOpen}
                aria-haspopup="true"
              >
                Products
                <FaChevronDown
                  size={10}
                  className={`transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {megaMenuOpen && (
                <div
                  className="absolute top-[calc(100%+10px)] left-0 w-[560px] glass-mega-panel rounded-2xl z-50 p-4 nav-dropdown-enter"
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

            {NAV_LINKS.map(({ label, href }) => (
              <button
                key={href}
                onClick={() => router.push(href)}
                className={`nav-link ${isActive(href) ? 'nav-link-active' : ''}`}
              >
                {label}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="nav-actions ml-auto">
            <div className="nav-actions-cluster">

            {/* Search, wishlist, cart, account — same size glass controls */}
            <div className="nav-glass-controls-row">
              <div className="relative flex-shrink-0" ref={searchRef}>
                {searchOpen ? (
                  <form
                    onSubmit={handleSearch}
                    className="nav-search-field nav-glass-control"
                    style={{ width: 'min(260px, 42vw)' }}
                  >
                    <FaSearch size={13} className="text-white/50 flex-shrink-0" />
                    <input
                      ref={searchInputRef}
                      type="search"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search products…"
                      className="flex-1 bg-transparent text-[13px] outline-none min-w-0"
                      aria-label="Search products"
                    />
                    {searchQuery ? (
                      <>
                        <button type="submit" className="text-[#4ddbb8] hover:text-[#7ee8cc] transition-colors flex-shrink-0" aria-label="Search">
                          <FaSearch size={13} />
                        </button>
                        <button type="button" onClick={() => setSearchQuery('')} className="text-white/50 hover:text-white transition-colors flex-shrink-0" aria-label="Clear search">
                          <FaTimes size={13} />
                        </button>
                      </>
                    ) : (
                      <button type="button" onClick={() => { setSearchOpen(false); setSearchQuery(''); }} className="text-white/50 hover:text-white transition-colors flex-shrink-0" aria-label="Close search">
                        <FaTimes size={13} />
                      </button>
                    )}
                  </form>
                ) : (
                  <button
                    onClick={() => setSearchOpen(true)}
                    aria-label="Search"
                    title="Search products"
                    className="nav-glass-control nav-glass-control--icon"
                  >
                    <FaSearch size={15} />
                  </button>
                )}
              </div>

              <div className="nav-glass-controls-desktop">
                <WishlistButton variant="glass-chip" />
                <button
                  onClick={onCartClick}
                  aria-label={cartCount > 0 ? `Cart — ${cartCount} items` : 'Cart'}
                  className="nav-glass-control nav-glass-control--stack"
                >
                  <span className="nav-glass-control__icon">
                    <FaShoppingCart size={15} />
                  </span>
                  {cartCount > 0 && (
                    <span className="glass-chip-badge glass-chip-badge--pulse">
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                  <span className="nav-glass-control__label">Cart</span>
                </button>
                <AccountMenu
                  variant="glass"
                  onNavigate={onNavigate}
                  onLoginClick={onLoginClick}
                  onLogout={onLogout}
                />
              </div>

              <button
                onClick={onCartClick}
                aria-label={cartCount > 0 ? `Cart — ${cartCount} items` : 'Cart'}
                className="nav-glass-control nav-glass-control--icon nav-cart-mobile-only"
              >
                <FaShoppingCart size={15} />
                {cartCount > 0 && (
                  <span className="glass-chip-badge glass-chip-badge--pulse">
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            </div>

            {!authed && (
              <div className="hidden md:flex items-center gap-2">
                <button onClick={onLoginClick} className="nav-cta-ghost">
                  Log in
                </button>
                <button onClick={onRegisterClick} className="nav-cta-solid">
                  Register
                </button>
              </div>
            )}

            {authed && user?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className="glass-chip-admin"
              >
                Admin
              </button>
            )}

            <button
              onClick={() => router.push('/b2b')}
              className="glass-chip-primary"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              B2B Portal
            </button>

            <button
              onClick={() => setMobileMenuOpen(true)}
              className="nav-menu-toggle nav-menu-toggle--mobile"
              aria-label="Open menu"
            >
              <FaBars size={17} />
            </button>

            </div>
          </div>
        </div>
      </header>

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
