"use client";

import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

export default function CartPage({ onCheckout, onContinueShopping }) {
  const router = useRouter();
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount } = useCart();
  const { user, isB2BCustomer } = useAuth();

  const subtotal = getCartTotal();
  const discount = isB2BCustomer() ? subtotal * 0.08 : 0;
  const deliveryFee = cart.length > 0 ? 150 : 0;
  const total = subtotal - discount + deliveryFee;

  // Use prop callbacks if provided (SPA mode), otherwise use router (App Router mode)
  const handleCheckout = onCheckout || (() => router.push('/checkout'));
  const handleContinueShopping = onContinueShopping || (() => router.push('/products'));

  const getItemIcon = (name) => {
    if (name.includes('ECG')) return '📊';
    if (name.includes('reagent') || name.includes('Reagent')) return '🧪';
    if (name.includes('cable') || name.includes('Cable')) return '🔌';
    return '📦';
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-[var(--color-background-secondary)] flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-[64px] mb-4">🛒</div>
          <h2 className="text-[20px] font-semibold mb-2 font-[family-name:var(--font-lora)]">
            Your cart is empty
          </h2>
          <p className="text-[13px] text-[var(--color-text-secondary)] mb-6">
            Add some products to your cart to get started
          </p>
          <Button 
            variant="primary"
            onClick={handleContinueShopping}
          >
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background-secondary)] p-4 md:p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-4 md:mb-6">
          <h1 className="text-[20px] md:text-[24px] font-semibold mb-2 font-[family-name:var(--font-lora)]">
            Shopping Cart
          </h1>
          <p className="text-[12px] md:text-[13px] text-[var(--color-text-secondary)]">
            {getCartCount()} {getCartCount() === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_380px] gap-4 md:gap-6">
          {/* Cart Items */}
          <div className="space-y-3 md:space-y-4">
            {cart.map((item, index) => {
              const itemKey = item.id || item._id || `cart-item-${index}`;
              return (
                <div
                  key={itemKey}
                  className="bg-white rounded-lg p-3 md:p-5 border-[0.5px] border-[var(--color-border-tertiary)]"
                >
                <div className="flex gap-3 md:gap-4">
                  {/* Product Icon */}
                  <div className="w-16 h-16 md:w-20 md:h-20 bg-[var(--color-background-tertiary)] rounded-lg flex items-center justify-center text-[28px] md:text-[32px] flex-shrink-0">
                    {getItemIcon(item.name)}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-[13px] md:text-[14px] font-semibold mb-1 font-[family-name:var(--font-plus-jakarta)] line-clamp-2">
                      {item.name}
                    </h3>
                    <p className="text-[10px] md:text-[11px] text-[var(--color-text-secondary)] mb-2">
                      {typeof item.brand === 'object' ? item.brand?.name : item.brand}
                    </p>
                    {item.sku && (
                      <p className="text-[9px] md:text-[10px] text-[var(--color-text-tertiary)]">
                        SKU: {item.sku}
                      </p>
                    )}
                    
                    {/* Mobile: Price and Quantity inline */}
                    <div className="md:hidden mt-2 flex items-center justify-between">
                      <div>
                        <div className="text-[15px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
                          ৳{(item.price * item.quantity).toLocaleString()}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-secondary)]">
                          ৳{item.price.toLocaleString()} each
                        </div>
                      </div>
                      
                      {/* Mobile Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id || item._id, item.quantity - 1)}
                          className="w-8 h-8 border-[0.5px] border-[var(--color-border-secondary)] rounded bg-white hover:bg-[var(--color-background-tertiary)] flex items-center justify-center text-[14px]"
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-[13px] font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id || item._id, item.quantity + 1)}
                          className="w-8 h-8 border-[0.5px] border-[var(--color-border-secondary)] rounded bg-white hover:bg-[var(--color-background-tertiary)] flex items-center justify-center text-[14px]"
                        >
                          +
                        </button>
                      </div>
                    </div>
                    
                    {/* Mobile Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id || item._id)}
                      className="md:hidden mt-2 text-[11px] text-[#E24B4A] hover:underline"
                    >
                      Remove
                    </button>
                  </div>

                  {/* Desktop: Price & Actions */}
                  <div className="hidden md:block text-right">
                    <div className="text-[16px] font-bold text-[#0B2545] mb-3 font-[family-name:var(--font-plus-jakarta)]">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] mb-3">
                      ৳{item.price.toLocaleString()} each
                    </div>

                    {/* Desktop Quantity Controls */}
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => updateQuantity(item.id || item._id, item.quantity - 1)}
                        className="w-8 h-8 border-[0.5px] border-[var(--color-border-secondary)] rounded bg-white hover:bg-[var(--color-background-tertiary)] flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-[13px] font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id || item._id, item.quantity + 1)}
                        className="w-8 h-8 border-[0.5px] border-[var(--color-border-secondary)] rounded bg-white hover:bg-[var(--color-background-tertiary)] flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    {/* Desktop Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id || item._id)}
                      className="text-[11px] text-[#E24B4A] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            );
            })}
          </div>

          {/* Order Summary */}
          <div className="md:sticky md:top-6">
            <div className="bg-white rounded-lg p-4 md:p-6 border-[0.5px] border-[var(--color-border-tertiary)]">
              <h3 className="text-[15px] md:text-[16px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
                Order Summary
              </h3>

              <div className="space-y-2 md:space-y-3 mb-4 pb-4 border-b-[0.5px] border-[var(--color-border-tertiary)]">
                <div className="flex justify-between text-[12px] md:text-[13px]">
                  <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                  <span className="font-medium">৳{subtotal.toLocaleString()}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-[12px] md:text-[13px]">
                    <span className="text-[#0E8A6E]">B2B Discount (8%)</span>
                    <span className="text-[#0E8A6E] font-medium">
                      −৳{discount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-[12px] md:text-[13px]">
                  <span className="text-[var(--color-text-secondary)]">Delivery Fee</span>
                  <span className="font-medium">৳{deliveryFee}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-4 md:mb-6">
                <span className="text-[15px] md:text-[16px] font-semibold">Total</span>
                <span className="text-[18px] md:text-[20px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
                  ৳{total.toLocaleString()}
                </span>
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={handleCheckout}
                className="mb-3 min-h-[48px]"
              >
                Proceed to Checkout
              </Button>

              <Button 
                variant="outline" 
                fullWidth
                onClick={handleContinueShopping}
                className="min-h-[48px]"
              >
                Continue Shopping
              </Button>

              {/* Info */}
              {isB2BCustomer() && (
                <div className="mt-4 p-3 bg-[#E1F5EE] rounded-lg">
                  <div className="text-[10px] md:text-[11px] text-[#085041]">
                    <div className="font-medium mb-1">🏢 B2B Benefits Applied</div>
                    <div>You're saving ৳{discount.toLocaleString()} with your B2B discount!</div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-[#E6F1FB] rounded-lg">
                <div className="text-[10px] md:text-[11px] text-[#0C447C]">
                  <div className="font-medium mb-1">🚚 Free Delivery</div>
                  <div>For orders above ৳50,000 in Dhaka metro area</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
