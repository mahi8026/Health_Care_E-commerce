"use client";

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { FaShoppingCart, FaMinus, FaPlus, FaTimes } from 'react-icons/fa';
import { useCart } from '@/context/CartContext';

/**
 * Sticky Add to Cart Bar
 * Appears only after the main add-to-cart button scrolls out of view.
 * Uses IntersectionObserver on #add-to-cart element for precise trigger.
 */
export default function StickyAddToCart({ product, scrollThreshold = 600 }) {
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [topbarHidden, setTopbarHidden] = useState(false);
  const barRef = useRef(null);
  const { addToCart } = useCart();

  useEffect(() => {
    // Use IntersectionObserver on the #add-to-cart element if it exists
    // Falls back to scroll threshold
    const target = document.getElementById('add-to-cart');

    if (target && 'IntersectionObserver' in window) {
      const observer = new IntersectionObserver(
        ([entry]) => {
          // Show bar when the add-to-cart panel is NOT visible
          setVisible(!entry.isIntersecting);
        },
        { threshold: 0, rootMargin: '-80px 0px 0px 0px' }
      );
      observer.observe(target);
      return () => observer.disconnect();
    }

    // Fallback: scroll threshold
    let ticking = false;
    const handleScroll = () => {
      setVisible(window.scrollY > scrollThreshold);
      ticking = false;
    };
    const throttled = () => {
      if (!ticking) { window.requestAnimationFrame(handleScroll); ticking = true; }
    };
    window.addEventListener('scroll', throttled, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', throttled);
  }, [scrollThreshold]);

  // Watch for topbar visibility changes
  useEffect(() => {
    const checkTopbar = () => {
      setTopbarHidden(document.documentElement.classList.contains('topbar-hidden'));
    };
    
    // Check initial state
    checkTopbar();
    
    // Watch for class changes on html element
    const observer = new MutationObserver(checkTopbar);
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    });
    
    return () => observer.disconnect();
  }, []);

  // Reset dismissed when product changes
  const prevProductId = useRef(null);
  useEffect(() => {
    if (product?._id && product._id !== prevProductId.current) {
      prevProductId.current = product._id;
      setDismissed(false);
    }
  }, [product?._id]);

  // F2 — sized SKUs need an explicit SizeSelector choice; calling addToCart
  // here previously created a DUPLICATE sizeless cart row that checkout then
  // rejected. Hide the bar until selected-size state is lifted page-wide.
  if (product?.variants?.sizes?.length > 0) return null;

  // Calculate visibility state
  const show = visible && !dismissed;

  // Handle add to cart — pass flash-deal price so the local cart matches
  const flashDealPrice =
    product.activeFlashDeal?.finalPrice > 0 &&
    (!product.price || product.activeFlashDeal.finalPrice < product.price)
      ? product.activeFlashDeal.finalPrice
      : null;
  const productForCart = flashDealPrice ? { ...product, price: flashDealPrice } : product;

  const handleAddToCart = async () => {
    setAdding(true);
    await addToCart(productForCart, quantity);
    setTimeout(() => setAdding(false), 1500);
  };

  const inStock = product.stock > 0;
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;

  // Calculate top position based on whether topbar is hidden
  // Topbar: 32px, Header: 52px → Total: 84px when topbar visible, 52px when hidden
  const topPosition = topbarHidden ? '52px' : 'var(--site-nav-height, 84px)';

  return (
    <div
      ref={barRef}
      className="hidden lg:block fixed left-0 right-0 bg-white"
      aria-hidden={!show}
      style={{
        top: topPosition,
        zIndex: 849,                           /* below navbar (z-header:900), above content */
        transform: show ? 'translateY(0)' : 'translateY(-120%)',
        opacity: show ? 1 : 0,
        transition: 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.25s ease, top 0.2s ease',
        pointerEvents: show ? 'auto' : 'none',
        borderBottom: '1px solid #e5e7eb',
        boxShadow: '0 4px 12px rgba(11,37,69,0.1)',
      }}
    >
      <div className="max-w-7xl mx-auto px-4 lg:px-6 py-2 flex items-center gap-4">

        {/* Product Image */}
        <div className="relative w-14 h-14 bg-gray-50 rounded-lg overflow-hidden flex-shrink-0 border border-gray-200">
          {product.images?.[0] ? (
            <Image
              src={typeof product.images[0] === 'string'
                ? product.images[0]
                : (product.images[0]?.url || product.images[0]?.secure_url || '')}
              alt={product.name}
              fill
              sizes="56px"
              className="object-contain p-1"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🏥</div>
          )}
        </div>

        {/* Product Name */}
        <div className="flex-1 min-w-0">
          {brandName && (
            <div style={{ fontSize: '10px' }} className="font-bold text-[var(--color-brand-teal)] uppercase tracking-wide mb-0.5">
              {brandName}
            </div>
          )}
          <h3 className="text-sm font-semibold text-gray-900 truncate leading-tight">
            {product.name}
          </h3>
        </div>

        {/* Price */}
        <div className="flex-shrink-0 text-right">
          <div className="text-xl font-bold text-[var(--color-brand-navy)]">
            {product.price > 0 ? `৳${product.price.toLocaleString()}` : 'Contact for Price'}
          </div>
          {flashDealPrice && product.price > flashDealPrice ? (
            <div className="text-xs text-orange-600 font-semibold">
              Flash Deal ৳{flashDealPrice.toLocaleString()}
            </div>
          ) : (
            product.oldPrice > 0 && product.oldPrice > product.price && (
              <div className="text-xs text-gray-400 line-through">
                ৳{product.oldPrice.toLocaleString()}
              </div>
            )
          )}
        </div>

        {/* Quantity — only when in stock */}
        {inStock && (
          <div className="flex items-center border border-gray-300 rounded-lg overflow-hidden flex-shrink-0">
            <button
              onClick={() => setQuantity(q => Math.max(1, q - 1))}
              disabled={quantity <= 1}
              className="w-11 h-11 flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              aria-label="Decrease quantity"
            >
              <FaMinus size={11} />
            </button>
            <span className="w-10 h-11 flex items-center justify-center text-sm font-semibold">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity(q => Math.min(product.stock || 999, q + 1))}
              disabled={quantity >= (product.stock || 999)}
              className="w-11 h-11 flex items-center justify-center bg-gray-50 hover:bg-gray-100 disabled:opacity-30 transition-colors"
              aria-label="Increase quantity"
            >
              <FaPlus size={11} />
            </button>
          </div>
        )}

        {/* Add to Cart / Out of Stock */}
        {inStock ? (
          <button
            onClick={handleAddToCart}
            disabled={adding}
            className="px-6 py-2.5 bg-[var(--color-brand-teal)] hover:bg-[var(--color-brand-teal-hover)] text-white rounded-xl font-semibold text-sm transition-colors disabled:opacity-60 flex items-center gap-2 flex-shrink-0"
          >
            {adding ? (
              <>
                <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Adding...
              </>
            ) : (
              <>
                <FaShoppingCart size={14} />
                Add to Cart
              </>
            )}
          </button>
        ) : (
          <div className="px-6 py-2.5 bg-gray-100 text-gray-500 rounded-xl font-semibold text-sm flex-shrink-0">
            Out of Stock
          </div>
        )}

        {/* Dismiss button */}
        <button
          onClick={() => setDismissed(true)}
          className="w-7 h-7 flex items-center justify-center text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors flex-shrink-0 ml-1"
          aria-label="Dismiss sticky bar"
        >
          <FaTimes size={12} />
        </button>
      </div>
    </div>
  );
}
