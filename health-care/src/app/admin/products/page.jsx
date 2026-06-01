"use client";

import { useRef } from 'react';
import dynamic from 'next/dynamic';
import AdminShell from '@/components/admin/AdminShell';

// Dynamic import — ProductsManagement is the largest admin component (~79KB)
// Loading it lazily reduces the initial JS bundle for the admin section
const ProductsManagement = dynamic(
  () => import('@/components/admin/ProductsManagement'),
  {
    ssr: false,
    loading: () => (
      <div className="p-5 px-6 animate-pulse space-y-4">
        <div className="h-10 bg-gray-200 rounded w-full" />
        <div className="h-64 bg-gray-200 rounded w-full" />
        <div className="h-64 bg-gray-200 rounded w-full" />
      </div>
    ),
  }
);

export default function ProductsPage() {
  const openCreateProductRef = useRef(null);

  const handleAddProduct = () => {
    openCreateProductRef.current?.();
  };

  return (
    <AdminShell 
      title="Product Catalogue" 
      action="+ Add product"
      onAction={handleAddProduct}
    >
      <div className="p-4 md:p-5 md:px-6 max-w-full overflow-hidden">
        <ProductsManagement openCreateRef={openCreateProductRef} />
      </div>
    </AdminShell>
  );
}
