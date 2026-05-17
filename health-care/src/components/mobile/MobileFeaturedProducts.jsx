'use client';

import { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/context/CartContext';

export default function MobileFeaturedProducts() {
  const router = useRouter();
  const { addToCart } = useCart();
  const [addingToCart, setAddingToCart] = useState({});

  const products = [
    {
      id: 1,
      _id: '1',
      name: 'Siemens ECG 12-lead',
      brand: 'Siemens',
      price: 95000,
      oldPrice: 110000,
      badge: 'sale',
      icon: '📊'
    },
    {
      id: 2,
      _id: '2',
      name: 'Roche HbA1c kit',
      brand: 'Roche',
      price: 8500,
      badge: 'new',
      icon: '🧪'
    },
    {
      id: 3,
      _id: '3',
      name: 'Abbott Troponin I',
      brand: 'Abbott',
      price: 22000,
      icon: '💉'
    }
  ];

  const handleAddToCart = useCallback((product, e) => {
    e.stopPropagation();
    setAddingToCart(prev => ({ ...prev, [product.id]: true }));
    
    try {
      addToCart(product, 1);
      setTimeout(() => {
        setAddingToCart(prev => ({ ...prev, [product.id]: false }));
      }, 1000);
    } catch (error) {
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Error adding to cart:', error);
      setAddingToCart(prev => ({ ...prev, [product.id]: false }));
    }
  }, [addToCart]);

  const handleViewAll = useCallback(() => {
    router.push('/products?featured=true');
  }, [router]);

  return (
    <div className="px-4 py-4 bg-[var(--color-background-secondary)]">
      <div className="flex items-center justify-between mb-3">
        <div className="text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
          Featured products
        </div>
        <button 
          onClick={handleViewAll}
          className="text-[10px] text-[#0E8A6E] font-medium"
        >
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
              {typeof product.brand === 'object' ? product.brand?.name : product.brand}
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
            <button 
              onClick={(e) => handleAddToCart(product, e)}
              disabled={addingToCart[product.id]}
              className="w-full py-[6px] bg-[#0B2545] text-white rounded text-[10px] font-semibold font-[family-name:var(--font-plus-jakarta)] hover:bg-[#0d2d52] transition-colors disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-1"
            >
              {addingToCart[product.id] ? (
                <>
                  <svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
                  </svg>
                  Adding...
                </>
              ) : (
                'Add to cart'
              )}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
