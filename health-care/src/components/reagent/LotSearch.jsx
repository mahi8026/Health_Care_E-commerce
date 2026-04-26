"use client";

import { useState } from 'react';
import Spinner from '@/components/ui/Spinner';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export default function LotSearch() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(`${API}/api/products?lotNumber=${encodeURIComponent(query.trim())}&limit=10`);
      const data = await res.json();
      setResults(data.products || data.data?.products || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setSearched(false);
  };

  return (
    <div className="mb-4">
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search by lot number / catalogue no. / expiry date"
            className="w-full px-4 py-[10px] pl-9 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] focus:outline-none focus:border-[#0E8A6E]"
          />
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[14px]">🔍</span>
        </div>
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-[10px] bg-[#0B2545] text-white rounded-lg text-[12px] font-semibold disabled:opacity-50 hover:bg-[#0d2d52] transition-colors"
        >
          {loading ? <Spinner size="small" color="white" /> : 'Search'}
        </button>
        {searched && (
          <button
            type="button"
            onClick={handleClear}
            className="px-3 py-[10px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)]"
          >
            Clear
          </button>
        )}
      </form>

      {/* Results */}
      {searched && !loading && (
        <div className="mt-3">
          {results.length === 0 ? (
            <div className="text-[12px] text-[var(--color-text-secondary)] py-3 text-center bg-[var(--color-background-tertiary)] rounded-lg">
              No reagents found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-[11px] text-[var(--color-text-secondary)] mb-2">
                {results.length} result{results.length !== 1 ? 's' : ''} for &ldquo;{query}&rdquo;
              </p>
              {results.map(product => (
                <div
                  key={product._id}
                  className="flex items-center gap-3 p-3 bg-white border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg"
                >
                  <div className="flex-1">
                    <div className="text-[12px] font-medium font-[family-name:var(--font-plus-jakarta)]">
                      {product.name}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">
                      {product.brand} · Lot: {product.lotNumber || '—'} · Expiry: {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString('en-BD', { month: 'short', year: 'numeric' }) : '—'}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      ৳{(product.price || 0).toLocaleString()}
                    </div>
                    <div className={`text-[10px] font-medium ${product.stock > 0 ? 'text-[#065F46]' : 'text-[#991B1B]'}`}>
                      {product.stock > 0 ? 'In stock' : 'Out of stock'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
