'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { FaChevronDown } from 'react-icons/fa';

export default function AccountMenu({ onNavigate, onLoginClick, onLogout, variant = 'default' }) {
  const [isOpen, setIsOpen] = useState(false);
  const { user, isAuthenticated, isB2BCustomer } = useAuth();
  const menuRef = useRef(null);
  const router = useRouter();

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleMenuClick = (action) => {
    setIsOpen(false);
    if (action) action();
  };

  const UserIcon = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );

  const isGlass = variant === 'glass';

  if (!isAuthenticated()) {
    if (isGlass) {
      return (
        <button
          onClick={onLoginClick}
          aria-label="Account"
          className="nav-glass-control nav-glass-control--stack"
        >
          <span className="nav-glass-control__icon"><UserIcon /></span>
          <span className="nav-glass-control__label">Account</span>
        </button>
      );
    }
    return (
      <button
        onClick={onLoginClick}
        aria-label="Account"
        className="w-8 h-8 rounded-[7px] border border-gray-200 bg-white flex items-center justify-center cursor-pointer hover:bg-[#F3F4F6] hover:border-gray-300 transition-colors text-[#6B7280] hover:text-[#0B2545]"
      >
        <UserIcon />
      </button>
    );
  }

  const initials = user?.name
    ? user.name.split(' ').map((n) => n[0]).slice(0, 2).join('').toUpperCase()
    : '?';

  const firstName = user?.name?.split(' ')[0] || 'Account';

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Account menu"
        aria-expanded={isOpen}
        className={
          isGlass
            ? `nav-glass-control nav-glass-control--pill ${isOpen ? 'is-open' : ''}`
            : `w-10 h-10 rounded-lg border flex items-center justify-center cursor-pointer transition-colors font-bold text-[11px] ${
                isOpen
                  ? 'border-[#0E8A6E] bg-[#F0FBF8] text-[#0E8A6E]'
                  : 'border-gray-200 bg-white text-[#0B2545] hover:bg-gray-50 hover:border-gray-300'
              }`
        }
      >
        {isGlass ? (
          <>
            <span className="glass-avatar">{initials}</span>
            <span className="nav-glass-control__label">{firstName}</span>
            <FaChevronDown
              size={10}
              className={`text-white/50 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
            />
          </>
        ) : (
          initials
        )}
      </button>

      {isOpen && (
        <div
          className={`absolute right-0 top-[calc(100%+10px)] w-[260px] rounded-2xl py-2 z-50 nav-dropdown-enter ${
            isGlass ? 'glass-panel-dark' : 'bg-white border border-gray-100 shadow-xl'
          }`}
          role="menu"
        >
          <div className={`px-4 py-3 border-b ${isGlass ? 'border-white/10' : 'border-gray-100'}`}>
            <div className="flex items-center gap-3">
              <div className="glass-avatar glass-avatar--no-status w-9 h-9 text-[13px]">
                {initials}
              </div>
              <div className="min-w-0">
                <div className={`text-[13px] font-semibold truncate ${isGlass ? 'text-white' : 'text-[#111827]'}`}>
                  {user?.name || 'User'}
                </div>
                <div className={`text-[11px] truncate ${isGlass ? 'text-white/55' : 'text-[#6B7280]'}`}>
                  {user?.email}
                </div>
              </div>
            </div>
            {isB2BCustomer() && user?.b2bTier && (
              <div className="mt-2">
                <span
                  className={`inline-flex items-center gap-1 text-[10px] px-2 py-1 rounded-full font-semibold ${
                    user.b2bTier === 'Platinum'
                      ? 'bg-[#EEEDFE] text-[#3C3489]'
                      : user.b2bTier === 'Gold'
                      ? 'bg-[#FAEEDA] text-[#633806]'
                      : 'bg-[#E6F1FB] text-[#0C447C]'
                  }`}
                >
                  {user.b2bTier === 'Platinum' && '💎'}
                  {user.b2bTier === 'Gold' && '🥇'}
                  {user.b2bTier === 'Silver' && '🥈'}
                  {' '}{user.b2bTier} Member
                </span>
              </div>
            )}
          </div>

          <div className="py-1" role="none">
            {isB2BCustomer() && (
              <MenuItem glass={isGlass} icon={<GridIcon />} label="B2B Dashboard" onClick={() => handleMenuClick(() => onNavigate('b2b'))} />
            )}
            <MenuItem glass={isGlass} icon={<OrderIcon />} label="Order History" onClick={() => handleMenuClick(() => onNavigate('orders'))} />
            <MenuItem glass={isGlass} icon={<HeartIcon />} label="My Wishlist" onClick={() => handleMenuClick(() => onNavigate('wishlist'))} />
            <MenuItem glass={isGlass} icon={<StarIcon />} label="My Reviews" onClick={() => handleMenuClick(() => onNavigate('reviews'))} />
            <MenuItem glass={isGlass} icon={<SettingsIcon />} label="Account Settings" onClick={() => handleMenuClick(() => router.push('/account'))} />
            <MenuItem glass={isGlass} icon={<UserIcon />} label="Edit Profile" onClick={() => handleMenuClick(() => router.push('/account/profile'))} />
            {user?.role === 'admin' && (
              <MenuItem glass={isGlass} icon={<AdminIcon />} label="Admin Panel" onClick={() => handleMenuClick(() => onNavigate('admin'))} />
            )}
          </div>

          <div className={`border-t pt-1 mt-1 ${isGlass ? 'border-white/10' : 'border-gray-100'}`}>
            <button
              onClick={() => handleMenuClick(onLogout)}
              className={`w-full px-4 py-2 text-left text-[12px] text-[#E24B4A] flex items-center gap-3 transition-colors ${
                isGlass ? 'hover:bg-white/5' : 'hover:bg-[#FEF2F2]'
              }`}
              role="menuitem"
            >
              <LogoutIcon />
              <span>Logout</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function MenuItem({ icon, label, onClick, glass }) {
  return (
    <button
      onClick={onClick}
      className={`w-full px-4 py-2 text-left text-[12px] flex items-center gap-3 transition-colors ${
        glass
          ? 'text-white/85 hover:bg-white/8'
          : 'text-[#374151] hover:bg-surface-subtle'
      }`}
      role="menuitem"
    >
      <span className={glass ? 'text-white/50' : 'text-[#6B7280]'}>{icon}</span>
      <span>{label}</span>
    </button>
  );
}

const GridIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
  </svg>
);
const OrderIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
    <line x1="3" y1="6" x2="21" y2="6" /><path d="M16 10a4 4 0 01-8 0" />
  </svg>
);
const HeartIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);
const StarIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);
const SettingsIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);
const UserIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const AdminIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 2L2 7l10 5 10-5-10-5z" />
    <path d="M2 17l10 5 10-5M2 12l10 5 10-5" />
  </svg>
);
const LogoutIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
