/**
 * ProductFilters - Presentational component for product filtering sidebar
 * 
 * Displays category, brand, price range, and availability filters.
 * All data and handlers are passed as props (no data fetching).
 */
export default function ProductFilters({
  categories = [],
  brands = [],
  selectedCategory,
  selectedBrand,
  priceRange,
  inStock,
  onCategoryChange,
  onBrandChange,
  onPriceRangeChange,
  onInStockChange,
  onClearAll,
  totalResults = 0,
  hasActiveFilters = false,
  t = (key) => key, // Translation function
}) {
  const handlePricePreset = (min, max) => {
    onPriceRangeChange({ minPrice: min || undefined, maxPrice: max });
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden sticky top-4">
      {/* Sidebar header */}
      <div className="px-5 py-4 bg-gradient-to-r from-[#0B2545] to-[#0d3060] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
          </svg>
          <span className="text-white font-bold text-[14px]">{t('products.filters')}</span>
        </div>
        {hasActiveFilters && (
          <button 
            onClick={onClearAll}
            className="text-[11px] text-red-300 hover:text-red-200 font-medium transition-colors"
          >
            {t('products.clearAll')}
          </button>
        )}
      </div>

      <div className="p-4 space-y-5">
        {/* Category */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            <span>📂</span> {t('products.category')}
          </label>
          <select 
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all cursor-pointer text-gray-700"
          >
            <option value="">{t('products.allCategories')}</option>
            {categories.map(cat => (
              <option key={cat._id || cat.name} value={cat.name}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {/* Brand */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            <span>🏭</span> {t('products.brand')}
          </label>
          <select 
            value={selectedBrand}
            onChange={(e) => onBrandChange(e.target.value)}
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all cursor-pointer text-gray-700"
          >
            <option value="">{t('products.allBrands')}</option>
            {brands.map(brand => (
              <option key={brand._id || brand.name} value={brand?.name || brand}>
                {brand?.name || brand}
              </option>
            ))}
          </select>
        </div>

        {/* Price Range */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            <span>💰</span> {t('products.priceRange')}
          </label>
          <div className="flex gap-2 items-center">
            <input 
              type="number" 
              placeholder="Min"
              value={priceRange.minPrice || ''}
              onChange={(e) => onPriceRangeChange({ 
                ...priceRange, 
                minPrice: e.target.value ? Number(e.target.value) : undefined 
              })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all" 
            />
            <span className="text-gray-400 text-[12px] flex-shrink-0">–</span>
            <input 
              type="number" 
              placeholder="Max"
              value={priceRange.maxPrice || ''}
              onChange={(e) => onPriceRangeChange({ 
                ...priceRange, 
                maxPrice: e.target.value ? Number(e.target.value) : undefined 
              })}
              className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all" 
            />
          </div>
          
          {/* Quick price presets */}
          <div className="flex flex-wrap gap-1.5 mt-2">
            {[
              ['Under ৳1K', 0, 1000], 
              ['৳1K–5K', 1000, 5000], 
              ['৳5K–20K', 5000, 20000], 
              ['৳20K+', 20000, undefined]
            ].map(([label, min, max]) => (
              <button 
                key={label}
                onClick={() => handlePricePreset(min, max)}
                className={`px-2 py-1 rounded-lg text-[10px] font-medium border transition-all ${
                  priceRange.minPrice === (min || undefined) && priceRange.maxPrice === max
                    ? 'bg-[#0E8A6E] text-white border-[#0E8A6E]'
                    : 'bg-gray-50 text-gray-600 border-gray-200 hover:border-[#0E8A6E] hover:text-[#0E8A6E]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div>
          <label className="flex items-center gap-1.5 text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2">
            <span>📦</span> {t('products.availability')}
          </label>
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl hover:border-[#0E8A6E] hover:bg-[#0E8A6E]/5 transition-all cursor-pointer">
            <input 
              type="checkbox" 
              checked={inStock}
              onChange={(e) => onInStockChange(e.target.checked)}
              className="w-4 h-4 text-[#0E8A6E] border-gray-300 rounded focus:ring-[#0E8A6E] cursor-pointer accent-[#0E8A6E]" 
            />
            <span className="text-[13px] text-gray-700 font-medium">
              {t('products.inStockOnly')}
            </span>
          </label>
        </div>

        {/* Results count */}
        {totalResults > 0 && (
          <div className="pt-4 border-t border-gray-100">
            <div className="flex items-center justify-center gap-2 px-3 py-2.5 bg-[#0E8A6E]/8 border border-[#0E8A6E]/20 rounded-xl">
              <span className="text-[15px] font-bold text-[#0E8A6E]">
                {totalResults.toLocaleString()}
              </span>
              <span className="text-[12px] text-gray-600">
                {t('products.productsFound')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
