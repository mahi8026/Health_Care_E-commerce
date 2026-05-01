"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import ProductGallery from '@/components/product/ProductGallery';
import ProductInfo from '@/components/product/ProductInfo';
import ProductTabs from '@/components/product/ProductTabs';
import ProductReviews from '@/components/product/ProductReviews';
import FrequentlyBought from '@/components/product/FrequentlyBought';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Spinner from '@/components/ui/Spinner';
import GA4Tracker from '@/services/GA4Tracker';
import { API as API_BASE } from '@/constants/api';

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
        const url = `${API_BASE}/products/${id}`;
        const res = await fetch(url);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        const p = data.data || data.product || data;

        // Normalize rating: API returns { average, count } but components expect a number
        if (p.rating && typeof p.rating === 'object') {
          p.reviewCount = p.reviewCount || p.rating.count || 0;
          p.rating = p.rating.average || 0;
        }

        // Normalize brand: populated object → string name for components that render it directly
        if (p.brand && typeof p.brand === 'object') {
          p.brandId = p.brand._id;
          p.brandName = p.brand.name;
          p.brand = p.brand.name; // flatten to string so any component can render it safely
        }

        // Normalize category: keep full object for breadcrumb but also expose flat fields
        if (p.category && typeof p.category === 'object') {
          p.categoryId = p.category._id;
          p.categoryName = p.category.name;
          // keep p.category as object — ProductDetailPage handles it with typeof checks
        }

        // Normalize specifications: Mongoose Map → plain object
        if (p.specifications && typeof p.specifications === 'object') {
          // If it's a Map-like object with a 'toJSON' method or has internal Mongoose keys, flatten it
          const rawSpecs = p.specifications;
          const cleanSpecs = {};
          for (const [k, v] of Object.entries(rawSpecs)) {
            if (typeof k === 'string' && !k.startsWith('$') && typeof v !== 'object') {
              cleanSpecs[k] = String(v);
            }
          }
          p.specifications = cleanSpecs;
        }

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

  const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;
  const categoryId = typeof product.category === 'object' ? product.category?._id : product.category;

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: categoryName || 'Products', href: `/search?category=${categoryId}` },
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
              product={product}
              badges={product.certifications || []}
              heroPriority={heroPriority}
            />
            <FrequentlyBought 
              productId={product._id || product.id} 
              category={product.categoryId || (typeof product.category === 'object' ? product.category?._id : product.category)} 
            />
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

      {/* Reviews Section */}
      <div className="border-t-[0.5px] border-[var(--color-border-tertiary)] px-7 py-8">
        <ProductReviews productId={product._id || product.id} />
      </div>
    </div>
  );
}
