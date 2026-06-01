"use client";

import { useRouter } from 'next/navigation';
import HomePage from '@/views/HomePage';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';

export default function HomeClient({ initialFeaturedProducts = [] }) {
  const router = useRouter();

  const handleNavigate = (view, category) => {
    const routes = {
      'home': '/',
      'search': '/products',
      'product': '/products',
      'diagnostics': '/products/category/diagnostic-equipment',
      'surgical': '/products/category/surgical-instruments',
      'machines': '/products/category/hospital-machines',
      'lab-equipment': '/products/category/lab-equipment',
      'cart': '/cart',
      'checkout': '/checkout',
      'reagent': '/reagent-store',
      'b2b': '/b2b',
      'admin': '/admin',
      'mobile': '/mobile-app',
      'orders': '/orders',
      'reset-password': '/reset-password',
    };
    
    // If a category is provided, convert to slug-based URL
    if (view === 'product' && category) {
      const slug = CATEGORY_NAME_TO_SLUG[category];
      if (slug) {
        router.push(`/products/category/${slug}`);
      } else {
        router.push(`/products?category=${encodeURIComponent(category)}`);
      }
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
