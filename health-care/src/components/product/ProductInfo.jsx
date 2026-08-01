import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';
import { useAuth } from '@/context/AuthContext';
import { CONTACT } from '@/constants/api';

export default function ProductInfo({
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
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isAuthenticated } = useAuth();
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [addingToCart, setAddingToCart] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);

  // Safe price values with fallback to 0
  const price = product.price || 0;
  const oldPrice = product.oldPrice || 0;
  const rating = product.rating || 0;
  const savings = oldPrice > price ? oldPrice - price : 0;
  const discountPercent = oldPrice > 0 ? Math.round((savings / oldPrice) * 100) : 0;
  const inWishlist = isInWishlist(product._id || product.id);

  const handleAddToCart = useCallback(async () => {
    setAddingToCart(true);
    try {
      addToCart(product, quantity);
      setToastMessage(`Added ${quantity} ${quantity > 1 ? 'items' : 'item'} to cart`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } finally {
      setAddingToCart(false);
    }
  }, [addToCart, product, quantity]);

  const handleToggleWishlist = useCallback(async () => {
    if (!isAuthenticated()) {
      router.push('/login');
      return;
    }

    setTogglingWishlist(true);
    const result = await toggleWishlist(product._id || product.id);
    setTogglingWishlist(false);

    if (result.success) {
      setToastMessage(result.added ? 'Added to wishlist' : 'Removed from wishlist');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    } else if (result.requiresLogin) {
      router.push('/login');
    }
  }, [toggleWishlist, product, isAuthenticated, router]);

  const handleWhatsAppClick = useCallback(() => {
    // Get WhatsApp business number from constants
    const phoneNumber = CONTACT.whatsapp;
    
    // Create a pre-filled message with product details
    const message = encodeURIComponent(
      `Hi! I'm interested in this product:\n\n` +
      `*${product.name}*\n` +
      `SKU: ${product.sku}\n` +
      `Price: ৳${price.toLocaleString()}\n` +
      `Quantity: ${quantity}\n\n` +
      `Link: ${window.location.href}\n\n` +
      `Could you please provide more information?`
    );
    
    // Open WhatsApp with pre-filled message
    const whatsappUrl = `https://wa.me/${phoneNumber}?text=${message}`;
    window.open(whatsappUrl, '_blank');
  }, [product, price, quantity]);

  return (
    <div>
      {/* Toast Notification */}
      {showToast && (
        <div className="fixed top-4 right-4 z-toast bg-[var(--color-status-success-tint)] text-[var(--color-status-success)] rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 animate-slide-in">
          <span className="text-lg">✓</span>
          <p className="text-xs font-medium font-[family-name:var(--font-plus-jakarta)]">
            {toastMessage}
          </p>
        </div>
      )}
      {/* Meta Tags */}
      <div className="flex gap-2 items-center mb-[10px] flex-wrap">
        <span className="text-xs text-brand-teal font-medium bg-brand-teal-tint px-2 py-[3px] rounded">
          {typeof product.brand === 'object' ? product.brand?.name : product.brand}
        </span>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {typeof product.category === 'object' ? product.category?.name : product.category}
        </span>
        <span className="text-xs text-[var(--color-text-tertiary)]">SKU: {product.sku}</span>
      </div>

      {/* Title */}
      <h1 className="font-[family-name:var(--font-lora)] text-xl font-semibold leading-[1.3] mb-[10px]">
        {product.name}
      </h1>

      {/* Rating */}
      <div className="flex items-center gap-2 mb-[14px]">
        <div className="flex gap-[2px]">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className={`w-[11px] h-[11px] ${
                i < Math.floor(rating) ? 'bg-warning' : 'bg-[var(--color-border-secondary)]'
              }`}
              style={{ clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }}
            />
          ))}
        </div>
        <span className="text-xs text-[var(--color-text-secondary)]">
          {rating > 0 ? `${rating} (${product.reviewCount || 0} reviews)` : 'No reviews yet'}
        </span>
        <span className="text-xs text-brand-teal">· {product.recommendPercent}% recommend</span>
      </div>

      {/* Price Block */}
      <div className="bg-[var(--color-background-secondary)] rounded-lg p-[14px] mb-4">
        <div className="flex items-baseline flex-wrap gap-1">
          <span className="font-[family-name:var(--font-lora)] text-3xl font-semibold text-brand-navy">
            ৳ {price.toLocaleString()}
          </span>
          {oldPrice > price && (
            <span className="text-sm text-[var(--color-text-secondary)] line-through ml-2">
              ৳ {oldPrice.toLocaleString()}
            </span>
          )}
          {savings > 0 && (
            <span className="text-xs text-brand-teal font-medium ml-[6px] bg-brand-teal-tint px-[7px] py-[2px] rounded">
              Save ৳ {savings.toLocaleString()}
            </span>
          )}
        </div>
        <div className="text-xs text-[var(--color-text-secondary)] mt-1">
          Inclusive of VAT · Free installation in Dhaka
        </div>
        <div className="flex gap-[6px] mt-2 flex-wrap">
          <span className="text-xs border-[0.5px] border-[var(--color-border-secondary)] rounded px-2 py-[3px] text-[var(--color-text-secondary)]">
            2–4 units: −8%
          </span>
          <span className="text-xs border-[0.5px] border-brand-teal rounded px-2 py-[3px] text-brand-teal bg-brand-teal-tint">
            5–9 units: −15%
          </span>
          <span className="text-xs border-[0.5px] border-[var(--color-border-secondary)] rounded px-2 py-[3px] text-[var(--color-text-secondary)]">
            10+ units: −22%
          </span>
        </div>
      </div>

      {/* Stock Status */}
      <div className="flex items-center gap-[6px] mb-[14px]">
        <div className="w-[7px] h-[7px] rounded-full bg-[#639922] flex-shrink-0" />
        <span className="text-xs text-[var(--color-text-secondary)]">
          <strong className="text-[var(--color-text-primary)]">In stock</strong> — ships within 24 hr from Dhaka warehouse
        </span>
      </div>

      {/* Connectivity Variant */}
      <div className="mb-[14px]">
        <div className="text-xs text-[var(--color-text-secondary)] mb-[6px]">Connectivity option</div>
        <div className="flex gap-[6px] flex-wrap">
          <button
            onClick={() => setSelectedConnectivity('usb-lan')}
            className={`px-3 py-[5px] rounded-md border-[0.5px] text-xs cursor-pointer ${
              selectedConnectivity === 'usb-lan'
                ? 'border-brand-navy bg-brand-navy text-white border-[1.5px]'
                : 'border-[var(--color-border-secondary)] text-[var(--color-text-primary)]'
            }`}
          >
            USB + LAN
          </button>
          <button
            onClick={() => setSelectedConnectivity('usb-lan-wifi')}
            className={`px-3 py-[5px] rounded-md border-[0.5px] text-xs cursor-pointer ${
              selectedConnectivity === 'usb-lan-wifi'
                ? 'border-brand-navy bg-brand-navy text-white border-[1.5px]'
                : 'border-[var(--color-border-secondary)] text-[var(--color-text-primary)]'
            }`}
          >
            USB + LAN + Wi-Fi (+৳ 4,000)
          </button>
        </div>
      </div>

      {/* Warranty Variant */}
      <div className="mb-[14px]">
        <div className="text-xs text-[var(--color-text-secondary)] mb-[6px]">Warranty</div>
        <div className="flex gap-[6px] flex-wrap">
          {['1-year', '2-year', 'amc'].map((warranty) => (
            <button
              key={warranty}
              onClick={() => setSelectedWarranty(warranty)}
              className={`px-3 py-[5px] rounded-md border-[0.5px] text-xs cursor-pointer ${
                selectedWarranty === warranty
                  ? 'border-brand-navy bg-brand-navy text-white border-[1.5px]'
                  : 'border-[var(--color-border-secondary)] text-[var(--color-text-primary)]'
              }`}
            >
              {warranty === '1-year' && '1-year standard'}
              {warranty === '2-year' && '2-year extended (+৳ 8,000)'}
              {warranty === 'amc' && 'AMC contract'}
            </button>
          ))}
        </div>
      </div>

      {/* Quantity */}
      <div className="flex items-center gap-3 mb-4">
        <span className="text-xs text-[var(--color-text-secondary)]">Quantity</span>
        <div className="flex items-center border-[0.5px] border-[var(--color-border-secondary)] rounded-md overflow-hidden">
          <button
            onClick={() => setQuantity(Math.max(1, quantity - 1))}
            className="w-11 h-11 bg-[var(--color-background-secondary)] border-none cursor-pointer text-base flex items-center justify-center text-[var(--color-text-primary)]"
          >
            −
          </button>
          <div className="w-14 text-center text-sm font-medium border-l-[0.5px] border-r-[0.5px] border-[var(--color-border-tertiary)] h-11 leading-[44px]">
            {quantity}
          </div>
          <button
            onClick={() => setQuantity(quantity + 1)}
            className="w-11 h-11 bg-[var(--color-background-secondary)] border-none cursor-pointer text-base flex items-center justify-center text-[var(--color-text-primary)]"
          >
            +
          </button>
        </div>
        <span className="text-xs text-[var(--color-text-secondary)]">Min. order: 1 unit</span>
      </div>

      {/* CTA Buttons */}
      <div className="flex gap-2 mb-[14px]">
        <button 
          onClick={handleAddToCart}
          disabled={addingToCart}
          aria-label="Add to cart"
          className="flex-[2] bg-brand-navy text-white border-none px-3 py-3 rounded-lg text-sm font-medium cursor-pointer font-[family-name:var(--font-plus-jakarta)] hover:bg-[var(--color-brand-navy-hover)] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {addingToCart ? (
            <>
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
              </svg>
              Adding...
            </>
          ) : 'Add to cart'}
        </button>
        <button 
          onClick={handleToggleWishlist}
          disabled={togglingWishlist}
          aria-label={inWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`w-[42px] h-[42px] rounded-lg border-[0.5px] flex items-center justify-center cursor-pointer transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
            inWishlist 
              ? 'border-danger bg-[var(--color-status-danger-tint)]' 
              : 'border-[var(--color-border-secondary)] bg-transparent hover:bg-[var(--color-background-tertiary)]'
          }`}
        >
          {togglingWishlist ? (
            <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill={inWishlist ? 'var(--color-status-danger)' : 'none'} stroke={inWishlist ? 'var(--color-status-danger)' : 'currentColor'} strokeWidth="1.5">
              <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"/>
            </svg>
          )}
        </button>
      </div>

      <button className="w-full bg-transparent text-brand-navy border-[0.5px] border-brand-navy px-[10px] py-[10px] rounded-lg text-sm cursor-pointer font-[family-name:var(--font-plus-jakarta)] font-medium mb-[14px]">
        Request formal quotation (B2B)
      </button>

      <button 
        onClick={handleWhatsAppClick}
        className="w-full bg-[#25D366] hover:bg-[#20BA5A] text-white border-none px-[10px] py-[10px] rounded-lg text-sm font-semibold cursor-pointer font-[family-name:var(--font-plus-jakarta)] mb-[14px] flex items-center justify-center gap-[6px] transition-all duration-300 transform hover:scale-[1.02] hover:shadow-lg"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="white">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/>
          <path d="M11.999 2C6.477 2 2 6.477 2 12c0 1.99.583 3.842 1.59 5.399L2 22l4.74-1.556A9.953 9.953 0 0012 22c5.523 0 10-4.477 10-10S17.523 2 11.999 2zm.001 18a7.965 7.965 0 01-4.184-1.186l-.299-.178-3.104 1.019 1.044-3.018-.197-.312A7.996 7.996 0 014 12c0-4.411 3.588-8 8-8s8 3.589 8 8c0 4.412-3.589 8-8 8z"/>
        </svg>
        Ask on WhatsApp
      </button>

      {/* Delivery Info */}
      <div className="bg-[var(--color-background-secondary)] rounded-lg p-3 mb-[14px]">
        {[
          { icon: 'truck', text: <><strong>Free delivery</strong> — Dhaka metro area</> },
          { icon: 'clock', text: <>Order before <strong>12:00 PM</strong> — same-day dispatch</> },
          { icon: 'shield', text: <><strong>Free installation</strong> included (Dhaka)</> },
          { icon: 'refresh', text: <><strong>30-day</strong> return & replacement policy</> }
        ].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2 py-[5px] border-b-[0.5px] border-[var(--color-border-tertiary)] last:border-b-0">
            <div className="w-6 h-6 rounded-sm bg-[var(--color-background-primary)] flex items-center justify-center flex-shrink-0">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                {item.icon === 'truck' && <><rect x="1" y="3" width="15" height="13"/><path d="M16 8h4l3 3v5h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></>}
                {item.icon === 'clock' && <><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></>}
                {item.icon === 'shield' && <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>}
                {item.icon === 'refresh' && <><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 11-2.12-9.36L23 10"/></>}
              </svg>
            </div>
            <div className="text-xs text-[var(--color-text-secondary)]">{item.text}</div>
          </div>
        ))}
      </div>

      {/* Trust Icons */}
      <div className="flex gap-2 flex-wrap">
        {['CE Certified', 'ISO 13485', 'DGDA Cleared', '24/7 Support'].map((trust, idx) => (
          <div key={idx} className="flex items-center gap-1 text-xs text-[var(--color-text-secondary)] bg-[var(--color-background-secondary)] px-2 py-1 rounded-sm">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {trust}
          </div>
        ))}
      </div>
    </div>
  );
}
