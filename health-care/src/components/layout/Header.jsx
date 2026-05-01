'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import AccountMenu from './AccountMenu';
import WishlistButton from './WishlistButton';
import { FaSearch, FaShoppingCart } from 'react-icons/fa';

const FALLBACK_CATEGORIES = [
  { name: 'Diagnostic Equipment' },
  { name: 'Surgical Instruments' },
  { name: 'Laboratory Reagents' },
  { name: 'Hospital Machines' },
  { name: 'Lab Equipment' },
  { name: 'PPE & Safety' },
  { name: 'Dental Equipment' },
  { name: 'Implants & Ortho' },
];

export default function Header({ onLoginClick, onRegisterClick, onLogout, onCartClick, onNavigate, onSearchClick }) {
  const router = useRouter();
  const { getCartCount } = useCart();
  const { user, isAuthenticated } = useAuth();
  const cartCount = getCartCount();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All Categories');

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const categoryParam = selectedCategory !== 'All Categories' 
        ? `&category=${encodeURIComponent(selectedCategory)}`
        : '';
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}${categoryParam}`);
    }
  };

  return (
    <>
      {/* Main Navbar with Search */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 py-3 flex items-center gap-4">
          {/* Logo */}
          <div 
            onClick={() => router.push('/')}
            className="font-[family-name:var(--font-lora)] text-[20px] font-bold text-[#0B2545] flex-shrink-0 cursor-pointer"
          >
            MedCore<span className="text-[#0E8A6E]">BD</span>
          </div>
          
          {/* Mega Search Bar */}
          <div className="flex-1 flex border-2 border-[#0B2545] rounded-lg overflow-hidden max-w-[680px]">
            <select 
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="border-none border-r border-gray-200 px-3 text-[12px] text-gray-700 bg-gray-50 cursor-pointer outline-none min-w-[130px]"
            >
              <option>All Categories</option>
              {FALLBACK_CATEGORIES.map(cat => (
                <option key={cat.name}>{cat.name}</option>
              ))}
            </select>
            <input 
              placeholder="Search products, brands, catalogue numbers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              className="flex-1 border-none px-4 text-[13px] outline-none"
            />
            <button 
              onClick={handleSearch}
              className="bg-[#0B2545] text-white border-none px-5 text-[13px] font-semibold cursor-pointer hover:bg-[#0d2d52] transition-colors flex items-center gap-2"
            >
              <FaSearch size={14} /> Search
            </button>
          </div>
          
          {/* Right Side Icons */}
          <div className="flex gap-2 items-center ml-auto">
            <WishlistButton />
            
            <button
              onClick={onCartClick}
              aria-label={cartCount > 0 ? `Shopping cart, ${cartCount} items` : 'Shopping cart'}
              className="w-8 h-8 rounded-lg border border-gray-200 bg-white flex items-center justify-center cursor-pointer relative hover:bg-gray-50 transition-colors"
              title={cartCount > 0 ? `${cartCount} items in cart` : 'Shopping cart'}
            >
              <FaShoppingCart size={14} className="text-gray-700" />
              {cartCount > 0 && (
                <div className="absolute -top-[5px] -right-[5px] bg-[#E24B4A] text-white text-[8px] w-[14px] h-[14px] rounded-full flex items-center justify-center border-[1.5px] border-white font-bold">
                  {cartCount}
                </div>
              )}
            </button>
            
            <AccountMenu 
              onNavigate={onNavigate}
              onLoginClick={onLoginClick}
              onLogout={onLogout}
            />
            
            {isAuthenticated() ? (
              <div className="flex items-center gap-2">
                <span className="text-[11px] text-gray-600">
                  {user?.name}
                </span>
                {user?.role === 'admin' && (
                  <button
                    onClick={() => router.push('/admin')}
                    className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[11px] font-medium cursor-pointer hover:bg-purple-700 transition-colors"
                  >
                    Shahid Admin
                  </button>
                )}
                <button
                  onClick={onLogout}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-transparent text-gray-700 text-[12px] cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  Logout
                </button>
              </div>
            ) : (
              <>
                <button
                  onClick={onLoginClick}
                  className="px-3 py-1.5 rounded-lg border border-gray-300 bg-transparent text-gray-700 text-[12px] cursor-pointer hover:bg-gray-50 transition-colors"
                >
                  Log in
                </button>
                <button
                  onClick={onRegisterClick}
                  className="px-3 py-1.5 rounded-lg border-none bg-[#0B2545] text-white text-[12px] font-medium cursor-pointer hover:bg-[#0d2d52] transition-colors"
                >
                  Register
                </button>
              </>
            )}
            
            <button
              onClick={() => router.push('/b2b')}
              className="px-4 py-1.5 bg-[#0E8A6E] text-white border-none rounded-lg text-[12px] font-semibold cursor-pointer hover:bg-[#0c7a61] transition-colors"
            >
              B2B Portal
            </button>
          </div>
        </div>
      </nav>

      {/* Secondary Navigation */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-[1400px] mx-auto px-6 flex items-center gap-0">
          {[
            { label: 'Home', path: '/' },
            { label: 'Diagnostics', path: '/products?category=Diagnostic+Equipment' },
            { label: 'Surgical', path: '/products?category=Surgical+Instruments' },
            { label: 'Reagents', path: '/products?category=Laboratory+Reagents' },
            { label: 'Machines', path: '/products?category=Hospital+Machines' },
            { label: 'Lab Equipment', path: '/products?category=Lab+Equipment' },
            { label: 'B2B Portal', path: '/b2b' },
          ].map(item => (
            <button 
              key={item.label}
              onClick={() => router.push(item.path)}
              className="px-3 py-2.5 bg-transparent border-none border-b-2 border-transparent text-[12px] font-medium text-gray-600 cursor-pointer whitespace-nowrap transition-all hover:text-[#0E8A6E] hover:border-[#0E8A6E]"
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
