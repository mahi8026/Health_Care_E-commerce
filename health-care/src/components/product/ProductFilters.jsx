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
    <div className="bg-white rounded-2xl shadow-sm border border-[var(--color-border-tertiary)] overflow-hidden sticky top-24">
      {/* Sidebar header */}
      <div className="px-4 py-3 bg-gradient-to-r from-brand-navy to-[var(--color-brand-navy-hover)] flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <line x1="4" y1="6" x2="20" y2="6"/><line x1="8" y1="12" x2="20" y2="12"/><line x1="12" y1="18" x2="20" y2="18"/>
          </svg>
          <span className="text-white font-semibold text-sm">{t('products.filters')}</span>
        </div>
        {hasActiveFilters && (
          <button 
            onClick={onClearAll}
            className="text-xs text-red-300 hover:text-red-200 font-medium transition-colors"
          >
            {t('products.clearAll')}
          </button>
        )}
      </div>

      <div className="p-3 space-y-4">
        {/* Category */}
        <div role="group" aria-labelledby="pf-category">
          <h3 id="pf-category" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            <span>📂</span> {t('products.category')}
          </h3>
          <select 
            value={selectedCategory}
            onChange={(e) => onCategoryChange(e.target.value)}
            aria-label={t('products.category')}
            className="w-full px-3 py-2.5 border border-[var(--color-border-primary)] rounded-xl text-base bg-white focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10 transition-all cursor-pointer text-[var(--color-text-primary)]"
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
        <div role="group" aria-labelledby="pf-brand">
          <h3 id="pf-brand" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            <span>🏭</span> {t('products.brand')}
          </h3>
          <select 
            value={selectedBrand}
            onChange={(e) => onBrandChange(e.target.value)}
            aria-label={t('products.brand')}
            className="w-full px-3 py-2.5 border border-[var(--color-border-primary)] rounded-xl text-base bg-white focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10 transition-all cursor-pointer text-[var(--color-text-primary)]"
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
        <div role="group" aria-labelledby="pf-price">
          <h3 id="pf-price" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            <span>💰</span> {t('products.priceRange')}
          </h3>
          <div className="flex gap-2 items-center">
            <input 
              type="number" 
              placeholder="Min"
              aria-label={`${t('products.priceRange')} — min`}
              value={priceRange.minPrice || ''}
              onChange={(e) => onPriceRangeChange({ 
                ...priceRange, 
                minPrice: e.target.value ? Number(e.target.value) : undefined 
              })}
              className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-xl text-base focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10 transition-all" 
            />
            <span className="text-[var(--color-text-secondary)] text-xs flex-shrink-0">–</span>
            <input 
              type="number" 
              placeholder="Max"
              aria-label={`${t('products.priceRange')} — max`}
              value={priceRange.maxPrice || ''}
              onChange={(e) => onPriceRangeChange({ 
                ...priceRange, 
                maxPrice: e.target.value ? Number(e.target.value) : undefined 
              })}
              className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-xl text-base focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/10 transition-all" 
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
                className={`px-2 py-1 rounded-lg text-xs font-medium border transition-all ${
                  priceRange.minPrice === (min || undefined) && priceRange.maxPrice === max
                    ? 'bg-brand-teal text-white border-brand-teal'
                    : 'bg-[var(--color-background-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-primary)] hover:border-brand-teal hover:text-brand-teal'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Availability */}
        <div role="group" aria-labelledby="pf-availability">
          <h3 id="pf-availability" className="flex items-center gap-1.5 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2">
            <span>📦</span> {t('products.availability')}
          </h3>
          <label className="flex items-center gap-3 p-3 border border-[var(--color-border-primary)] rounded-xl hover:border-brand-teal hover:bg-brand-teal/5 transition-all cursor-pointer">
            <input 
              type="checkbox" 
              checked={inStock}
              onChange={(e) => onInStockChange(e.target.checked)}
              className="w-4 h-4 text-brand-teal border-[var(--color-border-primary)] rounded focus:ring-brand-teal cursor-pointer accent-brand-teal" 
            />
            <span className="text-sm text-[var(--color-text-primary)] font-medium">
              {t('products.inStockOnly')}
            </span>
          </label>
        </div>

        {/* Results count */}
        {totalResults > 0 && (
          <div className="pt-4 border-t border-[var(--color-border-tertiary)]">
            <div className="flex items-center justify-center gap-2 px-3 py-2.5 bg-brand-teal/8 border border-brand-teal/20 rounded-xl">
              <span className="text-base font-semibold text-brand-teal">
                {totalResults.toLocaleString()}
              </span>
              <span className="text-xs text-[var(--color-text-secondary)]">
                {t('products.productsFound')}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
