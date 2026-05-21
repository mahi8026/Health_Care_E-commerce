"use client";

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import ProductImageGallery from '@/components/product/ProductImageGallery';
import ProductInfoPanel from '@/components/product/ProductInfoPanel';
import ProductTabsRedesigned from '@/components/product/ProductTabsRedesigned';
import ProductReviews from '@/components/product/ProductReviews';
import FrequentlyBoughtRedesigned from '@/components/product/FrequentlyBoughtRedesigned';
import Spinner from '@/components/ui/Spinner';
import GA4Tracker from '@/services/GA4Tracker';
import { API as API_BASE } from '@/constants/api';

export default function ProductDetailPage({ productId, heroPriority = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const id = productId || searchParams?.get('id');

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [selectedConnectivity, setSelectedConnectivity] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);

  useEffect(() => {
    if (!id) { setFetchError('No product selected.'); setLoading(false); return; }

    const fetchProduct = async () => {
      try {
        setLoading(true);
        setFetchError(null);
        const res = await fetch(`${API_BASE}/products/${id}`);
        if (!res.ok) throw new Error('Product not found');
        const data = await res.json();
        const p = data.data || data.product || data;

        if (p.rating && typeof p.rating === 'object') {
          p.reviewCount = p.reviewCount || p.rating.count || 0;
          p.rating = p.rating.average || 0;
        }
        if (p.brand && typeof p.brand === 'object') {
          p.brandId = p.brand._id;
          p.brandName = p.brand.name;
          p.brand = p.brand.name;
        }
        if (p.category && typeof p.category === 'object') {
          p.categoryId = p.category._id;
          p.categoryName = p.category.name;
        }
        if (p.specifications && typeof p.specifications === 'object') {
          const cleanSpecs = {};
          for (const [k, v] of Object.entries(p.specifications)) {
            if (typeof k === 'string' && !k.startsWith('$') && typeof v !== 'object') {
              cleanSpecs[k] = String(v);
            }
          }
          p.specifications = cleanSpecs;
        }

        setProduct(p);
        if (p.variants?.connectivity?.length) setSelectedConnectivity(p.variants.connectivity[0]);
        if (p.variants?.warranty?.length) setSelectedWarranty(p.variants.warranty[0]);
        GA4Tracker.trackViewItem(p);
      } catch (err) {
        setFetchError(err.message || 'Failed to load product');
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center gap-4">
          <Spinner />
          <p className="text-[13px] text-gray-400">Loading product...</p>
        </div>
      </div>
    );
  }

  if (fetchError || !product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 px-4">
        <div className="text-[56px]">😕</div>
        <h2 className="text-[18px] font-semibold text-gray-800">{fetchError || 'Product not found'}</h2>
        <p className="text-[13px] text-gray-500 text-center max-w-sm">
          The product may have been removed or the link is incorrect.
        </p>
        <button
          onClick={() => router.push('/products')}
          className="px-6 py-2.5 bg-[#0B2545] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0d2d52] transition-colors"
        >
          Browse Products
        </button>
      </div>
    );
  }

  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const categoryName = product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category);

  return (
    <div className="bg-page min-h-screen pb-24 md:pb-8">

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-3">
          <nav className="flex items-center gap-1.5 text-[12px] text-gray-500 flex-wrap">
            <button onClick={() => router.push('/')} className="hover:text-[#0E8A6E] transition-colors">Home</button>
            <span className="text-gray-300">/</span>
            <button onClick={() => router.push('/products')} className="hover:text-[#0E8A6E] transition-colors">Products</button>
            {categoryName && (
              <>
                <span className="text-gray-300">/</span>
                <button
                  onClick={() => router.push(`/products?category=${encodeURIComponent(categoryName)}`)}
                  className="hover:text-[#0E8A6E] transition-colors"
                >
                  {categoryName}
                </button>
              </>
            )}
            <span className="text-gray-300">/</span>
            <span className="text-gray-700 font-medium line-clamp-1 max-w-[200px]">{product.name}</span>
          </nav>
        </div>
      </div>

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

        {/* Two-column: image left, info right */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6 xl:gap-8">
          <div>
            <ProductImageGallery
              images={product.images || []}
              product={product}
              badges={product.certifications || []}
              heroPriority={heroPriority}
            />
          </div>
          <div>
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

        {/* Frequently Bought Together */}
        <div className="mt-8">
          <FrequentlyBoughtRedesigned
            productId={product._id || product.id}
            category={product.categoryId || (typeof product.category === 'object' ? product.category?._id : product.category)}
          />
        </div>

        {/* Tabs: Specs, Description, Shipping */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <ProductTabsRedesigned product={product} />
        </div>

        {/* Reviews */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <ProductReviews productId={product._id || product.id} />
        </div>

        {/* SEO Content */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
          <h2 className="text-[15px] font-semibold text-[#0B2545] mb-3">About {product.name}</h2>
          {product.description && (
            <p className="text-[13px] text-gray-500 leading-relaxed mb-5">{product.description}</p>
          )}
          <h3 className="text-[14px] font-semibold text-[#0B2545] mb-2">
            {product.name} Price in Bangladesh
          </h3>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
            The retail price of {product.name} in Bangladesh is{' '}
            {product.price > 0 ? `৳${product.price?.toLocaleString()}` : 'available on request'}.
            B2B institutions (hospitals, clinics, diagnostic centres) receive up to 22% bulk discount.
            Contact MedCore BD for institutional pricing and credit terms.
          </p>
          <h3 className="text-[14px] font-semibold text-[#0B2545] mb-2">
            Buy {product.name} in Bangladesh
          </h3>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            MedCore BD is an authorised distributor of{brandName ? ` ${brandName}` : ''} products in Bangladesh.
            Order online with free delivery to Dhaka, Chittagong and Sylhet.
            All products are DGDA registered and come with full manufacturer warranty.
          </p>
        </div>
      </div>

      {/* ── Mobile Sticky Bottom Bar ───────────────────────────────────── */}
      <div
        className="lg:hidden fixed bottom-[60px] left-0 right-0 bg-white border-t border-gray-200 px-4 py-3 z-[500] shadow-lg flex items-center gap-3"
        style={{ paddingBottom: 'calc(12px + env(safe-area-inset-bottom))' }}
      >
        <div className="flex-1">
          <div className="text-[10px] text-gray-400 font-medium">Price</div>
          <div className="text-[20px] font-bold text-[#0B2545] leading-tight">
            {product.price > 0 ? `৳${product.price?.toLocaleString()}` : 'Contact for Price'}
          </div>
        </div>
        <button
          onClick={() => {
            setAddingToCart(true);
            addToCart(product, quantity);
            setTimeout(() => setAddingToCart(false), 1200);
          }}
          disabled={addingToCart}
          className="bg-[#0E8A6E] hover:bg-[#0c7a61] text-white rounded-xl px-6 py-3 text-[14px] font-bold transition-colors disabled:opacity-60 flex items-center gap-2 min-w-[140px] justify-center"
        >
          {addingToCart ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Adding...
            </>
          ) : '🛒 Add to Cart'}
        </button>
      </div>
    </div>
  );
}
