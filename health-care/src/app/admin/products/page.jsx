"use client";

import { useRef } from 'react';
import AdminShell from '@/components/admin/AdminShell';
import ProductsManagement from '@/components/admin/ProductsManagement';

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
