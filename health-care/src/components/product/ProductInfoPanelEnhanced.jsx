"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { CONTACT } from '@/constants/api';
import SizeSelector from './SizeSelector';
import { getProductPriceDisplay, getFlashDealDisplay } from '@/utils/pricing';
import { 
  FaShoppingCart, 
  FaWhatsapp, 
  FaFacebookF, 
  FaTwitter, 
  FaLink,
  FaTruck,
  FaHeadset,
  FaShieldAlt,
  FaCreditCard,
  FaCheck,
  FaMinus,
  FaPlus,
  FaBolt,
  FaAward,
  FaTools,
  FaFileInvoiceDollar
} from 'react-icons/fa';

/**
 * World-Class Enhanced Product Info Panel
 * Features:
 * - Prominent pricing with savings
 * - Stock indicator with urgency
 * - Trust signals row
 * - Share buttons
 * - Better quantity selector
 * - Size selector for products with size variants
 * - Engaging CTA buttons
 */
export default function ProductInfoPanelEnhanced({ 
  product, 
  quantity, 
  setQuantity,
  selectedSize,
  onSizeChange 
}) {
  const router = useRouter();
  const { addToCart } = useCart();
  const { user } = useAuth();
  const [addingToCart, setAddingToCart] = useState(false);
  const [copied, setCopied] = useState(false);

  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
  const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;
  const category = typeof product.category === 'object' ? product.category : null;
  
  // Determine stock based on size selection
  const productStock = selectedSize ? selectedSize.stock : product.stock;
  const inStock = productStock > 0;
  const lowStock = productStock > 0 && productStock < 10;
  
  // Calculate B2B pricing
  const priceDisplay = getProductPriceDisplay(product, user, category);

  // Active "Deal of the Day" pricing — beats everything except a better price
  // the customer already qualifies for; server charges this same price.
  const flashDeal = getFlashDealDisplay(product, priceDisplay);
  const productForCart = flashDeal ? { ...product, price: flashDeal.finalPrice } : product;

  // Calculate final price with size adjustment
  const basePrice = flashDeal ? flashDeal.finalPrice : priceDisplay.price;
  const sizeAdjustment = selectedSize?.priceAdjustment || 0;
  const finalPrice = basePrice + sizeAdjustment;

  // Flash-deal strikethrough is anchored to the best non-deal price
  const hasFlashDiscount = !!flashDeal;
  
  // For B2B users showing discount from original price
  const hasB2BDiscount = !hasFlashDiscount && priceDisplay.isB2BPrice && priceDisplay.savings > 0;
  
  // For regular discount from oldPrice
  const hasRegularDiscount = !hasFlashDiscount && !priceDisplay.isB2BPrice && product.oldPrice > 0 && product.oldPrice > finalPrice;
  
  const displayOldPrice = hasFlashDiscount
    ? priceDisplay.price
    : hasB2BDiscount
      ? priceDisplay.originalPrice
      : (hasRegularDiscount ? product.oldPrice : null);
  const savings = hasFlashDiscount
    ? Math.max(0, (Number(priceDisplay.price) || 0) - flashDeal.finalPrice)
    : hasB2BDiscount
      ? priceDisplay.savings
      : (hasRegularDiscount ? product.oldPrice - finalPrice : 0);
  const discountPercent = hasFlashDiscount
    ? (flashDeal.discountPct || (priceDisplay.price > 0 ? Math.round((savings / priceDisplay.price) * 100) : 0))
    : hasB2BDiscount 
      ? priceDisplay.discountPct 
      : (hasRegularDiscount ? Math.round((savings / product.oldPrice) * 100) : 0);
  
  const hasDiscount = hasFlashDiscount || hasB2BDiscount || hasRegularDiscount;

  // Products without a published price get a WhatsApp price-request CTA
  const unpriced = finalPrice <= 0;
  const waPriceMsg = encodeURIComponent(
    `Hi MediportBD, I'd like to know the price of ${product.name}${product.sku ? ` (SKU: ${product.sku})` : ''}.`
  );
  const waPriceLink = `https://wa.me/${CONTACT.whatsapp}?text=${waPriceMsg}`;
  const waAmcMsg = encodeURIComponent(
    `Hi MediportBD, I'd like an Annual Maintenance Contract (AMC) quote for ${product.name}${product.sku ? ` (SKU: ${product.sku})` : ''}.`
  );
  const waAmcLink = `https://wa.me/${CONTACT.whatsapp}?text=${waAmcMsg}`;

  const handleAddToCart = async () => {
    setAddingToCart(true);
    await addToCart(productForCart, quantity, { size: selectedSize });
    setTimeout(() => setAddingToCart(false), 1500);
  };

  const handleBuyNow = () => {
    addToCart(productForCart, quantity, { size: selectedSize });
    router.push('/cart');
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    const text = `Check out ${product.name} on MediportBD`;

    switch (platform) {
      case 'whatsapp':
        window.open(`https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'copy':
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        break;
    }
  };

  return (
    <div className="space-y-2">
      {/* Brand & Category - Compact */}
      <div className="flex items-center gap-1.5 flex-wrap">
        {brandName && (
          <span className="px-2 py-0.5 bg-blue-50 text-blue-700 rounded-full text-[11px] font-medium hover:bg-blue-100 transition-colors cursor-pointer">
            {brandName}
          </span>
        )}
        {categoryName && (
          <span className="px-2 py-0.5 bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)] rounded-full text-[11px] font-medium">
            {categoryName}
          </span>
        )}
        {product.sku && (
          <span className="px-2 py-0.5 bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] rounded-full text-[10px] font-mono">
            SKU: {product.sku}
          </span>
        )}
      </div>

      {/* Product Name - Compact */}
      <h1 className="text-lg md:text-xl font-semibold text-[var(--color-text-primary)] leading-tight">
        {product.name}
      </h1>

      {/* Stock Status - Compact */}
      <div className="flex items-center gap-2">
        {inStock ? (
          <>
            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md ${
              lowStock ? 'bg-orange-50 text-orange-700' : 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]'
            }`}>
              <FaCheck size={12} />
              <span className="text-[11px] font-semibold">
                {lowStock ? `Only ${product.stock} left!` : 'In Stock'}
              </span>
            </div>
            {lowStock && (
              <span className="flex items-center gap-1 text-orange-600 text-[11px] font-medium animate-pulse">
                <FaBolt size={10} />
                Order soon!
              </span>
            )}
          </>
        ) : (
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]">
            <span className="text-[11px] font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Pricing - Compact */}
      <div className="bg-gradient-to-br from-blue-50 to-brand-teal-tint rounded-lg p-2.5 border border-blue-100">
        {hasDiscount && displayOldPrice > 0 && (
          <div className="flex items-center gap-1.5 mb-1">
            <span className="text-sm text-[var(--color-text-secondary)] line-through">
              ৳{displayOldPrice?.toLocaleString()}
            </span>
            <span className={`px-2 py-0.5 ${hasFlashDiscount ? 'bg-orange-500' : hasB2BDiscount ? 'bg-purple-500' : 'bg-[var(--color-status-danger-tint)]'} text-white rounded-full text-[10px] font-semibold`}>
              {hasFlashDiscount ? `Flash Deal -${discountPercent}%` : hasB2BDiscount ? `B2B ${discountPercent}%` : `Save ${discountPercent}%`}
            </span>
          </div>
        )}
        
        <div className="flex items-baseline gap-1.5 mb-1">
          <span className="text-2xl font-bold text-[var(--color-text-primary)]">
            {finalPrice > 0 ? `৳${finalPrice?.toLocaleString()}` : 'Contact for Price'}
          </span>
          {hasDiscount && savings > 0 && (
            <span className={`${hasFlashDiscount ? 'text-orange-600' : hasB2BDiscount ? 'text-purple-600' : 'text-[var(--color-status-success)]'} text-sm font-semibold`}>
              -৳{savings.toLocaleString()}
            </span>
          )}
        </div>

        {/* B2B Badge - Compact */}
        {priceDisplay.isB2BPrice && (
          <div className="flex items-center gap-1.5 mb-0.5">
            <span className="inline-flex items-center gap-1 text-[10px] text-purple-700 font-semibold bg-purple-100 px-2 py-0.5 rounded-full">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z"/>
              </svg>
              B2B Price Applied
            </span>
          </div>
        )}

        {finalPrice > 0 && !priceDisplay.isB2BPrice && (
          <p className="text-[10px] text-[var(--color-text-secondary)]">
            B2B pricing available for bulk orders (8-30% off)
          </p>
        )}
      </div>

      {/* Trust Signals */}
      <div className="grid grid-cols-2 gap-2.5">
        <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-[var(--color-border-primary)] hover:border-brand-teal hover:shadow-md transition-all">
          <div className="w-9 h-9 rounded-full bg-[var(--color-status-success-tint)] flex items-center justify-center flex-shrink-0">
            <FaTruck className="text-[var(--color-status-success)]" size={16} />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)]">Free Delivery</div>
            <div className="text-xs font-semibold text-[var(--color-text-primary)]">Orders &gt; ৳50k</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-[var(--color-border-primary)] hover:border-brand-teal hover:shadow-md transition-all">
          <div className="w-9 h-9 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FaHeadset className="text-blue-600" size={16} />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)]">24/7 Support</div>
            <div className="text-xs font-semibold text-[var(--color-text-primary)]">Expert Help</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-[var(--color-border-primary)] hover:border-brand-teal hover:shadow-md transition-all">
          <div className="w-9 h-9 rounded-full bg-brand-teal-tint flex items-center justify-center flex-shrink-0">
            <FaAward className="text-brand-teal" size={16} />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)]">DGDA Certified</div>
            <div className="text-xs font-semibold text-[var(--color-text-primary)]">Authentic</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-2.5 bg-white rounded-lg border border-[var(--color-border-primary)] hover:border-brand-teal hover:shadow-md transition-all">
          <div className="w-9 h-9 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <FaCreditCard className="text-purple-600" size={16} />
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)]">Secure Payment</div>
            <div className="text-xs font-semibold text-[var(--color-text-primary)]">SSL Protected</div>
          </div>
        </div>
      </div>

      {/* Size Selector */}
      {product.variants?.sizes && product.variants.sizes.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-[var(--color-border-primary)]">
          <SizeSelector
            sizes={product.variants.sizes}
            selectedSize={selectedSize}
            onSizeChange={onSizeChange}
          />
        </div>
      )}

      {/* Quantity Selector */}
      {inStock && (
        <div>
          <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-4">
            <div className="flex items-center border-2 border-[var(--color-border-primary)] rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-12 h-12 flex items-center justify-center bg-[var(--color-background-secondary)] hover:bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease quantity"
              >
                <FaMinus size={14} />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(productStock, parseInt(e.target.value) || 1)))}
                className="w-16 h-12 text-center text-lg font-semibold text-[var(--color-text-primary)] border-none focus:outline-none"
                min="1"
                max={productStock}
              />
              <button
                onClick={() => setQuantity(Math.min(productStock, quantity + 1))}
                disabled={quantity >= productStock}
                className="w-12 h-12 flex items-center justify-center bg-[var(--color-background-secondary)] hover:bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase quantity"
              >
                <FaPlus size={14} />
              </button>
            </div>
            {productStock && (
              <span className="text-sm text-[var(--color-text-secondary)]">
                {productStock} available
              </span>
            )}
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="space-y-2.5">
        {unpriced ? (
          <>
            <a
              href={waPriceLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3.5 px-6 bg-gradient-to-r from-[var(--color-status-success)] to-[var(--color-status-success)] hover:from-[var(--color-status-success-tint)] hover:to-[var(--color-status-success)] text-white rounded-xl font-semibold text-base transition-all duration-300 hover:shadow-xl flex items-center justify-center gap-2.5"
            >
              <FaWhatsapp size={20} />
              <span>Ask Price on WhatsApp</span>
            </a>
            <p className="text-xs text-[var(--color-text-secondary)] text-center">
              Get the best price — we usually reply within minutes (Mon–Sat, 9am–9pm)
            </p>
          </>
        ) : inStock ? (
          <>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full py-3.5 px-6 bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white rounded-xl font-semibold text-base transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-2.5 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              {addingToCart ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding to Cart...</span>
                </>
              ) : (
                <>
                  <FaShoppingCart size={18} />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              className="w-full py-3.5 px-6 bg-brand-navy hover:bg-[var(--color-brand-navy-hover)] text-white rounded-xl font-semibold text-base transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-2.5"
            >
              <FaBolt size={16} />
              <span>Buy Now</span>
            </button>
          </>
        ) : (
          <button
            disabled
            className="w-full py-3.5 px-6 bg-[var(--color-background-muted)] text-[var(--color-text-secondary)] rounded-xl font-semibold text-base cursor-not-allowed"
          >
            Out of Stock
          </button>
        )}
      </div>

      {/* Share Buttons */}
      <div className="pt-4 border-t border-[var(--color-border-primary)]">
        <div className="text-sm font-semibold text-[var(--color-text-primary)] mb-3">Share this product:</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleShare('whatsapp')}
            className="w-10 h-10 rounded-full bg-[var(--color-status-success-tint)] hover:bg-success text-white flex items-center justify-center transition-all hover:scale-110"
            aria-label="Share on WhatsApp"
          >
            <FaWhatsapp size={18} />
          </button>
          <button
            onClick={() => handleShare('facebook')}
            className="w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center transition-all hover:scale-110"
            aria-label="Share on Facebook"
          >
            <FaFacebookF size={16} />
          </button>
          <button
            onClick={() => handleShare('twitter')}
            className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-600 text-white flex items-center justify-center transition-all hover:scale-110"
            aria-label="Share on Twitter"
          >
            <FaTwitter size={16} />
          </button>
          <button
            onClick={() => handleShare('copy')}
            className={`w-10 h-10 rounded-full ${
              copied ? 'bg-[var(--color-status-success-tint)]' : 'bg-[var(--color-background-muted)] hover:bg-[var(--color-background-muted)]'
            } text-[var(--color-text-primary)] flex items-center justify-center transition-all hover:scale-110 relative`}
            aria-label="Copy link"
          >
            {copied ? (
              <FaCheck size={16} className="text-white" />
            ) : (
              <FaLink size={14} />
            )}
          </button>
          {copied && (
            <span className="text-sm text-[var(--color-status-success)] font-medium animate-fadeIn">
              Link copied!
            </span>
          )}
        </div>
      </div>

      {/* Ask Product Question via WhatsApp */}
      <div className="pt-3 border-t border-[var(--color-border-primary)]">
        <button
          onClick={() => {
            const message = encodeURIComponent(
              `Hi! I have a question about:\n\n${product.name}\n\nPrice: ৳${product.price?.toLocaleString()}\n\nQuestion: `
            );
            window.open(`https://wa.me/${CONTACT.whatsapp}?text=${message}`, '_blank');
          }}
          className="w-full py-2.5 px-4 bg-gradient-to-r from-[var(--color-status-success-tint)] to-[var(--color-status-success)] hover:from-[var(--color-status-success)] hover:to-[var(--color-status-success)] text-white rounded-xl font-semibold text-sm transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2.5"
        >
          <FaWhatsapp size={18} />
          <span>Ask a Question on WhatsApp</span>
        </button>
        <p className="text-xs text-[var(--color-text-secondary)] text-center mt-1.5">
          Get instant answers about specifications, pricing, and availability
        </p>
      </div>

      {/* Request formal quotation */}
      <button
        onClick={() => router.push(`/quotes/request?product=${product._id}&qty=${quantity}`)}
        className="w-full py-2.5 px-4 border-2 border-dashed border-brand-teal/40 hover:border-brand-teal text-brand-teal rounded-xl font-semibold text-sm transition-all duration-300 flex items-center justify-center gap-2.5"
      >
        <FaFileInvoiceDollar size={16} />
        <span>Request a Formal Quotation</span>
      </button>

      {/* Warranty Badge */}
      {product.warranty && (
        <div className="flex items-center gap-3 p-4 bg-[var(--color-status-warning-tint)] border border-[var(--color-status-warning-tint)] rounded-xl">
          <div className="w-12 h-12 rounded-full bg-[var(--color-status-warning-tint)] flex items-center justify-center flex-shrink-0">
            <FaShieldAlt className="text-[var(--color-status-warning)]" size={20} />
          </div>
          <div>
            <div className="text-sm font-semibold text-[var(--color-text-primary)]">Warranty Included</div>
            <div className="text-sm text-[var(--color-text-secondary)]">{product.warranty} manufacturer warranty</div>
          </div>
        </div>
      )}

      {/* Annual Maintenance Contract (AMC) — shown when the product is flagged */}
      {product.hasAMC && (
        <div className="flex items-center gap-3 p-4 bg-purple-50 border border-purple-200 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <FaTools className="text-purple-600" size={20} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-[var(--color-text-primary)]">AMC Available</div>
            <div className="text-sm text-[var(--color-text-secondary)]">Annual maintenance contract & priority support</div>
          </div>
          <a
            href={waAmcLink}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 px-3.5 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-xs font-semibold transition-colors"
          >
            Request Quote
          </a>
        </div>
      )}
    </div>
  );
}
