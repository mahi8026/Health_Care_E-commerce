'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  FaTimes,
  FaChevronRight,
  FaUser,
  FaBox,
  FaHeart,
  FaSignOutAlt,
  FaCog,
  FaStethoscope,
  FaSyringe,
  FaFlask,
  FaHospital,
  FaMicroscope,
  FaShieldAlt,
  FaTooth,
  FaBone,
  FaBuilding,
  FaSearch,
} from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

const MAIN_LINKS = [
  { label: 'Home', path: '/', icon: null },
  { label: 'All Products', path: '/products', icon: null },
  { label: 'Reagent Store', path: '/reagent-store', icon: <FaFlask size={14} /> },
  { label: 'B2B Portal', path: '/b2b', icon: <FaBuilding size={14} /> },
  { label: 'Track Order', path: '/track', icon: null },
];

const CATEGORIES = [
  { label: 'Diagnostic Equipment', path: '/products?category=Diagnostic+Equipment', icon: <FaStethoscope size={13} /> },
  { label: 'Surgical Instruments', path: '/products?category=Surgical+Instruments', icon: <FaSyringe size={13} /> },
  { label: 'Laboratory Reagents', path: '/reagent-store', icon: <FaFlask size={13} /> },
  { label: 'Hospital Machines', path: '/products?category=Hospital+Machines', icon: <FaHospital size={13} /> },
  { label: 'Lab Equipment', path: '/products?category=Lab+Equipment', icon: <FaMicroscope size={13} /> },
  { label: 'PPE & Safety', path: '/products?category=PPE+%26+Safety', icon: <FaShieldAlt size={13} /> },
  { label: 'Dental Equipment', path: '/products?category=Dental+Equipment', icon: <FaTooth size={13} /> },
  { label: 'Implants & Ortho', path: '/products?category=Implants+%26+Ortho', icon: <FaBone size={13} /> },
];

