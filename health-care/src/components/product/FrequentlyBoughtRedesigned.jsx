"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { API } from '@/constants/api';

/**
 * Redesigned Frequently Bought Together Component
 * Features: Horizontal product cards with bundle pricing
 */
export default function FrequentlyBoughtRedesigned({ productId, category }) {
  const [related, setRelated] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const { addToCart } = useCart();
  const [showToast, setShowToast] = useState(false);

  const categoryId = category && typeof category === 'object' ? category._id : category;

  useEffect(() => {
    if (!categoryId) return;
    const params = new URLSearchParams({ category: categoryId, limit: 3 });
    if (productId) params.set('exclude', productId);
    fetch(`${API}/products?${params}`)
      .then(r => r.json())
      .then(data => {
        const items = data.products || data.data?.products || [];
        setRelated(items.filter(p => (p._id || p.id) !== productId).slice(0, 3));
      })
      .catch(() => setRelated([]));
  }, [productId, categoryId]);

  if (related.length === 0) return null;

  const handleAddProduct = (product) => {
    addToCart({
      ...product,
      id: product._id || product.id,
    }, 1);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 2000);
  };

  const handleToggleProduct = (productId) => {
    setSelectedProducts(prev => 
      prev.includes(productId) 
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const bundleTotal = related
    .filter(p => selectedProducts.includes(p._id || p.id))
    .reduce((sum, p) => sum + (p.price || 0), 0);

  return (
    <div className="mt-6 mb-6">
      {/* Toast */}
      {showToast && (
        <div className="fixed top-4 right-4 z-50 bg-[#D1FAE5] text-[#065F46] rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 animate-slide-in">
          <span className="text-[18px]">✓</span>
          <p className="text-[13px] font-semibold">Added to cart!</p>
        </div>
      )}

      <h3 className="text-[16px] font-bold text-[#0B2545] mb-4">
        Frequently Bought Together
      </h3>
      
      <div className="flex gap-3 overflow-x-auto pb-2" style={{WebkitOverflowScrolling: 'touch'}}>
        {related.map((product) => {
          const imageData = product.images?.[0];
          const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
          const isSelected = selectedProducts.includes(product._id || product.id);
          
          return (
            <div
              key={product._id || product.id}
              className={`border rounded-xl p-4 flex flex-col gap-3 bg-white hover:shadow-md transition-all flex-shrink-0 w-[200px] ${
                isSelected ? 'border-[#0E8A6E] border-2' : 'border-[#E5E7EB]'
              }`}
            >
              {/* Image */}
              <div className="w-full h-24 rounded-lg bg-surface-subtle flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={imageUrl} 
                    alt={typeof imageData === 'object' ? imageData.alt : product.name}
                    className="w-full h-full object-contain p-2"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement.innerHTML = '<div class="text-[32px]">📦</div>';
                    }}
                  />
                ) : (
                  <div className="text-[32px]">📦</div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <div className="text-[12px] font-semibold text-[#0B2545] line-clamp-2 mb-2 min-h-[36px]">
                  {product.name}
                </div>
                <div className="text-[14px] font-bold text-[#0E8A6E]">
                  ৳{(product.price || 0).toLocaleString()}
                </div>
              </div>

              {/* Add Button */}
              <button
                onClick={() => handleAddProduct(product)}
                className="w-full py-2 bg-[#0B2545] hover:bg-[#1a3a5c] text-white rounded-lg text-[12px] font-semibold transition-colors flex items-center justify-center gap-1"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="12" y1="5" x2="12" y2="19"/>
                  <line x1="5" y1="12" x2="19" y2="12"/>
                </svg>
                Add
              </button>
            </div>
          );
        })}
      </div>

      {/* Bundle Total (if products selected) */}
      {selectedProducts.length > 0 && (
        <div className="mt-4 bg-[#E1F5EE] rounded-lg p-4 flex items-center justify-between">
          <div>
            <div className="text-[12px] text-[#0E8A6E] font-medium">Bundle Total</div>
            <div className="text-[20px] font-bold text-[#0B2545]">
              ৳{bundleTotal.toLocaleString()}
            </div>
          </div>
          <button
            onClick={() => {
              related
                .filter(p => selectedProducts.includes(p._id || p.id))
                .forEach(p => handleAddProduct(p));
              setSelectedProducts([]);
            }}
            className="px-6 py-2 bg-[#0E8A6E] hover:bg-[#0B7558] text-white rounded-lg text-[13px] font-semibold transition-colors"
          >
            Add Bundle to Cart
          </button>
        </div>
      )}
    </div>
  );
}
