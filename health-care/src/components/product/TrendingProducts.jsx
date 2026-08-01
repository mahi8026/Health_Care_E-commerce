"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { FaFire, FaShoppingCart, FaHeart } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { API } from '@/constants/api';

/**
 * Trending Products Component
 * Shows products that are currently popular based on recent orders
 * Uses AI-powered trending algorithm from backend
 */
export default function TrendingProducts({ limit = 12 }) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();
  const { toggleWishlist, isInWishlist } = useWishlist();

  useEffect(() => {
    const fetchTrendingProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API}/recommendations/trending?limit=${limit}`);
      const data = await res.json();
      
      if (data.success && data.data?.recommendations) {
        setProducts(data.data.recommendations);
      } else {
        // Fallback to featured products
        const fallbackRes = await fetch(`${API}/products?featured=true&limit=${limit}`);
        const fallbackData = await fallbackRes.json();
        
        if (fallbackData.success) {
          setProducts(fallbackData.data || []);
        }
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Fetch trending products error:', error);
      
      // Final fallback
      try {
        const fallbackRes = await fetch(`${API}/products?limit=${limit}`);
        const fallbackData = await fallbackRes.json();
        if (fallbackData.success) {
          setProducts(fallbackData.data || []);
        }
      } catch (fallbackError) {
        process.env.NODE_ENV !== "production" && console.error('Fallback also failed:', fallbackError);
      }
      } finally {
        setLoading(false);
      }
    };

    fetchTrendingProducts();
  }, [limit]);

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
        <div className="flex items-center gap-2 mb-6">
          <FaFire className="text-orange-500 text-2xl" />
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">Trending Now</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-[var(--color-background-muted)] animate-pulse rounded-2xl h-80"></div>
          ))}
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <FaFire className="text-orange-500 text-2xl animate-pulse" />
          <h2 className="text-2xl font-semibold text-[var(--color-text-primary)]">Trending Now</h2>
          <span className="text-sm text-[var(--color-text-secondary)] bg-orange-50 px-3 py-1 rounded-full font-medium">
            Hot Picks
          </span>
        </div>
        
        <Link
          href="/products"
          className="text-sm text-brand-teal hover:text-[var(--color-brand-teal-hover)] font-semibold hover:underline"
        >
          View All →
        </Link>
      </div>

      {/* Products Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {products.map((product) => {
          const inWishlist = isInWishlist(product._id || product.id);
          const productSlug = product.slug || product._id || product.id;
          
          // Get primary image
          const imageData = product.images?.find(img => typeof img === 'object' && img.isPrimary) || product.images?.[0];
          const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;

          return (
            <Link
              key={product._id || product.id}
              href={`/products/${productSlug}`}
              className="group"
            >
              <div className="bg-white border-2 border-[var(--color-border-primary)] rounded-2xl p-3 hover:border-orange-500 hover:shadow-xl transition-all duration-300 h-full flex flex-col relative">
                {/* Trending Badge */}
                <div className="absolute top-2 left-2 z-10 bg-gradient-to-r from-orange-500 to-danger text-white text-xs font-semibold px-2 py-1 rounded-full flex items-center gap-1">
                  <FaFire size={10} />
                  <span>Hot</span>
                </div>

                {/* Image */}
                <div className="relative w-full aspect-square mb-3 bg-[var(--color-background-secondary)] rounded-xl overflow-hidden">
                  {imageUrl ? (
                    <Image
                      src={imageUrl}
                      alt={product.name}
                      fill
                      sizes="(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 16vw"
                      className="object-contain p-2 group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[var(--color-text-tertiary)] text-5xl">
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
                    <FaHeart size={14} className={inWishlist ? 'fill-current' : ''} />
                  </button>

                  {/* Stock Badge */}
                  {product.stock === 0 && (
                    <div className="absolute bottom-2 left-2 px-2 py-1 bg-[var(--color-status-danger-tint)]0 text-white text-xs font-semibold rounded-full">
                      Out of Stock
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
                    className="w-full py-2 px-3 bg-gradient-to-r from-orange-500 to-danger hover:from-orange-600 hover:to-danger text-white rounded-xl font-semibold text-xs transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100"
                  >
                    <FaShoppingCart size={12} />
                    <span>Quick Add</span>
                  </button>
                )}
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
