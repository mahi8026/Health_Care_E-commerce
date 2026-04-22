"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ProductTabs from '@/components/product/ProductTabs';
import FrequentlyBought from '@/components/product/FrequentlyBought';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Spinner from '@/components/ui/Spinner';
import GA4Tracker from '@/services/GA4Tracker';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * @param {Object} props
 * @param {string}  [props.productId]      - Product _id or slug passed from parent (App.jsx)
 * @param {boolean} [props.heroPriority=false] - Preload hero image
 */
export default function ProductDetailPage({ productId, heroPriority = false }) {
  const searchParams = useSearchParams();
  // Support both prop-based id (SPA) and query-param id (?id=xxx)
  const id = productId || searchParams?.get('id');

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedConnectivity, setSelectedConnectivity] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState('');

  useEffect(() => {
    if (!id) {
      setError('No product selected.');
      setLoading(false);
      return;
    }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`${API_BASE}/api/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        const p = data.data || data.product || data;
        setProduct(p);
        // Set default variant selections
        if (p.variants?.connectivity?.length) setSelectedConnectivity(p.variants.connectivity[0]);
        if (p.variants?.warranty?.length) setSelectedWarranty(p.variants.warranty[0]);
        // Track product view
        GA4Tracker.trackViewItem(p);
      } catch (err) {
        setError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Spinner />
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <div className="text-[40px]">😕</div>
        <p className="text-[14px] font-medium text-[var(--color-text-primary)]">
          {error || 'Product not found'}
        </p>
        <p className="text-[12px] text-[var(--color-text-secondary)]">
          The product may have been removed or the link is incorrect.
        </p>
      </div>
    );
  }

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: product.category || 'Products', href: `/search?category=${product.category}` },
    { label: product.name, href: '#' }
  ];

  return (
    <div>
      <Breadcrumb items={breadcrumbs} />

      <div className="grid grid-cols-[1fr_380px]">
        {/* Left Column */}
        <div className="border-r-[0.5px] border-[var(--color-border-tertiary)]">
          <div className="p-6 px-7">
            <ProductGallery
              images={product.images || []}
              badges={product.certifications || []}
              heroPriority={heroPriority}
            />
            <FrequentlyBought />
          </div>

          <ProductTabs product={product} />
        </div>

        {/* Right Column - Buy Box */}
        <div className="p-6 bg-[var(--color-background-primary)] sticky top-0 self-start">
          <ProductInfo
            product={product}
            quantity={quantity}
            setQuantity={setQuantity}
            selectedConnectivity={selectedConnectivity}
            setSelectedConnectivity={setSelectedConnectivity}
            selectedWarranty={selectedWarranty}
            setSelectedWarranty={setSelectedWarranty}
          />
        </div>
      </div>
    </div>
  );
}
