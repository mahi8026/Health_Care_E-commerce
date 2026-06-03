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

export default function EnhancedSearchBox({ placeholder = 'Search medical equipment...', autoFocus = false, onClose }) {
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
        const response = await fetch(`${API}/products?q=${encodeURIComponent(debouncedQuery)}&limit=6`);
        if (!response.ok) {
          console.error('Search API error:', response.status, response.statusText);
          setSuggestions([]);
          return;
        }
        const data = await response.json();
        console.log('Search API response:', data); // Debug log
        
        // Handle different response structures
        let products = [];
        if (data.success && data.data?.products) {
          products = data.data.products;
        } else if (data.products) {
          products = data.products;
        } else if (Array.isArray(data)) {
          products = data;
        } else if (data.data && Array.isArray(data.data)) {
          products = data.data;
        }
        
        console.log('Parsed products:', products.length); // Debug log
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
    onClose?.();
  };

  const handleProductClick = (product) => {
    router.push(`/products/${product.slug || product._id}`);
    setIsOpen(false);
    setQuery('');
    onClose?.();
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
          className="w-full px-2 py-2 bg-transparent border-0 focus:outline-none text-[15px] text-gray-900 placeholder:text-gray-400"
        />
        {loading && (
          <div className="absolute right-2 top-1/2 -translate-y-1/2">
            <div className="w-4 h-4 border-2 border-[#0E8A6E] border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* Dropdown Content */}
      {isOpen && (query.length > 0 || recentSearches.length > 0) && (
        <div className="bg-white max-h-[calc(100vh-220px)] overflow-y-auto">
          {/* Popular Searches (shown when no query) */}
          {query.length === 0 && (
            <div className="p-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                <FaFire size={11} />
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-1.5">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-2.5 py-1 bg-gray-50 hover:bg-gray-100 rounded-full text-[11px] font-medium text-gray-700 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">
                <FaClock size={11} />
                Recent Searches
              </div>
              <div className="space-y-0.5">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(term)}
                    className="w-full text-left px-2.5 py-1.5 hover:bg-gray-50 rounded text-[13px] text-gray-700 transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Suggestions */}
          {suggestions.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <div className="text-[11px] font-semibold text-gray-500 mb-2 uppercase tracking-wide">Products</div>
              <div className="space-y-1">
                {suggestions.map((product, idx) => {
                  const img = typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url;
                  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
                  
                  return (
                    <button
                      key={product._id}
                      onClick={() => handleProductClick(product)}
                      className={`w-full flex items-center gap-2.5 p-2 rounded-lg transition-all ${
                        selectedIndex === idx ? 'bg-[#0E8A6E]/5 border border-[#0E8A6E]' : 'hover:bg-gray-50 border border-transparent'
                      }`}
                    >
                      <div className="w-12 h-12 flex-shrink-0 bg-gray-100 rounded-md overflow-hidden">
                        {img ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={img} alt={product.name} className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400 text-xl">
                            🏥
                          </div>
                        )}
                      </div>
                      <div className="flex-1 text-left min-w-0">
                        <div className="text-[13px] font-medium text-gray-900 line-clamp-1">{product.name}</div>
                        {brandName && (
                          <div className="text-[11px] text-gray-500 mt-0.5">{brandName}</div>
                        )}
                      </div>
                      <div className="text-[13px] font-bold text-[#0B2545] whitespace-nowrap">
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
            <div className="p-6 text-center border-t border-gray-100">
              <div className="text-4xl mb-2">🔍</div>
              <div className="text-[13px] font-medium text-gray-900 mb-1">No products found</div>
              <div className="text-[11px] text-gray-500">Try different keywords or browse categories</div>
            </div>
          )}

          {/* View all results */}
          {query.length >= 2 && suggestions.length > 0 && (
            <div className="p-3 border-t border-gray-100">
              <button
                onClick={() => handleSearch(query)}
                className="w-full py-2 bg-[#0E8A6E] hover:bg-[#0c7a61] text-white rounded-lg text-[13px] font-semibold transition-colors"
              >
                View all results for &quot;{query}&quot;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
