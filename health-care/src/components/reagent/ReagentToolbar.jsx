'use client';

import { useState } from 'react';
import { FaSearch, FaFlask, FaChevronDown, FaChevronUp } from 'react-icons/fa';
import LotSearchPanel from './LotSearchPanel';

export default function ReagentToolbar({
  searchQuery,
  setSearchQuery,
  sortBy,
  setSortBy,
  totalCount,
  loading,
}) {
  const [lotOpen, setLotOpen] = useState(false);

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-col lg:flex-row lg:items-center gap-3">
        {/* Primary search */}
        <div className="flex-1 relative">
          <FaSearch
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]"
            size={14}
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, brand, or SKU…"
            className="w-full pl-10 pr-4 py-3 border border-[var(--color-border-primary)] rounded-xl text-sm text-[var(--color-text-primary)] placeholder:text-[var(--color-text-tertiary)] focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15 bg-white shadow-sm"
            aria-label="Search reagents"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-3 border border-[var(--color-border-primary)] rounded-xl text-sm text-[var(--color-text-primary)] bg-white shadow-sm focus:outline-none focus:border-brand-teal min-w-[140px]"
            aria-label="Sort products"
          >
            <option value="relevance">Relevance</option>
            <option value="price-low">Price: low to high</option>
            <option value="price-high">Price: high to low</option>
            <option value="brand">Brand A–Z</option>
          </select>

          <button
            type="button"
            onClick={() => setLotOpen((v) => !v)}
            className={`inline-flex items-center gap-2 px-3.5 py-3 rounded-xl text-sm font-medium border transition-colors whitespace-nowrap ${
              lotOpen
                ? 'border-brand-teal bg-brand-teal-tint text-brand-teal'
                : 'border-[var(--color-border-primary)] bg-white text-[var(--color-text-primary)] hover:border-[var(--color-border-primary)] shadow-sm'
            }`}
            aria-expanded={lotOpen}
          >
            <FaFlask size={13} />
            Lot lookup
            {lotOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-[var(--color-text-secondary)] px-0.5">
        <span>
          {loading ? 'Loading catalog…' : (
            <>
              <span className="font-semibold text-brand-navy">{totalCount.toLocaleString()}</span>
              {' '}reagents
            </>
          )}
        </span>
        <span className="hidden sm:inline text-xs">
          Cold chain · MSDS on request
        </span>
      </div>

      {lotOpen && (
        <LotSearchPanel onClose={() => setLotOpen(false)} />
      )}
    </div>
  );
}
