"use client";

import { useState, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductInfoPanel from '@/components/product/ProductInfoPanel';
import ProductTabsRedesigned from '@/components/product/ProductTabsRedesigned';
import ProductReviews from '@/components/product/ProductReviews';
import FrequentlyBoughtRedesigned from '@/components/product/FrequentlyBoughtRedesigned';
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
  const { addToCart } = useCart();
  // Support both prop-based id (SPA) and query-param id (?id=xxx)
  const id = productId || searchParams?.get('id');

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedConnectivity, setSelectedConnectivity] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

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

  return (
    <div className="pb-20 md:pb-0 bg-white">
      {/* 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[58%_42%] gap-6 px-4 md:px-7 pt-6">
        {/* LEFT COLUMN - Images + Tabs */}
        <div className="space-y-6">
          {/* Image Gallery */}
          <ProductImageGallery
            images={product.images || []}
            product={product}
            badges={product.certifications || []}
            heroPriority={heroPriority}
          />

          {/* Frequently Bought Together */}
          <FrequentlyBoughtRedesigned 
            productId={product._id || product.id} 
            category={product.categoryId || (typeof product.category === 'object' ? product.category?._id : product.category)} 
          />

          {/* Tabs Section */}
          <ProductTabsRedesigned product={product} />
        </div>

        {/* RIGHT COLUMN - Sticky Product Info Panel (Desktop) */}
        <div className="hidden lg:block">
          <ProductInfoPanel
            product={product}
            quantity={quantity}
            setQuantity={setQuantity}
            selectedConnectivity={selectedConnectivity}
            setSelectedConnectivity={setSelectedConnectivity}
            selectedWarranty={selectedWarranty}
            setSelectedWarranty={setSelectedWarranty}
          />
        </div>

        {/* Mobile Product Info (Below Images) */}
        <div className="lg:hidden">
          <ProductInfoPanel
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

      {/* Reviews Section (Full Width) */}
      <div className="border-t border-[#E5E7EB] px-4 md:px-7 py-8 mt-8">
        <ProductReviews productId={product._id || product.id} />
      </div>

      {/* SEO Content Section — price transparency + where to buy (helps rank for long-tail searches) */}
      <div className="border-t border-[#E5E7EB] px-4 md:px-7 py-8 bg-[#F9FAFB]">
        <div className="max-w-3xl">
          <h2 className="text-[15px] font-semibold text-[#0B2545] mb-3">
            About {product.name}
          </h2>
          {product.description && (
            <p className="text-[13px] text-[#6B7280] leading-relaxed mb-5">
              {product.description}
            </p>
          )}

          <h3 className="text-[14px] font-semibold text-[#0B2545] mb-2">
            {product.name} Price in Bangladesh
          </h3>
          <p className="text-[13px] text-[#6B7280] leading-relaxed mb-5">
            The retail price of {product.name} in Bangladesh is ৳{product.price?.toLocaleString()}.
            B2B institutions (hospitals, clinics, diagnostic centres) receive up to 22% bulk discount.
            Contact MedCore BD for institutional pricing and credit terms.
          </p>

          <h3 className="text-[14px] font-semibold text-[#0B2545] mb-2">
            Buy {product.name} in Bangladesh
          </h3>
          <p className="text-[13px] text-[#6B7280] leading-relaxed">
            MedCore BD is an authorised distributor of{product.brand ? ` ${typeof product.brand === 'object' ? product.brand.name : product.brand}` : ''} products in Bangladesh.
            Order online with free delivery to Dhaka, Chittagong and Sylhet.
            All products are DGDA registered and come with full manufacturer warranty.
          </p>
        </div>
      </div>

      {/* Mobile Sticky Bottom Bar */}
      <div 
        className="lg:hidden fixed bottom-[60px] left-0 right-0 h-16 bg-white border-t border-[#E5E7EB] px-4 flex items-center justify-between z-[500] shadow-lg"
        style={{
          paddingBottom: 'calc(0px + env(safe-area-inset-bottom))',
        }}
      >
        <div>
          <div className="text-[11px] text-[#6B7280]">Price</div>
          <div className="text-[18px] font-bold text-[#0B2545]">
            ৳{product.price?.toLocaleString()}
          </div>
        </div>
        <button
          onClick={() => {
            setAddingToCart(true);
            try {
              addToCart(product, quantity);
              setTimeout(() => setAddingToCart(false), 1000);
            } catch (error) {
              // Error adding to cart - silently fail
              setAddingToCart(false);
            }
          }}
          disabled={addingToCart}
          className="bg-[#0E8A6E] hover:bg-[#0B7558] text-white rounded-lg px-6 py-3 text-[14px] font-semibold transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-w-[140px]"
        >
          {addingToCart ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Adding...
            </>
          ) : (
            'Add to Cart'
          )}
        </button>
      </div>
    </div>
  );
}
