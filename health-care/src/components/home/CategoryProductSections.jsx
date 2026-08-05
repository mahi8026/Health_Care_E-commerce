'use client';

import { useState, useEffect, memo, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { 
  FaStethoscope, 
  FaSyringe, 
  FaFlask, 
  FaHospital, 
  FaMicroscope, 
  FaShieldAlt, 
  FaTooth, 
  FaBone,
  FaChevronLeft,
  FaChevronRight,
} from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { API } from '@/constants/api';
import { CATEGORY_NAME_TO_SLUG } from '@/constants/categories';
import { getProductCardImage } from '@/utils/cloudinary';

/**
 * Get icon component for category
 */
function getCategoryIcon(categoryName) {
  const iconMap = {
    'Diagnostic Equipment': <FaStethoscope />,
    'Surgical Instruments': <FaSyringe />,
    'Laboratory Reagents': <FaFlask />,
    'Hospital Machines': <FaHospital />,
    'Lab Equipment': <FaMicroscope />,
    'Laboratory Equipment': <FaMicroscope />,
    'PPE & Safety': <FaShieldAlt />,
    'Dental Equipment': <FaTooth />,
    'Implants & Ortho': <FaBone />,
    'Orthopedic Supports': <FaBone />,
    'Consumables': <FaSyringe />,
    'Diabetes Care': <FaStethoscope />,
    'Diagnostic Devices': <FaStethoscope />,
    'IV & Infusion Therapy': <FaSyringe />,
    'Medical Devices': <FaStethoscope />,
    'Medical Supplies': <FaSyringe />,
    'Ophthalmology & ENT Equipment': <FaStethoscope />,
    'Physiotherapy & Rehabilitation': <FaBone />,
    'Respiratory Equipment': <FaStethoscope />,
    'Surgical & Wound Care': <FaSyringe />,
    'Surgical Instruments': <FaSyringe />,
    'Blood Bank Supplies': <FaFlask />,
    'Compression Garments': <FaBone />,
  };
  return iconMap[categoryName] || <FaStethoscope />;
}

/**
 * CategoryProductSections Component
 * 
 * Displays horizontal scrollable product sections for each category
 * Similar to the image provided by the user
 */
const ProductCard = memo(function ProductCard({ product, onCardClick, onAddToCart }) {
  const imgRaw = product.images?.[0];
  const img = typeof imgRaw === 'string' ? imgRaw : imgRaw?.url;
  const optimizedImg = img ? getProductCardImage(img) : null;
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const price = product.price || 0;
  const oldPrice = product.oldPrice || 0;
  const hasDiscount = oldPrice > 0 && oldPrice > price;
  const discount = hasDiscount ? Math.round(((oldPrice - price) / oldPrice) * 100) : 0;

  return (
    <div
      className="snap-start flex-shrink-0 w-[180px] bg-white rounded-md border border-[var(--color-border-primary)] overflow-hidden hover:shadow-md transition-shadow cursor-pointer group"
      onClick={onCardClick}
    >
      <div className="relative aspect-square w-full bg-[var(--color-background-secondary)] overflow-hidden">
        {optimizedImg ? (
          <Image
            src={optimizedImg}
            alt={`${product.name}${brandName ? ` — ${brandName}` : ''}`}
            fill
            sizes="180px"
            style={{ objectFit: 'contain', padding: '8px' }}
            className="group-hover:scale-105 transition-transform duration-200"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-4xl text-[var(--color-text-tertiary)]">
            🏥
          </div>
        )}

        {hasDiscount && (
          <div className="absolute top-1 left-1 bg-[#7C3AED] text-white text-[10px] font-semibold px-1.5 py-0.5 rounded">
            -{discount}%
          </div>
        )}
      </div>

      <div className="p-2">
        {brandName && (
          <div className="text-[10px] font-semibold text-brand-teal uppercase tracking-wide mb-1">
            {brandName}
          </div>
        )}

        <h3 className="font-semibold text-[var(--color-text-primary)] text-xs mb-2 line-clamp-2 min-h-[32px]">
          {product.name}
        </h3>

        <div className="mb-2">
          <div className="text-sm font-bold text-[var(--color-text-primary)]">
            ৳{price > 0 ? price.toLocaleString() : 'Call'}
          </div>
          {hasDiscount && (
            <div className="text-[10px] text-[var(--color-text-secondary)] line-through">
              ৳{oldPrice.toLocaleString()}
            </div>
          )}
        </div>

        <button
          onClick={onAddToCart}
          className="w-full bg-brand-teal text-white py-1.5 rounded text-[11px] font-semibold hover:bg-brand-teal transition-colors flex items-center justify-center gap-1"
        >
          + Cart
        </button>
      </div>
    </div>
  );
});

/**
 * CategorySection Component with Arrow Navigation
 */
const CategorySection = memo(function CategorySection({ categoryName, categoryData, products, router, addToCart }) {
  const scrollContainerRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const slug = CATEGORY_NAME_TO_SLUG[categoryName];

  // Check scroll position
  const checkScroll = useCallback(() => {
    const container = scrollContainerRef.current;
    if (container) {
      setCanScrollLeft(container.scrollLeft > 0);
      setCanScrollRight(
        container.scrollLeft < container.scrollWidth - container.clientWidth - 10
      );
    }
  }, []);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (container) {
      checkScroll();
      container.addEventListener('scroll', checkScroll);
      return () => container.removeEventListener('scroll', checkScroll);
    }
  }, [checkScroll]);

  // Scroll handlers
  const scrollLeft = () => {
    scrollContainerRef.current?.scrollBy({
      left: -400,
      behavior: 'smooth'
    });
  };

  const scrollRight = () => {
    scrollContainerRef.current?.scrollBy({
      left: 400,
      behavior: 'smooth'
    });
  };

  return (
    <section className="py-10 bg-white border-b border-[var(--color-border-tertiary)]">
      <div className="max-w-7xl mx-auto px-4">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {/* Double vertical bars */}
            <div className="flex gap-1">
              <div className="w-1 h-6 bg-brand-teal rounded-full"></div>
              <div className="w-1 h-6 bg-brand-teal rounded-full"></div>
            </div>
            <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-text-primary)]">
              {categoryName}
              <span className="ml-2 text-sm font-normal text-[var(--color-text-secondary)]">
                ({categoryData?.productCount || products.length} products)
              </span>
            </h2>
          </div>
          <Link
            href={slug ? `/products/category/${slug}` : `/products?category=${encodeURIComponent(categoryName)}`}
            className="flex items-center gap-1 text-brand-teal hover:text-brand-teal font-semibold text-sm transition-colors"
          >
            View All Items →
          </Link>
        </div>

        {/* Products Horizontal Scroll with Arrows */}
        <div className="relative group/slider">
          {/* Left Arrow */}
          {canScrollLeft && (
            <button
              onClick={scrollLeft}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-[var(--color-border-primary)] rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-brand-teal hover:text-white hover:border-brand-teal"
              aria-label="Scroll left"
            >
              <FaChevronLeft size={16} />
            </button>
          )}

          {/* Right Arrow */}
          {canScrollRight && (
            <button
              onClick={scrollRight}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-white border border-[var(--color-border-primary)] rounded-full shadow-lg flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity hover:bg-brand-teal hover:text-white hover:border-brand-teal"
              aria-label="Scroll right"
            >
              <FaChevronRight size={16} />
            </button>
          )}

          <div 
            ref={scrollContainerRef}
            className="flex gap-4 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide"
            style={{
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
            }}
          >
            {products.map((product) => (
              <ProductCard
                key={product._id}
                product={product}
                onCardClick={() => router.push(`/products/${product._id}`)}
                onAddToCart={(e) => {
                  e.stopPropagation();
                  addToCart(product, 1);
                }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Hide scrollbar */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
});

export default function CategoryProductSections({ categories = [] }) {
  const router = useRouter();
  const { addToCart } = useCart();
  const [categoryProducts, setCategoryProducts] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCategoryProducts = async () => {
      setLoading(true);
      
      // Sort categories by product count and filter those with products
      const sortedCategories = categories
        .map(cat => ({
          ...cat,
          name: typeof cat === 'string' ? cat : cat.name,
          productCount: cat.productCount || 0
        }))
        .filter(cat => cat.productCount >= 4) // Only show categories with at least 4 products
        .sort((a, b) => b.productCount - a.productCount) // Sort by product count descending
        .slice(0, 6); // Show top 6 categories only
      
      const productsPromises = sortedCategories.map(async (cat) => {
        const categoryName = cat.name;
        try {
          const response = await fetch(
            `${API}/products?category=${encodeURIComponent(categoryName)}&limit=10&sortBy=popular`
          );
          const data = await response.json();
          const products = Array.isArray(data.data) ? data.data : (data.data?.products || data.products || []);
          return { categoryName, products, cat };
        } catch (error) {
          console.error(`Error fetching products for ${categoryName}:`, error);
          return { categoryName, products: [], cat };
        }
      });

      const results = await Promise.all(productsPromises);
      
      // Convert array to object keyed by category name, preserve original category data
      const productsObj = {};
      results.forEach(({ categoryName, products, cat }) => {
        productsObj[categoryName] = { products, categoryData: cat };
      });
      
      setCategoryProducts(productsObj);
      setLoading(false);
    };

    if (categories.length > 0) {
      fetchCategoryProducts();
    }
  }, [categories]);

  if (loading) {
    return (
      <div className="py-8 bg-[var(--color-background-secondary)]">
        <div className="max-w-7xl mx-auto px-4">
          <div className="h-8 w-48 bg-[var(--color-background-muted)] rounded animate-pulse mb-6"></div>
          <div className="flex gap-4 overflow-hidden">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="w-[180px] h-[260px] bg-[var(--color-background-muted)] rounded-md animate-pulse flex-shrink-0"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {Object.keys(categoryProducts)
        .map((categoryName) => {
          const { products: catProducts, categoryData } = categoryProducts[categoryName];
          
          // Skip if no products for this category
          if (!catProducts || catProducts.length === 0) return null;

          return (
            <CategorySection
              key={categoryName}
              categoryName={categoryName}
              categoryData={categoryData}
              products={catProducts}
              router={router}
              addToCart={addToCart}
            />
          );
        })}
    </>
  );
}
