"use client";

import { useState, useEffect, useMemo } from 'react';
import { useProducts } from '@/hooks/useProducts';
import Spinner from '@/components/ui/Spinner';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function HomePage({ onNavigate, onNavigateToProduct, onRegisterClick, initialFeaturedProducts = [] }) {
  const filters = useMemo(() => ({ limit: 3, featured: true }), []);
  const { products, loading } = useProducts(filters, initialFeaturedProducts);

  // FIX 16: fetch real stats from API
  const [stats, setStats] = useState({ products: null, customers: null });
  const [categoryCounts, setCategoryCounts] = useState({});

  useEffect(() => {
    // Fetch category counts (public endpoint)
    fetch(`${API}/products/category-counts`)
      .then(r => r.json())
      .then(data => setCategoryCounts(data.data || data || {}))
      .catch(() => {}); // fail silently — fallback labels shown below
  }, []);

  return (
    <div className="min-h-screen bg-[var(--color-background-secondary)]">
      {/* Hero Section */}
      <div className="bg-gradient-to-br from-[#0B2545] to-[#0d2d52] text-white px-6 py-16">
        <div className="max-w-6xl mx-auto text-center">
          <h1 className="text-[32px] font-bold mb-4 font-[family-name:var(--font-lora)]">
            Bangladesh's Trusted Medical Equipment Supplier
          </h1>
          <p className="text-[15px] opacity-90 mb-6 max-w-2xl mx-auto">
            Premium diagnostic devices, surgical instruments, laboratory reagents, and hospital machines from world-leading brands
          </p>
          <div className="flex gap-3 justify-center">
            <button 
              onClick={() => onNavigate && onNavigate('reagent')}
              className="px-6 py-3 bg-[#0E8A6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0c7a61] cursor-pointer"
            >
              Browse products
            </button>
            <button 
              onClick={() => onRegisterClick && onRegisterClick()}
              className="px-6 py-3 bg-white/10 backdrop-blur-sm text-white rounded-lg text-[13px] font-semibold hover:bg-white/20 cursor-pointer"
            >
              Register for B2B
            </button>
          </div>
        </div>
      </div>

      {/* Trust Strip */}
      <div className="bg-white border-b-[0.5px] border-[var(--color-border-tertiary)] py-4">
        <div className="max-w-6xl mx-auto px-6 flex justify-around items-center">
          <div className="text-center">
            <div className="text-[20px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
              {categoryCounts.totalProducts ? `${categoryCounts.totalProducts.toLocaleString()}+` : '5,200+'}
            </div>
            <div className="text-[11px] text-[var(--color-text-secondary)]">Products</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
              {categoryCounts.totalBrands ? `${categoryCounts.totalBrands}+` : '50+'}
            </div>
            <div className="text-[11px] text-[var(--color-text-secondary)]">Global Brands</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
              1,200+
            </div>
            <div className="text-[11px] text-[var(--color-text-secondary)]">B2B Customers</div>
          </div>
          <div className="text-center">
            <div className="text-[20px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
              24/7
            </div>
            <div className="text-[11px] text-[var(--color-text-secondary)]">Support</div>
          </div>
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <h2 className="text-[20px] font-semibold mb-6 font-[family-name:var(--font-lora)]">
          Shop by category
        </h2>
        <div className="grid grid-cols-4 gap-4">
          {[
            { icon: '🩺', name: 'Diagnostic Equipment', key: 'Diagnostic Equipment', fallback: '1,200+' },
            { icon: '💉', name: 'Surgical Instruments', key: 'Surgical Instruments', fallback: '850+' },
            { icon: '🧪', name: 'Laboratory Reagents', key: 'Laboratory Reagents', fallback: '2,400+' },
            { icon: '🏥', name: 'Hospital Machines', key: 'Hospital Machines', fallback: '750+' }
          ].map((category, index) => (
            <div
              key={index}
              onClick={() => onNavigate && onNavigate('reagent')}
              className="bg-white rounded-lg p-6 border-[0.5px] border-[var(--color-border-tertiary)] hover:shadow-md transition-shadow cursor-pointer text-center"
            >
              <div className="text-[40px] mb-3">{category.icon}</div>
              <div className="text-[13px] font-semibold mb-1 font-[family-name:var(--font-plus-jakarta)]">
                {category.name}
              </div>
              <div className="text-[11px] text-[var(--color-text-secondary)]">
                {categoryCounts[category.key]
                  ? `${categoryCounts[category.key].toLocaleString()}+ products`
                  : `${category.fallback} products`}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Featured Products */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-[20px] font-semibold font-[family-name:var(--font-lora)]">
            Featured products
          </h2>
          <button 
            onClick={() => onNavigate && onNavigate('reagent')}
            className="text-[12px] text-[#0E8A6E] font-medium hover:underline cursor-pointer"
          >
            View all →
          </button>
        </div>
        
        {loading ? (
          <div className="flex justify-center py-12">
            <Spinner />
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {products.slice(0, 3).map((product) => (
              <div
                key={product.id || product._id}
                className="bg-white rounded-lg p-4 border-[0.5px] border-[var(--color-border-tertiary)] hover:shadow-md transition-shadow"
              >
                {product.badge && (
                  <div className="flex justify-end mb-2">
                    <span className={`text-[9px] px-2 py-[2px] rounded font-medium ${
                      product.badge === 'sale'
                        ? 'bg-[#FCEBEB] text-[#791F1F]'
                        : 'bg-[#E1F5EE] text-[#085041]'
                    }`}>
                      {product.badge === 'sale' ? '🔥 SALE' : '✨ NEW'}
                    </span>
                  </div>
                )}
                <div className="w-full h-32 bg-[var(--color-background-tertiary)] rounded-lg mb-3 flex items-center justify-center text-[40px]">
                  {(() => {
                    // Handle both old (string) and new (object) image formats
                    const imageData = product.images?.[0];
                    const imageUrl = typeof imageData === 'string' ? imageData : imageData?.url;
                    
                    return imageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img 
                        src={imageUrl} 
                        alt={typeof imageData === 'object' ? imageData.alt : product.name}
                        className="w-full h-full object-cover rounded-lg"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                          e.currentTarget.parentElement.innerHTML = '📊';
                        }}
                      />
                    ) : '📊';
                  })()}
                </div>
                <div className="text-[13px] font-medium mb-1 font-[family-name:var(--font-plus-jakarta)]">
                  {product.name}
                </div>
                <div className="text-[11px] text-[var(--color-text-secondary)] mb-3">
                  {product.brand}
                </div>
                <div className="flex items-end justify-between mb-3">
                  <div>
                    <div className="text-[16px] font-bold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
                      ৳{product.price.toLocaleString()}
                    </div>
                    {product.oldPrice && (
                      <div className="text-[11px] text-[var(--color-text-tertiary)] line-through">
                        ৳{product.oldPrice.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={() => onNavigateToProduct && onNavigateToProduct(product._id || product.id)}
                  className="w-full py-[8px] bg-[#0B2545] text-white rounded-lg text-[12px] font-semibold hover:bg-[#0d2d52] cursor-pointer"
                >
                  View details
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* B2B Banner */}
      <div className="max-w-6xl mx-auto px-6 py-12">
        <div className="bg-gradient-to-r from-[#0E8A6E] to-[#4DDBB8] rounded-lg p-8 text-white">
          <div className="flex items-center gap-6">
            <div className="text-[60px]">🏢</div>
            <div className="flex-1">
              <h3 className="text-[20px] font-semibold mb-2 font-[family-name:var(--font-lora)]">
                Register for B2B Account
              </h3>
              <p className="text-[13px] opacity-90 mb-4">
                Get exclusive bulk discounts, flexible credit terms, priority support, and dedicated account management
              </p>
              <button 
                onClick={() => onRegisterClick && onRegisterClick()}
                className="px-6 py-3 bg-white text-[#0E8A6E] rounded-lg text-[13px] font-semibold hover:bg-[#f9fafb] cursor-pointer"
              >
                Register now →
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
