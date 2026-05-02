"use client";

import { useRouter } from 'next/navigation';
import { generatePageMetadata } from '@/utils/metadata';
import { pageMetadata } from '@/config/seo';
import SearchPage from '@/views/SearchPage';

export default function Search() {
  const router = useRouter();

  const handleProductClick = (productId) => {
    router.push(`/products/${productId}`);
  };

  return <SearchPage onProductClick={handleProductClick} />;
}
