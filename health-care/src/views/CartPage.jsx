"use client";

import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import Button from '@/components/ui/Button';

export default function CartPage({ onCheckout, onContinueShopping }) {
  const { cart, updateQuantity, removeFromCart, getCartTotal, getCartCount } = useCart();
  const { user, isB2BCustomer } = useAuth();

  const subtotal = getCartTotal();
  const discount = isB2BCustomer() ? subtotal * 0.08 : 0;
  const deliveryFee = cart.length > 0 ? 150 : 0;
  const total = subtotal - discount + deliveryFee;

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
            onClick={() => onContinueShopping && onContinueShopping()}
          >
            Browse Products
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-background-secondary)] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-[24px] font-semibold mb-2 font-[family-name:var(--font-lora)]">
            Shopping Cart
          </h1>
          <p className="text-[13px] text-[var(--color-text-secondary)]">
            {getCartCount()} {getCartCount() === 1 ? 'item' : 'items'} in your cart
          </p>
        </div>

        <div className="grid grid-cols-[1fr_380px] gap-6">
          {/* Cart Items */}
          <div className="space-y-4">
            {cart.map((item) => (
              <div
                key={item.id}
                className="bg-white rounded-lg p-5 border-[0.5px] border-[var(--color-border-tertiary)]"
              >
                <div className="flex gap-4">
                  {/* Product Icon */}
                  <div className="w-20 h-20 bg-[var(--color-background-tertiary)] rounded-lg flex items-center justify-center text-[32px] flex-shrink-0">
                    {getItemIcon(item.name)}
                  </div>

                  {/* Product Info */}
                  <div className="flex-1">
                    <h3 className="text-[14px] font-semibold mb-1 font-[family-name:var(--font-plus-jakarta)]">
                      {item.name}
                    </h3>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mb-2">
                      {item.brand}
                    </p>
                    {item.sku && (
                      <p className="text-[10px] text-[var(--color-text-tertiary)]">
                        SKU: {item.sku}
                      </p>
                    )}
                  </div>

                  {/* Price & Actions */}
                  <div className="text-right">
                    <div className="text-[16px] font-bold text-[#0B2545] mb-3 font-[family-name:var(--font-plus-jakarta)]">
                      ৳{(item.price * item.quantity).toLocaleString()}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] mb-3">
                      ৳{item.price.toLocaleString()} each
                    </div>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 mb-3">
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        className="w-8 h-8 border-[0.5px] border-[var(--color-border-secondary)] rounded bg-white hover:bg-[var(--color-background-tertiary)] flex items-center justify-center"
                      >
                        −
                      </button>
                      <span className="w-10 text-center text-[13px] font-medium">
                        {item.quantity}
                      </span>
                      <button
                        onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        className="w-8 h-8 border-[0.5px] border-[var(--color-border-secondary)] rounded bg-white hover:bg-[var(--color-background-tertiary)] flex items-center justify-center"
                      >
                        +
                      </button>
                    </div>

                    {/* Remove Button */}
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-[11px] text-[#E24B4A] hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Summary */}
          <div>
            <div className="bg-white rounded-lg p-6 border-[0.5px] border-[var(--color-border-tertiary)] sticky top-6">
              <h3 className="text-[16px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
                Order Summary
              </h3>

              <div className="space-y-3 mb-4 pb-4 border-b-[0.5px] border-[var(--color-border-tertiary)]">
                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--color-text-secondary)]">Subtotal</span>
                  <span className="font-medium">৳{subtotal.toLocaleString()}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-[13px]">
                    <span className="text-[#0E8A6E]">B2B Discount (8%)</span>
                    <span className="text-[#0E8A6E] font-medium">
                      −৳{discount.toLocaleString()}
                    </span>
                  </div>
                )}

                <div className="flex justify-between text-[13px]">
                  <span className="text-[var(--color-text-secondary)]">Delivery Fee</span>
                  <span className="font-medium">৳{deliveryFee}</span>
                </div>
              </div>

              <div className="flex justify-between items-center mb-6">
                <span className="text-[16px] font-semibold">Total</span>
                <span className="text-[20px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
                  ৳{total.toLocaleString()}
                </span>
              </div>

              <Button
                variant="primary"
                fullWidth
                onClick={onCheckout}
                className="mb-3"
              >
                Proceed to Checkout
              </Button>

              <Button 
                variant="outline" 
                fullWidth
                onClick={() => onContinueShopping && onContinueShopping()}
              >
                Continue Shopping
              </Button>

              {/* Info */}
              {isB2BCustomer() && (
                <div className="mt-4 p-3 bg-[#E1F5EE] rounded-lg">
                  <div className="text-[11px] text-[#085041]">
                    <div className="font-medium mb-1">🏢 B2B Benefits Applied</div>
                    <div>You're saving ৳{discount.toLocaleString()} with your B2B discount!</div>
                  </div>
                </div>
              )}

              <div className="mt-4 p-3 bg-[#E6F1FB] rounded-lg">
                <div className="text-[11px] text-[#0C447C]">
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
