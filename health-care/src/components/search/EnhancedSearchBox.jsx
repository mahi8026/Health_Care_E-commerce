'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaTimes, FaClock, FaFire } from 'react-icons/fa';
import { API } from '@/constants/api';
import { useDebounce } from '@/hooks/useDebounce';

const POPULAR_SEARCHES = [
  'ECG Machine',
  'HbA1c Kit',
  'Ventilator',
  'Pulse Oximeter',
  'Surgical Set',
  'Blood Pressure Monitor',
];

export default function EnhancedSearchBox({ placeholder = 'Search medical equipment...', autoFocus = false }) {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent.slice(0, 5));
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API}/products?search=${encodeURIComponent(debouncedQuery)}&limit=6`);
        const data = await response.json();
        const products = data.data?.products || data.products || [];
        setSuggestions(products);
      } catch (error) {
        console.error('Search error:', error);
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.min(prev + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => Math.max(prev - 1, -1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && suggestions[selectedIndex]) {
        handleProductClick(suggestions[selectedIndex]);
      } else {
        handleSearch(query);
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
    }
  };

  const handleSearch = (searchTerm) => {
    if (!searchTerm.trim()) return;

    // Save to recent searches
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    const updated = [searchTerm, ...recent.filter((s) => s !== searchTerm)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(updated));

    router.push(`/products?q=${encodeURIComponent(searchTerm.trim())}`);
    setIsOpen(false);
    setQuery('');
  };

  const handleProductClick = (product) => {
    router.push(`/products/${product.slug || product._id}`);
    setIsOpen(false);
    setQuery('');
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <FaSearch size={18} />
        </div>
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
            setSelectedIndex(-1);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoFocus={autoFocus}
          className="w-full pl-12 pr-12 py-3.5 rounded-xl border border-gray-200 focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/20 outline-none transition-all text-[14px]"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <FaTimes size={16} />
          </button>
        )}
        {loading && (
          <div className="absolute right-4 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#0E8A6E] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown */}
      {isOpen && (query.length > 0 || recentSearches.length > 0) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-2xl border border-gray-100 max-h-[500px] overflow-y-auto z-50 animate-slide-down">
          {/* Popular Searches (shown when no query) */}
          {query.length === 0 && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-3">
                <FaFire size={12} />
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-3 py-1.5 bg-gray-50 hover:bg-gray-100 rounded-full text-xs font-medium text-gray-700 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="p-4 border-b border-gray-100">
              <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mb-3">
                <FaClock size={12} />
                Recent Searches
              </div>
              <div className="space-y-1">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(term)}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50 rounded-lg text-sm text-gray-700 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-4">
              <div className="text-xs font-semibold text-gray-500 mb-3">Products</div>
              <div className="space-y-2">
                {suggestions.map((product, idx) => {
                  const img = typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url;
                  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
                  
                  return (
                    <button
                      key={product._id}
                      onClick={() => handleProductClick(product)}
                      className={`w-full flex items-center gap-3 p-3 rounded-lg transition-all ${
                        selectedIndex === idx ? 'bg-[#0E8A6E]/5 border border-[#0E8A6E]' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="w-14 h-14 flex-shrink-0 bg-gray-100 rounded-lg overflow-hidden">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-2xl">
                            🏥
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-sm font-medium text-gray-900 truncate">{product.name}</div>
                        {brandName && (
                          <div className="text-xs text-gray-500 mt-0.5">{brandName}</div>
                        )}
                      </div>
                      <div className="text-sm font-bold text-[#0B2545] whitespace-nowrap">
                        {product.price > 0 ? `৳${product.price.toLocaleString()}` : 'Quote'}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !loading && suggestions.length === 0 && (
            <div className="p-8 text-center">
              <div className="text-4xl mb-3">🔍</div>
              <div className="text-sm font-medium text-gray-900 mb-1">No products found</div>
              <div className="text-xs text-gray-500">Try different keywords</div>
            </div>
          )}

          {/* View all results */}
          {query.length >= 2 && suggestions.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => handleSearch(query)}
                className="w-full py-2.5 bg-[#0E8A6E] hover:bg-[#0c7a61] text-white rounded-lg text-sm font-semibold transition-colors"
              >
                View all results for &quot;{query}&quot;
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateY(-10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .animate-slide-down {
          animation: slide-down 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
