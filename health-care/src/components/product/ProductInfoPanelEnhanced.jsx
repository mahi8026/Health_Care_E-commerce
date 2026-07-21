"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { CONTACT } from '@/constants/api';
import SizeSelector from './SizeSelector';
import { getProductPriceDisplay } from '@/utils/pricing';
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
  FaAward
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
  
  // Calculate final price with size adjustment
  const basePrice = priceDisplay.price;
  const sizeAdjustment = selectedSize?.priceAdjustment || 0;
  const finalPrice = basePrice + sizeAdjustment;
  
  // For B2B users showing discount from original price
  const hasB2BDiscount = priceDisplay.isB2BPrice && priceDisplay.savings > 0;
  
  // For regular discount from oldPrice
  const hasRegularDiscount = !priceDisplay.isB2BPrice && product.oldPrice && product.oldPrice > finalPrice;
  
  const displayOldPrice = hasB2BDiscount ? priceDisplay.originalPrice : (hasRegularDiscount ? product.oldPrice : null);
  const savings = hasB2BDiscount ? priceDisplay.savings : (hasRegularDiscount ? product.oldPrice - finalPrice : 0);
  const discountPercent = hasB2BDiscount 
    ? priceDisplay.discountPct 
    : (hasRegularDiscount ? Math.round((savings / product.oldPrice) * 100) : 0);
  
  const hasDiscount = hasB2BDiscount || hasRegularDiscount;

  const handleAddToCart = async () => {
    setAddingToCart(true);
    await addToCart(product, quantity);
    setTimeout(() => setAddingToCart(false), 1500);
  };

  const handleBuyNow = () => {
    addToCart(product, quantity);
    router.push('/cart');
  };

  const handleShare = async (platform) => {
    const url = window.location.href;
    const text = `Check out ${product.name} on MedCore BD`;

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
    <div className="space-y-6">
      {/* Brand & Category */}
      <div className="flex items-center gap-2 flex-wrap">
        {brandName && (
          <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-full text-sm font-medium hover:bg-blue-100 transition-colors cursor-pointer">
            {brandName}
          </span>
        )}
        {categoryName && (
          <span className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm font-medium">
            {categoryName}
          </span>
        )}
        {product.sku && (
          <span className="px-3 py-1 bg-gray-50 text-gray-500 rounded-full text-xs font-mono">
            SKU: {product.sku}
          </span>
        )}
      </div>

      {/* Product Name */}
      <h1 className="text-2xl md:text-3xl font-bold text-gray-900 leading-tight">
        {product.name}
      </h1>

      {/* Stock Status */}
      <div className="flex items-center gap-3">
        {inStock ? (
          <>
            <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
              lowStock ? 'bg-orange-50 text-orange-700' : 'bg-green-50 text-green-700'
            }`}>
              <FaCheck size={14} />
              <span className="text-sm font-semibold">
                {lowStock ? `Only ${product.stock} left!` : 'In Stock'}
              </span>
            </div>
            {lowStock && (
              <span className="flex items-center gap-1 text-orange-600 text-sm font-medium animate-pulse">
                <FaBolt size={12} />
                Order soon!
              </span>
            )}
          </>
        ) : (
          <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 text-red-700">
            <span className="text-sm font-semibold">Out of Stock</span>
          </div>
        )}
      </div>

      {/* Pricing */}
      <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-2xl p-6 border border-blue-100">
        {hasDiscount && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg text-gray-500 line-through">
              ৳{displayOldPrice?.toLocaleString()}
            </span>
            <span className={`px-3 py-1 ${hasB2BDiscount ? 'bg-purple-500' : 'bg-red-500'} text-white rounded-full text-sm font-bold`}>
              {hasB2BDiscount ? 'B2B' : 'Save'} {discountPercent}%
            </span>
          </div>
        )}
        
        <div className="flex items-baseline gap-3 mb-2">
          <span className="text-4xl font-extrabold text-gray-900">
            {finalPrice > 0 ? `৳${finalPrice?.toLocaleString()}` : 'Contact for Price'}
          </span>
          {hasDiscount && (
            <span className={`${hasB2BDiscount ? 'text-purple-600' : 'text-green-600'} text-lg font-bold`}>
              -৳{savings.toLocaleString()}
            </span>
          )}
        </div>

        {/* B2B Badge */}
        {priceDisplay.isB2BPrice && (
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 text-sm text-purple-700 font-semibold bg-purple-100 px-3 py-1 rounded-full">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.5 3.8 10.7 10 12 6.2-1.3 10-6.5 10-12V7l-10-5z"/>
              </svg>
              B2B Price Applied
            </span>
          </div>
        )}

        {finalPrice > 0 && !priceDisplay.isB2BPrice && (
          <p className="text-sm text-gray-600">
            B2B pricing available for bulk orders (8-30% off)
          </p>
        )}
      </div>

      {/* Trust Signals */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#0E8A6E] hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
            <FaTruck className="text-green-600" size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-500">Free Delivery</div>
            <div className="text-sm font-semibold text-gray-900">Orders &gt; ৳50k</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#0E8A6E] hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
            <FaHeadset className="text-blue-600" size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-500">24/7 Support</div>
            <div className="text-sm font-semibold text-gray-900">Expert Help</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#0E8A6E] hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
            <FaAward className="text-teal-600" size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-500">DGDA Certified</div>
            <div className="text-sm font-semibold text-gray-900">Authentic</div>
          </div>
        </div>

        <div className="flex items-center gap-2 p-3 bg-white rounded-lg border border-gray-200 hover:border-[#0E8A6E] hover:shadow-md transition-all">
          <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
            <FaCreditCard className="text-purple-600" size={18} />
          </div>
          <div>
            <div className="text-xs text-gray-500">Secure Payment</div>
            <div className="text-sm font-semibold text-gray-900">SSL Protected</div>
          </div>
        </div>
      </div>

      {/* Size Selector */}
      {product.variants?.sizes && product.variants.sizes.length > 0 && (
        <div className="bg-white rounded-xl p-4 border border-gray-200">
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
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Quantity
          </label>
          <div className="flex items-center gap-4">
            <div className="flex items-center border-2 border-gray-300 rounded-xl overflow-hidden">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1}
                className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Decrease quantity"
              >
                <FaMinus size={14} />
              </button>
              <input
                type="number"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Math.min(productStock, parseInt(e.target.value) || 1)))}
                className="w-16 h-12 text-center text-lg font-bold text-gray-900 border-none focus:outline-none"
                min="1"
                max={productStock}
              />
              <button
                onClick={() => setQuantity(Math.min(productStock, quantity + 1))}
                disabled={quantity >= productStock}
                className="w-12 h-12 flex items-center justify-center bg-gray-50 hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Increase quantity"
              >
                <FaPlus size={14} />
              </button>
            </div>
            {productStock && (
              <span className="text-sm text-gray-500">
                {productStock} available
              </span>
            )}
          </div>
        </div>
      )}

      {/* CTA Buttons */}
      <div className="space-y-3">
        {inStock ? (
          <>
            <button
              onClick={handleAddToCart}
              disabled={addingToCart}
              className="w-full py-4 px-6 bg-[#0E8A6E] hover:bg-[#0c7a61] text-white rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] disabled:opacity-60 flex items-center justify-center gap-3 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-1000" />
              {addingToCart ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Adding to Cart...</span>
                </>
              ) : (
                <>
                  <FaShoppingCart size={20} />
                  <span>Add to Cart</span>
                </>
              )}
            </button>

            <button
              onClick={handleBuyNow}
              className="w-full py-4 px-6 bg-[#0B2545] hover:bg-[#0d2d52] text-white rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-xl hover:scale-[1.02] flex items-center justify-center gap-3"
            >
              <FaBolt size={18} />
              <span>Buy Now</span>
            </button>
          </>
        ) : (
          <button
            disabled
            className="w-full py-4 px-6 bg-gray-300 text-gray-500 rounded-xl font-bold text-lg cursor-not-allowed"
          >
            Out of Stock
          </button>
        )}
      </div>

      {/* Share Buttons */}
      <div className="pt-4 border-t border-gray-200">
        <div className="text-sm font-semibold text-gray-700 mb-3">Share this product:</div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleShare('whatsapp')}
            className="w-10 h-10 rounded-full bg-green-500 hover:bg-green-600 text-white flex items-center justify-center transition-all hover:scale-110"
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
              copied ? 'bg-green-500' : 'bg-gray-200 hover:bg-gray-300'
            } text-gray-700 flex items-center justify-center transition-all hover:scale-110 relative`}
            aria-label="Copy link"
          >
            {copied ? (
              <FaCheck size={16} className="text-white" />
            ) : (
              <FaLink size={14} />
            )}
          </button>
          {copied && (
            <span className="text-sm text-green-600 font-medium animate-fadeIn">
              Link copied!
            </span>
          )}
        </div>
      </div>

      {/* Ask Product Question via WhatsApp */}
      <div className="pt-4 border-t border-gray-200">
        <button
          onClick={() => {
            const message = encodeURIComponent(
              `Hi! I have a question about:\n\n${product.name}\n\nPrice: ৳${product.price?.toLocaleString()}\n\nQuestion: `
            );
            window.open(`https://wa.me/${CONTACT.whatsapp}?text=${message}`, '_blank');
          }}
          className="w-full py-3 px-4 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-xl font-semibold text-base transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-3"
        >
          <FaWhatsapp size={20} />
          <span>Ask a Question on WhatsApp</span>
        </button>
        <p className="text-xs text-gray-500 text-center mt-2">
          Get instant answers about specifications, pricing, and availability
        </p>
      </div>

      {/* Warranty Badge */}
      {product.warranty && (
        <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
          <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center flex-shrink-0">
            <FaShieldAlt className="text-yellow-600" size={20} />
          </div>
          <div>
            <div className="text-sm font-bold text-gray-900">Warranty Included</div>
            <div className="text-sm text-gray-600">{product.warranty} manufacturer warranty</div>
          </div>
        </div>
      )}
    </div>
  );
}
