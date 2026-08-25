'use client';

import { useState, useRef, useEffect, memo } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useT } from '@/hooks/useT';
import AccountMenu from './AccountMenu';
import WishlistButton from '../wishlist/WishlistButton';
import MobileMenu from './MobileMenu';
import LanguageSwitcher from '../ui/LanguageSwitcher';
import EnhancedSearchBox from '../search/EnhancedSearchBox';
import { API } from '@/constants/api';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';
import { fetchCached } from '@/utils/api';
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
  FaTools,
} from 'react-icons/fa';

// Icon mapping for categories
const CATEGORY_ICONS = {
  'Diagnostic Equipment': <FaStethoscope size={14} />,
  'Surgical Instruments': <FaSyringe size={14} />,
  'Laboratory Reagents': <FaFlask size={14} />,
  'Hospital Machines': <FaHospital size={14} />,
  'Lab Equipment': <FaMicroscope size={14} />,
  'Laboratory Equipment': <FaMicroscope size={14} />,
  'PPE & Safety': <FaShieldAlt size={14} />,
  'Dental Equipment': <FaTooth size={14} />,
  'Implants & Ortho': <FaBone size={14} />,
  'Surgical & Wound Care': <FaSyringe size={14} />,
  'Diabetes Care': <FaFlask size={14} />,
  'Physiotherapy & Rehabilitation': <FaTools size={14} />,
  'Ophthalmology & ENT Equipment': <FaStethoscope size={14} />,
  'IV & Infusion Therapy': <FaSyringe size={14} />,
  'Blood Bank Supplies': <FaFlask size={14} />,
  'Respiratory Equipment': <FaHospital size={14} />,
  'Medical Supplies': <FaShoppingCart size={14} />,
  'Compression Garments': <FaShieldAlt size={14} />,
  'Consumables': <FaShoppingCart size={14} />,
  'Medical Devices': <FaStethoscope size={14} />,
  'Diagnostic Devices': <FaStethoscope size={14} />,
  'Orthopedic Supports': <FaBone size={14} />,
};

// Short descriptions for categories
const CATEGORY_DESC = {
  'Diagnostic Equipment': 'ECG, ultrasound, monitors',
  'Surgical Instruments': 'Scalpels, forceps, retractors',
  'Laboratory Reagents': 'HbA1c, CBC, chemistry kits',
  'Hospital Machines': 'Ventilators, infusion pumps',
  'Lab Equipment': 'Centrifuges, analyzers',
  'Laboratory Equipment': 'Centrifuges, analyzers',
  'PPE & Safety': 'Gloves, masks, gowns',
  'Dental Equipment': 'Chairs, handpieces, X-ray',
  'Implants & Ortho': 'Orthopedic implants, fixators',
  'Surgical & Wound Care': 'Dressings, tapes, ostomy',
  'Diabetes Care': 'Glucose meters, test strips',
  'Physiotherapy & Rehabilitation': 'TENS, heating pads',
  'Ophthalmology & ENT Equipment': 'Ophthalmoscopes, otoscopes',
  'IV & Infusion Therapy': 'IV cannulas, infusion sets',
  'Blood Bank Supplies': 'Blood bags, collection sets',
  'Respiratory Equipment': 'Nebulizers, oxygen therapy',
  'Medical Supplies': 'General medical supplies',
  'Compression Garments': 'Compression stockings',
  'Consumables': 'Medical consumables',
  'Medical Devices': 'Medical devices',
  'Diagnostic Devices': 'Diagnostic tools',
  'Orthopedic Supports': 'Orthopedic supports',
};

const NAV_LINKS = [
  { label: 'reagentStore', href: '/reagent-store' },
  { label: 'trackOrder', href: '/track' },
];

