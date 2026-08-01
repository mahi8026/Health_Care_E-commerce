/**
 * ProductFiltersMobile - Mobile drawer version of product filters
 * 
 * Displays filters in a slide-out drawer for mobile devices.
 * All data and handlers are passed as props (no data fetching).
 */
export default function ProductFiltersMobile({
  isOpen,
  onClose,
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
  t = (key) => key, // Translation function
}) {
  if (!isOpen) return null;

  const handleCategoryChange = (value) => {
    onCategoryChange(value);
    onClose();
  };

  const handleBrandChange = (value) => {
    onBrandChange(value);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-modal lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose} 
      />
      
      {/* Drawer */}
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-lg overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-brand-navy to-[var(--color-brand-navy-hover)] flex items-center justify-between">
          <span className="text-white font-semibold text-sm">
            {t('products.filters')}
          </span>
          <button 
            onClick={onClose} 
            className="text-white/70 hover:text-white"
            aria-label="Close filters"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
        </div>

        {/* Filter content */}
        <div className="p-4 space-y-5">
          {/* Category */}
          <div role="group" aria-labelledby="pfm-category">
            <h3 id="pfm-category" className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">
              {t('products.category')}
            </h3>
            <select 
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              aria-label={t('products.category')}
              className="w-full px-3 py-2.5 border border-[var(--color-border-primary)] rounded-xl text-sm bg-white focus:outline-none focus:border-brand-teal"
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
          <div role="group" aria-labelledby="pfm-brand">
            <h3 id="pfm-brand" className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">
              {t('products.brand')}
            </h3>
            <select 
              value={selectedBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              aria-label={t('products.brand')}
              className="w-full px-3 py-2.5 border border-[var(--color-border-primary)] rounded-xl text-sm bg-white focus:outline-none focus:border-brand-teal"
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
          <div role="group" aria-labelledby="pfm-price">
            <h3 id="pfm-price" className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider mb-2 block">
              {t('products.priceRange')}
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
                className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-xl text-xs focus:outline-none focus:border-brand-teal" 
              />
              <span className="text-[var(--color-text-secondary)] text-xs">–</span>
              <input 
                type="number" 
                placeholder="Max" 
                aria-label={`${t('products.priceRange')} — max`}
                value={priceRange.maxPrice || ''}
                onChange={(e) => onPriceRangeChange({ 
                  ...priceRange, 
                  maxPrice: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 border border-[var(--color-border-primary)] rounded-xl text-xs focus:outline-none focus:border-brand-teal" 
              />
            </div>
          </div>

          {/* Availability */}
          <label className="flex items-center gap-3 p-3 border border-[var(--color-border-primary)] rounded-xl cursor-pointer">
            <input 
              type="checkbox" 
              checked={inStock}
              onChange={(e) => onInStockChange(e.target.checked)}
              className="w-4 h-4 accent-brand-teal" 
            />
            <span className="text-sm text-[var(--color-text-primary)] font-medium">
              {t('products.inStockOnly')}
            </span>
          </label>

          {/* Action buttons */}
          <button 
            onClick={() => { onClearAll(); onClose(); }}
            className="w-full py-2.5 border border-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] rounded-xl text-sm font-medium hover:bg-[var(--color-status-danger-tint)] transition-colors"
          >
            {t('products.clearAll')}
          </button>
          
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-brand-teal text-white rounded-xl text-sm font-semibold hover:bg-[var(--color-brand-teal-hover)] transition-colors"
          >
            {t('products.applyFilters')}
          </button>
        </div>
      </div>
    </div>
  );
}
