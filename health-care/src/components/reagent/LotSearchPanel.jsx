'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Spinner from '@/components/ui/Spinner';
import { API } from '@/constants/api';
import { getProductBrandName } from '@/utils/helpers';

export default function LotSearchPanel({ onClose }) {
  const router = useRouter();
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
      const res = await fetch(
        `${API}/products?category=Laboratory+Reagents&search=${encodeURIComponent(query.trim())}&limit=8`
      );
      const data = await res.json();
      setResults(data.products || data.data?.products || []);
    } catch {
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="rounded-xl border border-[#C6EDE4] bg-[#F0FBF8]/60 p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <p className="text-[12px] text-[#085041] leading-relaxed">
          Find a reagent by <strong>lot number</strong>, catalogue code, or SKU.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="text-[11px] text-[#6B7280] hover:text-[#0B2545] flex-shrink-0"
        >
          Close
        </button>
      </div>

      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. SER-2610010-HCG-VIAL-50"
          className="flex-1 px-3 py-2.5 border border-gray-200 rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E]"
        />
        <button
          type="submit"
          disabled={loading || !query.trim()}
          className="px-4 py-2.5 bg-[#0B2545] text-white rounded-lg text-[13px] font-semibold disabled:opacity-50 hover:bg-[#0d2d52]"
        >
          {loading ? <Spinner size="sm" /> : 'Find'}
        </button>
      </form>

      {searched && !loading && (
        <div className="mt-3">
          {results.length === 0 ? (
            <p className="text-[12px] text-[#6B7280] py-2 text-center">
              No match for &ldquo;{query}&rdquo;
            </p>
          ) : (
            <ul className="divide-y divide-[#C6EDE4]/80 rounded-lg border border-[#C6EDE4] bg-white overflow-hidden">
              {results.map((product) => (
                <li key={product._id}>
                  <button
                    type="button"
                    onClick={() => router.push(`/products/${product._id}`)}
                    className="w-full flex items-center gap-3 p-3 text-left hover:bg-surface-subtle transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-[#0B2545] truncate">{product.name}</p>
                      <p className="text-[11px] text-[#6B7280] mt-0.5">
                        {getProductBrandName(product) || '—'}
                        {product.lotNumber || product.sku
                          ? ` · ${product.lotNumber || product.sku}`
                          : ''}
                      </p>
                    </div>
                    <span className="text-[13px] font-semibold text-[#0B2545] flex-shrink-0">
                      ৳{(product.price || 0).toLocaleString()}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
