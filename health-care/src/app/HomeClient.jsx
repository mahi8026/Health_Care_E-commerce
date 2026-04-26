"use client";

import { useRouter } from 'next/navigation';
import HomePage from '@/views/HomePage';

export default function HomeClient({ initialFeaturedProducts = [] }) {
  const router = useRouter();

  const handleNavigate = (view) => {
    const routes = {
      'home': '/',
      'search': '/search',
      'product': '/products',
      'cart': '/cart',
      'checkout': '/checkout',
      'reagent': '/reagent-store',
      'b2b': '/b2b',
      'admin': '/admin',
      'mobile': '/mobile-app',
      'orders': '/orders',
      'reset-password': '/reset-password',
    };
    
    router.push(routes[view] || '/');
  };

  const handleNavigateToProduct = (productId) => {
    router.push(`/products/${productId}`);
  };

  const handleRegisterClick = () => {
    router.push('/register');
  };

  return (
    <HomePage
      onNavigate={handleNavigate}
      onNavigateToProduct={handleNavigateToProduct}
      onRegisterClick={handleRegisterClick}
      initialFeaturedProducts={initialFeaturedProducts}
    />
  );
}
