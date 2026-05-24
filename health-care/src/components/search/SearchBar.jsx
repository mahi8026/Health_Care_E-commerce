"use client";

import { useState } from 'react';
import GA4Tracker from '@/services/GA4Tracker';

export default function SearchBar({ onSearch, placeholder = "Search products..." }) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');

  const handleSubmit = (e) => {
    e.preventDefault();
    const searchParams = { query, category: category === 'all' ? '' : category };
    onSearch(searchParams);
    // Track search event (result count will be tracked by parent component)
    // For now, we'll track with 0 results, parent should update if needed
    GA4Tracker.trackSearch(query, 0);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    // Real-time search with debounce would go here
  };

  return (
    <form onSubmit={handleSubmit} className="bg-[var(--color-background-primary)] border-b-[0.5px] border-[var(--color-border-tertiary)] px-3 sm:px-4 md:px-6 py-2 md:py-3">
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 items-stretch sm:items-center max-w-6xl mx-auto">
        <div className="flex-1 flex items-center border-[0.5px] border-[var(--color-border-secondary)] rounded-lg bg-[var(--color-background-secondary)] px-3 md:px-4 h-[38px] sm:h-[42px] gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0 opacity-40 sm:w-4 sm:h-4">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder={placeholder}
            aria-label="Search products"
            className="flex-1 border-none outline-none bg-transparent text-[16px] sm:text-[13px] text-[var(--color-text-primary)] font-[family-name:var(--font-plus-jakarta)] min-w-0"
          />
          <div className="w-[0.5px] h-4 sm:h-5 bg-[var(--color-border-secondary)] hidden sm:block"></div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="border-none bg-transparent text-[11px] sm:text-[12px] text-[var(--color-text-secondary)] cursor-pointer px-1 sm:px-2 font-[family-name:var(--font-plus-jakarta)] outline-none hidden sm:block"
          >
            <option value="all">All categories</option>
            <option value="Diagnostic Equipment">Diagnostic Equipment</option>
            <option value="Surgical Instruments">Surgical Instruments</option>
            <option value="Laboratory Reagents">Laboratory Reagents</option>
            <option value="Lab Equipment">Lab Equipment</option>
            <option value="PPE & Disposables">PPE & Disposables</option>
          </select>
        </div>
        <div className="flex gap-2 sm:gap-3">
          <button
            type="submit"
            className="flex-1 sm:flex-none bg-[#0B2545] text-white border-none px-4 sm:px-5 h-[38px] sm:h-[42px] rounded-lg text-[12px] sm:text-[13px] font-medium cursor-pointer whitespace-nowrap font-[family-name:var(--font-plus-jakarta)] hover:bg-[#0d2d52]"
          >
            Search
          </button>
          <button
            type="button"
            className="hidden md:block bg-[#0E8A6E] text-white border-none px-4 sm:px-5 h-[38px] sm:h-[42px] rounded-lg text-[12px] sm:text-[13px] font-medium cursor-pointer whitespace-nowrap font-[family-name:var(--font-plus-jakarta)] hover:bg-[#0c7a61]"
          >
            Advanced filter
          </button>
        </div>
      </div>
      {/* Mobile category selector */}
      <div className="sm:hidden mt-2">
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          aria-label="Filter by category"
          className="w-full border-[0.5px] border-[var(--color-border-secondary)] bg-[var(--color-background-secondary)] rounded-lg px-3 py-2 text-[11px] text-[var(--color-text-secondary)] cursor-pointer font-[family-name:var(--font-plus-jakarta)] outline-none"
        >
          <option value="all">All categories</option>
          <option value="Diagnostic Equipment">Diagnostic Equipment</option>
          <option value="Surgical Instruments">Surgical Instruments</option>
          <option value="Laboratory Reagents">Laboratory Reagents</option>
          <option value="Lab Equipment">Lab Equipment</option>
          <option value="PPE & Disposables">PPE & Disposables</option>
        </select>
      </div>
    </form>
  );
}
