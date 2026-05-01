"use client";

import { useState, useEffect } from 'react';
import ReagentFilters from '@/components/reagent/ReagentFilters';
import ReagentToolbar from '@/components/reagent/ReagentToolbar';
import ReagentGrid from '@/components/reagent/ReagentGrid';
import LotSearch from '@/components/reagent/LotSearch';
import Breadcrumb from '@/components/ui/Breadcrumb';
import Spinner from '@/components/ui/Spinner';
import { API as API_BASE } from '@/constants/api';

export default function ReagentStorePage({ onNavigateToProduct }) {
  const [reagents, setReagents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    brands: [],
    categories: [],
    temperature: [],
    priceRange: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('relevance');
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchReagents = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({ category: 'Laboratory Reagents', limit: 20 });
        if (filters.brands?.length) params.set('brand', filters.brands[0]);
        if (filters.temperature?.length) params.set('storageTemp', filters.temperature[0].toLowerCase().includes('cold') ? 'cold' : filters.temperature[0].toLowerCase().includes('frozen') ? 'frozen' : 'room');
        if (searchQuery) params.set('search', searchQuery);
        if (sortBy === 'price-low') params.set('sortBy', 'price-low');
        else if (sortBy === 'price-high') params.set('sortBy', 'price-high');

        const res = await fetch(`${API_BASE}/products?${params}`);
        const data = await res.json();
        setReagents(data.products || data.data?.products || []);
        setTotal(data.total || data.data?.total || 0);
      } catch {
        setReagents([]);
      } finally {
        setLoading(false);
      }
    };

    fetchReagents();
  }, [filters, searchQuery, sortBy]);

  const breadcrumbs = [
    { label: 'Home', href: '/' },
    { label: 'Reagents & diagnostic kits', href: '#' }
  ];

  return (
    <div>
      <Breadcrumb items={breadcrumbs} />

      {/* Info Bar */}
      <div className="bg-[var(--color-background-primary)] border-b-[0.5px] border-[var(--color-border-tertiary)] px-6 py-3 flex gap-3 items-center flex-wrap">
        <span className="text-[12px] font-medium">Reagents & Diagnostic Kits</span>
        <span className="text-[11px] text-[var(--color-text-secondary)]">
          {total > 0 ? `${total} products` : 'Loading…'} · 35+ brands · Cold chain available
        </span>
        <div className="flex gap-[6px] ml-auto flex-wrap">
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-[2px] rounded bg-[#E6F1FB] text-[#0C447C] font-medium">
            ❄ Cold (2–8°C)
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-[2px] rounded bg-[#EEEDFE] text-[#3C3489] font-medium">
            🧊 Frozen (−20°C)
          </span>
          <span className="inline-flex items-center gap-1 text-[10px] px-2 py-[2px] rounded bg-[#E1F5EE] text-[#085041] font-medium">
            🌡 Room temp
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-[2px] rounded bg-[#FCEBEB] text-[#791F1F] font-medium">
            ⚠ Biohazard
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-[2px] rounded bg-[#FAEEDA] text-[#633806] font-medium">
            ⚠ Chemical
          </span>
          <span className="inline-flex items-center gap-1 text-[9px] px-2 py-[2px] rounded bg-[#E1F5EE] text-[#085041] font-medium">
            ✓ Safe
          </span>
        </div>
      </div>

      <div className="grid grid-cols-[220px_1fr] gap-0">
        {/* Filters Sidebar */}
        <ReagentFilters filters={filters} setFilters={setFilters} />

        {/* Main Content */}
        <div className="p-4 px-5">
          {/* Lot Search */}
          <LotSearch />

          <ReagentToolbar
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            sortBy={sortBy}
            setSortBy={setSortBy}
            totalCount={total}
          />

          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : reagents.length === 0 ? (
            <div className="text-center py-16 text-[13px] text-[var(--color-text-secondary)]">
              No reagents found matching your filters.
            </div>
          ) : (
            <ReagentGrid reagents={reagents} onProductClick={onNavigateToProduct} />
          )}
        </div>
      </div>
    </div>
  );
}
