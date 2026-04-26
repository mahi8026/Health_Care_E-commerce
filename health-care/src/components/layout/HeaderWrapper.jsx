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

  const handleNavigate = (view) => {
    const routes = {
      'home': '/',
      'search': '/search',
      'cart': '/cart',
      'reagent': '/reagent-store',
      'orders': '/orders',
    };
    router.push(routes[view] || '/');
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
