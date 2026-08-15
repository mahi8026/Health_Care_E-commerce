'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import {
  FaTimes, FaChevronRight, FaUser, FaBox, FaHeart, FaSignOutAlt,
  FaCog, FaStethoscope, FaSyringe, FaFlask, FaHospital, FaMicroscope,
  FaShieldAlt, FaTooth, FaBone, FaBuilding, FaSearch, FaUserShield,
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';
import { API } from '@/constants/api';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';
import { fetchCached } from '@/utils/api';

const MAIN_LINKS = [
  { label: 'Home', path: '/' },
  { label: 'All Products', path: '/products' },
  { label: 'Reagent Store', path: '/reagent-store', icon: <FaFlask size={13} /> },
  { label: 'B2B Portal', path: '/b2b', icon: <FaBuilding size={13} /> },
  { label: 'Track Order', path: '/track' },
];

const CATEGORY_ICON_MAP = {
  'Diagnostic Equipment': <FaStethoscope size={13} />,
  'Surgical Instruments': <FaSyringe size={13} />,
  'Laboratory Reagents': <FaFlask size={13} />,
  'Hospital Machines': <FaHospital size={13} />,
  'Lab Equipment': <FaMicroscope size={13} />,
  'PPE & Safety': <FaShieldAlt size={13} />,
  'Dental Equipment': <FaTooth size={13} />,
  'Implants & Ortho': <FaBone size={13} />,
};

// Glass style tokens
const glass = {
  panel: {
    background: 'rgba(11,37,69,0.82)',
    backdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(1.06)',
    WebkitBackdropFilter: 'blur(var(--glass-blur)) saturate(var(--glass-saturate)) brightness(1.06)',
    borderLeft: '1px solid rgba(255,255,255,0.14)',
    boxShadow: '-12px 0 60px rgba(0,0,0,0.35), inset 1px 0 0 rgba(255,255,255,0.08)',
  },
  section: {
    borderBottom: '1px solid rgba(255,255,255,0.07)',
  },
  item: {
    base: { color: 'rgba(255,255,255,0.82)', fontSize: 'var(--text-sm)', fontWeight: 500 },
    hover: { background: 'rgba(255,255,255,0.07)' },
  },
};

