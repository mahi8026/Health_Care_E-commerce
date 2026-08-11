'use client';

/**
 * FlashDealModal — Create/Edit Flash Deal Modal
 * 
 * Features:
 * - Title & description inputs
 * - Product search & selection
 * - Discount percentage per product
 * - Start/End datetime pickers
 * - Stock limit settings
 * - Badge customization
 * - Real-time price preview
 * - Form validation
 */

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  FaTimes, FaSave, FaSearch, FaPlus, FaTrash, FaPercentage,
  FaClock, FaTag, FaBoxes, FaCalendar, FaPalette, FaFire
} from 'react-icons/fa';
import api from '@/utils/api';
import Spinner from '@/components/ui/Spinner';

export default function FlashDealModal({ deal, onClose, onSave }) {
  const isEditing = !!deal;

  // Form state
  const [formData, setFormData] = useState({
    title: deal?.title || 'Deal of the Day',
    description: deal?.description || 'Limited time offer - grab it before it\'s gone!',
    startTime: deal?.startTime ? formatDateTimeLocal(deal.startTime) : '',
    endTime: deal?.endTime ? formatDateTimeLocal(deal.endTime) : '',
    badgeText: deal?.badge?.text || 'FLASH DEAL',
    badgeColor: deal?.badge?.color || 'var(--color-status-danger)',
    displayOrder: deal?.displayOrder || 0,
  });

  const [selectedProducts, setSelectedProducts] = useState(
    deal?.products?.map(p => {
      // p.product may be a populated object OR just an ID string
      const productObj = p.product && typeof p.product === 'object' ? p.product : null;
      const productId = productObj?._id || p.product || p.productId;
      return {
        productId: String(productId),
        product: productObj || { _id: String(productId), name: 'Loading...', price: 0, images: [] },
        discountPercentage: p.discountPercentage ?? 0,
        stockLimit: p.stockLimit ?? null,
        soldCount: p.soldCount || 0,
      };
    }).filter(p => p.productId) || []
  );

  // Product search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [showProductSearch, setShowProductSearch] = useState(false);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState('basic'); // basic, products, timing, settings

  // If editing and products have placeholder data (not populated), fetch full details
  useEffect(() => {
    if (!isEditing) return;
    const unpopulated = selectedProducts.filter(p => p.product.name === 'Loading...');
    if (unpopulated.length === 0) return;

    const fetchDetails = async () => {
      const updated = await Promise.all(
        selectedProducts.map(async (p) => {
          if (p.product.name !== 'Loading...') return p;
          try {
            const res = await api.get(`/products/${p.productId}`);
            const prod = res.data || res.product || res;
            return { ...p, product: prod };
          } catch {
            return p;
          }
        })
      );
      setSelectedProducts(updated);
    };

    void fetchDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isEditing]);

  // Search products
  const searchProducts = async (query) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setSearching(true);
    try {
      const response = await api.get(`/products?search=${encodeURIComponent(query)}&limit=20`);
      const products = response.data?.products || response.products || response.data || [];
      setSearchResults(Array.isArray(products) ? products : []);
    } catch (err) {
      console.error('Search error:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery) {
        searchProducts(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleAddProduct = (product) => {
    // Check if already added
    if (selectedProducts.some(p => p.productId === product._id)) {
      setError('Product already added');
      setTimeout(() => setError(''), 3000);
      return;
    }

    setSelectedProducts(prev => [
      ...prev,
      {
        productId: product._id,
        product: product,
        discountPercentage: 20,
        stockLimit: null,
        soldCount: 0
      }
    ]);

    setSearchQuery('');
    setSearchResults([]);
    setShowProductSearch(false);
  };

  const handleRemoveProduct = (productId) => {
    setSelectedProducts(prev => prev.filter(p => p.productId !== productId));
  };

  const handleProductChange = (productId, field, value) => {
    setSelectedProducts(prev =>
      prev.map(p =>
        p.productId === productId
          ? { ...p, [field]: field === 'discountPercentage' ? Math.min(100, Math.max(0, value)) : value }
          : p
      )
    );
  };

  const calculateDiscountedPrice = (item) => {
    const originalPrice = item.product?.price || 0;
    const discount = originalPrice * ((item.discountPercentage || 0) / 100);
    const finalPrice = originalPrice - discount;
    return { originalPrice, discount, finalPrice };
  };

  const handleSubmit = async () => {
    // Validation
    if (!formData.title.trim()) {
      setError('Title is required');
      return;
    }

    if (selectedProducts.length === 0) {
      setError('At least one product is required');
      setActiveTab('products');
      return;
    }

    if (!formData.startTime || !formData.endTime) {
      setError('Start time and end time are required');
      setActiveTab('timing');
      return;
    }

    if (new Date(formData.startTime) >= new Date(formData.endTime)) {
      setError('End time must be after start time');
      setActiveTab('timing');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        products: selectedProducts.map(p => ({
          productId: p.productId,
          discountPercentage: p.discountPercentage,
          stockLimit: p.stockLimit,
          soldCount: p.soldCount
        })),
        startTime: new Date(formData.startTime).toISOString(),
        endTime: new Date(formData.endTime).toISOString(),
        badge: {
          text: formData.badgeText,
          color: formData.badgeColor
        },
        displayOrder: parseInt(formData.displayOrder) || 0
      };

      if (isEditing) {
        await api.put(`/flash-deals/${deal._id}`, payload);
      } else {
        await api.post('/flash-deals', payload);
      }

      onSave();
    } catch (err) {
      setError(err.message || `Failed to ${isEditing ? 'update' : 'create'} flash deal`);
    } finally {
      setLoading(false);
    }
  };

  // Quick time presets
  const setQuickTime = (hours) => {
    const now = new Date();
    const start = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
    const end = new Date(start.getTime() + hours * 3600000);

    setFormData(prev => ({
      ...prev,
      startTime: formatDateTimeLocal(start),
      endTime: formatDateTimeLocal(end)
    }));
  };

  return (
    <div className="fixed inset-0 z-modal flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-lg max-w-5xl w-full max-h-[90vh] overflow-hidden flex flex-col relative z-10">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[var(--color-border-primary)] flex items-center justify-between bg-gradient-to-r from-[var(--color-status-danger-tint)] to-orange-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[var(--color-status-danger-tint)] rounded-xl flex items-center justify-center">
              <FaFire className="text-white text-xl" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
                {isEditing ? 'Edit Flash Deal' : 'Create Flash Deal'}
              </h2>
              <p className="text-sm text-[var(--color-text-secondary)]">Set up limited-time product discounts</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-[var(--color-background-tertiary)] rounded-lg transition-colors"
          >
            <FaTimes className="text-[var(--color-text-secondary)]" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-3 border-b border-[var(--color-border-primary)] bg-[var(--color-background-secondary)]">
          <div className="flex gap-2">
            {[
              { id: 'basic', label: 'Basic Info', icon: FaTag },
              { id: 'products', label: 'Products', icon: FaBoxes, badge: selectedProducts.length },
              { id: 'timing', label: 'Timing', icon: FaClock },
              { id: 'settings', label: 'Settings', icon: FaPalette }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'bg-[var(--color-status-danger-tint)] text-white'
                    : 'bg-white text-[var(--color-text-secondary)] hover:bg-[var(--color-background-tertiary)]'
                }`}
              >
                <tab.icon />
                {tab.label}
                {tab.badge !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-full text-xs font-semibold ${
                    activeTab === tab.id ? 'bg-white/20' : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mx-6 mt-4 p-4 bg-[var(--color-status-danger-tint)] border border-[var(--color-status-danger-tint)] rounded-lg text-[var(--color-status-danger)] text-sm">
            {error}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {/* Basic Info Tab */}
          {activeTab === 'basic' && (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Deal Title *
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => handleInputChange('title', e.target.value)}
                  placeholder="Deal of the Day"
                  className="w-full px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-status-danger)] focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Limited time offer - grab it before it's gone!"
                  rows={3}
                  className="w-full px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-status-danger)] focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    value={formData.displayOrder}
                    onChange={(e) => handleInputChange('displayOrder', e.target.value)}
                    placeholder="0"
                    className="w-full px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-status-danger)] focus:border-transparent"
                  />
                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">Lower numbers appear first</p>
                </div>
              </div>
            </div>
          )}

          {/* Products Tab */}
          {activeTab === 'products' && (
            <div className="space-y-4">
              {/* Product Search */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2 flex items-center gap-2">
                  <FaSearch className="text-[var(--color-text-secondary)]" />
                  Add Products * 
                  <span className="text-xs font-normal text-[var(--color-text-secondary)]">
                    (Search by name, SKU, or brand)
                  </span>
                </label>
                <div className="relative">
                  <div className="relative">
                    <FaSearch className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] z-10" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={(e) => {
                        setSearchQuery(e.target.value);
                        setShowProductSearch(true);
                      }}
                      onFocus={() => setShowProductSearch(true)}
                      placeholder="Search products by name or SKU..."
                      className="w-full pl-12 pr-4 py-3 border-2 border-[var(--color-border-primary)] rounded-xl focus:ring-2 focus:ring-[var(--color-status-danger)] focus:border-[var(--color-status-danger)] transition-all shadow-sm"
                      autoComplete="off"
                    />
                    {searchQuery && (
                      <button
                        onClick={() => {
                          setSearchQuery('');
                          setSearchResults([]);
                          setShowProductSearch(false);
                        }}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)]"
                      >
                        <FaTimes />
                      </button>
                    )}
                  </div>

                  {/* Search Results Dropdown */}
                  {showProductSearch && searchQuery && (
                    <>
                      {/* Backdrop to close dropdown */}
                      <div 
                        className="fixed inset-0 z-10"
                        onClick={() => setShowProductSearch(false)}
                      />
                      <div className="absolute top-full left-0 right-0 mt-2 bg-white border-2 border-[var(--color-border-primary)] rounded-xl shadow-lg max-h-80 overflow-y-auto z-20">
                        {searching ? (
                          <div className="p-8 text-center">
                            <Spinner size="small" />
                            <p className="text-sm text-[var(--color-text-secondary)] mt-2">Searching products...</p>
                          </div>
                        ) : searchResults.length > 0 ? (
                          <div className="py-2">
                            <div className="px-4 py-2 bg-[var(--color-background-secondary)] border-b border-[var(--color-border-primary)]">
                              <p className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                                {searchResults.length} Result{searchResults.length !== 1 ? 's' : ''} Found
                              </p>
                            </div>
                            {searchResults.map(product => {
                              const isAdded = selectedProducts.some(p => p.productId === product._id);
                              return (
                                <button
                                  key={product._id}
                                  onClick={() => handleAddProduct(product)}
                                  disabled={isAdded}
                                  className={`w-full px-4 py-3 text-left flex items-center gap-4 transition-all duration-200 ${
                                    isAdded 
                                      ? 'bg-green-50/50 opacity-60 cursor-not-allowed' 
                                      : 'hover:bg-[var(--color-status-danger-tint)] hover:shadow-sm cursor-pointer'
                                  }`}
                                >
                                  {/* Product Image */}
                                  <div className="relative w-14 h-14 bg-[var(--color-background-tertiary)] rounded-lg overflow-hidden flex-shrink-0 shadow-sm">
                                    {product.images?.[0] ? (
                                      <Image
                                        src={typeof product.images[0] === 'string' ? product.images[0] : (product.images[0].url || product.images[0])}
                                        alt={product.name}
                                        fill
                                        className="object-cover"
                                        sizes="56px"
                                        unoptimized
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center text-2xl">
                                        🏥
                                      </div>
                                    )}
                                  </div>
                                  
                                  {/* Product Info */}
                                  <div className="flex-1 min-w-0">
                                    <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate mb-1">
                                      {product.name}
                                    </div>
                                    <div className="flex items-center gap-2 flex-wrap">
                                      <span className="text-sm font-semibold text-[var(--color-status-success)]">
                                        ৳{product.price?.toLocaleString()}
                                      </span>
                                      {product.brand && (
                                        <span className="text-xs px-2 py-0.5 bg-brand-teal-tint text-brand-teal rounded-full font-medium">
                                          {typeof product.brand === 'object' ? product.brand.name : product.brand}
                                        </span>
                                      )}
                                      <span className="text-xs text-[var(--color-text-secondary)]">
                                        Stock: <span className="font-semibold">{product.stock || 0}</span>
                                      </span>
                                    </div>
                                  </div>

                                  {/* Add Button / Status */}
                                  {isAdded ? (
                                    <span className="flex items-center gap-1 text-xs text-[var(--color-status-success)] font-semibold bg-[var(--color-status-success-tint)] px-3 py-1.5 rounded-full flex-shrink-0">
                                      <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                      </svg>
                                      Added
                                    </span>
                                  ) : (
                                    <div className="flex items-center justify-center w-8 h-8 bg-[var(--color-status-danger-tint)] text-white rounded-full flex-shrink-0 group-hover:scale-110 transition-transform">
                                      <FaPlus className="text-sm" />
                                    </div>
                                  )}
                                </button>
                              );
                            })}
                          </div>
                        ) : (
                          <div className="p-8 text-center">
                            <div className="text-4xl text-[var(--color-text-tertiary)] mb-2">🔍</div>
                            <p className="text-sm font-medium text-[var(--color-text-primary)]">No products found</p>
                            <p className="text-xs text-[var(--color-text-secondary)] mt-1">Try a different search term</p>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>
                <p className="text-xs text-[var(--color-text-secondary)] mt-2 flex items-center gap-1">
                  <span>💡</span>
                  <span>Tip: Type product name or SKU to quickly find products</span>
                </p>
              </div>

              {/* Selected Products */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center justify-between">
                  <span>Selected Products</span>
                  <span className="px-3 py-1 bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] rounded-full text-xs font-semibold">
                    {selectedProducts.length} {selectedProducts.length === 1 ? 'Product' : 'Products'}
                  </span>
                </label>
                {selectedProducts.length === 0 ? (
                  <div className="p-12 text-center border-2 border-dashed border-[var(--color-border-primary)] rounded-xl bg-[var(--color-background-secondary)]">
                    <div className="w-20 h-20 mx-auto mb-4 bg-[var(--color-background-muted)] rounded-full flex items-center justify-center">
                      <FaBoxes className="text-4xl text-[var(--color-text-secondary)]" />
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">No products added yet</h3>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-4">Search and add products above to create your flash deal</p>
                    <div className="flex items-center justify-center gap-2 text-xs text-[var(--color-text-secondary)]">
                      <FaSearch />
                      <span>Use the search bar to find products</span>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {selectedProducts.map((item) => {
                      const prices = calculateDiscountedPrice(item);
                      return (
                        <div key={item.productId} className="p-5 border-2 border-[var(--color-border-primary)] rounded-xl hover:border-[var(--color-status-danger-tint)] hover:shadow-md transition-all bg-white">
                          <div className="flex items-start gap-4">
                            {/* Product Image */}
                            <div className="relative w-20 h-20 bg-[var(--color-background-tertiary)] rounded-lg overflow-hidden flex-shrink-0">
                              {item.product.images?.[0] ? (
                                <Image
                                  src={typeof item.product.images[0] === 'string' ? item.product.images[0] : (item.product.images[0]?.url || item.product.images[0]?.secure_url || '')}
                                  alt={item.product.name || 'Product'}
                                  fill
                                  className="object-cover"
                                  sizes="80px"
                                  unoptimized
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-3xl">
                                  🏥
                                </div>
                              )}
                            </div>
                            
                            {/* Product Details */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start justify-between gap-2 mb-3">
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
                                    {item.product.name}
                                  </h4>
                                  <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
                                    {item.product.brand && (
                                      <span className="px-2 py-1 bg-[var(--color-background-tertiary)] rounded">
                                        {typeof item.product.brand === 'object' ? item.product.brand.name : item.product.brand}
                                      </span>
                                    )}
                                    <span>SKU: {item.product.sku || 'N/A'}</span>
                                  </div>
                                </div>
                                <button
                                  onClick={() => handleRemoveProduct(item.productId)}
                                  className="p-2 text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger-tint)] rounded-lg transition-colors"
                                  title="Remove product"
                                >
                                  <FaTrash size={16} />
                                </button>
                              </div>

                              <div className="grid grid-cols-2 gap-4">
                                {/* Discount Percentage */}
                                <div>
                                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2 flex items-center gap-1">
                                    <FaPercentage size={10} />
                                    Discount Percentage
                                  </label>
                                  <div className="flex items-center gap-2">
                                    <input
                                      type="range"
                                      min="0"
                                      max="100"
                                      step="5"
                                      value={item.discountPercentage}
                                      onChange={(e) =>
                                        handleProductChange(item.productId, 'discountPercentage', parseInt(e.target.value))
                                      }
                                      className="flex-1"
                                      style={{
                                        background: `linear-gradient(to right, #E11D48 0%, #E11D48 ${item.discountPercentage}%, var(--color-background-muted) ${item.discountPercentage}%, var(--color-background-muted) 100%)`
                                      }}
                                    />
                                    <div className="relative">
                                      <input
                                        type="number"
                                        min="0"
                                        max="100"
                                        value={item.discountPercentage}
                                        onChange={(e) =>
                                          handleProductChange(item.productId, 'discountPercentage', parseInt(e.target.value) || 0)
                                        }
                                        className="w-20 px-3 py-2 text-sm font-semibold border-2 border-[var(--color-border-primary)] rounded-lg text-center focus:border-[var(--color-status-danger)] focus:ring-2 focus:ring-[var(--color-status-danger-tint)]"
                                      />
                                      <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--color-text-secondary)]">%</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Stock Limit */}
                                <div>
                                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2 flex items-center gap-1">
                                    <FaBoxes size={10} />
                                    Stock Limit (Optional)
                                  </label>
                                  <input
                                    type="number"
                                    min="0"
                                    value={item.stockLimit || ''}
                                    onChange={(e) =>
                                      handleProductChange(item.productId, 'stockLimit', e.target.value ? parseInt(e.target.value) : null)
                                    }
                                    placeholder="Unlimited"
                                    className="w-full px-3 py-2 text-sm border-2 border-[var(--color-border-primary)] rounded-lg focus:border-[var(--color-status-danger)] focus:ring-2 focus:ring-[var(--color-status-danger-tint)]"
                                  />
                                  <p className="text-xs text-[var(--color-text-secondary)] mt-1">Leave empty for unlimited</p>
                                </div>
                              </div>

                              {/* Price Preview */}
                              <div className="mt-4 pt-4 border-t-2 border-[var(--color-border-tertiary)] flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <div>
                                    <div className="text-xs text-[var(--color-text-secondary)] mb-1">Original Price</div>
                                    <div className="text-sm text-[var(--color-text-secondary)] line-through font-medium">
                                      ৳{prices.originalPrice.toLocaleString()}
                                    </div>
                                  </div>
                                  <div className="w-px h-10 bg-[var(--color-background-muted)]"></div>
                                  <div>
                                    <div className="text-xs text-[var(--color-text-secondary)] mb-1">Flash Sale Price</div>
                                    <div className="text-2xl font-semibold text-[var(--color-status-danger)]">
                                      ৳{prices.finalPrice.toLocaleString()}
                                    </div>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <div className="px-3 py-1 bg-[var(--color-status-success-tint)] text-[var(--color-status-success)] rounded-full text-xs font-semibold mb-1">
                                    -{item.discountPercentage}% OFF
                                  </div>
                                  <div className="text-xs text-[var(--color-text-secondary)]">
                                    Save <span className="font-semibold text-[var(--color-status-success)]">৳{prices.discount.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Timing Tab */}
          {activeTab === 'timing' && (
            <div className="space-y-4">
              {/* Quick Presets */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Quick Duration Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { label: '1 Hour', hours: 1 },
                    { label: '3 Hours', hours: 3 },
                    { label: '6 Hours', hours: 6 },
                    { label: '12 Hours', hours: 12 },
                    { label: '24 Hours', hours: 24 },
                    { label: '48 Hours', hours: 48 }
                  ].map(preset => (
                    <button
                      key={preset.hours}
                      onClick={() => setQuickTime(preset.hours)}
                      className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                    >
                      <FaClock className="inline mr-2" />
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Start Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.startTime}
                    onChange={(e) => handleInputChange('startTime', e.target.value)}
                    className="w-full px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-status-danger)] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    End Date & Time *
                  </label>
                  <input
                    type="datetime-local"
                    value={formData.endTime}
                    onChange={(e) => handleInputChange('endTime', e.target.value)}
                    className="w-full px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-status-danger)] focus:border-transparent"
                  />
                </div>
              </div>

              {/* Duration Display */}
              {formData.startTime && formData.endTime && (
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-center gap-2 text-blue-900">
                    <FaCalendar />
                    <span className="font-semibold">Duration:</span>
                    <span>
                      {(() => {
                        const start = new Date(formData.startTime);
                        const end = new Date(formData.endTime);
                        const hours = Math.round((end - start) / (1000 * 60 * 60));
                        return hours > 0 ? `${hours} hours` : 'Invalid duration';
                      })()}
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Settings Tab */}
          {activeTab === 'settings' && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Badge Text
                  </label>
                  <input
                    type="text"
                    value={formData.badgeText}
                    onChange={(e) => handleInputChange('badgeText', e.target.value)}
                    placeholder="FLASH DEAL"
                    className="w-full px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-status-danger)] focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                    Badge Color
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={formData.badgeColor}
                      onChange={(e) => handleInputChange('badgeColor', e.target.value)}
                      className="w-16 h-10 rounded border border-[var(--color-border-primary)] cursor-pointer"
                    />
                    <input
                      type="text"
                      value={formData.badgeColor}
                      onChange={(e) => handleInputChange('badgeColor', e.target.value)}
                      placeholder="var(--color-status-danger)"
                      className="flex-1 px-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-status-danger)] focus:border-transparent"
                    />
                  </div>
                </div>
              </div>

              {/* Badge Preview */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Badge Preview
                </label>
                <div className="p-6 bg-[var(--color-background-tertiary)] rounded-lg flex items-center justify-center">
                  <span
                    className="px-4 py-2 rounded-lg text-white font-semibold text-sm shadow-lg"
                    style={{ backgroundColor: formData.badgeColor }}
                  >
                    {formData.badgeText || 'FLASH DEAL'}
                  </span>
                </div>
              </div>

              {/* Color Presets */}
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">
                  Color Presets
                </label>
                <div className="flex flex-wrap gap-2">
                  {[
                    { name: 'Red', color: 'var(--color-status-danger)' },
                    { name: 'Orange', color: '#F97316' },
                    { name: 'Yellow', color: '#EAB308' },
                    { name: 'Green', color: 'var(--color-status-success)' },
                    { name: 'Blue', color: 'var(--color-status-info)' },
                    { name: 'Purple', color: '#A855F7' },
                    { name: 'Pink', color: '#EC4899' },
                    { name: 'Teal', color: '#14B8A6' }
                  ].map(preset => (
                    <button
                      key={preset.color}
                      onClick={() => handleInputChange('badgeColor', preset.color)}
                      className="flex items-center gap-2 px-3 py-2 bg-white border-2 border-[var(--color-border-primary)] rounded-lg hover:border-[var(--color-border-primary)] transition-colors"
                      style={{
                        borderColor: formData.badgeColor === preset.color ? preset.color : undefined
                      }}
                    >
                      <div
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: preset.color }}
                      />
                      <span className="text-sm font-medium text-[var(--color-text-primary)]">{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] flex items-center justify-between">
          <button
            onClick={onClose}
            disabled={loading}
            className="px-4 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)] rounded-lg transition-colors font-medium disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            onClick={handleSubmit}
            disabled={loading || selectedProducts.length === 0}
            className="flex items-center gap-2 px-6 py-2 bg-[var(--color-status-danger-tint)] text-white rounded-lg hover:bg-danger transition-colors font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Spinner size="small" />
                {isEditing ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <FaSave />
                {isEditing ? 'Update Flash Deal' : 'Create Flash Deal'}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// Helper function to format datetime for input
function formatDateTimeLocal(date) {
  const d = new Date(date);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}
