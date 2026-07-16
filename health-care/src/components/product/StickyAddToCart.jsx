"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { FaShoppingCart, FaMinus, FaPlus } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';

/**
 * Sticky Add to Cart Bar
 * Shows on scroll with compact product info
 * Features:
 * - Appears after scrolling past main add-to-cart button
 * - Compact product info (image + name + price)
 * - Quantity selector
 * - Add to cart button
 * - Smooth slide-in animation
 */
export default function StickyAddToCart({ product, scrollThreshold = 600 }) {
  const [visible, setVisible] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const { addToCart } = useCart();

  useEffect(() => {
    let ticking = false;
    
    const handleScroll = () => {
      const scrolled = window.scrollY > scrollThreshold;
      setVisible(scrolled);
      ticking = false;
    };

    const throttledScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(handleScroll);
        ticking = true;
      }
    };

    window.addEventListener('scroll', throttledScroll, { passive: true });
    handleScroll(); // Check initial scroll position

    return () => window.removeEventListener('scroll', throttledScroll);
  }, [scrollThreshold]);

  const handleAddToCart = async () => {
    setAdding(true);
    await addToCart(product, quantity);
    setTimeout(() => setAdding(false), 1500);
  };

  const inStock = product.stock > 0;
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;

  return (
    <div
      className={`hidden lg:block fixed top-0 left-0 right-0 z-[1000] bg-white border-b-2 border-gray-200 shadow-xl transition-all duration-500 ${
        visible ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-6">
        {/* Product Image */}
        <div className="relative w-16 h-16 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
          {product.images && product.images[0] ? (
            <Image
              src={product.images[0].url}
              alt={product.name}
              fill
              sizes="64px"
              className="object-contain p-1"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-2xl">
              🏥
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="flex-1 min-w-0">
          {brandName && (
            <div className="text-xs font-semibold text-blue-600 mb-1">
              {brandName}
            </div>
          )}
          <h3 className="text-sm font-bold text-gray-900 truncate">
            {product.name}
          </h3>
        </div>

        {/* Price */}
        <div className="flex-shrink-0">
          <div className="text-2xl font-extrabold text-gray-900">
            {product.price > 0 ? `৳${product.price?.toLocaleString()}` : 'Contact for Price'}
          </div>
          {product.oldPrice && product.oldPrice > product.price && (
            <div className="text-sm text-gray-500 line-through text-right">
              ৳{product.oldPrice?.toLocaleString()}
            </div>
          )}
        </div>

        {/* Quantity Selector */}
        {inStock && (
          <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden flex-shrink-0">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              disabled={quantity <= 1}
              className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Decrease quantity"
            >
              <FaMinus size={12} />
            </button>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, Math.min(product.stock, parseInt(e.target.value) || 1)))}
              className="w-14 h-10 text-center text-base font-bold text-gray-900 border-none focus:outline-none"
              min="1"
              max={product.stock}
            />
            <button
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              disabled={quantity >= product.stock}
              className="w-10 h-10 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              aria-label="Increase quantity"
            >
              <FaPlus size={12} />
            </button>
          </div>
        )}

        {/* Add to Cart Button */}
        {inStock ? (
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="px-8 py-3 bg-[#0E8A6E] hover:bg-[#0c7a61] text-white rounded-xl font-bold text-base transition-all duration-300 hover:shadow-lg disabled:opacity-60 flex items-center gap-3 flex-shrink-0 relative overflow-hidden group"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
            {adding ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <FaShoppingCart size={18} />
                <span>Add to Cart</span>
              </>
            )}
          </button>
        ) : (
          <div className="px-8 py-3 bg-gray-300 text-gray-500 rounded-xl font-bold text-base flex-shrink-0">
            Out of Stock
          </div>
        )}
      </div>
    </div>
  );
}
