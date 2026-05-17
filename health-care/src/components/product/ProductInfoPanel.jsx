"use client";

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { CONTACT } from '@/constants/api';

/**
 * Redesigned Sticky Product Info Panel (Right Column)
 * Features: Brand/category pills, pricing, variants, quantity, CTA buttons, trust badges
 */
export default function ProductInfoPanel({
  product,
  quantity,
  setQuantity,
  selectedConnectivity,
  setSelectedConnectivity,
  selectedWarranty,
  setSelectedWarranty
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { isAuthenticated } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [buttonText, setButtonText] = useState('Add to cart');

  // Safe price values
  const price = product.price || 0;
  const oldPrice = product.oldPrice || 0;
  const rating = product.rating || 0;
  const reviewCount = product.reviewCount || 0;
  const savings = oldPrice > price ? oldPrice - price : 0;
  const discountPercent = oldPrice > 0 ? Math.round((savings / oldPrice) * 100) : 0;

  // Extract brand and category
  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;

  const handleAddToCart = useCallback(async () => {
    setAddingToCart(true);
    setButtonText('Adding...');
    
    try {
      addToCart(product, quantity);
      setButtonText('✓ Added!');
      setToastMessage(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart`);
      setShowToast(true);
      
      setTimeout(() => {
        setButtonText('Add to cart');
        setShowToast(false);
      }, 1500);
    } finally {
      setTimeout(() => setAddingToCart(false), 1500);
    }
  }, [addToCart, product, quantity]);

  const handleQuotationRequest = useCallback(() => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }
    // Navigate to quotation request page or open modal
    router.push(`/quotation?product=${product._id || product.id}`);
  }, [isAuthenticated, router, product]);

  const handleWhatsAppClick = useCallback(() => {
    const phoneNumber = CONTACT.whatsapp;
    const message = encodeURIComponent(
      `Hi! I'm interested in this product:\n\n` +
      `*${product.name}*\n` +
      `SKU: ${product.sku}\n` +
      `Price: ৳${price.toLocaleString()}\n` +
      `Quantity: ${quantity}\n\n` +
      `Link: ${window.location.href}\n\n` +
      `Could you please provide more information?`
    );
    window.open(`https://wa.me/${phoneNumber}?text=${message}`, '_blank');
  }, [product, price, quantity]);

  return (
    <div className="sticky top-20 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 lg:p-6">
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl shadow-lg px-4 py-3 flex items-center gap-3">
          <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <p className="text-[13px] font-semibold">{toastMessage}</p>
        </div>
      )}

      {/* Brand + Category Pills */}
      <div className="flex gap-2 items-center mb-3 flex-wrap">
        {brandName && (
          <button 
            onClick={() => router.push(`/search?brand=${product.brandId || brandName}`)}
            className="text-[11px] font-medium bg-[#F9FAFB] text-[#6B7280] px-3 py-[5px] rounded-full hover:bg-[#E5E7EB] transition-colors"
          >
            {brandName}
          </button>
        )}
        {categoryName && (
          <button 
            onClick={() => router.push(`/search?category=${product.categoryId || categoryName}`)}
            className="text-[11px] font-medium bg-[#F9FAFB] text-[#6B7280] px-3 py-[5px] rounded-full hover:bg-[#E5E7EB] transition-colors"
          >
            {categoryName}
          </button>
        )}
      </div>

      {/* SKU */}
      <div className="text-[11px] text-[#6B7280] mb-3 font-mono">
        SKU: {product.sku}
      </div>

      {/* Product Name */}
      <h1 className="text-[24px] font-bold leading-[1.3] mb-3 text-[#0B2545]">
        {product.name}
      </h1>

      {/* Rating Row */}
      <div className="flex items-center gap-2 mb-4">
        <div className="flex gap-[2px]">
          {[...Array(5)].map((_, i) => (
            <svg
              key={i}
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill={i < Math.floor(rating) ? '#F59E0B' : '#E5E7EB'}
              stroke="none"
            >
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
          ))}
        </div>
        <span className="text-[12px] text-[#6B7280]">
          {reviewCount > 0 ? `${rating.toFixed(1)} (${reviewCount} reviews)` : 'No reviews yet'}
        </span>
        {product.recommendPercent > 0 && (
          <span className="text-[11px] text-[#0E8A6E] font-medium">
            · {product.recommendPercent}% recommend
          </span>
        )}
      </div>

      {/* Price Section */}
      <div className="mb-5 p-4 bg-[#F8FAFC] rounded-2xl border border-gray-100">
        <div className="flex items-baseline gap-3 flex-wrap mb-1">
          <span className="text-[34px] font-extrabold text-[#0B2545] leading-none">
            {price > 0 ? `৳${price.toLocaleString()}` : (
              <span className="text-[20px] font-bold text-gray-500">Contact for Price</span>
            )}
          </span>
          {oldPrice > price && (
            <>
              <span className="text-[16px] text-gray-400 line-through">৳{oldPrice.toLocaleString()}</span>
              <span className="text-[12px] font-bold bg-emerald-500 text-white px-2.5 py-1 rounded-lg">
                Save ৳{savings.toLocaleString()} ({discountPercent}% off)
              </span>
            </>
          )}
        </div>
        <div className="text-[12px] text-gray-500 mt-1">
          {price > 0 ? 'Inclusive of VAT · Free installation in Dhaka' : 'Call +880 1800-000-MED for pricing'}
        </div>
      </div>

      {/* B2B Bulk Pricing Pills */}
      {product.bulkPricing && (
        <div className="mb-4">
          <div className="text-[11px] text-[#6B7280] mb-2">Bulk pricing available:</div>
          <div className="flex gap-2 flex-wrap">
            <button 
              className="text-[11px] px-3 py-[6px] rounded-full border border-[#E5E7EB] text-[#6B7280] hover:border-[#0E8A6E] hover:bg-[#E1F5EE] hover:text-[#0E8A6E] transition-colors"
              title="Order 2-4 units to unlock this price"
            >
              2-4 units: -8%
            </button>
            <button 
              className="text-[11px] px-3 py-[6px] rounded-full border-2 border-[#0E8A6E] bg-[#E1F5EE] text-[#0E8A6E] font-semibold"
              title="Order 5-9 units to unlock this price"
            >
              5-9 units: -15%
            </button>
            <button 
              className="text-[11px] px-3 py-[6px] rounded-full border border-[#E5E7EB] text-[#6B7280] hover:border-[#0E8A6E] hover:bg-[#E1F5EE] hover:text-[#0E8A6E] transition-colors"
              title="Order 10+ units to unlock this price"
            >
              10+ units: -22%
            </button>
          </div>
        </div>
      )}

      {/* Stock Status */}
      <div className="flex items-center gap-2 mb-4">
        <div className="w-2 h-2 rounded-full bg-[#10B981] flex-shrink-0" />
        <span className="text-[13px] text-[#0B2545]">
          <strong>In stock</strong> — ships within 24 hr from Dhaka warehouse
        </span>
      </div>

      {/* Connectivity Variant */}
      {product.variants?.connectivity && product.variants.connectivity.length > 0 && (
        <div className="mb-4">
          <div className="text-[12px] font-medium text-[#0B2545] mb-2">Connectivity option:</div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setSelectedConnectivity('usb-lan')}
              className={`px-4 py-[8px] rounded-lg text-[13px] font-medium transition-all ${
                selectedConnectivity === 'usb-lan'
                  ? 'border-2 border-[#0E8A6E] bg-[#E1F5EE] text-[#0E8A6E]'
                  : 'border border-[#E5E7EB] text-[#0B2545] hover:border-[#0B2545]'
              }`}
            >
              USB + LAN
            </button>
            <button
              onClick={() => setSelectedConnectivity('usb-lan-wifi')}
              className={`px-4 py-[8px] rounded-lg text-[13px] font-medium transition-all ${
                selectedConnectivity === 'usb-lan-wifi'
                  ? 'border-2 border-[#0E8A6E] bg-[#E1F5EE] text-[#0E8A6E]'
                  : 'border border-[#E5E7EB] text-[#0B2545] hover:border-[#0B2545]'
              }`}
            >
              USB + LAN + Wi-Fi <span className="text-[11px]">(+৳4,000)</span>
            </button>
          </div>
        </div>
      )}

      {/* Warranty Variant */}
      {product.variants?.warranty && product.variants.warranty.length > 0 && (
        <div className="mb-4">
          <div className="text-[12px] font-medium text-[#0B2545] mb-2">Warranty:</div>
          <div className="flex gap-2 flex-wrap">
            {['1-year', '2-year', 'amc'].map((warranty) => (
              <button
                key={warranty}
                onClick={() => setSelectedWarranty(warranty)}
                className={`px-4 py-[8px] rounded-lg text-[13px] font-medium transition-all ${
                  selectedWarranty === warranty
                    ? 'border-2 border-[#0E8A6E] bg-[#E1F5EE] text-[#0E8A6E]'
                    : 'border border-[#E5E7EB] text-[#0B2545] hover:border-[#0B2545]'
                }`}
              >
                {warranty === '1-year' && '1-year standard'}
                {warranty === '2-year' && '2-year extended (+৳8,000)'}
                {warranty === 'amc' && 'AMC contract'}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Quantity Selector */}
      <div className="mb-4">
        <div className="text-[12px] font-medium text-[#0B2545] mb-2">Quantity:</div>
        <div className="flex items-center gap-3">
          <div className="flex items-center border border-[#E5E7EB] rounded-lg overflow-hidden">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-9 h-9 bg-white hover:bg-[#0E8A6E] hover:text-white transition-colors flex items-center justify-center text-[18px] font-bold"
            >
              −
            </button>
            <div className="w-12 text-center text-[16px] font-bold border-l border-r border-[#E5E7EB] h-9 leading-9">
              {quantity}
            </div>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-9 h-9 bg-white hover:bg-[#0E8A6E] hover:text-white transition-colors flex items-center justify-center text-[18px] font-bold"
            >
              +
            </button>
          </div>
          <span className="text-[11px] text-[#6B7280]">Min. order: 1 unit</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="space-y-2.5 mb-5">
        {/* Add to Cart */}
        <button
          onClick={handleAddToCart}
          disabled={addingToCart}
          className="w-full h-[52px] bg-[#0B2545] hover:bg-[#0d2d52] text-white rounded-xl text-[15px] font-bold transition-all disabled:opacity-60 flex items-center justify-center gap-2 shadow-sm hover:shadow-md"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/>
            <path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"/>
          </svg>
          {buttonText}
        </button>

        {/* Request Quotation */}
        <button
          onClick={handleQuotationRequest}
          className="w-full h-[46px] bg-transparent hover:bg-gray-50 text-[#0B2545] border border-[#0B2545]/30 hover:border-[#0B2545] rounded-xl text-[13px] font-semibold transition-all"
        >
          📋 Request Formal Quotation (B2B)
        </button>

        {/* WhatsApp */}
        <button
          onClick={handleWhatsAppClick}
          className="w-full h-[46px] bg-[#25D366] hover:bg-[#20b958] text-white rounded-xl text-[13px] font-semibold transition-all flex items-center justify-center gap-2 shadow-sm"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
            <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.583 3.842 1.59 5.399L2 22l4.74-1.556A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 11.999 2zm.001 18a7.965 7.965 0 01-4.184-1.186l-.299-.178-3.104 1.019 1.044-3.018-.197-.312A7.996 7.996 0 014 12c0-4.411 3.588-8 8-8s8 3.589 8 8c0 4.412-3.589 8-8 8z"/>
          </svg>
          Ask on WhatsApp
        </button>
      </div>

      {/* Promise Badges (2x2 Grid) */}
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[
          { icon: '🚚', text: 'Free delivery', subtext: 'Dhaka metro area' },
          { icon: '⚡', text: 'Order before 12 PM', subtext: 'Same-day dispatch' },
          { icon: '🔧', text: 'Free installation', subtext: 'Dhaka metro' },
          { icon: '🔄', text: '30-day return', subtext: 'Hassle-free policy' }
        ].map((item, idx) => (
          <div key={idx} className="bg-[#F8FAFC] rounded-xl p-3 flex items-start gap-2.5 border border-gray-100">
            <span className="text-[20px] flex-shrink-0 leading-none mt-0.5">{item.icon}</span>
            <div>
              <div className="text-[11px] font-bold text-[#0B2545]">{item.text}</div>
              <div className="text-[10px] text-gray-400 mt-0.5">{item.subtext}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Certification Badges */}
      <div className="flex flex-wrap gap-2 pt-4 border-t border-gray-100">
        {['CE Certified', 'ISO 13485', 'DGDA Cleared', '24/7 Support'].map((trust, idx) => (
          <div key={idx} className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-2.5 py-1.5 rounded-lg">
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#10B981" strokeWidth="3">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            <span className="text-[11px] font-semibold text-emerald-700">{trust}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
