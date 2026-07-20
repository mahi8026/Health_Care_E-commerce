"use client";

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useCart } from '@/context/CartContext';
import { useProductDetail } from '@/hooks/useProductDetail';
import { showToast } from '@/components/ui/Toast';
import ProductImageGalleryEnhanced from '@/components/product/ProductImageGalleryEnhanced';
import ProductInfoPanelEnhanced from '@/components/product/ProductInfoPanelEnhanced';
import ProductTabsEnhanced from '@/components/product/ProductTabsEnhanced';
import ProductReviewsEnhanced from '@/components/product/ProductReviewsEnhanced';
import FrequentlyBoughtRedesigned from '@/components/product/FrequentlyBoughtRedesigned';
import CustomersAlsoViewed from '@/components/product/CustomersAlsoViewed';
import StickyAddToCart from '@/components/product/StickyAddToCart';
import { Skeleton, SkeletonText } from '@/components/ui/Skeleton';
import ErrorMessage from '@/components/ui/ErrorMessage';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';

import Breadcrumb from '@/components/ui/Breadcrumb';
import ProductSchema from '@/components/seo/ProductSchema';
import BreadcrumbSchema from '@/components/seo/BreadcrumbSchema';
import FAQSchema from '@/components/seo/FAQSchema';
import ReviewSchema from '@/components/seo/ReviewSchema';

// Innovation Features
import { useRecentlyViewed } from '@/hooks/useRecentlyViewed';
import RecentlyViewed from '@/components/product/RecentlyViewed';
import ProductVideo from '@/components/product/ProductVideo';
import { getRecommendations } from '@/utils/recommendations';
import { API } from '@/constants/api';

