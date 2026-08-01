"use client";

import { useState, useEffect } from 'react';
import GA4Tracker from '@/services/GA4Tracker';
import { FaFilter, FaTimes } from 'react-icons/fa';
import { API } from '@/constants/api';

export default function SearchFilters({ onFilterChange, activeFilters = {} }) {
  const [priceRange, setPriceRange] = useState(activeFilters.maxPrice || 100000);
  const [selectedBrands, setSelectedBrands] = useState(activeFilters.brands || []);
  const [selectedCategories, setSelectedCategories] = useState(activeFilters.categories || []);
  const [inStock, setInStock] = useState(activeFilters.inStock || false);
  const [expandedSections, setExpandedSections] = useState({
    price: true,
    categories: true,
    brands: false,
  });

  // Real data from API
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [brandsRes, catsRes] = await Promise.all([
          fetch(`${API}/manufacturers`),
          fetch(`${API}/categories`),
        ]);
        if (brandsRes.ok) {
          const d = await brandsRes.json();
          const list = d.data?.manufacturers || d.manufacturers || [];
          setBrands(list.map((m) => (typeof m === 'string' ? m : m.name)).filter(Boolean));
        }
        if (catsRes.ok) {
          const d = await catsRes.json();
          const list = d.data?.categories || d.categories || [];
          setCategories(list.map((c) => (typeof c === 'string' ? c : c.name)).filter(Boolean));
        }
      } catch {
        // silently fall back to empty lists
      }
    };
    fetchData();
  }, []);

  const toggleSection = (section) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  const handleBrandToggle = (brand) => {
    const updated = selectedBrands.includes(brand)
      ? selectedBrands.filter((b) => b !== brand)
      : [...selectedBrands, brand];
    setSelectedBrands(updated);
    onFilterChange({ ...activeFilters, brands: updated });
    GA4Tracker.trackFilterApplied('brand', brand);
  };

  const handleCategoryToggle = (category) => {
    const updated = selectedCategories.includes(category)
      ? selectedCategories.filter((c) => c !== category)
      : [...selectedCategories, category];
    setSelectedCategories(updated);
    onFilterChange({ ...activeFilters, categories: updated });
    GA4Tracker.trackFilterApplied('category', category);
  };

  const handlePriceChange = (value) => {
    setPriceRange(value);
    onFilterChange({ ...activeFilters, maxPrice: value });
    GA4Tracker.trackFilterApplied('price', `max_${value}`);
  };

  const handleStockToggle = () => {
    const updated = !inStock;
    setInStock(updated);
    onFilterChange({ ...activeFilters, inStock: updated });
    GA4Tracker.trackFilterApplied('stock', updated ? 'in_stock_only' : 'all');
  };

  const handleClearAll = () => {
    setPriceRange(100000);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setInStock(false);
    onFilterChange({});
  };

  const activeFilterCount =
    selectedBrands.length +
    selectedCategories.length +
    (inStock ? 1 : 0) +
    (priceRange < 100000 ? 1 : 0);

  return (
    <div className="bg-white rounded-lg shadow-sm border border-[var(--color-border-tertiary)] overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-brand-teal to-[#0c7359] px-3 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FaFilter className="text-white text-xs" />
          <h3 className="text-white font-semibold text-xs">Filters</h3>
          {activeFilterCount > 0 && (
            <span className="bg-white text-brand-teal text-xs font-semibold px-1.5 py-0.5 rounded-full">
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={handleClearAll}
            className="text-white text-xs hover:underline flex items-center gap-1"
            aria-label="Clear all filters"
          >
            <FaTimes size={8} />
            Clear
          </button>
        )}
      </div>

      <div className="p-3 space-y-2">
        {/* Stock Status */}
        <div className="bg-[var(--color-background-secondary)] rounded-md p-2">
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={inStock}
              onChange={handleStockToggle}
              className="w-3 h-3 cursor-pointer accent-brand-teal"
              aria-label="Show only in-stock products"
            />
            <span className="text-xs text-[var(--color-text-primary)] group-hover:text-brand-teal transition-colors">
              In stock only
            </span>
          </label>
        </div>

        {/* Price Range */}
        <div className="border-t pt-2">
          <button
            onClick={() => toggleSection('price')}
            className="w-full flex items-center justify-between mb-1.5"
            aria-expanded={expandedSections.price}
            aria-controls="price-range-section"
            aria-label="Toggle price range filter"
          >
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">Price Range</span>
            <span className="text-[var(--color-text-secondary)] text-xs">{expandedSections.price ? '−' : '+'}</span>
          </button>
          {expandedSections.price && (
            <div id="price-range-section" className="space-y-1.5" role="group" aria-label="Price range filter">
              <div className="relative py-1">
                <input
                  type="range"
                  min="0"
                  max="200000"
                  step="5000"
                  value={priceRange}
                  onChange={(e) => handlePriceChange(parseInt(e.target.value))}
                  className="w-full h-1 bg-[var(--color-background-muted)] rounded-lg appearance-none cursor-pointer"
                  aria-label="Maximum price filter"
                  aria-valuemin="0"
                  aria-valuemax="200000"
                  aria-valuenow={priceRange}
                  aria-valuetext={`৳${priceRange.toLocaleString()}`}
                  style={{
                    background: `linear-gradient(to right, var(--color-brand-teal) 0%, var(--color-brand-teal) ${(priceRange / 200000) * 100}%, var(--color-background-muted) ${(priceRange / 200000) * 100}%, var(--color-background-muted) 100%)`,
                  }}
                />
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-[var(--color-text-secondary)]">৳0</span>
                <div className="bg-brand-teal text-white px-2 py-0.5 rounded-full text-xs font-semibold">
                  ৳{priceRange.toLocaleString()}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Categories */}
        <div className="border-t pt-2">
          <button
            onClick={() => toggleSection('categories')}
            className="w-full flex items-center justify-between mb-1.5"
            aria-expanded={expandedSections.categories}
            aria-controls="categories-section"
            aria-label="Toggle categories filter"
          >
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">Categories</span>
            <div className="flex items-center gap-1.5">
              {selectedCategories.length > 0 && (
                <span className="bg-brand-teal text-white text-xs px-1.5 py-0.5 rounded-full">
                  {selectedCategories.length}
                </span>
              )}
              <span className="text-[var(--color-text-secondary)] text-xs">{expandedSections.categories ? '−' : '+'}</span>
            </div>
          </button>
          {expandedSections.categories && (
            <div id="categories-section" className="space-y-1 max-h-32 overflow-y-auto">
              {categories.length === 0 ? (
                <div className="space-y-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-5 bg-[var(--color-background-tertiary)] rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                categories.map((category) => (
                  <label
                    key={category}
                    className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded-md hover:bg-[var(--color-background-secondary)] transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedCategories.includes(category)}
                      onChange={() => handleCategoryToggle(category)}
                      className="w-3 h-3 cursor-pointer accent-brand-teal"
                      aria-label={`Filter by ${category} category`}
                    />
                    <span className="text-xs text-[var(--color-text-primary)] group-hover:text-brand-teal transition-colors">
                      {category}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>

        {/* Brands */}
        <div className="border-t pt-2">
          <button
            onClick={() => toggleSection('brands')}
            className="w-full flex items-center justify-between mb-1.5"
            aria-expanded={expandedSections.brands}
            aria-controls="brands-section"
            aria-label="Toggle brands filter"
          >
            <span className="text-xs font-semibold text-[var(--color-text-primary)]">Brands</span>
            <div className="flex items-center gap-1.5">
              {selectedBrands.length > 0 && (
                <span className="bg-brand-teal text-white text-xs px-1.5 py-0.5 rounded-full">
                  {selectedBrands.length}
                </span>
              )}
              <span className="text-[var(--color-text-secondary)] text-xs">{expandedSections.brands ? '−' : '+'}</span>
            </div>
          </button>
          {expandedSections.brands && (
            <div id="brands-section" className="space-y-1 max-h-32 overflow-y-auto" role="group" aria-label="Brand filters">
              {brands.length === 0 ? (
                <div className="space-y-1">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="h-5 bg-[var(--color-background-tertiary)] rounded animate-pulse" />
                  ))}
                </div>
              ) : (
                brands.map((brand) => (
                  <label
                    key={brand}
                    className="flex items-center gap-1.5 cursor-pointer p-1.5 rounded-md hover:bg-[var(--color-background-secondary)] transition-colors group"
                  >
                    <input
                      type="checkbox"
                      checked={selectedBrands.includes(brand)}
                      onChange={() => handleBrandToggle(brand)}
                      className="w-3 h-3 cursor-pointer accent-brand-teal"
                      aria-label={`Filter by ${brand} brand`}
                    />
                    <span className="text-xs text-[var(--color-text-primary)] group-hover:text-brand-teal transition-colors">
                      {brand}
                    </span>
                  </label>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