export default function MobileMenu({ isOpen, onClose }) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [categoriesExpanded, setCategoriesExpanded] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => {
        setMounted(false);
        setCategoriesExpanded(false);
        setSearchQuery('');
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleNavigate = (path) => {
    router.push(path);
    onClose();
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      onClose();
    }
  };

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/');
  };

  const authed = isAuthenticated();
  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  if (!mounted && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          zIndex: 999,
          opacity: isOpen ? 1 : 0,
          transition: 'opacity 0.3s',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      />

      {/* Menu Panel */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Navigation menu"
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '85%',
          maxWidth: 320,
          background: '#fff',
          zIndex: 1000,
          transform: isOpen ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.3s ease-out',
          overflowY: 'auto',
          boxShadow: '-4px 0 24px rgba(0,0,0,0.12)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '16px 20px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#0B2545',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          <span style={{ fontSize: 20, fontWeight: 700, letterSpacing: '-0.3px' }}>
            MedCore<span style={{ color: '#0E8A6E' }}>BD</span>
          </span>
          <button
            onClick={onClose}
            aria-label="Close menu"
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              width: 34,
              height: 34,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            <FaTimes size={16} />
          </button>
        </div>

        {/* Search */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', alignItems: 'center', gap: 8, background: '#F9FAFB', borderRadius: 10, padding: '8px 12px', border: '1px solid #E5E7EB' }}>
            <FaSearch size={13} color="#9CA3AF" />
            <input
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search products…"
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#111827' }}
              aria-label="Search products"
            />
          </form>
        </div>

        {/* User Section */}
        {authed && user && (
          <div style={{ padding: '12px 16px', borderBottom: '1px solid #F3F4F6' }}>
            <button
              onClick={() => handleNavigate('/account')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 12px',
                background: '#F0FBF8',
                borderRadius: 10,
                cursor: 'pointer',
                width: '100%',
                border: 'none',
                textAlign: 'left',
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: '#0E8A6E',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 14,
                  fontWeight: 700,
                  flexShrink: 0,
                }}
              >
                {initials}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#111827', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.name}
                </div>
                <div style={{ fontSize: 11, color: '#6B7280', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user.email}
                </div>
              </div>
              <FaChevronRight size={12} color="#9CA3AF" />
            </button>
          </div>
        )}

        {/* Main Navigation */}
        <div style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
          <div style={{ padding: '4px 16px 6px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            Navigation
          </div>
          {MAIN_LINKS.map((item) => (
            <NavButton key={item.path} item={item} onClick={() => handleNavigate(item.path)} />
          ))}
        </div>

        {/* Categories */}
        <div style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
          <button
            onClick={() => setCategoriesExpanded((v) => !v)}
            style={{
              width: '100%',
              padding: '10px 16px',
              background: 'none',
              border: 'none',
              textAlign: 'left',
              fontSize: 13,
              fontWeight: 600,
              color: '#111827',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                Shop by Category
              </span>
            </span>
            <FaChevronRight
              size={11}
              color="#9CA3AF"
              style={{ transform: categoriesExpanded ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}
            />
          </button>

          {categoriesExpanded && (
            <div>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.path}
                  onClick={() => handleNavigate(cat.path)}
                  style={{
                    width: '100%',
                    padding: '9px 16px 9px 28px',
                    background: 'none',
                    border: 'none',
                    textAlign: 'left',
                    fontSize: 13,
                    color: '#374151',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                  }}
                >
                  <span style={{ color: '#0E8A6E', flexShrink: 0 }}>{cat.icon}</span>
                  {cat.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Account Actions (authenticated) */}
        {authed && (
          <div style={{ padding: '8px 0', borderBottom: '1px solid #F3F4F6' }}>
            <div style={{ padding: '4px 16px 6px', fontSize: 10, fontWeight: 700, color: '#9CA3AF', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
              My Account
            </div>
            <AccountButton icon={<FaUser size={13} />} label="My Account" onClick={() => handleNavigate('/account')} />
            <AccountButton icon={<FaBox size={13} />} label="My Orders" onClick={() => handleNavigate('/account')} />
            <AccountButton icon={<FaHeart size={13} />} label="Wishlist" onClick={() => handleNavigate('/wishlist')} />
            <AccountButton icon={<FaCog size={13} />} label="Settings" onClick={() => handleNavigate('/account')} />
            <AccountButton icon={<FaSignOutAlt size={13} />} label="Logout" onClick={handleLogout} danger />
          </div>
        )}

        {/* Auth Buttons (guest) */}
        {!authed && (
          <div style={{ padding: '16px' }}>
            <button
              onClick={() => handleNavigate('/login')}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0B2545',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
                marginBottom: 8,
              }}
            >
              Log In
            </button>
            <button
              onClick={() => handleNavigate('/register')}
              style={{
                width: '100%',
                padding: '12px',
                background: 'transparent',
                color: '#0B2545',
                border: '1.5px solid #0B2545',
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Register
            </button>
          </div>
        )}

        {/* B2B CTA */}
        <div style={{ padding: '0 16px 20px', marginTop: 'auto' }}>
          <button
            onClick={() => handleNavigate('/b2b')}
            style={{
              width: '100%',
              padding: '12px',
              background: '#0E8A6E',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            <FaBuilding size={14} />
            B2B Portal — Bulk Pricing
          </button>
        </div>
      </div>
    </>
  );
}

function NavButton({ item, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 16px',
        background: 'none',
        border: 'none',
        textAlign: 'left',
        fontSize: 14,
        fontWeight: 500,
        color: '#111827',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <span style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        {item.icon && <span style={{ color: '#0E8A6E' }}>{item.icon}</span>}
        {item.label}
      </span>
      <FaChevronRight size={11} color="#D1D5DB" />
    </button>
  );
}

function AccountButton({ icon, label, onClick, danger }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: '100%',
        padding: '10px 16px',
        background: 'none',
        border: 'none',
        textAlign: 'left',
        fontSize: 13,
        color: danger ? '#E24B4A' : '#374151',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
      }}
    >
      <span style={{ color: danger ? '#E24B4A' : '#6B7280' }}>{icon}</span>
      {label}
    </button>
  );
}
