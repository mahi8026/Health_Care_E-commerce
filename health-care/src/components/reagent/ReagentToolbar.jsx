'use client';

export default function ReagentToolbar({ searchQuery, setSearchQuery, sortBy, setSortBy, totalCount }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {/* Search */}
      <div className="flex-1 relative">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by product name, lot number, or brand..."
          className="w-full pl-9 pr-3 py-[9px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:border-[#0E8A6E]"
        />
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-tertiary)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
      </div>

      {/* Sort */}
      <select
        value={sortBy}
        onChange={(e) => setSortBy(e.target.value)}
        className="px-3 py-[9px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:border-[#0E8A6E] bg-white min-w-[160px]"
      >
        <option value="relevance">Sort by: Relevance</option>
        <option value="price-low">Price: Low to High</option>
        <option value="price-high">Price: High to Low</option>
        <option value="expiry">Expiry date</option>
        <option value="brand">Brand A-Z</option>
      </select>

      {/* Results Count */}
      <div className="text-[12px] text-[var(--color-text-secondary)] whitespace-nowrap">
        {totalCount} products
      </div>
    </div>
  );
}
