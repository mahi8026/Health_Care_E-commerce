export default function ReagentFilters({ filters, setFilters }) {
  const brands = [
    'Roche Diagnostics',
    'Abbott Laboratories',
    'Siemens Healthineers',
    'Beckman Coulter',
    'bioMérieux',
    'BD Diagnostics',
    'Thermo Fisher',
    'Danaher (Beckman)'
  ];

  const categories = [
    'Haematology',
    'Clinical chemistry',
    'Immunoassay',
    'Microbiology',
    'Molecular diagnostics',
    'Coagulation',
    'Urinalysis'
  ];

  const temperatures = [
    'Cold (2–8°C)',
    'Frozen (−20°C)',
    'Room temperature'
  ];

  const hazards = [
    'Biohazard',
    'Chemical hazard',
    'Safe to handle'
  ];

  const toggleFilter = (category, value) => {
    setFilters(prev => {
      const current = prev[category] || [];
      const updated = current.includes(value)
        ? current.filter(item => item !== value)
        : [...current, value];
      return { ...prev, [category]: updated };
    });
  };

  return (
    <div className="bg-white border-r-[0.5px] border-[var(--color-border-tertiary)] p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
          Filters
        </h3>
        <button
          onClick={() => setFilters({ brands: [], categories: [], temperature: [], priceRange: 50000 })}
          className="text-[11px] text-[#0E8A6E] font-medium"
        >
          Clear all
        </button>
      </div>

      {/* Brand Filter */}
      <div className="mb-5">
        <div className="text-[12px] font-medium mb-2 font-[family-name:var(--font-plus-jakarta)]">
          Brand
        </div>
        <div className="space-y-2">
          {brands.map(brand => (
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
      </div>

      {/* Category Filter */}
      <div className="mb-5 pb-5 border-b-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="text-[12px] font-medium mb-2 font-[family-name:var(--font-plus-jakarta)]">
          Category
        </div>
        <div className="space-y-2">
          {categories.map(category => (
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
          onChange={(e) => setFilters({ ...filters, priceRange: parseInt(e.target.value) })}
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
          {temperatures.map(temp => (
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
          {hazards.map(hazard => (
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
