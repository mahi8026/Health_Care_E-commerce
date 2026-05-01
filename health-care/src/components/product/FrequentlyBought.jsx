"use client";

import { useState, useEffect } from 'react';
import { useCart } from '@/context/CartContext';
import { API } from '@/constants/api';

export default function FrequentlyBought({ productId, category }) {
  const [related, setRelated] = useState([]);
  const { addToCart } = useCart();

  // category can be an ObjectId string or a populated object {_id, name, slug}
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

  const handleAdd = (product) => {
    addToCart({
      ...product,
      id: product._id || product.id,
    }, 1);
  };

  return (
    <div className="mt-4">
      <div className="text-[11px] text-[var(--color-text-secondary)] mb-2">
        Frequently bought together
      </div>
      <div className="flex gap-2 flex-wrap">
        {related.map((product) => (
          <div
            key={product._id || product.id}
            className="border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg px-[10px] py-2 flex items-center gap-2 bg-[var(--color-background-primary)] hover:border-[#0B2545] transition-colors"
          >
            <div className="w-8 h-8 rounded-md bg-[var(--color-background-tertiary)] flex items-center justify-center text-[18px] overflow-hidden">
              {(() => {
                // Handle both old (string) and new (object) image formats
                const imageData = product.images?.[0];
                const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
                
                return imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img 
                    src={imageUrl} 
                    alt={typeof imageData === 'object' ? imageData.alt : product.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.parentElement.innerHTML = '📦';
                    }}
                  />
                ) : '📦';
              })()}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[11px] font-medium truncate max-w-[120px]">{product.name}</div>
              <div className="text-[10px] text-[var(--color-text-secondary)]">
                ৳{(product.price || 0).toLocaleString()}
              </div>
            </div>
            <button
              onClick={() => handleAdd(product)}
              className="text-[10px] px-2 py-1 bg-[#0B2545] text-white rounded hover:bg-[#0d2d52] transition-colors flex-shrink-0"
            >
              + Add
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
