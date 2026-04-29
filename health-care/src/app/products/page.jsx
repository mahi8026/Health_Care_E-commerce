"use client";

import { useRouter } from 'next/navigation';
import ProductsPage from '@/views/ProductsPage';

export default function ProductsRoute() {
  const router = useRouter();

  const handleProductClick = (productId) => {
    router.push(`/products/${productId}`);
  };

  return <ProductsPage onProductClick={handleProductClick} />;
}