export default function ProductDetailPage({ productId, heroPriority = false }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { addToCart } = useCart();
  const id = productId || searchParams?.get('id');

  // Use custom hook for data fetching
  const { product, loading, error: fetchError } = useProductDetail(id);

  // Recently viewed hook
  const { addToRecentlyViewed, recentlyViewed } = useRecentlyViewed();

  // UI state
  const [quantity, setQuantity] = useState(1);
  const [selectedConnectivity, setSelectedConnectivity] = useState('');
  const [selectedWarranty, setSelectedWarranty] = useState('');
  const [selectedSize, setSelectedSize] = useState(null);
  const [addingToCart, setAddingToCart] = useState(false);
  
  // AI Recommendations state
  const [allProducts, setAllProducts] = useState([]);
  const [recommendedProducts, setRecommendedProducts] = useState([]);
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);
  
  // Previous product ID to detect when product changes
  const prevProductIdRef = useRef(null);
  
  // Initialize variants when product first loads or changes
  useEffect(() => {
    const currentProductId = product?._id || product?.id;
    
    // Only initialize if product ID has changed (new product loaded)
    if (product && currentProductId !== prevProductIdRef.current) {
      prevProductIdRef.current = currentProductId;
      
      // Batch state updates using queueMicrotask to avoid synchronous setState warning
      queueMicrotask(() => {
        if (product.variants?.connectivity?.length) {
          setSelectedConnectivity(product.variants.connectivity[0]);
        }
        if (product.variants?.warranty?.length) {
          setSelectedWarranty(product.variants.warranty[0]);
        }
        // Auto-select first available size
        if (product.variants?.sizes?.length) {
          const firstAvailableSize = product.variants.sizes.find(
            size => size.isAvailable && size.stock > 0
          );
          if (firstAvailableSize) {
            setSelectedSize(firstAvailableSize);
          }
        }
      });

      // Track in recently viewed
      addToRecentlyViewed(product);
    }
  }, [product, addToRecentlyViewed]);

  // Fetch AI-powered recommendations
  useEffect(() => {
    if (!product) return;

    // Fetch AI-powered recommendations from backend
    const fetchRecs = async () => {
      setLoadingRecommendations(true);
      try {
        const productId = product._id || product.id;
        
        // Use new hybrid recommendation API (combines content-based + collaborative)
        const res = await fetch(`${API}/recommendations/hybrid/${productId}?limit=6`);
        const data = await res.json();
        
        if (data.success && data.data?.recommendations) {
          setRecommendedProducts(data.data.recommendations);
        } else {
          // Fallback to similar products API
          const fallbackRes = await fetch(`${API}/recommendations/similar/${productId}?limit=6`);
          const fallbackData = await fallbackRes.json();
          
          if (fallbackData.success && fallbackData.data?.recommendations) {
            setRecommendedProducts(fallbackData.data.recommendations);
          }
        }
      } catch (err) {
        if (process.env.NODE_ENV !== 'production') {
          console.error('Failed to fetch recommendations:', err);
        }
        
        // Final fallback: use client-side algorithm
        try {
          const res = await fetch(`${API}/products?limit=50`);
          const data = await res.json();
          const products = Array.isArray(data.data) ? data.data : (data.data?.products || data.products || []);
          
          if (products.length > 0) {
            // Simple client-side filtering as last resort
            const cartData = localStorage.getItem('cart');
            const cartItems = cartData ? JSON.parse(cartData).items || [] : [];
            const recommendations = getRecommendations(product, products, recentlyViewed, cartItems, 6);
            setRecommendedProducts(recommendations);
          }
        } catch (fallbackErr) {
          if (process.env.NODE_ENV !== 'production') {
            console.error('Fallback recommendations also failed:', fallbackErr);
          }
        }
      } finally {
        setLoadingRecommendations(false);
      }
    };

    fetchRecs();
  }, [product, recentlyViewed]);

  // Redirect from MongoDB ID to slug-based URL for SEO
  useEffect(() => {
    if (!product || !id) return;

    // Check if current param looks like a MongoDB ObjectId (24 hex characters)
    const isMongoId = /^[a-f0-9]{24}$/i.test(id);
    
    // Only redirect if:
    // 1. Current param is a MongoDB ID
    // 2. Product has a slug
    // 3. Slug is different from current param (prevent infinite loop)
    if (isMongoId && product.slug && product.slug !== id) {
      router.replace(`/products/${product.slug}`);
    }
  }, [product, id, router]);

  // Loading state
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Image skeleton */}
          <div>
            <Skeleton className="w-full aspect-square rounded-lg" />
            <div className="flex gap-2 mt-4">
              {[...Array(4)].map((_, i) => (
                <Skeleton key={i} className="w-20 h-20 rounded" />
              ))}
            </div>
          </div>
          
          {/* Info skeleton */}
          <div className="space-y-4">
            <Skeleton className="h-8 w-3/4" />
            <Skeleton className="h-6 w-1/2" />
            <SkeletonText lines={3} />
            <Skeleton className="h-12 w-32" />
            <div className="flex gap-2 pt-4">
              <Skeleton className="h-12 flex-1" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
        
        {/* Tabs skeleton */}
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  // Error state
  if (fetchError || !product) {
    return (
      <div className="min-h-[60vh]">
        <ErrorMessage 
          message={fetchError || 'Product not found'}
          onRetry={() => router.push('/products')}
        />
      </div>
    );
  }

  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const categoryName = product.categoryName || (typeof product.category === 'object' ? product.category?.name : product.category);
  
  // Get category slug for SEO-friendly URL
  const categorySlug = categoryName ? CATEGORY_NAME_TO_SLUG[categoryName] : null;

  // Prepare breadcrumb data for schema
  const breadcrumbItems = [
    { name: 'Home', url: '/' },
    { name: 'Products', url: '/products' },
  ];
  if (categoryName && categorySlug) {
    breadcrumbItems.push({
      name: categoryName,
      url: `/products/category/${categorySlug}`,
    });
  }
  breadcrumbItems.push({
    name: product.name,
    url: `/products/${product.slug || product._id}`,
  });

  // Prepare FAQ data for schema (common product questions)
  const productFAQs = [
    {
      question: `Is the ${product.name} DGDA certified?`,
      answer: `Yes, the ${product.name} is DGDA registered and certified for use in Bangladesh. All our medical equipment meets Bangladesh Drug Administration requirements.`,
    },
    {
      question: `What is the warranty on ${product.name}?`,
      answer: `The ${product.name} comes with ${product.warranty || '1 year'} manufacturer warranty. We also offer extended warranty options and annual maintenance contracts.`,
    },
    {
      question: `Do you provide free delivery for ${product.name}?`,
      answer: 'Yes, we offer free delivery in Dhaka metro area for orders over ৳50,000. For other areas, delivery charges apply based on location.',
    },
    {
      question: `Can I get installation service for ${product.name}?`,
      answer: `Yes, we provide free installation and staff training for ${product.name} in Dhaka metro area. For outside Dhaka, installation charges may apply.`,
    },
    {
      question: `Is B2B pricing available for ${product.name}?`,
      answer: 'Yes, hospitals, clinics, and diagnostic centers receive 8-30% bulk discount depending on order quantity. We also offer 30-90 day credit terms for B2B clients.',
    },
  ];

  return (
    <div className="bg-page min-h-screen pb-24 md:pb-8">
      {/* SEO Structured Data Schemas */}
      <ProductSchema product={product} />
      <BreadcrumbSchema items={breadcrumbItems} />
      <FAQSchema faqs={productFAQs} />
      {product.reviews && product.reviews.length > 0 && (
        <ReviewSchema
          reviews={product.reviews}
          productName={product.name}
          productId={product._id || product.id}
        />
      )}

      {/* Sticky Add to Cart Bar (appears on scroll) */}
      <StickyAddToCart product={product} scrollThreshold={500} />

      {/* ── Breadcrumb ─────────────────────────────────────────────────── */}
      <Breadcrumb 
        items={[
          { label: 'Home', href: '/' },
          { label: 'Products', href: '/products' },
          ...(categoryName && categorySlug ? [{
            label: categoryName,
            href: `/products/category/${categorySlug}`
          }] : []),
          { label: product.name }
        ]}
      />

      {/* ── Main Content ───────────────────────────────────────────────── */}
      <div className="max-w-7xl mx-auto px-4 md:px-6 py-6">

        {/* Two-column: image left, info right */}
        <div className="grid grid-cols-1 lg:grid-cols-[55%_45%] gap-6 xl:gap-8">
          <div>
            <ProductImageGalleryEnhanced
              images={(product.images || []).map(img =>
                typeof img === 'string'
                  ? { url: img, isPrimary: false, alt: product.name }
                  : img
              ).filter(img => img?.url)}
              product={product}
              badges={product.certifications || []}
              heroPriority={heroPriority}
            />
          </div>
          <div id="add-to-cart">
            <ProductInfoPanelEnhanced
              product={product}
              quantity={quantity}
              setQuantity={setQuantity}
              selectedSize={selectedSize}
              onSizeChange={setSelectedSize}
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
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <ProductTabsEnhanced product={product} />
        </div>

        {/* Reviews */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <ProductReviewsEnhanced productId={product._id || product.id} />
        </div>

        {/* Customers Also Viewed */}
        <div className="mt-6">
          <CustomersAlsoViewed
            productId={product._id || product.id}
            category={product.categoryId || (typeof product.category === 'object' ? product.category?._id : product.category)}
          />
        </div>

        {/* Product Video (if available) */}
        {product.videoUrl && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <h2 className="text-[15px] font-semibold text-[#0B2545] mb-4">Product Video</h2>
            <ProductVideo
              videoUrl={product.videoUrl}
              thumbnail={product.videoThumbnail}
              title={`${product.name} — Product Demo`}
            />
          </div>
        )}

        {/* AI-Powered Recommendations */}
        {!loadingRecommendations && recommendedProducts.length > 0 && (
          <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xl">🤖</span>
              <h2 className="text-[15px] font-semibold text-[#0B2545]">You Might Also Like</h2>
              <span className="text-[11px] text-gray-400 bg-purple-50 px-2 py-0.5 rounded-full font-medium">
                AI Recommended
              </span>
            </div>
            
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
              {recommendedProducts.map((recProduct) => {
                const recImageData = recProduct.images?.find(img => typeof img === 'object' && img.isPrimary) || recProduct.images?.[0];
                const recImageUrl = typeof recImageData === 'string' ? recImageData : recImageData?.url;
                const recPrice = recProduct.price || 0;
                
                return (
                  <Link
                    key={recProduct._id || recProduct.id}
                    href={`/products/${recProduct.slug || recProduct._id}`}
                    className="group bg-white rounded-lg border border-gray-100 hover:border-[#0E8A6E]/40 hover:shadow-lg transition-all overflow-hidden"
                  >
                    <div className="relative aspect-square bg-gray-50">
                      {recImageUrl ? (
                        <Image
                          src={recImageUrl}
                          alt={`${recProduct.name}${recProduct.brand ? ` — ${typeof recProduct.brand === 'object' ? recProduct.brand.name : recProduct.brand}` : ''} — Related product Bangladesh — MedCore BD`}
                          fill
                          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                          style={{ objectFit: 'cover' }}
                          className="group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-3xl">🏥</div>
                      )}
                    </div>
                    <div className="p-2">
                      <h3 className="text-[11px] font-medium text-gray-800 line-clamp-2 mb-1 group-hover:text-[#0E8A6E]">
                        {recProduct.name}
                      </h3>
                      <p className="text-[13px] font-bold text-[#0B2545]">
                        {recPrice > 0 ? `৳${recPrice.toLocaleString()}` : 'Contact'}
                      </p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Recently Viewed Products */}
        <div className="mt-6">
          <RecentlyViewed
            currentProductId={product._id || product.id}
            limit={6}
            title="Your Recently Viewed Products"
          />
        </div>

        {/* SEO Content */}
        <div className="mt-6 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 sm:p-6">
          <h2 className="text-[15px] font-semibold text-[#0B2545] mb-3">About {product.name}</h2>
          {product.description && (
            <p className="text-[13px] text-gray-500 leading-relaxed mb-5">{product.description}</p>
          )}
          <h3 className="text-[14px] font-semibold text-[#0B2545] mb-2">
            {product.name} Price in Bangladesh
          </h3>
          <p className="text-[13px] text-gray-500 leading-relaxed mb-5">
            The retail price of {product.name} in Bangladesh is{' '}
            {product.price && product.price > 0 ? `৳${product.price.toLocaleString()}` : 'Contact for Price'}.
            {' '}B2B institutions (hospitals, clinics, diagnostic centres) receive 8–30% bulk discount depending on order volume.
            Contact MedCore BD for institutional pricing and credit terms.
          </p>
          <h3 className="text-[14px] font-semibold text-[#0B2545] mb-2">
            Buy {product.name} in Bangladesh
          </h3>
          <p className="text-[13px] text-gray-500 leading-relaxed">
            MedCore BD is an authorised distributor{brandName ? ` of ${brandName}` : ''} in Bangladesh.
            {' '}All products are DGDA registered and come with full manufacturer warranty.
            {' '}Enjoy free delivery in Dhaka for orders over ৳50,000 and nationwide shipping to all major cities.
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
            // Validate size selection if product has sizes
            if (product.variants?.sizes?.length > 0 && !selectedSize) {
              showToast.warning('Please select a size');
              return;
            }
            setAddingToCart(true);
            addToCart(product, quantity, { size: selectedSize });
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