export default function MobileMenu({ isOpen, onClose }) {
  const router = useRouter();
  const { user, isAuthenticated, isAdmin, isB2BCustomer, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    // Shared cache dedupes this with Header's identical /categories call
    fetchCached(`${API}/categories`)
      .then(data => setCategories(data.data?.categories || data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (isOpen) {
      // Use queueMicrotask to avoid synchronous setState in effect
      queueMicrotask(() => setMounted(true));
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const t = setTimeout(() => { setMounted(false); setCategoriesExpanded(false); setSearchQuery(''); }, 300);
      return () => clearTimeout(t);
    }
  }, [isOpen]);

  const handleNavigate = (path) => { router.push(path); onClose(); };
  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) { router.push(`/products?q=${encodeURIComponent(searchQuery.trim())}`); onClose(); }
  };
  const handleLogout = () => { logout(); onClose(); router.push('/'); };

  const authed = isAuthenticated();
  const initials = user?.name ? user.name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase() : '?';

  if (!mounted && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed', inset: 0, zIndex: 'var(--z-drawer)',
          background: 'rgba(0,0,0,0.55)',
          backdropFilter: isOpen ? 'blur(var(--glass-blur))' : 'none',
          WebkitBackdropFilter: isOpen ? 'blur(var(--glass-blur))' : 'none',
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s, backdrop-filter 0.3s',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          position: 'fixed', top: 0, right: 0, bottom: 0,
          width: '82%', maxWidth: 320,
          zIndex: 'var(--z-drawer)',
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.32s cubic-bezier(0.4,0,0.2,1)',
          overflowY: 'auto',
          display: 'flex', flexDirection: 'column',
          ...glass.panel,
        }}
      >
        {/* Header */}
        <div style={{
          padding: '16px 20px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.10)',
          boxShadow: 'inset 0 -1px 0 rgba(255,255,255,0.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              position: 'relative',
              width: '40px',
              height: '40px',
              borderRadius: '50%',
              overflow: 'hidden',
              border: '2px solid rgba(14,138,110,0.3)',
              background: 'white',
              padding: '2px',
            }}>
              <Image
                src="/Mediport_Logo.png"
                alt="MediportBD"
                fill
                sizes="40px"
                style={{ objectFit: 'contain' }}
              />
            </div>
            <span style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: '#fff', letterSpacing: '-0.3px' }}>
              Mediport<span style={{ color: 'var(--color-brand-teal-light)' }}>BD</span>
            </span>
          </div>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              width: 44, height: 44, borderRadius: 10, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.14)',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            <FaTimes size={14} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px', ...glass.section }}>
          <form onSubmit={handleSearch} style={{
            display: 'flex', alignItems: 'center', gap: 8,
            background: 'rgba(255,255,255,0.08)',
            borderRadius: 10, padding: '8px 12px',
            border: '1px solid rgba(255,255,255,0.14)',
          }}>
            <button type="submit" aria-label="Search" style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center' }}>
              <FaSearch size={13} color="rgba(255,255,255,0.4)" />
            </button>
            <input
              type="search"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search products…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 'var(--text-base)', color: '#fff' }}
              aria-label="Search products"
            />
            {searchQuery && (
              <button type="button" onClick={() => setSearchQuery('')} aria-label="Clear search"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, display: 'flex', alignItems: 'center', color: 'rgba(255,255,255,0.4)' }}>
                <FaTimes size={12} />
              </button>
            )}
          </form>
        </div>

        {/* User card */}
        {authed && user && (
          <div style={{ padding: '12px 16px', ...glass.section }}>
            <button
              onClick={() => handleNavigate('/account')}
              style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: '10px 12px', width: '100%', border: 'none', textAlign: 'left', cursor: 'pointer',
                background: 'rgba(77,219,184,0.10)',
                borderRadius: 12,
                border: '1px solid rgba(77,219,184,0.18)',
              }}
            >
              <div style={{
                width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                background: 'linear-gradient(145deg,#0a6b55,var(--color-brand-teal),var(--color-brand-teal-light))',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 'var(--text-sm)', fontWeight: 600,
                boxShadow: '0 2px 10px rgba(14,138,110,0.4)',
              }}>
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#fff', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                <div style={{ fontSize: 'var(--text-xs)', color: 'rgba(255,255,255,0.45)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.email}</div>
              </div>
              <FaChevronRight size={11} color="rgba(255,255,255,0.3)" />
            </button>

            {/* Quick access shortcuts — visible immediately without scrolling */}
            {isAdmin() && (
              <button
                onClick={() => handleNavigate('/admin')}
                style={{
                  marginTop: 8, width: '100%', padding: '11px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(124,58,237,0.18)',
                  border: '1px solid rgba(167,139,250,0.30)',
                  borderRadius: 10, cursor: 'pointer',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <FaUserShield size={14} color="#c4b5fd" />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#c4b5fd', flex: 1 }}>Admin Panel</span>
                <span style={{
                  fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                  background: 'rgba(124,58,237,0.30)', border: '1px solid rgba(167,139,250,0.35)',
                  color: 'rgba(196,181,253,0.9)', letterSpacing: '0.04em',
                }}>ADMIN</span>
              </button>
            )}

            {isB2BCustomer() && (
              <button
                onClick={() => handleNavigate('/b2b')}
                style={{
                  marginTop: 8, width: '100%', padding: '11px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(14,138,110,0.18)',
                  border: '1px solid rgba(77,219,184,0.30)',
                  borderRadius: 10, cursor: 'pointer',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <FaBuilding size={14} color="var(--color-brand-teal-light)" />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-brand-teal-light)', flex: 1 }}>B2B Portal</span>
                <span style={{
                  fontSize: 'var(--text-xs)', fontWeight: 600, padding: '2px 7px', borderRadius: 999,
                  background: 'rgba(14,138,110,0.30)', border: '1px solid rgba(77,219,184,0.35)',
                  color: 'rgba(77,219,184,0.95)', letterSpacing: '0.04em',
                }}>B2B</span>
              </button>
            )}

            {!isAdmin() && !isB2BCustomer() && (
              <button
                onClick={() => handleNavigate('/orders')}
                style={{
                  marginTop: 8, width: '100%', padding: '11px 14px',
                  display: 'flex', alignItems: 'center', gap: 10,
                  background: 'rgba(59,130,246,0.18)',
                  border: '1px solid rgba(96,165,250,0.30)',
                  borderRadius: 10, cursor: 'pointer',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08)',
                }}
              >
                <FaBox size={14} color="#93c5fd" />
                <span style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: '#93c5fd', flex: 1 }}>My Orders</span>
                <FaChevronRight size={10} color="rgba(147,197,253,0.5)" />
              </button>
            )}
          </div>
        )}

        {/* Main nav */}
        <div style={{ padding: '8px 0', ...glass.section }}>
          <div style={{ padding: '4px 16px 6px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
            Navigation
          </div>
          {MAIN_LINKS.map(item => (
            <GlassNavButton key={item.path} item={item} onClick={() => handleNavigate(item.path)} />
          ))}
        </div>

        {/* Categories */}
        <div style={{ padding: '8px 0', ...glass.section }}>
          <button
            onClick={() => setCategoriesExpanded(v => !v)}
            style={{
              width: '100%', padding: '10px 16px', background: 'none', border: 'none',
              textAlign: 'left', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}
          >
            <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              Shop by Category
            </span>
            <FaChevronRight size={11} color="rgba(255,255,255,0.3)"
              style={{ transform: categoriesExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
          </button>

          {categoriesExpanded && (
            <div>
              {categories.map(cat => {
                const name = typeof cat === 'string' ? cat : cat.name;
                const slug = CATEGORY_NAME_TO_SLUG[name];
                const path = name === 'Laboratory Reagents' 
                  ? '/reagent-store' 
                  : slug 
                    ? `/products/category/${slug}` 
                    : `/products?category=${encodeURIComponent(name)}`;
                const icon = CATEGORY_ICON_MAP[name] || <FaStethoscope size={13} />;
                return (
                  <button key={name} onClick={() => handleNavigate(path)}
                    style={{
                      width: '100%', padding: '9px 16px 9px 28px', background: 'none', border: 'none',
                      textAlign: 'left', fontSize: 'var(--text-sm)', color: 'rgba(255,255,255,0.72)', cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 10,
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'none'}
                  >
                    <span style={{ color: 'var(--color-brand-teal-light)', flexShrink: 0 }}>{icon}</span>
                    {name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Account actions */}
        {authed && (
          <div style={{ padding: '8px 0', ...glass.section }}>
            <div style={{ padding: '4px 16px 6px', fontSize: 'var(--text-xs)', fontWeight: 600, color: 'rgba(255,255,255,0.3)', letterSpacing: '0.1em', textTransform: 'uppercase' }}>
              My Account
            </div>
            <GlassAccountButton icon={<FaUser size={13} />} label="My Account" onClick={() => handleNavigate('/account')} />
            <GlassAccountButton icon={<FaBox size={13} />} label="My Orders" onClick={() => handleNavigate('/account')} />
            <GlassAccountButton icon={<FaHeart size={13} />} label="Wishlist" onClick={() => handleNavigate('/wishlist')} />
            <GlassAccountButton icon={<FaCog size={13} />} label="Settings" onClick={() => handleNavigate('/account')} />
            {isAdmin() && (
              <GlassAccountButton icon={<FaUserShield size={13} />} label="Admin Panel" onClick={() => handleNavigate('/admin')} admin />
            )}
            <GlassAccountButton icon={<FaSignOutAlt size={13} />} label="Logout" onClick={handleLogout} danger />
          </div>
        )}

        {/* Guest auth */}
        {!authed && (
          <div style={{ padding: '16px' }}>
            <button onClick={() => handleNavigate('/login')}
              style={{
                width: '100%', padding: '12px', marginBottom: 8, border: 'none', borderRadius: 12,
                fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer', color: '#fff',
                background: 'rgba(255,255,255,0.14)',
                backdropFilter: 'blur(var(--glass-blur))',
                border: '1px solid rgba(255,255,255,0.22)',
                boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.20)',
              }}>
              Log In
            </button>
            <button onClick={() => handleNavigate('/register')}
              style={{
                width: '100%', padding: '12px', border: 'none', borderRadius: 12,
                fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer',
                color: 'var(--color-brand-teal-light)',
                background: 'rgba(77,219,184,0.10)',
                border: '1px solid rgba(77,219,184,0.25)',
              }}>
              Register
            </button>
          </div>
        )}

        {/* B2B CTA */}
        <div style={{ padding: '0 16px 24px', marginTop: 'auto' }}>
          <button onClick={() => handleNavigate('/b2b')}
            style={{
              width: '100%', padding: '13px', border: 'none', borderRadius: 12,
              fontSize: 'var(--text-sm)', fontWeight: 600, cursor: 'pointer', color: '#fff',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              background: 'rgba(14,138,110,0.35)',
              backdropFilter: 'blur(var(--glass-blur))',
              border: '1px solid rgba(77,219,184,0.30)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.14), 0 4px 16px rgba(14,138,110,0.20)',
            }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(14,138,110,0.48)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(14,138,110,0.35)'}
          >
            <FaBuilding size={14} />
            B2B Portal — Bulk Pricing
          </button>
        </div>
      </div>
    </>
  );
}

function GlassNavButton({ item, onClick }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', padding: '11px 16px', minHeight: 44,
        background: hovered ? 'rgba(255,255,255,0.07)' : 'none',
        border: 'none', textAlign: 'left', fontSize: 'var(--text-sm)', fontWeight: 500,
        color: hovered ? '#fff' : 'rgba(255,255,255,0.78)',
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {item.icon && <span style={{ color: 'var(--color-brand-teal-light)' }}>{item.icon}</span>}
        {item.label}
      </span>
      <FaChevronRight size={10} color="rgba(255,255,255,0.25)" />
    </button>
  );
}

function GlassAccountButton({ icon, label, onClick, danger, admin }) {
  const [hovered, setHovered] = useState(false);

  const color = danger
    ? (hovered ? '#ff6b6b' : 'rgba(226,75,74,0.85)')
    : admin
    ? (hovered ? '#c4b5fd' : 'rgba(167,139,250,0.9)')
    : (hovered ? '#fff' : 'rgba(255,255,255,0.72)');

  const iconColor = danger
    ? (hovered ? '#ff6b6b' : 'rgba(226,75,74,0.7)')
    : admin
    ? (hovered ? '#c4b5fd' : 'rgba(167,139,250,0.7)')
    : (hovered ? 'var(--color-brand-teal-light)' : 'rgba(255,255,255,0.4)');

  const bg = hovered
    ? danger
      ? 'rgba(226,75,74,0.08)'
      : admin
      ? 'rgba(124,58,237,0.14)'
      : 'rgba(255,255,255,0.06)'
    : 'none';

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        width: '100%', padding: '11px 16px', minHeight: 44,
        background: bg,
        border: 'none', textAlign: 'left', fontSize: 'var(--text-sm)',
        color,
        cursor: 'pointer',
        display: 'flex', alignItems: 'center', gap: 12,
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      <span style={{ color: iconColor }}>{icon}</span>
      {label}
      {admin && (
        <span style={{
          marginLeft: 'auto', fontSize: 'var(--text-xs)', fontWeight: 600,
          padding: '2px 7px', borderRadius: 999,
          background: 'rgba(124,58,237,0.25)',
          border: '1px solid rgba(167,139,250,0.3)',
          color: 'rgba(167,139,250,0.9)',
          letterSpacing: '0.04em',
        }}>ADMIN</span>
      )}
    </button>
  );
}
