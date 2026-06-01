'use client';

import { useCompare } from '@/context/CompareContext';
import { useCart } from '@/context/CartContext';
import { useRouter } from 'next/navigation';

/**
 * Full-screen comparison modal — side-by-side product specs table.
 */
export default function CompareModal({ onClose }) {
  const { compareList, removeFromCompare, clearCompare } = useCompare();
  const { addToCart } = useCart();
  const router = useRouter();

  const specs = [
    { key: 'price', label: 'Price' },
    { key: 'brand', label: 'Brand' },
    { key: 'stock', label: 'Availability' },
    { key: 'rating', label: 'Rating' },
    { key: 'specifications', label: 'Specifications', isNested: true },
  ];

  const getImageUrl = (product) => {
    const img = product.images?.[0];
    return typeof img === 'string' ? img : img?.url;
  };

  const getBrandName = (product) => {
    return typeof product.brand === 'object' ? product.brand?.name : product.brand;
  };

  const renderSpecValue = (product, spec) => {
    if (spec.key === 'price') {
      return product.price > 0 ? `৳${product.price.toLocaleString()}` : 'Contact for Price';
    }
    if (spec.key === 'brand') {
      return getBrandName(product) || '—';
    }
    if (spec.key === 'stock') {
      return product.stock > 0 ? (
        <span className="text-[#0E8A6E] font-medium">✓ In Stock</span>
      ) : (
        <span className="text-[#E24B4A]">Out of Stock</span>
      );
    }
    if (spec.key === 'rating') {
      const rating = typeof product.rating === 'object' ? product.rating?.average : product.rating;
      return rating ? `${rating.toFixed(1)} ★` : 'No reviews';
    }
    if (spec.isNested && product.specifications) {
      return (
        <div className="space-y-1 text-[11px]">
          {Object.entries(product.specifications).slice(0, 5).map(([k, v]) => (
            <div key={k}>
              <span className="font-medium">{k}:</span> {v}
            </div>
          ))}
        </div>
      );
    }
    return product[spec.key] || '—';
  };

  return (
    <div className="fixed inset-0 z-[500] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
          <div>
            <h2 className="text-[20px] font-bold text-[#0B2545]">Compare Products</h2>
            <p className="text-[12px] text-gray-500 mt-0.5">
              {compareList.length} {compareList.length === 1 ? 'product' : 'products'} selected
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={clearCompare}
              className="px-4 py-2 text-[12px] text-[#E24B4A] hover:bg-red-50 rounded-lg transition-colors font-medium"
            >
              Clear All
            </button>
            <button
              onClick={onClose}
              className="w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors"
              aria-label="Close"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="sticky left-0 bg-white z-10 w-40 p-3 text-left text-[12px] font-semibold text-gray-500 border-b-2 border-gray-200">
                    Feature
                  </th>
                  {compareList.map((product) => (
                    <th key={product._id || product.id} className="p-3 border-b-2 border-gray-200 min-w-[220px]">
                      <div className="flex flex-col items-center gap-3">
                        {/* Image */}
                        <div className="w-32 h-32 bg-gray-100 rounded-lg overflow-hidden flex items-center justify-center">
                          {getImageUrl(product) ? (
                            <img
                              src={getImageUrl(product)}
                              alt={`${product.name}${product.brand ? ` — ${product.brand}` : ''} — Price ৳${product.price?.toLocaleString() || ''} Bangladesh`}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <span className="text-[40px]">📦</span>
                          )}
                        </div>
                        {/* Name */}
                        <div className="text-[13px] font-semibold text-[#0B2545] text-center line-clamp-2 min-h-[40px]">
                          {product.name}
                        </div>
                        {/* Actions */}
                        <div className="flex gap-2">
                          <button
                            onClick={() => {
                              addToCart(product, 1);
                              onClose();
                            }}
                            className="px-3 py-1.5 bg-[#0E8A6E] hover:bg-[#0c7a61] text-white rounded-lg text-[11px] font-semibold transition-colors"
                          >
                            Add to Cart
                          </button>
                          <button
                            onClick={() => removeFromCompare(product._id || product.id)}
                            className="px-3 py-1.5 border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-[11px] font-medium transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {specs.map((spec, idx) => (
                  <tr key={spec.key} className={idx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    <td className="sticky left-0 bg-inherit z-10 p-3 text-[12px] font-semibold text-gray-700 border-b border-gray-200">
                      {spec.label}
                    </td>
                    {compareList.map((product) => (
                      <td
                        key={product._id || product.id}
                        className="p-3 text-[12px] text-gray-600 text-center border-b border-gray-200"
                      >
                        {renderSpecValue(product, spec)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <p className="text-[11px] text-gray-500">
            Tip: Click "Add to Cart" to purchase any product directly from here.
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-[#0B2545] hover:bg-[#0d2e56] text-white rounded-lg text-[13px] font-semibold transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
}

