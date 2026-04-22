"use client";

import { useState } from 'react';
import GA4Tracker from '@/services/GA4Tracker';

export default function SearchFilters({ onFilterChange, activeFilters = {} }) {
  const [priceRange, setPriceRange] = useState(activeFilters.maxPrice || 100000);
  const [selectedBrands, setSelectedBrands] = useState(activeFilters.brands || []);
  const [selectedCategories, setSelectedCategories] = useState(activeFilters.categories || []);
  const [inStock, setInStock] = useState(activeFilters.inStock || false);

  const brands = [
    'Siemens Healthineers',
    'Roche Diagnostics',
    'Abbott Laboratories',
    'GE Healthcare',
    'Philips Healthcare',
    'Medtronic'
  ];

  const categories = [
    'Diagnostic Equipment',
    'Surgical Instruments',
    'Laboratory Reagents',
    'Lab Equipment',
    'PPE & Disposables',
    'Implants & Ortho'
  ];

  const handleBrandToggle = (brand) => {
    const updated = selectedBrands.includes(brand)
      ? selectedBrands.filter(b => b !== brand)
      : [...selectedBrands, brand];
    setSelectedBrands(updated);
    onFilterChange({ ...activeFilters, brands: updated });
    // Track filter applied
    GA4Tracker.trackFilterApplied('brand', brand);
  };

  const handleCategoryToggle = (category) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(updated);
    onFilterChange({ ...activeFilters, categories: updated });
    // Track filter applied
    GA4Tracker.trackFilterApplied('category', category);
  };

  const handlePriceChange = (value) => {
    setPriceRange(value);
    onFilterChange({ ...activeFilters, maxPrice: value });
    // Track filter applied
    GA4Tracker.trackFilterApplied('price', `max_${value}`);
  };

  const handleStockToggle = () => {
    const updated = !inStock;
    setInStock(updated);
    onFilterChange({ ...activeFilters, inStock: updated });
    // Track filter applied
    GA4Tracker.trackFilterApplied('stock', updated ? 'in_stock_only' : 'all');
  };

  const handleClearAll = () => {
    setPriceRange(100000);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setInStock(false);
    onFilterChange({});
  };

  return (
    <div className="w-64 bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] p-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[14px] font-semibold">Filters</h3>
        <button
          onClick={handleClearAll}
          className="text-[11px] text-[#0E8A6E] hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Stock Status */}
      <div className="mb-4 pb-4 border-b-[0.5px] border-[var(--color-border-tertiary)]">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inStock}
            onChange={handleStockToggle}
            className="w-4 h-4 cursor-pointer"
          />
          <span className="text-[12px]">In stock only</span>
        </label>
      </div>

      {/* Price Range */}
      <div className="mb-4 pb-4 border-b-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="text-[12px] font-medium mb-2">Price Range</div>
        <input
          type="range"
          min="0"
          max="200000"
          step="5000"
          value={priceRange}
          onChange={(e) => handlePriceChange(parseInt(e.target.value))}
          aria-label="Maximum price filter"
          className="w-full"
        />
        <div className="flex justify-between text-[11px] text-[var(--color-text-secondary)] mt-1">
          <span>৳0</span>
          <span>৳{priceRange.toLocaleString()}</span>
        </div>
      </div>

      {/* Categories */}
      <div className="mb-4 pb-4 border-b-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="text-[12px] font-medium mb-2">Categories</div>
        <div className="space-y-2">
          {categories.map((category) => (
            <label key={category} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() => handleCategoryToggle(category)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-[11px]">{category}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Brands */}
      <div>
        <div className="text-[12px] font-medium mb-2">Brands</div>
        <div className="space-y-2">
          {brands.map((brand) => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedBrands.includes(brand)}
                onChange={() => handleBrandToggle(brand)}
                className="w-4 h-4 cursor-pointer"
              />
              <span className="text-[11px]">{brand}</span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
