'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';

export default function AccountMenu({ onNavigate, onLoginClick, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isB2BCustomer } = useAuth();
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleMenuClick = (action) => {
    setIsOpen(false);
    if (action) action();
  };

  if (!isAuthenticated()) {
    return (
      <button
        onClick={onLoginClick}
        aria-label="Account"
        className="w-8 h-8 rounded-[7px] border-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)] flex items-center justify-center cursor-pointer hover:bg-[var(--color-background-secondary)] transition-colors"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </button>
    );
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Account menu"
        aria-expanded={isOpen}
        className={`w-8 h-8 rounded-[7px] border-[0.5px] ${
          isOpen 
            ? 'border-[#0B2545] bg-[var(--color-background-secondary)]' 
            : 'border-[var(--color-border-tertiary)] bg-[var(--color-background-primary)]'
        } flex items-center justify-center cursor-pointer hover:bg-[var(--color-background-secondary)] transition-colors`}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
          <circle cx="12" cy="8" r="4"/>
          <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
        </svg>
      </button>

      {isOpen && (
        <div className="absolute right-0 top-[calc(100%+8px)] w-[240px] bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] shadow-lg py-2 z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b-[0.5px] border-[var(--color-border-tertiary)]">
            <div className="text-[13px] font-semibold text-[var(--color-text-primary)] mb-1 font-[family-name:var(--font-plus-jakarta)]">
              {user?.name || 'User'}
            </div>
            <div className="text-[11px] text-[var(--color-text-secondary)] mb-1">
              {user?.email}
            </div>
            {isB2BCustomer() && user?.b2bTier && (
              <div className="inline-flex items-center gap-1 mt-2">
                <span className={`text-[9px] px-2 py-[3px] rounded font-medium ${
                  user.b2bTier === 'Platinum' 
                    ? 'bg-[#EEEDFE] text-[#3C3489]'
                    : user.b2bTier === 'Gold'
                    ? 'bg-[#FAEEDA] text-[#633806]'
                    : 'bg-[#E6F1FB] text-[#0C447C]'
                }`}>
                  {user.b2bTier === 'Platinum' && '💎'}
                  {user.b2bTier === 'Gold' && '🥇'}
                  {user.b2bTier === 'Silver' && '🥈'}
                  {' '}{user.b2bTier} Member
                </span>
              </div>
            )}
          </div>

          {/* Menu Items */}
          <div className="py-1">
            {isB2BCustomer() && (
              <button
                onClick={() => handleMenuClick(() => onNavigate('b2b'))}
                className="w-full px-4 py-2 text-left text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] flex items-center gap-3 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="3" y="3" width="7" height="7"/>
                  <rect x="14" y="3" width="7" height="7"/>
                  <rect x="14" y="14" width="7" height="7"/>
                  <rect x="3" y="14" width="7" height="7"/>
                </svg>
                <span>B2B Dashboard</span>
              </button>
            )}

            <button
              onClick={() => handleMenuClick(() => onNavigate('orders'))}
              className="w-full px-4 py-2 text-left text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] flex items-center gap-3 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 01-8 0"/>
              </svg>
              <span>Order History</span>
            </button>

            <button
              onClick={() => handleMenuClick(() => onNavigate('wishlist'))}
              className="w-full px-4 py-2 text-left text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] flex items-center gap-3 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
              </svg>
              <span>My Wishlist</span>
            </button>

            <button
              onClick={() => handleMenuClick(() => onNavigate('reviews'))}
              className="w-full px-4 py-2 text-left text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] flex items-center gap-3 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              <span>My Reviews</span>
            </button>

            <button
              onClick={() => handleMenuClick(() => alert('Profile settings coming soon!'))}
              className="w-full px-4 py-2 text-left text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] flex items-center gap-3 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <circle cx="12" cy="12" r="3"/>
                <path d="M12 1v6m0 6v6M5.64 5.64l4.24 4.24m4.24 4.24l4.24 4.24M1 12h6m6 0h6M5.64 18.36l4.24-4.24m4.24-4.24l4.24-4.24"/>
              </svg>
              <span>Account Settings</span>
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => handleMenuClick(() => onNavigate('admin'))}
                className="w-full px-4 py-2 text-left text-[12px] text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] flex items-center gap-3 transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 2L2 7l10 5 10-5-10-5z"/>
                  <path d="M2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <span>Admin Panel</span>
              </button>
            )}
          </div>

          {/* Logout */}
          <div className="border-t-[0.5px] border-[var(--color-border-tertiary)] pt-1 mt-1">
            <button
              onClick={() => handleMenuClick(onLogout)}
              className="w-full px-4 py-2 text-left text-[12px] text-[#E24B4A] hover:bg-[#FCEBEB] flex items-center gap-3 transition-colors"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                <polyline points="16 17 21 12 16 7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
