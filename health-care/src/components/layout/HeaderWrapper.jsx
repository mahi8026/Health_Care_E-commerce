"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';

export default function HeaderWrapper({ onCartClick }) {
  const router = useRouter();
  const pathname = usePathname();
  const { logout, isAuthenticated, isB2BCustomer } = useAuth();

  // Admin & app shell only — keep header on /b2b for guests & retail users
  if (pathname?.startsWith('/admin') || pathname?.startsWith('/mobile-app')) {
    return null;
  }
  if (pathname?.startsWith('/b2b') && isAuthenticated() && isB2BCustomer()) {
    return null;
  }

  const handleLoginClick = () => {
    router.push('/login');
  };

  const handleRegisterClick = () => {
    router.push('/register');
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Use window.location for more reliable navigation after logout
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Logout error:', error);
      // Still redirect even if logout API fails
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  const handleCartClick = () => {
    // Use the passed onCartClick if available (for sidebar), otherwise navigate to cart page
    if (onCartClick) {
      onCartClick();
    } else {
      router.push('/cart');
    }
  };

  const handleNavigate = (view, category) => {
    const routes = {
      'home': '/',
      'search': '/products',
      'cart': '/cart',
      'product': '/products',
      'diagnostics': '/products?category=Diagnostic Equipment',
      'surgical': '/products?category=Surgical Instruments',
      'machines': '/products?category=Hospital Machines',
      'lab-equipment': '/products?category=Lab Equipment',
      'reagent': '/reagent-store',
      'orders': '/orders',
      'admin': '/admin',
      'b2b': '/b2b',
      'reviews': '/account/reviews',
      'wishlist': '/wishlist',
    };
    
    // If a category is provided, append it to the products route
    if (view === 'product' && category) {
      router.push(`/products?category=${encodeURIComponent(category)}`);
    } else {
      router.push(routes[view] || '/');
    }
  };

  const handleSearchClick = () => {
    router.push('/products');
  };

  return (
    <Header
      onLoginClick={handleLoginClick}
      onRegisterClick={handleRegisterClick}
      onLogout={handleLogout}
      onCartClick={handleCartClick}
      onNavigate={handleNavigate}
      onSearchClick={handleSearchClick}
    />
  );
}
