'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import AccountMenu from './AccountMenu';
import WishlistButton from './WishlistButton';
import MobileMenu from './MobileMenu';
import { FaSearch, FaShoppingCart, FaBars } from 'react-icons/fa';

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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  const handleSearch = () => {
    if (searchQuery.trim()) {
      const categoryParam = selectedCategory !== 'All Categories' 
        ? `&category=${encodeURIComponent(selectedCategory)}`
        : '';
      router.push(`/search?q=${encodeURIComponent(searchQuery.trim())}${categoryParam}`);
      setMobileSearchOpen(false);
    }
  };

  return (
    <>
      {/* Main Navbar with Search */}
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-4 md:px-6 py-3 flex items-center gap-2 md:gap-4">
          {/* Logo */}
          <div 
            onClick={() => router.push('/')}
            className="font-[family-name:var(--font-lora)] text-[18px] md:text-[20px] font-bold text-[#0B2545] flex-shrink-0 cursor-pointer"
          >
            MedCore<span className="text-[#0E8A6E]">BD</span>
          </div>
          
          {/* Desktop Search Bar */}
          <div className="hidden md:flex flex-1 max-w-[680px]">
            <div className="flex w-full border-2 border-gray-300 rounded-lg overflow-hidden bg-white hover:border-[#0E8A6E] transition-colors focus-within:border-[#0E8A6E] focus-within:shadow-md">
              <select 
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="border-none bg-gray-50 px-4 py-3 text-[13px] text-gray-700 cursor-pointer outline-none min-w-[150px] font-medium"
              >
                <option value="All Categories">All Categories</option>
                {FALLBACK_CATEGORIES.map(cat => (
                  <option key={cat.name} value={cat.name}>{cat.name}</option>
                ))}
              </select>
              <div className="w-px bg-gray-300"></div>
              <div className="flex-1 relative">
                <input 
                  placeholder="Search products, brands, catalogue numbers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="w-full border-none px-4 py-3 text-[14px] outline-none"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
                    aria-label="Clear search"
                  >
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                      <path d="M8 0a8 8 0 1 0 0 16A8 8 0 0 0 8 0zm3.5 10.5l-1 1L8 9l-2.5 2.5-1-1L7 8 4.5 5.5l1-1L8 7l2.5-2.5 1 1L9 8l2.5 2.5z"/>
                    </svg>
                  </button>
                )}
              </div>
              <button 
                onClick={handleSearch}
                className="bg-[#0E8A6E] text-white border-none px-6 py-3 text-[14px] font-semibold cursor-pointer hover:bg-[#0c7a61] transition-colors flex items-center gap-2"
              >
                <FaSearch size={14} /> 
                <span className="hidden lg:inline">Search</span>
              </button>
            </div>
          </div>
          
          {/* Mobile Search Icon */}
          <button
            onClick={() => setMobileSearchOpen(!mobileSearchOpen)}
            className="md:hidden w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center cursor-pointer"
          >
            <FaSearch size={16} className="text-gray-700" />
          </button>
          
          {/* Right Side Icons */}
          <div className="flex gap-2 items-center ml-auto">
            {/* Wishlist - Hidden on mobile */}
            <div className="hidden md:block">
              <WishlistButton />
            </div>
            
            {/* Cart */}
            <button
              onClick={onCartClick}
              aria-label={cartCount > 0 ? `Shopping cart, ${cartCount} items` : 'Shopping cart'}
              className="w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center cursor-pointer relative hover:bg-gray-50 transition-colors"
              title={cartCount > 0 ? `${cartCount} items in cart` : 'Shopping cart'}
            >
              <FaShoppingCart size={16} className="text-gray-700" />
              {cartCount > 0 && (
                <div className="absolute -top-[5px] -right-[5px] bg-[#E24B4A] text-white text-[8px] w-[16px] h-[16px] rounded-full flex items-center justify-center border-[1.5px] border-white font-bold">
                  {cartCount > 9 ? '9+' : cartCount}
                </div>
              )}
            </button>
            
            {/* Desktop Account Menu */}
            <div className="hidden md:block">
              <AccountMenu 
                onNavigate={onNavigate}
                onLoginClick={onLoginClick}
                onLogout={onLogout}
              />
            </div>
            
            {/* Desktop Auth Buttons */}
            <div className="hidden lg:flex items-center gap-2">
              {isAuthenticated() ? (
                <>
                  <span className="text-[11px] text-gray-600">
                    {user?.name}
                  </span>
                  {user?.role === 'admin' && (
                    <button
                      onClick={() => router.push('/admin')}
                      className="px-3 py-1.5 rounded-lg bg-purple-600 text-white text-[11px] font-medium cursor-pointer hover:bg-purple-700 transition-colors"
                    >
                      Admin
                    </button>
                  )}
                  <button
                    onClick={onLogout}
                    className="px-3 py-1.5 rounded-lg border border-gray-300 bg-transparent text-gray-700 text-[12px] cursor-pointer hover:bg-gray-50 transition-colors"
                  >
                    Logout
                  </button>
                </>
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
            
            {/* Mobile Hamburger Menu */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden w-10 h-10 rounded-lg border border-gray-200 bg-white flex items-center justify-center cursor-pointer"
            >
              <FaBars size={18} className="text-gray-700" />
            </button>
          </div>
        </div>
        
        {/* Mobile Search Bar (Expandable) */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 border-t border-gray-100 pt-3 animate-slide-in">
            <div className="flex border-2 border-[#0B2545] rounded-lg overflow-hidden">
              <input 
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="flex-1 border-none px-3 py-2 text-[14px] outline-none"
                autoFocus
              />
              <button 
                onClick={handleSearch}
                className="bg-[#0B2545] text-white border-none px-4 text-[13px] font-semibold cursor-pointer"
              >
                <FaSearch size={14} />
              </button>
            </div>
          </div>
        )}
      </nav>
      
      {/* Mobile Menu */}
      <MobileMenu isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
    </>
  );
}
