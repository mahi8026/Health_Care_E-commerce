"use client";

import { useRouter } from 'next/navigation';
import HomePage from '@/views/HomePage';

export default function HomeClient({ initialFeaturedProducts = [] }) {
  const router = useRouter();

  const handleNavigate = (view, category) => {
    const routes = {
      'home': '/',
      'search': '/search',
      'product': '/products',
      'diagnostics': '/products?category=Diagnostic Equipment',
      'surgical': '/products?category=Surgical Instruments',
      'machines': '/products?category=Hospital Machines',
      'lab-equipment': '/products?category=Lab Equipment',
      'cart': '/cart',
      'checkout': '/checkout',
      'reagent': '/reagent-store',
      'b2b': '/b2b',
      'admin': '/admin',
      'mobile': '/mobile-app',
      'orders': '/orders',
      'reset-password': '/reset-password',
    };
    
    // If a category is provided, append it to the products route
    if (view === 'product' && category) {
      router.push(`/products?category=${encodeURIComponent(category)}`);
    } else {
      router.push(routes[view] || '/');
    }
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
