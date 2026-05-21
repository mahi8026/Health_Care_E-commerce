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
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#9CA3AF]"
            size={14}
            aria-hidden
          />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by product name, brand, or SKU…"
            className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-xl text-[14px] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/15 bg-white shadow-sm"
            aria-label="Search reagents"
          />
        </div>

        <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="flex-1 sm:flex-none px-3 py-3 border border-gray-200 rounded-xl text-[13px] text-[#374151] bg-white shadow-sm focus:outline-none focus:border-[#0E8A6E] min-w-[140px]"
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
            className={`inline-flex items-center gap-2 px-3.5 py-3 rounded-xl text-[13px] font-medium border transition-colors whitespace-nowrap ${
              lotOpen
                ? 'border-[#0E8A6E] bg-[#F0FBF8] text-[#0E8A6E]'
                : 'border-gray-200 bg-white text-[#374151] hover:border-gray-300 shadow-sm'
            }`}
            aria-expanded={lotOpen}
          >
            <FaFlask size={13} />
            Lot lookup
            {lotOpen ? <FaChevronUp size={10} /> : <FaChevronDown size={10} />}
          </button>
        </div>
      </div>

      <div className="flex items-center justify-between text-[12px] text-[#6B7280] px-0.5">
        <span>
          {loading ? 'Loading catalog…' : (
            <>
              <span className="font-semibold text-[#0B2545]">{totalCount.toLocaleString()}</span>
              {' '}reagents
            </>
          )}
        </span>
        <span className="hidden sm:inline text-[11px]">
          Cold chain · MSDS on request
        </span>
      </div>

      {lotOpen && (
        <LotSearchPanel onClose={() => setLotOpen(false)} />
      )}
    </div>
  );
}
