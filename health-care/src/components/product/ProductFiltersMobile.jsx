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
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={onClose} 
      />
      
      {/* Drawer */}
      <div className="absolute left-0 top-0 bottom-0 w-72 bg-white shadow-2xl overflow-y-auto">
        {/* Header */}
        <div className="px-5 py-4 bg-gradient-to-r from-[#0B2545] to-[#0d3060] flex items-center justify-between">
          <span className="text-white font-bold text-[14px]">
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
          <div>
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              {t('products.category')}
            </label>
            <select 
              value={selectedCategory}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E]"
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
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              {t('products.brand')}
            </label>
            <select 
              value={selectedBrand}
              onChange={(e) => handleBrandChange(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E]"
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
            <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mb-2 block">
              {t('products.priceRange')}
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
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-[#0E8A6E]" 
              />
              <span className="text-gray-400 text-[12px]">–</span>
              <input 
                type="number" 
                placeholder="Max" 
                value={priceRange.maxPrice || ''}
                onChange={(e) => onPriceRangeChange({ 
                  ...priceRange, 
                  maxPrice: e.target.value ? Number(e.target.value) : undefined 
                })}
                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-[12px] focus:outline-none focus:border-[#0E8A6E]" 
              />
            </div>
          </div>

          {/* Availability */}
          <label className="flex items-center gap-3 p-3 border border-gray-200 rounded-xl cursor-pointer">
            <input 
              type="checkbox" 
              checked={inStock}
              onChange={(e) => onInStockChange(e.target.checked)}
              className="w-4 h-4 accent-[#0E8A6E]" 
            />
            <span className="text-[13px] text-gray-700 font-medium">
              {t('products.inStockOnly')}
            </span>
          </label>

          {/* Action buttons */}
          <button 
            onClick={() => { onClearAll(); onClose(); }}
            className="w-full py-2.5 border border-red-200 text-red-600 rounded-xl text-[13px] font-medium hover:bg-red-50 transition-colors"
          >
            {t('products.clearAll')}
          </button>
          
          <button 
            onClick={onClose}
            className="w-full py-2.5 bg-[#0E8A6E] text-white rounded-xl text-[13px] font-semibold hover:bg-[#0c7a61] transition-colors"
          >
            {t('products.applyFilters')}
          </button>
        </div>
      </div>
    </div>
  );
}
