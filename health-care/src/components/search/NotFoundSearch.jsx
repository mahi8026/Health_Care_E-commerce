'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NotFoundSearch() {
  const router = useRouter();
  const [query, setQuery] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q) {
      router.push(`/products?q=${encodeURIComponent(q)}`);
    } else {
      router.push('/products');
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      role="search"
      className="flex flex-col sm:flex-row gap-2 max-w-xl mx-auto mb-10"
    >
      <label htmlFor="not-found-search" className="sr-only">
        Search products on MediportBD
      </label>
      <input
        id="not-found-search"
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search medical equipment, reagents, instruments…"
        className="flex-1 rounded-lg border border-[var(--color-border-primary)] bg-white px-4 py-3 text-sm text-[var(--color-text-primary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-brand-teal)]"
      />
      <button
        type="submit"
        className="rounded-lg bg-brand-teal px-6 py-3 text-sm font-semibold text-white hover:bg-[var(--color-brand-teal-hover)] transition-colors"
      >
        Search
      </button>
    </form>
  );
}