const Header = memo(function Header({ onLoginClick, onRegisterClick, onLogout, onCartClick, onNavigate }) {
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
  const [categories, setCategories] = useState([]);
  const [categoriesLoading, setCategoriesLoading] = useState(true);

  const megaMenuRef = useRef(null);
  const searchRef = useRef(null);
  const prevCartCount = useRef(cartCount);

  const isActive = (href) => pathname === href || pathname?.startsWith(href + '/');
  const authed = isAuthenticated();

  // Fetch categories from API — shared cache dedupes with MobileMenu/HomePage
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const data = await fetchCached(`${API}/categories`);
        if (data.success && data.data?.categories) {
          // Map categories to the format expected by the dropdown,
          // hiding empty categories (productCount 0)
          const mappedCategories = data.data.categories
            .filter(cat => (cat.productCount ?? 1) > 0)
            .map(cat => {
            const slug = CATEGORY_NAME_TO_SLUG[cat.name] || cat.slug || cat.name.toLowerCase().replace(/\s+/g, '-');
            // Special case: Laboratory Reagents goes to reagent-store
            const href = cat.name === 'Laboratory Reagents' 
              ? '/reagent-store'
              : `/products/category/${slug}`;
            return {
              label: cat.name,
              href,
              icon: CATEGORY_ICONS[cat.name] || <FaStethoscope size={14} />,
              desc: CATEGORY_DESC[cat.name] || '',
            };
          });
          setCategories(mappedCategories);
        }
      } catch (error) {
        console.error('Error fetching categories:', error);
      } finally {
        setCategoriesLoading(false);
      }
    };
    fetchCategories();
  }, []);

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
      // Search modal is closed via its backdrop onClick and Escape key only —
      // do NOT close it here, searchRef only covers the trigger button not the modal panel
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
        <div className="max-w-[1400px] mx-auto px-2 sm:px-4 md:px-6 h-[52px] nav-header-row gap-1.5 sm:gap-2 md:gap-3">

          {/* Logo */}
          <button
            onClick={() => router.push('/')}
            className="flex-shrink-0 cursor-pointer group flex items-center gap-2"
            aria-label="MediportBD home"
          >
            <div className="relative w-11 h-11 rounded-full overflow-hidden border-2 border-white/20 group-hover:border-brand-teal-light/60 transition-all bg-white flex items-center justify-center p-1">
              <Image
                src="/Mediport_Logo.png"
                alt="MediportBD"
                fill
                sizes="44px"
                priority
                className="object-contain"
              />
            </div>
            <span className="hidden sm:block font-[family-name:var(--font-lora)] text-lg font-semibold text-white group-hover:text-brand-teal-light transition-colors">
              Mediport<span className="text-brand-teal-light">BD</span>
            </span>
          </button>

          <div className="hidden md:block nav-divider" />

          {/* Tablet/Mobile Horizontal Nav (md to lg) */}
          <nav className="flex lg:hidden items-center gap-2 overflow-x-auto scrollbar-hide flex-1 min-w-0" aria-label="Main navigation">
            <button
              onClick={() => router.push('/products')}
              className={`nav-link-mobile whitespace-nowrap ${isActive('/products') ? 'nav-link-active' : ''}`}
              aria-current={isActive('/products') ? 'page' : undefined}
            >
              Products
            </button>
            <button
              onClick={() => router.push('/reagent-store')}
              className={`nav-link-mobile nav-link-mobile--reagent whitespace-nowrap ${isActive('/reagent-store') ? 'nav-link-active' : ''}`}
              aria-current={isActive('/reagent-store') ? 'page' : undefined}
            >
              <span className="inline sm:hidden">Reagent</span>
              <span className="hidden sm:inline">Reagent Store</span>
            </button>
          </nav>

          {/* Desktop Nav (lg+) - Shows all links including Track Order */}
          <nav className="hidden lg:flex items-center gap-0.5 flex-1" aria-label="Main navigation">
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
                  className="absolute top-[calc(100%+10px)] left-0 w-[720px] max-w-[calc(100vw-2rem)] glass-mega-panel rounded-2xl z-dropdown p-4 nav-dropdown-enter"
                  onMouseLeave={() => setMegaMenuOpen(false)}
                  role="menu"
                >
                  <div className="grid grid-cols-3 gap-1">
                    {categoriesLoading ? (
                      // Loading skeleton
                      Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg animate-pulse">
                          <div className="w-4 h-4 bg-[var(--color-background-muted)] rounded mt-0.5" />
                          <div className="flex-1">
                            <div className="h-3 bg-[var(--color-background-muted)] rounded w-3/4 mb-2" />
                            <div className="h-2 bg-[var(--color-background-tertiary)] rounded w-full" />
                          </div>
                        </div>
                      ))
                    ) : (
                      categories.map((cat) => (
                        <button
                          key={cat.href}
                          onClick={() => { router.push(cat.href); setMegaMenuOpen(false); }}
                          className="flex items-start gap-3 p-3 rounded-lg hover:bg-brand-teal-tint transition-colors text-left group"
                          role="menuitem"
                        >
                          <span className="mt-0.5 text-brand-teal flex-shrink-0 group-hover:scale-110 transition-transform">
                            {cat.icon}
                          </span>
                          <div>
                            <div className="text-sm font-semibold text-[var(--color-text-primary)] group-hover:text-brand-teal transition-colors">
                              {cat.label}
                            </div>
                            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5">{cat.desc}</div>
                          </div>
                        </button>
                      ))
                    )}
                  </div>
                  <div className="mt-3 pt-3 border-t border-[var(--color-border-tertiary)]">
                    <div className="flex items-center justify-between gap-2">
                      <button
                        onClick={() => { router.push('/products'); setMegaMenuOpen(false); }}
                        className="flex-1 py-2 text-center text-xs font-semibold text-brand-teal hover:bg-brand-teal-tint rounded-lg transition-colors"
                      >
                        View All Products →
                      </button>
                      <button
                        onClick={() => { router.push('/equipment'); setMegaMenuOpen(false); }}
                        className="flex-1 py-2 text-center text-xs font-semibold text-[var(--color-text-secondary)] hover:text-brand-teal hover:bg-brand-teal-tint rounded-lg transition-colors"
                      >
                        Price Guides →
                      </button>
                      <button
                        onClick={() => { router.push('/brands'); setMegaMenuOpen(false); }}
                        className="flex-1 py-2 text-center text-xs font-semibold text-[var(--color-text-secondary)] hover:text-brand-teal hover:bg-brand-teal-tint rounded-lg transition-colors"
                      >
                        Browse by Brand →
                      </button>
                      <button
                        onClick={() => { router.push('/topics'); setMegaMenuOpen(false); }}
                        className="flex-1 py-2 text-center text-xs font-semibold text-[var(--color-text-secondary)] hover:text-brand-teal hover:bg-brand-teal-tint rounded-lg transition-colors"
                      >
                        Topic Guides →
                      </button>
                    </div>
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
              <div className="relative flex-shrink-0">
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
              <div className="hidden xl:flex items-center gap-2">
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
          {/* Backdrop: closes modal when clicking outside the panel */}
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-modal animate-fade-in"
            onClick={() => setSearchOpen(false)}
          />
          {/* Modal panel: higher z-index, stopPropagation on the white card only */}
          <div 
            className="fixed top-[62px] left-0 right-0 z-modal px-4 animate-slide-down-modal pointer-events-none"
          >
            <div className="max-w-[680px] mx-auto pointer-events-none">
              {/* White card — re-enable pointer events here so all children are clickable */}
              <div
                className="bg-white rounded-2xl shadow-[0_20px_70px_-10px_rgba(0,0,0,0.3)] border border-gray-200/80 overflow-hidden pointer-events-auto"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="relative">
                  <EnhancedSearchBox 
                    placeholder="Search 350+ medical products..." 
                    autoFocus 
                    onClose={() => setSearchOpen(false)}
                  />
                  <button
                    onClick={() => setSearchOpen(false)}
                    className="absolute top-4 right-4 flex-shrink-0 w-9 h-9 flex items-center justify-center rounded-lg hover:bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all duration-200 group z-10"
                    aria-label="Close search"
                  >
                    <FaTimes size={16} className="group-hover:rotate-90 transition-transform duration-200" />
                  </button>
                </div>
              </div>
              {/* Keyboard shortcuts hint */}
              <div className="flex items-center justify-center gap-4 mt-3 text-xs text-[var(--color-text-secondary)] pointer-events-none">
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 bg-gray-800/90 text-white rounded text-xs font-medium shadow-sm">↑</kbd>
                  <kbd className="px-2 py-0.5 bg-gray-800/90 text-white rounded text-xs font-medium shadow-sm">↓</kbd>
                  <span>Navigate</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 bg-gray-800/90 text-white rounded text-xs font-medium shadow-sm">Enter</kbd>
                  <span>Select</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <kbd className="px-2 py-0.5 bg-gray-800/90 text-white rounded text-xs font-medium shadow-sm">Esc</kbd>
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
});

export default Header;
