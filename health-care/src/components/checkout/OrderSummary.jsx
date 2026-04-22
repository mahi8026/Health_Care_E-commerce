import { useState } from 'react';

export default function OrderSummary({ items }) {
  const [promoCode, setPromoCode] = useState('');
  const [appliedPromo, setAppliedPromo] = useState(null);

  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const b2bDiscount = subtotal * 0.08;
  const deliveryFee = 150;
  const promoDiscount = appliedPromo ? 500 : 0;
  const total = subtotal - b2bDiscount + deliveryFee - promoDiscount;

  const handleApplyPromo = () => {
    if (promoCode === 'FIRST500') {
      setAppliedPromo({ code: 'FIRST500', discount: 500 });
    }
  };

  const getItemIcon = (icon) => {
    const icons = {
      ecg: '📊',
      reagent: '🧪',
      cable: '🔌'
    };
    return icons[icon] || '📦';
  };

  return (
    <div>
      <h3 className="text-[14px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
        Order summary
      </h3>

      {/* Cart Items */}
      <div className="space-y-3 mb-4 pb-4 border-b-[0.5px] border-[var(--color-border-tertiary)]">
        {items.map((item) => (
          <div key={item.id} className="flex gap-3">
            <div className="w-12 h-12 bg-[var(--color-background-tertiary)] rounded-lg flex items-center justify-center text-xl flex-shrink-0">
              {getItemIcon(item.icon)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] font-medium mb-[2px] font-[family-name:var(--font-plus-jakarta)] line-clamp-1">
                {item.name}
              </div>
              <div className="text-[10px] text-[var(--color-text-secondary)] mb-1">
                {item.brand}
              </div>
              {item.variant && (
                <div className="text-[10px] text-[var(--color-text-tertiary)]">
                  {item.variant}
                  {item.warranty && ` · ${item.warranty}`}
                </div>
              )}
              {item.note && (
                <div className="text-[10px] text-[#0C447C] bg-[#E6F1FB] inline-block px-2 py-[2px] rounded mt-1">
                  {item.note}
                </div>
              )}
              <div className="flex items-center justify-between mt-2">
                <span className="text-[11px] text-[var(--color-text-secondary)]">
                  Qty: {item.quantity}
                </span>
                <span className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                  ৳{(item.price * item.quantity).toLocaleString()}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code */}
      <div className="mb-4">
        <label className="block text-[11px] text-[var(--color-text-secondary)] mb-2 font-[family-name:var(--font-plus-jakarta)]">
          Promo code
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            placeholder="Enter code"
            className="flex-1 px-3 py-[9px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:border-[#0E8A6E]"
          />
          <button
            onClick={handleApplyPromo}
            className="px-4 py-[9px] bg-[var(--color-background-tertiary)] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-medium font-[family-name:var(--font-plus-jakarta)] hover:bg-[var(--color-background-secondary)]"
          >
            Apply
          </button>
        </div>
        {appliedPromo && (
          <div className="mt-2 text-[11px] text-[#0E8A6E] flex items-center gap-1">
            ✓ Code "{appliedPromo.code}" applied
          </div>
        )}
      </div>

      {/* Price Breakdown */}
      <div className="space-y-2 mb-4 pb-4 border-b-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="flex justify-between text-[12px]">
          <span className="text-[var(--color-text-secondary)]">Subtotal</span>
          <span className="font-medium font-[family-name:var(--font-plus-jakarta)]">
            ৳{subtotal.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-[#0E8A6E]">B2B discount (8%)</span>
          <span className="text-[#0E8A6E] font-medium font-[family-name:var(--font-plus-jakarta)]">
            −৳{b2bDiscount.toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between text-[12px]">
          <span className="text-[var(--color-text-secondary)]">Delivery fee</span>
          <span className="font-medium font-[family-name:var(--font-plus-jakarta)]">
            ৳{deliveryFee}
          </span>
        </div>
        {promoDiscount > 0 && (
          <div className="flex justify-between text-[12px]">
            <span className="text-[#0E8A6E]">Promo discount</span>
            <span className="text-[#0E8A6E] font-medium font-[family-name:var(--font-plus-jakarta)]">
              −৳{promoDiscount}
            </span>
          </div>
        )}
      </div>

      {/* Total */}
      <div className="flex justify-between items-center mb-4">
        <span className="text-[14px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
          Total
        </span>
        <span className="text-[18px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
          ৳{total.toLocaleString()}
        </span>
      </div>

      {/* Info Box */}
      <div className="bg-[#E6F1FB] rounded-lg p-3 text-[11px] text-[#0C447C]">
        <div className="font-medium mb-1">💳 Secure checkout</div>
        <div>Your payment information is encrypted and secure.</div>
      </div>
    </div>
  );
}
