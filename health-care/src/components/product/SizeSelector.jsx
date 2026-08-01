"use client";

import { useState } from 'react';
import { useT } from '@/hooks/useT';

export default function SizeSelector({ 
  sizes = [], 
  selectedSize, 
  onSizeChange,
  className = '' 
}) {
  const t = useT();
  const [showSizeChart, setShowSizeChart] = useState(false);

  if (!sizes || sizes.length === 0) {
    return null;
  }

  const handleSizeClick = (size) => {
    if (size.isAvailable && size.stock > 0) {
      onSizeChange(size);
    }
  };

  return (
    <div className={`size-selector ${className}`}>
      <div className="flex items-center justify-between mb-3">
        <label className="text-sm font-semibold text-[var(--color-text-primary)]">
          {t('products.selectSize')}
          {selectedSize && (
            <span className="ml-2 text-xs font-normal text-[var(--color-text-secondary)]">
              ({selectedSize.name})
            </span>
          )}
        </label>
        <button
          type="button"
          onClick={() => setShowSizeChart(true)}
          className="text-xs text-brand-teal hover:underline"
        >
          {t('products.sizeChart')}
        </button>
      </div>

      <div className="flex flex-wrap gap-2">
        {sizes.map((size) => {
          const isSelected = selectedSize?.name === size.name;
          const isAvailable = size.isAvailable && size.stock > 0;
          const isLowStock = size.stock > 0 && size.stock <= 5;

          return (
            <button
              key={size.name}
              type="button"
              onClick={() => handleSizeClick(size)}
              disabled={!isAvailable}
              className={`
                relative min-w-[48px] h-[44px] px-3 rounded-lg border-2 
                text-sm font-medium transition-all duration-200
                ${isSelected 
                  ? 'border-brand-teal bg-brand-teal/5 text-brand-teal' 
                  : isAvailable
                    ? 'border-[var(--color-border-secondary)] bg-white text-[var(--color-text-primary)] hover:border-brand-teal/50 hover:bg-brand-teal/5'
                    : 'border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)] text-[var(--color-text-tertiary)] cursor-not-allowed line-through'
                }
              `}
              title={
                !isAvailable 
                  ? t('products.outOfStock')
                  : isLowStock
                    ? t('products.lowStock', { count: size.stock })
                    : `${size.name} - ${size.stock} ${t('products.inStock')}`
              }
            >
              {size.name}
              
              {/* Selected indicator */}
              {isSelected && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-brand-teal rounded-full flex items-center justify-center">
                  <svg width="10" height="10" viewBox="0 0 12 12" fill="white">
                    <path d="M10 3L4.5 8.5L2 6" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </span>
              )}
              
              {/* Low stock indicator */}
              {isAvailable && isLowStock && !isSelected && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full" />
              )}
              
              {/* Price adjustment indicator */}
              {size.priceAdjustment !== 0 && isAvailable && (
                <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 text-xs text-brand-teal whitespace-nowrap">
                  {size.priceAdjustment > 0 ? '+' : ''}৳{size.priceAdjustment}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Selected size info */}
      {selectedSize && (
        <div className="mt-3 p-3 bg-brand-teal/5 rounded-lg">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--color-text-secondary)]">
              {t('products.selectedSize')}: <strong className="text-[var(--color-text-primary)]">{selectedSize.name}</strong>
            </span>
            {selectedSize.stock <= 10 && (
              <span className="text-orange-600 font-medium">
                {t('products.only')} {selectedSize.stock} {t('products.left')}
              </span>
            )}
          </div>
        </div>
      )}

      {/* Size Chart Modal */}
      {showSizeChart && (
        <div 
          className="fixed inset-0 bg-black/50 z-[var(--z-drawer)] flex items-center justify-center p-4"
          onClick={() => setShowSizeChart(false)}
        >
          <div 
            className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-brand-navy">
                {t('products.sizeChart')}
              </h3>
              <button
                onClick={() => setShowSizeChart(false)}
                className="w-11 h-11 rounded-full hover:bg-[var(--color-background-tertiary)] flex items-center justify-center"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b-2 border-[var(--color-border-primary)]">
                    <th className="text-left py-3 px-2 font-semibold text-[var(--color-text-primary)]">Size</th>
                    <th className="text-center py-3 px-2 font-semibold text-[var(--color-text-primary)]">Chest (inches)</th>
                    <th className="text-center py-3 px-2 font-semibold text-[var(--color-text-primary)]">Waist (inches)</th>
                    <th className="text-center py-3 px-2 font-semibold text-[var(--color-text-primary)]">Length (inches)</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b border-[var(--color-border-tertiary)]">
                    <td className="py-3 px-2 font-medium">XS</td>
                    <td className="py-3 px-2 text-center">32-34</td>
                    <td className="py-3 px-2 text-center">26-28</td>
                    <td className="py-3 px-2 text-center">26-27</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border-tertiary)]">
                    <td className="py-3 px-2 font-medium">S</td>
                    <td className="py-3 px-2 text-center">34-36</td>
                    <td className="py-3 px-2 text-center">28-30</td>
                    <td className="py-3 px-2 text-center">27-28</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border-tertiary)]">
                    <td className="py-3 px-2 font-medium">M</td>
                    <td className="py-3 px-2 text-center">38-40</td>
                    <td className="py-3 px-2 text-center">32-34</td>
                    <td className="py-3 px-2 text-center">28-29</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border-tertiary)]">
                    <td className="py-3 px-2 font-medium">L</td>
                    <td className="py-3 px-2 text-center">42-44</td>
                    <td className="py-3 px-2 text-center">36-38</td>
                    <td className="py-3 px-2 text-center">29-30</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border-tertiary)]">
                    <td className="py-3 px-2 font-medium">XL</td>
                    <td className="py-3 px-2 text-center">46-48</td>
                    <td className="py-3 px-2 text-center">40-42</td>
                    <td className="py-3 px-2 text-center">30-31</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border-tertiary)]">
                    <td className="py-3 px-2 font-medium">XXL</td>
                    <td className="py-3 px-2 text-center">50-52</td>
                    <td className="py-3 px-2 text-center">44-46</td>
                    <td className="py-3 px-2 text-center">31-32</td>
                  </tr>
                  <tr className="border-b border-[var(--color-border-tertiary)]">
                    <td className="py-3 px-2 font-medium">XXXL</td>
                    <td className="py-3 px-2 text-center">54-56</td>
                    <td className="py-3 px-2 text-center">48-50</td>
                    <td className="py-3 px-2 text-center">32-33</td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-xs text-[var(--color-text-secondary)]">
                <strong className="text-[var(--color-text-primary)]">Note:</strong> Measurements are approximate. 
                For medical clothing and PPE, please ensure proper fit for safety and compliance.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
