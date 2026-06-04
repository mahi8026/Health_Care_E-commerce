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
    if (category) {
      fetchSimilarProducts();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, productId]);

  const fetchSimilarProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/products?category=${category}&limit=12`);
      const data = await res.json();
      
      if (data.success) {
        // Exclude current product
        const filtered = data.data.filter(p => p._id !== productId && p.id !== productId);
        setProducts(filtered.slice(0, 8));
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Fetch similar products error:', error);
    } finally {
      setLoading(false);
    }
  };

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
        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customers Also Viewed</h2>
        <div className="flex gap-4 overflow-hidden">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="flex-shrink-0 w-64">
              <div className="bg-gray-200 animate-pulse rounded-2xl h-80"></div>
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
        <h2 className="text-2xl font-bold text-gray-900">Customers Also Viewed</h2>
        
        {/* Navigation Arrows */}
        <div className="flex gap-2">
          <button
            onClick={() => scroll('left')}
            className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 hover:border-[#0E8A6E] hover:text-[#0E8A6E] flex items-center justify-center transition-all hover:scale-110 shadow-md"
            aria-label="Scroll left"
          >
            <FaChevronLeft size={16} />
          </button>
          <button
            onClick={() => scroll('right')}
            className="w-10 h-10 rounded-full bg-white border-2 border-gray-300 hover:border-[#0E8A6E] hover:text-[#0E8A6E] flex items-center justify-center transition-all hover:scale-110 shadow-md"
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
              <div className="bg-white border-2 border-gray-200 rounded-2xl p-4 hover:border-[#0E8A6E] hover:shadow-xl transition-all duration-300 h-full flex flex-col">
                {/* Image */}
                <div className="relative w-full h-48 mb-3 bg-gray-50 rounded-xl overflow-hidden">
                  {product.images && product.images[0] ? (
                    <Image
                      src={product.images[0].url}
                      alt={product.name}
                      fill
                      sizes="256px"
                      className="object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-300 text-6xl">
                      🏥
                    </div>
                  )}

                  {/* Wishlist Button */}
                  <button
                    onClick={(e) => handleToggleWishlist(e, product._id || product.id)}
                    className={`absolute top-2 right-2 w-9 h-9 rounded-full bg-white shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 ${
                      inWishlist ? 'text-red-500' : 'text-gray-400 hover:text-red-500'
                    }`}
                    aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
                  >
                    <FaHeart size={16} className={inWishlist ? 'fill-current' : ''} />
                  </button>

                  {/* Stock Badge */}
                  {product.stock === 0 && (
                    <div className="absolute bottom-2 left-2 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-full">
                      Out of Stock
                    </div>
                  )}
                  {product.stock > 0 && product.stock < 5 && (
                    <div className="absolute bottom-2 left-2 px-3 py-1 bg-orange-500 text-white text-xs font-bold rounded-full">
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
                <h3 className="text-sm font-bold text-gray-900 mb-2 line-clamp-2 min-h-[40px]">
                  {product.name}
                </h3>

                {/* Price */}
                <div className="mb-3 mt-auto">
                  {product.oldPrice && product.oldPrice > product.price ? (
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-lg font-extrabold text-gray-900">
                        ৳{product.price?.toLocaleString()}
                      </span>
                      <span className="text-sm text-gray-500 line-through">
                        ৳{product.oldPrice?.toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <span className="text-lg font-extrabold text-gray-900">
                      {product.price > 0 ? `৳${product.price?.toLocaleString()}` : 'Contact for Price'}
                    </span>
                  )}
                </div>

                {/* Quick Add Button */}
                {product.stock > 0 && product.price > 0 && (
                  <button
                    onClick={(e) => handleQuickAdd(e, product)}
                    className="w-full py-2 px-4 bg-[#0E8A6E] hover:bg-[#0c7a61] text-white rounded-xl font-bold text-sm transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
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
