'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { FaSearch, FaClock, FaFire, FaShoppingCart, FaHeart, FaCheck, FaExclamationTriangle } from 'react-icons/fa';
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

export default function EnhancedSearchBox({ placeholder = 'Search medical equipment...', autoFocus = false, onClose, variant = 'default' }) {
  const isHero = variant === 'hero';
  const router = useRouter();
  const { addToCart } = useCart();
  const { addToWishlist, isInWishlist } = useWishlist();
  const [query, setQuery] = useState('');
  // When inside a modal (onClose provided) start open; standalone starts closed
  const [isOpen, setIsOpen] = useState(!!onClose);
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
        <mark key={i} className="bg-brand-teal/10 text-brand-teal font-semibold px-0.5 rounded">{part}</mark> : 
        part
    );
  };

  // Load recent searches from localStorage
  useEffect(() => {
    const recent = JSON.parse(localStorage.getItem('recentSearches') || '[]');
    void Promise.resolve().then(() => setRecentSearches(recent.slice(0, 5)));
  }, []);

  // Fetch suggestions
  useEffect(() => {
    if (debouncedQuery.trim().length < 2) {
      void Promise.resolve().then(() => setSuggestions([]));
      return;
    }

    const fetchSuggestions = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API}/products?search=${encodeURIComponent(debouncedQuery)}&limit=6`);
        if (!response.ok) {
          setSuggestions([]);
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
        setSuggestions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSuggestions();
  }, [debouncedQuery]);

  // Close internal dropdown when clicking outside (only relevant when used standalone)
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    // Only attach when no onClose prop (standalone mode, not inside a modal)
    if (!onClose) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [onClose]);

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
    
    // Close the search modal and dropdown
    setIsOpen(false);
    onClose?.();
    
    // Clear query
    setQuery('');
    
    // Navigate to product page
    router.push(productUrl);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      {/* Search Input */}
      <div className={`relative px-5 py-2.5 ${isHero ? 'border-b border-white/20 bg-white/10 backdrop-blur-md rounded-2xl' : 'border-b border-[var(--color-border-tertiary)]'}`}>
        <div className="flex items-center gap-3">
          <FaSearch size={18} className={isHero ? 'text-white/70 flex-shrink-0' : 'text-[var(--color-text-secondary)] flex-shrink-0'} />
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
            aria-label="Search products"
            className={`flex-1 bg-transparent border-0 focus:outline-none text-base ${
              isHero
                ? 'text-white placeholder:text-white/50'
                : 'text-[var(--color-text-primary)] placeholder:text-[var(--color-text-secondary)]'
            }`}
          />
          {loading && (
            <div className="flex-shrink-0">
              <div className={`w-5 h-5 border-2 border-t-transparent rounded-full animate-spin ${isHero ? 'border-white/70' : 'border-brand-teal'}`} />
            </div>
          )}
        </div>
      </div>

      {/* Dropdown Content — always visible when inside a modal (onClose provided),
          otherwise gated by isOpen to support standalone usage */}
      {(onClose ? true : isOpen) && (query.length > 0 || recentSearches.length > 0) && (
        <div className={`bg-white max-h-[calc(100vh-240px)] overflow-y-auto custom-scrollbar ${isHero ? 'rounded-2xl mt-2 shadow-lg border border-[var(--color-border-tertiary)]' : ''}`}>
          {/* Loading skeleton */}
          {loading && query.length >= 2 && (
            <div className="p-4 border-t border-[var(--color-border-tertiary)]">
              <div className="text-xs font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide">Searching...</div>
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3 p-2.5 rounded-xl border-2 border-transparent animate-pulse">
                    <div className="w-14 h-14 bg-gradient-to-br from-[var(--color-background-muted)] to-[var(--color-background-muted)] rounded-xl" />
                    <div className="flex-1 space-y-2">
                      <div className="h-3 bg-gradient-to-r from-[var(--color-background-muted)] to-[var(--color-background-muted)] rounded w-3/4" />
                      <div className="h-2 bg-gradient-to-r from-[var(--color-background-tertiary)] to-[var(--color-background-muted)] rounded w-1/2" />
                    </div>
                    <div className="h-4 bg-gradient-to-r from-[var(--color-background-muted)] to-[var(--color-background-muted)] rounded w-16" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches (shown when no query) */}
          {query.length === 0 && (
            <div className="p-4 border-t border-[var(--color-border-tertiary)] bg-gradient-to-b from-white to-[var(--color-background-secondary)]">
              <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)] mb-3 uppercase tracking-wide">
                <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-orange-400 to-danger flex items-center justify-center">
                  <FaFire size={11} className="text-white" />
                </div>
                Popular Searches
              </div>
              <div className="flex flex-wrap gap-2">
                {POPULAR_SEARCHES.map((term) => (
                  <button
                    key={term}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSearch(term);
                    }}
                    className="px-3 py-1.5 bg-white hover:bg-gradient-to-r hover:from-brand-teal hover:to-[var(--color-brand-teal-hover)] border border-[var(--color-border-primary)] hover:border-transparent rounded-full text-xs font-medium text-[var(--color-text-primary)] hover:text-white transition-all duration-200 hover:shadow-md hover:scale-105"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Recent Searches */}
          {query.length === 0 && recentSearches.length > 0 && (
            <div className="p-4 border-t border-[var(--color-border-tertiary)]">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                  <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                    <FaClock size={10} className="text-white" />
                  </div>
                  Recent Searches
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    localStorage.removeItem('recentSearches');
                    setRecentSearches([]);
                  }}
                  className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-status-danger)] transition-colors"
                >
                  Clear all
                </button>
              </div>
              <div className="space-y-1">
                {recentSearches.map((term, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleSearch(term);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gradient-to-r hover:from-[var(--color-background-secondary)] hover:to-[var(--color-background-tertiary)] rounded-lg text-sm text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] transition-all duration-150 flex items-center justify-between group"
                  >
                    <span>{term}</span>
                    <FaSearch size={10} className="text-[var(--color-text-tertiary)] group-hover:text-brand-teal transition-colors" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Product Suggestions */}
          {!loading && suggestions.length > 0 && (
            <div className="p-4 border-t border-[var(--color-border-tertiary)]">
              <div className="flex items-center justify-between mb-3">
                <div className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">Products</div>
                <div className="text-xs text-[var(--color-text-secondary)]">{suggestions.length} results</div>
              </div>
              <div className="space-y-1.5">
                {suggestions.map((product, idx) => {
                  const img = typeof product.images?.[0] === 'string' ? product.images[0] : product.images?.[0]?.url;
                  const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
                  const inStock = product.stock > 0;
                  const isHovered = hoveredProduct === product._id;
                  const inWishlist = isInWishlist(product._id);
                  
                  return (
                    <button
                      key={product._id}
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        handleProductClick(product);
                      }}
                      onMouseEnter={() => setHoveredProduct(product._id)}
                      onMouseLeave={() => setHoveredProduct(null)}
                      className={`w-full relative group rounded-xl transition-all duration-200 ${
                        selectedIndex === idx 
                          ? 'bg-gradient-to-r from-brand-teal/5 to-brand-teal/10 border-2 border-brand-teal shadow-lg shadow-brand-teal/10' 
                          : 'hover:bg-[var(--color-background-secondary)] border-2 border-transparent hover:border-[var(--color-border-primary)] hover:shadow-md'
                      }`}
                    >
                      <div className="flex items-center gap-3 p-2.5">
                        {/* Product Image */}
                        <div className="flex-shrink-0 w-14 h-14 bg-gradient-to-br from-[var(--color-background-secondary)] to-[var(--color-background-tertiary)] rounded-xl overflow-hidden border border-[var(--color-border-primary)] group-hover:border-brand-teal/30 transition-all duration-200 group-hover:shadow-md relative">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt={product.name} loading="lazy" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-2xl">
                              🏥
                            </div>
                          )}
                          {/* Stock badge */}
                          {!inStock && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                              <span className="text-white text-xs font-semibold">OUT</span>
                            </div>
                          )}
                        </div>

                        {/* Product Info */}
                        <div className="flex-1 text-left min-w-0">
                          <div className="text-sm font-semibold text-[var(--color-text-primary)] line-clamp-1 group-hover:text-brand-teal transition-colors">
                            {highlightMatch(product.name, query)}
                          </div>
                          {brandName && (
                            <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 flex items-center gap-1.5">
                              <span>{brandName}</span>
                              {inStock && product.stock < 10 && (
                                <span className="inline-flex items-center gap-0.5 text-xs text-orange-600 font-medium">
                                  <FaExclamationTriangle size={8} />
                                  Low stock
                                </span>
                              )}
                            </div>
                          )}
                          {/* Category tag */}
                          {product.category && (
                            <div className="mt-1">
                              <span className="inline-block px-1.5 py-0.5 bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)] rounded text-xs font-medium">
                                {typeof product.category === 'object' ? product.category.name : product.category}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* Price & Actions */}
                        <div className="flex-shrink-0 flex flex-col items-end gap-2">
                          <div className="text-sm font-semibold text-brand-navy">
                            {product.price > 0 ? (
                              <span className="flex items-baseline gap-0.5">
                                <span className="text-xs text-[var(--color-text-secondary)]">৳</span>
                                {product.price.toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-xs px-2 py-0.5 bg-blue-50 text-blue-600 rounded-full font-semibold">
                                Quote
                              </span>
                            )}
                          </div>
                          
                          {/* Quick actions - show on hover */}
                          {isHovered && inStock && (
                            <div className="flex gap-1 animate-fade-in">
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addToWishlist(product);
                                }}
                                className={`p-1.5 rounded-lg transition-all duration-200 ${
                                  inWishlist
                                    ? 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger-tint)]'
                                    : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)]'
                                }`}
                                title="Add to wishlist"
                              >
                                <FaHeart size={11} className={inWishlist ? 'fill-current' : ''} />
                              </button>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  addToCart(product);
                                }}
                                className="p-1.5 bg-brand-teal hover:bg-[var(--color-brand-teal-hover)] text-white rounded-lg transition-all duration-200 hover:shadow-lg hover:scale-105"
                                title="Add to cart"
                              >
                                <FaShoppingCart size={11} />
                              </button>
                            </div>
                          )}
                          
                          {/* Stock status */}
                          {inStock && product.stock >= 10 && (
                            <div className="flex items-center gap-1 text-[var(--color-status-success)] text-xs font-medium">
                              <FaCheck size={8} />
                              <span>In Stock</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* No results */}
          {query.length >= 2 && !loading && suggestions.length === 0 && (
            <div className="p-10 text-center border-t border-[var(--color-border-tertiary)]">
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-[var(--color-background-tertiary)] to-[var(--color-background-muted)] flex items-center justify-center">
                <FaSearch size={32} className="text-[var(--color-text-secondary)]" />
              </div>
              <div className="text-base font-semibold text-[var(--color-text-primary)] mb-2">No products found</div>
              <div className="text-sm text-[var(--color-text-secondary)] mb-4">
                We couldn&apos;t find any matches for &quot;<span className="font-semibold text-[var(--color-text-primary)]">{query}</span>&quot;
              </div>
              <div className="text-xs text-[var(--color-text-secondary)]">
                Try different keywords or browse our categories
              </div>
            </div>
          )}

          {/* View all results */}
          {query.length >= 2 && suggestions.length > 0 && (
            <div className="p-4 border-t border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)]">
              <button
                type="button"
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  handleSearch(query);
                }}
                className="w-full py-2.5 bg-gradient-to-r from-brand-teal to-[var(--color-brand-teal-hover)] hover:from-[var(--color-brand-teal-hover)] hover:to-brand-teal text-white rounded-xl text-sm font-semibold transition-all duration-300 hover:shadow-lg hover:shadow-brand-teal/30 hover:scale-[1.02] flex items-center justify-center gap-2"
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
          background: linear-gradient(180deg, var(--color-brand-teal), #0c7a61);
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: linear-gradient(180deg, #0c7a61, var(--color-brand-teal));
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
