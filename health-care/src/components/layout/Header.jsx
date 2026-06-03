'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/hooks/useT';
import AccountMenu from './AccountMenu';
import WishlistButton from '../wishlist/WishlistButton';
import MobileMenu from './MobileMenu';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import EnhancedSearchBox from '../search/EnhancedSearchBox';
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
  { label: 'Diagnostic Equipment', href: '/products/category/diagnostic-equipment', icon: <FaStethoscope size={14} />, desc: 'ECG, ultrasound, monitors' },
  { label: 'Surgical Instruments', href: '/products/category/surgical-instruments', icon: <FaSyringe size={14} />, desc: 'Scalpels, forceps, retractors' },
  { label: 'Laboratory Reagents', href: '/reagent-store', icon: <FaFlask size={14} />, desc: 'HbA1c, CBC, chemistry kits' },
  { label: 'Hospital Machines', href: '/products/category/hospital-machines', icon: <FaHospital size={14} />, desc: 'Ventilators, infusion pumps' },
  { label: 'Lab Equipment', href: '/products/category/lab-equipment', icon: <FaMicroscope size={14} />, desc: 'Centrifuges, analyzers' },
  { label: 'PPE & Safety', href: '/products/category/ppe-safety', icon: <FaShieldAlt size={14} />, desc: 'Gloves, masks, gowns' },
  { label: 'Dental Equipment', href: '/products/category/dental-equipment', icon: <FaTooth size={14} />, desc: 'Chairs, handpieces, X-ray' },
  { label: 'Implants & Ortho', href: '/products/category/implants-ortho', icon: <FaBone size={14} />, desc: 'Orthopedic implants, fixators' },
];

const NAV_LINKS = [
  { label: 'reagentStore', href: '/reagent-store' },
  { label: 'trackOrder', href: '/track' },
];

export default function Header({ onLoginClick, onRegisterClick, onLogout, onCartClick, onNavigate }) {
  const router = useRouter();
  const pathname = usePathname();
  const t = useT();
  const { getCartCount } = useCart();
  const { user, isAuthenticated } = useAuth();
  const cartCount = getCartCount();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [megaMenuOpen, setMegaMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);

  const megaMenuRef = useRef(null);
  const searchRef = useRef(null);
  const prevCartCount = useRef(cartCount);

  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/');
  const authed = isAuthenticated();

  // Cart bounce animation on count change
  useEffect(() => {
    if (cartCount > prevCartCount.current && cartCount > 0) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => setCartBounce(true));
      const timer = setTimeout(() => setCartBounce(false), 600);
      return () => clearTimeout(timer);
    }
    prevCartCount.current = cartCount;
  }, [cartCount]);

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
    const onKey = (e) => {
      if (e.key === 'Escape') {
        setMegaMenuOpen(false);
        setSearchOpen(false);
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  return (
    <>
      <style jsx>{`
        @keyframes cartBounce {
          0% { transform: scale(1); }
          50% { transform: scale(1.4); }
          100% { transform: scale(1); }
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
        @keyframes slideDownModal {
          from {
            opacity: 0;
            transform: translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .cart-bounce {
          animation: cartBounce 0.4s ease;
        }
        .animate-fade-in {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slide-down-modal {
          animation: slideDownModal 0.3s ease-out;
        }
      `}</style>
      <header className="glass-nav">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 h-[58px] nav-header-row gap-2 md:gap-3">

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
                {t('nav.products')}
                <FaChevronDown
                  size={10}
                  className={`transition-transform duration-200 ${megaMenuOpen ? 'rotate-180' : ''}`}
                />
              </button>

              {megaMenuOpen && (
                <div
                  className="absolute top-[calc(100%+10px)] left-0 w-[560px] max-w-[calc(100vw-2rem)] glass-mega-panel rounded-2xl z-50 p-4 nav-dropdown-enter"
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
                aria-current={isActive(href) ? 'page' : undefined}
              >
                {t(`nav.${label}`)}
              </button>
            ))}
          </nav>

          {/* Right actions */}
          <div className="nav-actions ml-auto">
            <div className="nav-actions-cluster">

            {/* Search, wishlist, cart, account — same size glass controls */}
            <div className="nav-glass-controls-row">
              {/* Search */}
              <div className="relative flex-shrink-0" ref={searchRef}>
                <button
                  onClick={() => setSearchOpen(true)}
                  aria-label="Search"
                  title="Search products"
                  className="nav-glass-control nav-glass-control--icon"
                >
                  <FaSearch size={15} />
                </button>
              </div>

              <LanguageSwitcher />

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
                    <span className={`glass-chip-badge glass-chip-badge--pulse ${cartBounce ? 'cart-bounce' : ''}`}>
                      {cartCount > 9 ? '9+' : cartCount}
                    </span>
                  )}
                  <span className="nav-glass-control__label">{t('nav.cart')}</span>
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
                  <span className={`glass-chip-badge glass-chip-badge--pulse ${cartBounce ? 'cart-bounce' : ''}`}>
                    {cartCount > 9 ? '9+' : cartCount}
                  </span>
                )}
              </button>
            </div>

            {!authed && (
              <div className="hidden md:flex items-center gap-2">
                <button onClick={onLoginClick} className="nav-cta-ghost">
                  {t('nav.login')}
                </button>
                <button onClick={onRegisterClick} className="nav-cta-solid">
                  {t('nav.register')}
                </button>
              </div>
            )}

            {authed && user?.role === 'admin' && (
              <button
                onClick={() => router.push('/admin')}
                className="glass-chip-admin"
              >
                {t('nav.admin')}
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
              {t('nav.b2bPortal')}
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

      {/* World-Class Search Modal */}
      {searchOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md animate-fade-in"
            style={{ zIndex: 9998 }}
            onClick={() => setSearchOpen(false)}
          />
          {/* Modal Container */}
          <div 
            className="fixed top-[70px] left-0 right-0 px-4 animate-slide-down-modal"
            style={{ zIndex: 9999 }}
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setSearchOpen(false);
              }
            }}
          >
            <div 
              className="max-w-[680px] mx-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-white rounded-2xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] border border-gray-200/80 overflow-hidden relative">
                <div className="relative">
                  <EnhancedSearchBox 
                    placeholder="Search 10,000+ medical products..." 
                    autoFocus 
                    onClose={() => setSearchOpen(false)}
                  />
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSearchOpen(false);
                    }}
                    className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-all duration-200 group"
                    style={{ zIndex: 10 }}
                    aria-label="Close search"
                  >
                    <FaTimes size={16} className="group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                </div>
              </div>
              {/* Keyboard shortcuts hint */}
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-gray-400">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 bg-gray-800/90 text-white rounded text-[10px] font-medium shadow-sm">↑</kbd>
                  <kbd className="px-2 py-0.5 bg-gray-800/90 text-white rounded text-[10px] font-medium shadow-sm">↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 bg-gray-800/90 text-white rounded text-[10px] font-medium shadow-sm">Enter</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 bg-gray-800/90 text-white rounded text-[10px] font-medium shadow-sm">Esc</kbd>
                  <span>Close</span>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
