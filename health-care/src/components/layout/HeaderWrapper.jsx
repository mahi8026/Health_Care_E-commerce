"use client";

import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import Header from './Header';

export default function HeaderWrapper() {
  const router = useRouter();
  const pathname = usePathname();
  const { logout } = useAuth();

  // Don't show header on these pages
  const hideHeaderPaths = ['/admin', '/b2b', '/mobile-app'];
  if (hideHeaderPaths.some(path => pathname?.startsWith(path))) {
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
    router.push('/cart');
  };

  const handleNavigate = (view, category) => {
    const routes = {
      'home': '/',
      'search': '/search',
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
    router.push('/search');
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
