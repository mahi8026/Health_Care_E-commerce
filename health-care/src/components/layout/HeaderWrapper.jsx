"use client";

import { useRouter, usePathname } from 'next/navigation';
import Header from './Header';

export default function HeaderWrapper() {
  const router = useRouter();
  const pathname = usePathname();

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

  const handleLogout = () => {
    // Logout is handled by the Header component itself
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
