"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaChevronLeft, FaChevronRight, FaShoppingCart, FaHeart } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { API } from '@/constants/api';

/**
 * Customers Also Viewed Carousel
 * Features:
 * - Horizontal scrolling carousel
 * - Similar products based on category
 * - Quick add to cart
 * - Quick add to wishlist
 * - Smooth scroll animations
 */
export default function CustomersAlsoViewed({ productId, category }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();
  const scrollContainerRef = useRef(null);

  useEffect(() => {
    if (!category) return;

    const fetchSimilarProducts = async () => {
    try {
      setLoading(true);
      
      // Use new recommendation API (collaborative filtering with fallback)
      const res = await fetch(`${API}/recommendations/also-viewed/${productId}?limit=8`);
      const data = await res.json();
      
      if (data.success && data.data?.recommendations) {
        setProducts(data.data.recommendations);
      } else {
        // Fallback to category filtering if API fails
        const fallbackRes = await fetch(`${API}/products?category=${category}&limit=12`);
        const fallbackData = await fallbackRes.json();
        
        if (fallbackData.success) {
          // Exclude current product
          const filtered = fallbackData.data.filter(p => p._id !== productId && p.id !== productId);
          setProducts(filtered.slice(0, 8));
        }
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Fetch recommendations error:', error);
      
      // Fallback to category filtering on error
      try {
        const fallbackRes = await fetch(`${API}/products?category=${category}&limit=12`);
        const fallbackData = await fallbackRes.json();
        
        if (fallbackData.success) {
          const filtered = fallbackData.data.filter(p => p._id !== productId && p.id !== productId);
          setProducts(filtered.slice(0, 8));
        }
      } catch (fallbackError) {
        process.env.NODE_ENV !== "production" && console.error('Fallback also failed:', fallbackError);
      }
      } finally {
        setLoading(false);
      }
    };

    fetchSimilarProducts();
  }, [category, productId]);

  const scroll = (direction) => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -320 : 320;
      scrollContainerRef.current.scrollBy({
        left: scrollAmount,
        behavior: 'smooth'
      });
    }
  };

  const handleQuickAdd = (e, product) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart(product, 1);
  };

  const handleToggleWishlist = (e, productId) => {
    e.preventDefault();
    e.stopPropagation();
    toggleWishlist(productId);
  };

  if (loading) {
    return (
      <div className="py-8">
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)] mb-6">Customers Also Viewed</h2>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-64">
              <div className="bg-[var(--color-background-muted)] animate-pulse rounded-2xl h-80"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="py-8 relative">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">Customers Also Viewed</h2>
        
        {/* Navigation Arrows */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-11 h-11 rounded-full bg-white border-2 border-[var(--color-border-primary)] hover:border-brand-teal hover:text-brand-teal flex items-center justify-center transition-all hover:scale-110 shadow-md"
            aria-label="Scroll left"
          >
            <FaChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-11 h-11 rounded-full bg-white border-2 border-[var(--color-border-primary)] hover:border-brand-teal hover:text-brand-teal flex items-center justify-center transition-all hover:scale-110 shadow-md"
            aria-label="Scroll right"
          >
            <FaChevronRight size={16} />
          </button>
        </div>
      </div>

      {/* Products Carousel */}
      <div
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {products.map((product) => {
          const inWishlist = isInWishlist(product._id || product.id);
          const productSlug = product.slug || product._id || product.id;

          return (
            <Link
              key={product._id || product.id}
              href={`/products/${productSlug}`}
              className="flex-shrink-0 w-64 group"
            >
              <div className="bg-white border-2 border-[var(--color-border-primary)] rounded-2xl p-4 hover:border-brand-teal hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                {/* Image */}
                <div className="relative w-full aspect-square mb-3 bg-[var(--color-background-secondary)] rounded-xl overflow-hidden">
                  {product.images && product.images[0] ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      sizes="256px"
                      className="object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)] text-6xl">
                      🏥
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleToggleWishlist(e, product._id || product.id)}
                    className={`absolute top-2 right-2 w-11 h-11 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                      inWishlist ? 'text-[var(--color-status-danger)]' : 'text-[var(--color-text-secondary)] hover:text-[var(--color-status-danger)]'
                    }`}
                    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                    aria-pressed={inWishlist}
                  >
                    <FaHeart size={16} className={inWishlist ? 'fill-current' : ''} />
                  </button>

                  {/* Stock Badge */}
                  {product.stock === 0 && (
                    <div className="absolute bottom-2 left-2 px-3 py-1 bg-[var(--color-status-danger-tint)]0 text-white text-xs font-semibold rounded-full">
                      Out of Stock
                    </div>
                  )}
                  {product.stock > 0 && product.stock < 5 && (
                    <div className="absolute bottom-2 left-2 px-3 py-1 bg-orange-500 text-white text-xs font-semibold rounded-full">
                      Only {product.stock} left
                    </div>
                  )}
                </div>

                {/* Brand */}
                {product.brand && (
                  <div className="text-xs font-semibold text-blue-600 mb-1">
                    {typeof product.brand === 'object' ? product.brand.name : product.brand}
                  </div>
                )}

                {/* Name */}
                <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2 line-clamp-2 min-h-[40px]">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="mb-3 mt-auto">
                  {product.oldPrice && product.oldPrice > product.price ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                        ৳{product.price?.toLocaleString()}
                      </span>
                      <span className="text-sm text-[var(--color-text-secondary)] line-through">
                        ৳{product.oldPrice?.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-semibold text-[var(--color-text-primary)]">
                      {product.price > 0 ? `৳${product.price?.toLocaleString()}` : 'Contact for Price'}
                    </span>
                  )}
                </div>

                {/* Quick Add Button */}
                {product.stock > 0 && product.price > 0 && (
                  <button
                    onClick={(e) => handleQuickAdd(e, product)}
                    className="w-full py-2 px-4 bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
                  >
                    <FaShoppingCart size={14} />
                    <span>Quick Add</span>
                  </button>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {/* Hide scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
