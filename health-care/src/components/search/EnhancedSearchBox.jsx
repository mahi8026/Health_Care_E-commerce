'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaTimes, FaClock, FaFire, FaShoppingCart, FaHeart, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
import { API } from '@/constants/api';
import { useDebounce } from '@/hooks/useDebounce';
import { useCart } from '@/context/CartContext';
import { useWishlist } from '@/context/WishlistContext';

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
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [recentSearches, setRecentSearches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const wrapperRef = useRef(null);
  const inputRef = useRef(null);

  const debouncedQuery = useDebounce(query, 300);

  // Highlight matching text
  const highlightMatch = (text, query) => {
    if (!query || !text) return text;
    const parts = text.split(new RegExp(`(${query})`, 'gi'));
    return parts.map((part, i) => 
      part.toLowerCase() === query.toLowerCase() ? 
        <mark key={i} className="bg-[#0E8A6E]/10 text-[#0E8A6E] font-semibold px-0.5 rounded">{part}</mark> : 
        part
    );
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    setRecentSearches(recent.slice(0, 5));
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        // Try multiple parameter variations to match backend
        const searchParams = new URLSearchParams({
          search: debouncedQuery,
          q: debouncedQuery,
          name: debouncedQuery,
          limit: '6'
        });
        
        const response = await fetch(`${API}/products?${searchParams.toString()}`);
        if (!response.ok) {
          setSuggestions([]);
          setLoading(false);
          return;
        }
        const data = await response.json();
        
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
    const productUrl = `/products/${product.slug || product._id}`;
    router.push(productUrl);
    setIsOpen(false);
    setQuery('');
    if (onClose) {
      onClose();
    }
  };

  const clearSearch = () => {
    setQuery('');
    setSuggestions([]);
    inputRef.current?.focus();
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Search Input */}
      <div className="relative px-5 py-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <FaSearch size={18} className="text-gray-400 flex-shrink-0" />
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
            className="flex-1 bg-transparent border-0 focus:outline-none text-[15px] text-gray-900 placeholder:text-gray-400"
          />
          {loading && (
            <div className="flex-shrink-0">
              <div className="w-5 h-5 border-2 border-[#0E8A6E] border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Content */}
      {isOpen && (query.length > 0 || recentSearches.length > 0) && (
        <div className="bg-white max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar">
          {/* Loading skeleton */}
          {loading && query.length >= 2 && (
            <div className="p-4 border-t border-gray-100">
              <div className="text-[11px] font-semibold text-gray-500 mb-3 uppercase tracking-wide">Searching...</div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border-2 border-transparent animate-pulse">
                    <div className="w-14 h-14 bg-gradient-to-br from-gray-200 to-gray-300 rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-3/4" />
                      <div className="h-2 bg-gradient-to-r from-gray-100 to-gray-200 rounded w-1/2" />
                    </div>
                    <div className="h-4 bg-gradient-to-r from-gray-200 to-gray-300 rounded w-16" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches (shown when no query) */}
          {query.length === 0 && (
            <div className="p-4 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 mb-3 uppercase tracking-wide">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-red-500 flex items-center justify-center">
                  <FaFire size={11} className="text-white" />
                </div>
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    onClick={() => handleSearch(term)}
                    className="px-3 py-1.5 bg-white hover:bg-gradient-to-r hover:from-[#0E8A6E] hover:to-[#0c7a61] border border-gray-200 hover:border-transparent rounded-full text-[11px] font-medium text-gray-700 hover:text-white transition-all duration-200 hover:shadow-md hover:scale-105"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <FaClock size={10} className="text-white" />
                  </div>
                  Recent Searches
                </div>
                <button
                  onClick={() => {
                    localStorage.removeItem('recentSearches');
                    setRecentSearches([]);
                  }}
                  className="text-[10px] text-gray-400 hover:text-red-500 transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSearch(term)}
                    className="w-full text-left px-3 py-2 hover:bg-gradient-to-r hover:from-gray-50 hover:to-gray-100 rounded-lg text-[13px] text-gray-700 hover:text-gray-900 transition-all duration-150 flex items-center justify-between group"
                  >
                    <span>{term}</span>
                    <FaSearch size={10} className="text-gray-300 group-hover:text-[#0E8A6E] transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Suggestions */}
          {!loading && suggestions.length > 0 && (
            <div className="p-4 border-t border-gray-100">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">Products</div>
                <div className="text-[10px] text-gray-400">{suggestions.length} results</div>
              </div>
              <div className="space-y-1.5">
                {suggestions.map((product, idx) => {
                  const img = typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url;
                  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
                  const inStock = product.stock > 0;
                  const isHovered = hoveredProduct === product._id;
                  const inWishlist = isInWishlist(product._id);
                  
                  return (
                    <div
                      key={product._id}
                      onMouseEnter={() => setHoveredProduct(product._id)}
                      onMouseLeave={() => setHoveredProduct(null)}
                      onClick={() => handleProductClick(product)}
                      className={`relative group rounded-xl transition-all duration-200 cursor-pointer ${
                        selectedIndex === idx 
                          ? 'bg-gradient-to-r from-[#0E8A6E]/5 to-[#0E8A6E]/10 border-2 border-[#0E8A6E] shadow-lg shadow-[#0E8A6E]/10' 
                          : 'hover:bg-gray-50 border-2 border-transparent hover:border-gray-200 hover:shadow-md'
                      }`}
                      role="button"
                      tabIndex={0}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleProductClick(product);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3 p-2.5">
                        {/* Product Image */}
                        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl overflow-hidden border border-gray-200 group-hover:border-[#0E8A6E]/30 transition-all duration-200 group-hover:shadow-md relative">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              🏥
                            </div>
                          )}
                          {/* Stock badge */}
                          {!inStock && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center pointer-events-none">
                              <span className="text-white text-[9px] font-bold">OUT</span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-[13px] font-semibold text-gray-900 line-clamp-1 group-hover:text-[#0E8A6E] transition-colors">
                            {highlightMatch(product.name, query)}
                          </div>
                          {brandName && (
                            <div className="text-[11px] text-gray-500 mt-0.5 flex items-center gap-1.5">
                              <span>{brandName}</span>
                              {inStock && product.stock < 10 && (
                                <span className="inline-flex items-center gap-0.5 text-[9px] text-orange-600 font-medium">
                                  <FaExclamationTriangle size={8} />
                                  Low stock
                                </span>
                              )}
                            </div>
                          )}
                          {/* Category tag */}
                          {product.category && (
                            <div className="mt-1">
                              <span className="inline-block px-1.5 py-0.5 bg-gray-100 text-gray-600 rounded text-[9px] font-medium pointer-events-none">
                                {typeof product.category === 'object' ? product.category.name : product.category}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Price & Actions */}
                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                          <div className="text-[14px] font-bold text-[#0B2545]">
                            {product.price > 0 ? (
                              <span className="flex items-baseline gap-0.5">
                                <span className="text-[10px] text-gray-500">৳</span>
                                {product.price.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-[11px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">
                                Quote
                              </span>
                            )}
                          </div>
                          
                          {/* Quick actions - show on hover */}
                          {isHovered && inStock && (
                            <div className="flex gap-1 animate-fade-in">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToWishlist(product);
                                }}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${
                                  inWishlist
                                    ? 'bg-red-50 text-red-500 hover:bg-red-100'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                                title="Add to wishlist"
                              >
                                <FaHeart size={11} className={inWishlist ? 'fill-current' : ''} />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
                                className="p-1.5 bg-[#0E8A6E] hover:bg-[#0c7a61] text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
                                title="Add to cart"
                              >
                                <FaShoppingCart size={11} />
                              </button>
                            </div>
                          )}
                          
                          {/* Stock status */}
                          {inStock && product.stock >= 10 && (
                            <div className="flex items-center gap-1 text-green-600 text-[9px] font-medium">
                              <FaCheck size={8} />
                              <span>In Stock</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !loading && suggestions.length === 0 && (
            <div className="p-10 text-center border-t border-gray-100">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                <FaSearch size={32} className="text-gray-400" />
              </div>
              <div className="text-[15px] font-semibold text-gray-900 mb-2">No products found</div>
              <div className="text-[13px] text-gray-500 mb-4">
                We couldn&apos;t find any matches for &quot;<span className="font-semibold text-gray-700">{query}</span>&quot;
              </div>
              <div className="text-[12px] text-gray-400">
                Try different keywords or browse our categories
              </div>
            </div>
          )}

          {/* View all results */}
          {query.length >= 2 && suggestions.length > 0 && (
            <div className="p-4 border-t border-gray-100 bg-gray-50">
              <button
                onClick={() => handleSearch(query)}
                className="w-full py-2.5 bg-gradient-to-r from-[#0E8A6E] to-[#0c7a61] hover:from-[#0c7a61] hover:to-[#0E8A6E] text-white rounded-xl text-[13px] font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-[#0E8A6E]/30 hover:scale-[1.02] flex items-center justify-center gap-2"
              >
                <FaSearch size={12} />
                View all results for &quot;{query}&quot;
              </button>
            </div>
          )}
        </div>
      )}

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: linear-gradient(180deg, #0E8A6E, #0c7a61);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #0c7a61, #0E8A6E);
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: scale(0.95);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }
        .animate-fade-in {
          animation: fadeIn 0.15s ease-out;
        }
      `}</style>
    </div>
  );
}
