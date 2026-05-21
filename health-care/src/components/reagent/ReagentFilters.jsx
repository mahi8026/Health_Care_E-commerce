'use client';

import { useState, useEffect } from 'react';
import { API } from '@/constants/api';
import { getPopulatedLabel } from '@/utils/helpers';

// These are enum-style values that don't change — kept as constants
const TEMPERATURES = ['Cold (2–8°C)', 'Frozen (−20°C)', 'Room temperature'];
const HAZARDS = ['Biohazard', 'Chemical hazard', 'Safe to handle'];

export default function ReagentFilters({ filters, setFilters }) {
  const [brands, setBrands] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchFilterData = async () => {
      try {
        const [brandsRes, catsRes] = await Promise.all([
          fetch(`${API}/manufacturers`),
          fetch(`${API}/categories`),
        ]);

        if (brandsRes.ok) {
          const data = await brandsRes.json();
          const list = data.data?.manufacturers || data.manufacturers || [];
          setBrands(list.map((m) => getPopulatedLabel(m)).filter(Boolean));
        }

        if (catsRes.ok) {
          const data = await catsRes.json();
          const list = data.data?.categories || data.categories || [];
          // Show all categories — the reagent store will filter by product category separately
          setCategories(list.map((c) => getPopulatedLabel(c)).filter(Boolean));
        }
      } catch {
        // silently fall back to empty — filters still work without them
      } finally {
        setLoading(false);
      }
    };

    fetchFilterData();
  }, []);

  const toggleFilter = (key, value) => {
    setFilters((prev) => {
      const current = prev[key] || [];
      const updated = current.includes(value)
        ? current.filter((item) => item !== value)
        : [...current, value];
      return { ...prev, [key]: updated };
    });
  };

  const clearAll = () =>
    setFilters({ brands: [], categories: [], temperature: [], hazards: [], priceRange: 50000 });

  return (
    <div className="p-5">
      <div className="flex items-center justify-between mb-5">
        <h3 className="text-[14px] font-semibold text-[#0B2545] font-[family-name:var(--font-plus-jakarta)]">
          Filters
        </h3>
        <button
          onClick={clearAll}
          className="text-[11px] text-[#0E8A6E] font-medium hover:underline"
        >
          Clear all
        </button>
      </div>

      {/* Brand Filter */}
      <div className="mb-5">
        <div className="text-[12px] font-medium mb-2 font-[family-name:var(--font-plus-jakarta)]">
          Brand
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : brands.length === 0 ? (
          <p className="text-[11px] text-[#9CA3AF]">No brands available</p>
        ) : (
          <div className="space-y-2">
            {brands.map((brand) => (
              <label key={brand} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.brands?.includes(brand)}
                  onChange={() => toggleFilter('brands', brand)}
                  className="w-4 h-4 rounded border-[var(--color-border-secondary)] text-[#0E8A6E] focus:ring-[#0E8A6E]"
                />
                <span className="text-[11px] text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                  {brand}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Category Filter — optional on reagent-only page */}
      <div className="mb-5 pb-5 border-b border-gray-100 hidden">
        <div className="text-[12px] font-medium mb-2 font-[family-name:var(--font-plus-jakarta)]">
          Category
        </div>
        {loading ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-4 bg-gray-100 rounded animate-pulse" />
            ))}
          </div>
        ) : categories.length === 0 ? (
          <p className="text-[11px] text-[#9CA3AF]">No categories available</p>
        ) : (
          <div className="space-y-2">
            {categories.map((category) => (
              <label key={category} className="flex items-center gap-2 cursor-pointer group">
                <input
                  type="checkbox"
                  checked={filters.categories?.includes(category)}
                  onChange={() => toggleFilter('categories', category)}
                  className="w-4 h-4 rounded border-[var(--color-border-secondary)] text-[#0E8A6E] focus:ring-[#0E8A6E]"
                />
                <span className="text-[11px] text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                  {category}
                </span>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Price Range */}
      <div className="mb-5 pb-5 border-b-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="text-[12px] font-medium mb-3 font-[family-name:var(--font-plus-jakarta)]">
          Price range
        </div>
        <input
          type="range"
          min="0"
          max="100000"
          step="5000"
          value={filters.priceRange}
          onChange={(e) =>
            setFilters({ ...filters, priceRange: parseInt(e.target.value) })
          }
          className="w-full h-1 bg-[var(--color-border-tertiary)] rounded-lg appearance-none cursor-pointer accent-[#0E8A6E]"
        />
        <div className="flex justify-between mt-2">
          <span className="text-[11px] text-[var(--color-text-secondary)]">৳0</span>
          <span className="text-[11px] font-medium font-[family-name:var(--font-plus-jakarta)]">
            ৳{filters.priceRange?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Temperature Storage */}
      <div className="mb-5 pb-5 border-b-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="text-[12px] font-medium mb-2 font-[family-name:var(--font-plus-jakarta)]">
          Temperature storage
        </div>
        <div className="space-y-2">
          {TEMPERATURES.map((temp) => (
            <label key={temp} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.temperature?.includes(temp)}
                onChange={() => toggleFilter('temperature', temp)}
                className="w-4 h-4 rounded border-[var(--color-border-secondary)] text-[#0E8A6E] focus:ring-[#0E8A6E]"
              />
              <span className="text-[11px] text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                {temp}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Hazard Classification */}
      <div>
        <div className="text-[12px] font-medium mb-2 font-[family-name:var(--font-plus-jakarta)]">
          Hazard classification
        </div>
        <div className="space-y-2">
          {HAZARDS.map((hazard) => (
            <label key={hazard} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="checkbox"
                checked={filters.hazards?.includes(hazard)}
                onChange={() => toggleFilter('hazards', hazard)}
                className="w-4 h-4 rounded border-[var(--color-border-secondary)] text-[#0E8A6E] focus:ring-[#0E8A6E]"
              />
              <span className="text-[11px] text-[var(--color-text-secondary)] group-hover:text-[var(--color-text-primary)]">
                {hazard}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
