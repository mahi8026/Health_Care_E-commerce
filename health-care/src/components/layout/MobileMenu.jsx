'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FaTimes, FaChevronRight, FaUser, FaBox, FaHeart, FaCog, FaSignOutAlt } from 'react-icons/fa';
import { useAuth } from '@/context/AuthContext';

const CATEGORIES = [
  { label: 'Home', path: '/' },
  { label: 'All Products', path: '/products' },
  { label: 'Diagnostics', path: '/products?category=Diagnostic+Equipment' },
  { label: 'Surgical', path: '/products?category=Surgical+Instruments' },
  { label: 'Reagents', path: '/products?category=Laboratory+Reagents' },
  { label: 'Machines', path: '/products?category=Hospital+Machines' },
  { label: 'Lab Equipment', path: '/products?category=Lab+Equipment' },
  { label: 'B2B Portal', path: '/b2b' },
];

export default function MobileMenu({ isOpen, onClose }) {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setMounted(true);
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      const timer = setTimeout(() => setMounted(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isOpen]);

  const handleNavigate = (path) => {
    router.push(path);
    onClose();
  };

  const handleLogout = () => {
    logout();
    onClose();
    router.push('/');
  };

  if (!mounted && !isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
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
          boxShadow: '-4px 0 20px rgba(0,0,0,0.1)',
        }}
      >
        {/* Header */}
        <div
          style={{
            padding: '20px',
            borderBottom: '1px solid #E5E7EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: '#0B2545',
            color: '#fff',
          }}
        >
          <div>
            <div style={{ fontSize: 18, fontWeight: 700 }}>
              MedCore<span style={{ color: '#0E8A6E' }}>BD</span>
            </div>
            {isAuthenticated() && user && (
              <div style={{ fontSize: 12, marginTop: 4, opacity: 0.8 }}>
                {user.name}
              </div>
            )}
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.1)',
              border: 'none',
              width: 36,
              height: 36,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            <FaTimes size={18} />
          </button>
        </div>

        {/* User Section */}
        {isAuthenticated() && user && (
          <div style={{ padding: '16px 20px', borderBottom: '1px solid #E5E7EB' }}>
            <div
              onClick={() => handleNavigate('/account')}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '12px',
                background: '#F9FAFB',
                borderRadius: 8,
                cursor: 'pointer',
              }}
            >
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: '#0E8A6E',
                  color: '#fff',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 20,
                  fontWeight: 700,
                }}
              >
                {user.name?.charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600 }}>{user.name}</div>
                <div style={{ fontSize: 12, color: '#6B7280' }}>{user.email}</div>
              </div>
              <FaChevronRight size={14} color="#9CA3AF" />
            </div>
          </div>
        )}

        {/* Navigation Links */}
        <div style={{ padding: '8px 0' }}>
          {CATEGORIES.map((item) => (
            <button
              key={item.path}
              onClick={() => handleNavigate(item.path)}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                fontSize: 15,
                fontWeight: 500,
                color: '#111827',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                transition: 'background 0.2s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F9FAFB')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'none')}
            >
              {item.label}
              <FaChevronRight size={12} color="#9CA3AF" />
            </button>
          ))}
        </div>

        {/* Account Actions */}
        {isAuthenticated() && (
          <div style={{ padding: '8px 0', borderTop: '1px solid #E5E7EB', marginTop: 8 }}>
            <button
              onClick={() => handleNavigate('/account')}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                fontSize: 14,
                color: '#111827',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <FaUser size={16} color="#6B7280" />
              My Account
            </button>
            <button
              onClick={() => handleNavigate('/account')}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                fontSize: 14,
                color: '#111827',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <FaBox size={16} color="#6B7280" />
              My Orders
            </button>
            <button
              onClick={() => handleNavigate('/wishlist')}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                fontSize: 14,
                color: '#111827',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <FaHeart size={16} color="#6B7280" />
              Wishlist
            </button>
            <button
              onClick={handleLogout}
              style={{
                width: '100%',
                padding: '14px 20px',
                background: 'none',
                border: 'none',
                textAlign: 'left',
                fontSize: 14,
                color: '#E24B4A',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <FaSignOutAlt size={16} color="#E24B4A" />
              Logout
            </button>
          </div>
        )}

        {/* Auth Buttons */}
        {!isAuthenticated() && (
          <div style={{ padding: '20px', borderTop: '1px solid #E5E7EB', marginTop: 8 }}>
            <button
              onClick={() => handleNavigate('/login')}
              style={{
                width: '100%',
                padding: '12px',
                background: '#0B2545',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
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
                border: '1px solid #0B2545',
                borderRadius: 8,
                fontSize: 14,
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Register
            </button>
          </div>
        )}
      </div>
    </>
  );
}
