"use client";

import GA4Tracker from '@/services/GA4Tracker';

export default function SortOptions({ sortBy, onSortChange }) {
  const options = [
    { value: 'relevance', label: 'Most Relevant' },
    { value: 'price-low', label: 'Price: Low to High' },
    { value: 'price-high', label: 'Price: High to Low' },
    { value: 'name', label: 'Name: A to Z' },
    { value: 'newest', label: 'Newest First' },
    { value: 'popular', label: 'Most Popular' }
  ];

  const handleSortChange = (value) => {
    onSortChange(value);
    // Track sort applied
    GA4Tracker.trackSortApplied(value);
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-[12px] text-[var(--color-text-secondary)]">Sort by:</span>
      <select
        value={sortBy}
        onChange={(e) => handleSortChange(e.target.value)}
        aria-label="Sort products by"
        className="border-[0.5px] border-[var(--color-border-secondary)] rounded-lg px-3 py-2 text-[12px] bg-white cursor-pointer outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
}
