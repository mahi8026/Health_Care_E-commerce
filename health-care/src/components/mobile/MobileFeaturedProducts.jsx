export default function MobileFeaturedProducts() {
  const products = [
    {
      id: 1,
      name: 'Siemens ECG 12-lead',
      brand: 'Siemens',
      price: 95000,
      oldPrice: 110000,
      badge: 'sale',
      icon: '📊'
    },
    {
      id: 2,
      name: 'Roche HbA1c kit',
      brand: 'Roche',
      price: 8500,
      badge: 'new',
      icon: '🧪'
    },
    {
      id: 3,
      name: 'Abbott Troponin I',
      brand: 'Abbott',
      price: 22000,
      icon: '💉'
    }
  ];

  return (
    <div className="px-4 py-4 bg-[var(--color-background-secondary)]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
          Featured products
        </div>
        <button className="text-[10px] text-[#0E8A6E] font-medium">
          View all →
        </button>
      </div>

      <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
        {products.map(product => (
          <div
            key={product.id}
            className="flex-shrink-0 w-[140px] bg-white rounded-lg p-3 border-[0.5px] border-[var(--color-border-tertiary)]"
          >
            {/* Badge */}
            {product.badge && (
              <div className="flex justify-end mb-2">
                <span className={`text-[8px] px-2 py-[2px] rounded font-medium ${
                  product.badge === 'sale'
                    ? 'bg-[#FCEBEB] text-[#791F1F]'
                    : 'bg-[#E1F5EE] text-[#085041]'
                }`}>
                  {product.badge === 'sale' ? '🔥 SALE' : '✨ NEW'}
                </span>
              </div>
            )}

            {/* Icon */}
            <div className="w-12 h-12 bg-[var(--color-background-tertiary)] rounded-lg flex items-center justify-center text-[24px] mx-auto mb-2">
              {product.icon}
            </div>

            {/* Info */}
            <div className="text-[11px] font-medium mb-1 font-[family-name:var(--font-plus-jakarta)] line-clamp-2 text-center">
              {product.name}
            </div>
            <div className="text-[9px] text-[var(--color-text-secondary)] mb-2 text-center">
              {product.brand}
            </div>

            {/* Price */}
            <div className="text-center mb-2">
              <div className="text-[13px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
                ৳{product.price.toLocaleString()}
              </div>
              {product.oldPrice && (
                <div className="text-[9px] text-[var(--color-text-tertiary)] line-through">
                  ৳{product.oldPrice.toLocaleString()}
                </div>
              )}
            </div>

            {/* Button */}
            <button className="w-full py-[6px] bg-[#0B2545] text-white rounded text-[10px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
              Add to cart
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
