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
    <form onSubmit={handleSubmit} className="bg-[var(--color-background-primary)] border-b-[0.5px] border-[var(--color-border-tertiary)] px-6 py-4">
      <div className="flex gap-3 items-center max-w-6xl mx-auto">
        <div className="flex-1 flex items-center border-[0.5px] border-[var(--color-border-secondary)] rounded-lg bg-[var(--color-background-secondary)] px-4 h-[42px] gap-2">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="flex-shrink-0 opacity-40">
            <circle cx="11" cy="11" r="8"/>
            <path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={handleChange}
            placeholder={placeholder}
            aria-label="Search products"
            className="flex-1 border-none outline-none bg-transparent text-[13px] text-[var(--color-text-primary)] font-[family-name:var(--font-plus-jakarta)]"
          />
          <div className="w-[0.5px] h-5 bg-[var(--color-border-secondary)]"></div>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            aria-label="Filter by category"
            className="border-none bg-transparent text-[12px] text-[var(--color-text-secondary)] cursor-pointer px-2 font-[family-name:var(--font-plus-jakarta)] outline-none"
          >
            <option value="all">All categories</option>
            <option value="Diagnostic Equipment">Diagnostic Equipment</option>
            <option value="Surgical Instruments">Surgical Instruments</option>
            <option value="Laboratory Reagents">Laboratory Reagents</option>
            <option value="Lab Equipment">Lab Equipment</option>
            <option value="PPE & Disposables">PPE & Disposables</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-[#0B2545] text-white border-none px-5 h-[42px] rounded-lg text-[13px] font-medium cursor-pointer whitespace-nowrap font-[family-name:var(--font-plus-jakarta)] hover:bg-[#0d2d52]"
        >
          Search
        </button>
        <button
          type="button"
          className="bg-[#0E8A6E] text-white border-none px-5 h-[42px] rounded-lg text-[13px] font-medium cursor-pointer whitespace-nowrap font-[family-name:var(--font-plus-jakarta)] hover:bg-[#0c7a61]"
        >
          Advanced filter
        </button>
      </div>

      {/* Popular Searches */}
      <div className="flex gap-2 mt-3 flex-wrap max-w-6xl mx-auto">
        <span className="text-[11px] text-[var(--color-text-secondary)] py-[5px]">Popular:</span>
        {['ECG Machine', 'Suction Device', 'HbA1c Kit', 'Surgical Gloves', 'Pulse Oximeter'].map((term) => (
          <button
            key={term}
            type="button"
            onClick={() => {
              setQuery(term);
              const searchParams = { query: term, category: '' };
              onSearch(searchParams);
              // Track popular search click
              GA4Tracker.trackSearch(term, 0);
            }}
            className="text-[11px] px-3 py-[5px] rounded-[20px] border-[0.5px] border-[var(--color-border-secondary)] cursor-pointer text-[var(--color-text-secondary)] bg-[var(--color-background-primary)] whitespace-nowrap hover:border-[#0B2545] hover:text-[#0B2545]"
          >
            {term}
          </button>
        ))}
      </div>
    </form>
  );
}
