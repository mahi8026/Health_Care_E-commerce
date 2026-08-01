"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { API } from '@/constants/api';
import OptimizedImage from '@/components/ui/OptimizedImage';

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
      .catch(() => { if (process.env.NODE_ENV !== 'production') console.warn('Failed to fetch related products'); setRelated([]); });
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
        <div className="fixed top-4 right-4 z-[var(--z-toast)] bg-[var(--color-status-success-tint)] text-[var(--color-status-success)] rounded-lg shadow-lg px-4 py-3 flex items-center gap-3 animate-slide-in">
          <span className="text-lg">✓</span>
          <p className="text-sm font-semibold">Added to cart!</p>
        </div>
      )}

      <h3 className="text-base font-semibold text-brand-navy mb-4">
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
                isSelected ? 'border-brand-teal border-2' : 'border-[#E5E7EB]'
              }`}
            >
              {/* Image */}
              <div className="w-full aspect-square rounded-lg bg-surface-subtle flex items-center justify-center overflow-hidden">
                {imageUrl ? (
                  <OptimizedImage
                    src={imageUrl}
                    alt={`${product.name}${typeof product.brand === 'object' && product.brand?.name ? ` — ${product.brand.name}` : product.brand ? ` — ${product.brand}` : ''} — Price ৳${product.price > 0 ? product.price.toLocaleString() : 'Contact for Price'} Bangladesh`}
                    fill
                    context="card"
                    fallback="📦"
                    className="w-full h-full"
                    style={{ objectFit: 'contain', padding: 8 }}
                  />
                ) : (
                  <div className="text-4xl">📦</div>
                )}
              </div>

              {/* Product Info */}
              <div className="flex-1">
                <div className="text-xs font-semibold text-brand-navy line-clamp-2 mb-2 min-h-[36px]">
                  {product.name}
                </div>
                <div className="text-sm font-semibold text-brand-teal">
                  ৳{(product.price || 0).toLocaleString()}
                </div>
              </div>

              {/* Add Button */}
              <button
                onClick={() => handleAddProduct(product)}
                className="w-full py-2 bg-brand-navy hover:bg-[#1a3a5c] text-white rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1"
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
            <div className="text-xs text-brand-teal font-medium">Bundle Total</div>
            <div className="text-xl font-semibold text-brand-navy">
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
            className="px-6 py-2 bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white rounded-lg text-sm font-semibold transition-colors"
          >
            Add Bundle to Cart
          </button>
        </div>
      )}
    </div>
  );
}
