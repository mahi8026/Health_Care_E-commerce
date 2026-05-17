"use client";

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/constants/api';

const UNITS = ['piece', 'box', 'kit', 'pack'];
const CERTIFICATIONS = ['CE', 'FDA', 'ISO', 'DGDA'];

const EMPTY_CREATE_FORM = {
  sku: '',
  name: '',
  description: '',
  brand: '', // Will store ObjectId when selected from dropdown
  category: '', // Will store ObjectId when selected from dropdown
  subcategory: '',
  price: '',
  b2bPrice: '',
  oldPrice: '',
  discountPct: '',
  stock: '',
  lowStockThreshold: '10',
  unit: 'piece',
  minOrderQty: '1',
  certifications: [],
  specifications: [],     // array of {key, value}
  storageTemp: 'room',
  hazardClass: 'safe',
  compatibleWith: [],
  tags: [],
  lotNumber: '',
  expiryDate: '',
  hasAMC: false,
  isFeatured: false,
  isActive: true,
  images: [],          // array of uploaded URLs
};

export default function ProductsManagement({ openCreateRef }) {
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [brandFilter, setBrandFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [stockFilter, setStockFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Dynamic data from API
  const [categories, setCategories] = useState([]);
  const [manufacturers, setManufacturers] = useState([]);
  const [loadingMeta, setLoadingMeta] = useState(true);

  // Edit modal state
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [modalProduct, setModalProduct] = useState(null); // product being edited

  // Create modal state
  const [showCreate, setShowCreate] = useState(false);
  const [createForm, setCreateForm] = useState(EMPTY_CREATE_FORM);
  const [creating, setCreating] = useState(false);

  // Brand search state
  const [brandSearch, setBrandSearch] = useState('');
  const [showBrandDropdown, setShowBrandDropdown] = useState(false);

  // Expose open function to parent via ref
  useEffect(() => {
    if (openCreateRef) openCreateRef.current = () => setShowCreate(true);
  }, [openCreateRef]);

  // Close brand dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (showBrandDropdown && !e.target.closest('.brand-dropdown-container')) {
        setShowBrandDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showBrandDropdown]);

  // Fetch categories and manufacturers on mount
  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoadingMeta(true);
        const token = localStorage.getItem('medcore_token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const [categoriesRes, manufacturersRes] = await Promise.all([
          fetch(`${API}/categories`, { headers }),
          fetch(`${API}/manufacturers`, { headers })
        ]);
        
        const categoriesData = await categoriesRes.json();
        const manufacturersData = await manufacturersRes.json();
        
        const cats = categoriesData.categories || categoriesData.data || [];
        const mfrs = manufacturersData.manufacturers || manufacturersData.data || [];
        
        setCategories(cats);
        setManufacturers(mfrs);
      } catch (err) {
        showMessage('Failed to load categories/manufacturers', 'error');
      } finally {
        setLoadingMeta(false);
      }
    };
    fetchMetadata();
  }, []);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const filters = { page, limit: 20 };
      if (categoryFilter) filters.category = categoryFilter;
      if (brandFilter) filters.brand = brandFilter;
      if (searchQuery) filters.search = searchQuery;
      if (statusFilter) {
        if (statusFilter === 'active') filters.isActive = 'true';
        if (statusFilter === 'inactive') filters.isActive = 'false';
        if (statusFilter === 'featured') filters.isFeatured = 'true';
      }
      if (stockFilter) {
        if (stockFilter === 'instock') filters.inStock = 'true';
        if (stockFilter === 'lowstock') filters.lowStock = 'true';
        if (stockFilter === 'outofstock') filters.outOfStock = 'true';
      }
      // Add cache buster to force fresh data
      filters._t = Date.now().toString();
      
      // Use the API helper which includes auth headers
      const token = localStorage.getItem('medcore_token');
      
      const url = `${API}/products?${new URLSearchParams(filters)}`;
      
      const res = await fetch(url, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        },
        cache: 'no-store'
      });
      
      const data = await res.json();
      
      setProducts(data.products || data.data?.products || []);
      setTotal(data.total || data.data?.total || 0);
    } catch (error) {
      showMessage('Failed to load products', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, categoryFilter, brandFilter, statusFilter, stockFilter, searchQuery]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const handleDelete = async (productId) => {
    if (!confirm('Delete this product? This cannot be undone.')) return;
    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/products/${productId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Delete failed');
      showMessage('Product deleted', 'success');
      fetchProducts();
    } catch {
      showMessage('Failed to delete product', 'error');
    }
  };

  const handleEditOpen = (product) => {
    
    setModalMode('edit');
    setModalProduct(product);
    
    // Extract IDs from populated fields (handle both string and ObjectId formats)
    const categoryId = product.category && typeof product.category === 'object' ? product.category._id : product.category;
    const brandId = product.brand && typeof product.brand === 'object' ? product.brand._id : product.brand;
    
    // Pre-fill createForm with all product fields
    const formData = {
      name:              product.name || '',
      sku:               product.sku || '',
      brand:             brandId || '',
      category:          categoryId || '',
      subcategory:       product.subcategory || '',
      description:       product.description || '',
      price:             product.price?.toString() || '',
      b2bPrice:          product.b2bPrice?.toString() || '',
      oldPrice:          product.oldPrice?.toString() || '',
      discountPct:       product.discountPct?.toString() || '0',
      stock:             product.stock?.toString() || '',
      lowStockThreshold: product.lowStockThreshold?.toString() || '10',
      unit:              product.unit || 'piece',
      minOrderQty:       product.minOrderQty?.toString() || '1',
      certifications:    product.certifications || [],
      specifications:    product.specifications ? Object.entries(product.specifications).map(([key, value]) => ({ key, value })) : [],
      storageTemp:       product.storageTemp || 'room',
      hazardClass:       product.hazardClass || 'safe',
      compatibleWith:    product.compatibleWith || [],
      tags:              product.tags || [],
      lotNumber:         product.lotNumber || '',
      expiryDate:        product.expiryDate ? product.expiryDate.split('T')[0] : '',
      hasAMC:            product.hasAMC || false,
      isFeatured:        product.isFeatured || false,
      isActive:          product.isActive !== false,
      images:            product.images || [],
    };
    
    setCreateForm(formData);
    
    // Set brand search to display name
    if (typeof product.brand === 'object' && product.brand.name) {
      setBrandSearch(product.brand.name);
    } else if (typeof product.brand === 'string') {
      // Legacy string brand - find matching manufacturer
      const manufacturer = manufacturers?.find(m => m._id === product.brand || m.name === product.brand);
      setBrandSearch(manufacturer?.name || product.brand);
    }
    
    setShowCreate(true); // reuse the same modal
  };

  const handleEditSave = async () => {
    if (!modalProduct) return;
    setCreating(true);
    try {
      const token = localStorage.getItem('medcore_token');
      const payload = {
        ...createForm,
        price: Number(createForm.price),
        stock: Number(createForm.stock),
        lowStockThreshold: Number(createForm.lowStockThreshold) || 10,
        minOrderQty: Number(createForm.minOrderQty) || 1,
        ...(createForm.b2bPrice ? { b2bPrice: Number(createForm.b2bPrice) } : {}),
        ...(createForm.oldPrice ? { oldPrice: Number(createForm.oldPrice) } : {}),
        ...(createForm.discountPct ? { discountPct: Number(createForm.discountPct) } : {}),
      };
      
      const res = await fetch(`${API}/products/${modalProduct._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload)
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Update failed');
      }
      
      const result = await res.json();
      
      showMessage('Product updated successfully', 'success');
      closeModal();
      
      // Force refresh the products list
      await fetchProducts();
    } catch (error) {
      showMessage(error.message || 'Failed to update product', 'error');
    } finally {
      setCreating(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const closeModal = () => {
    setShowCreate(false);
    setCreateForm(EMPTY_CREATE_FORM);
    setModalMode('create');
    setModalProduct(null);
    setBrandSearch('');
    setShowBrandDropdown(false);
  };

  // ── Image upload (via Backend API) ─────────────────────────────────────────
  const [uploading, setUploading] = useState(false);
  
  const handleFileUpload = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    
    if (createForm.images.length + files.length > 5) {
      showMessage('Maximum 5 images per product', 'error');
      return;
    }
    
    setUploading(true);
    
    try {
      for (const file of files) {
        // Validate file type
        if (!['image/jpeg', 'image/jpg', 'image/png', 'image/webp'].includes(file.type)) {
          showMessage(`Invalid file type: ${file.name}. Only JPEG, PNG, WebP allowed.`, 'error');
          continue;
        }
        
        // Validate file size (5MB)
        if (file.size > 5 * 1024 * 1024) {
          showMessage(`File too large: ${file.name}. Max 5MB.`, 'error');
          continue;
        }
        
        const formData = new FormData();
        formData.append('image', file);
        
        const response = await fetch(`${API}/upload/image`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('medcore_token')}`,
          },
          body: formData,
        });
        
        const data = await response.json();
        
        if (data.success && data.url) {
          const newImage = {
            url: data.url,
            publicId: data.url.split('/').pop().split('.')[0], // Extract public ID from URL
            isPrimary: createForm.images.length === 0,
            alt: createForm.name || 'Product image',
          };
          
          setCreateForm(f => ({
            ...f,
            images: [...f.images, newImage],
          }));
        } else {
          showMessage(data.message || 'Upload failed', 'error');
        }
      }
      
      showMessage('Images uploaded successfully', 'success');
    } catch (error) {
      showMessage('Upload failed. Please try again.', 'error');
    } finally {
      setUploading(false);
      // Reset file input
      e.target.value = '';
    }
  };

  const handleRemoveImage = (idx) => {
    setCreateForm(f => {
      const updated = f.images.filter((_, i) => i !== idx);
      // If deleted was primary, make first remaining primary
      if (f.images[idx]?.isPrimary && updated.length > 0) {
        updated[0].isPrimary = true;
      }
      return { ...f, images: updated };
    });
  };

  // ── Create/Edit product ──────────────────────────────────────────────────────
  const handleCreateProduct = async () => {
    // Basic validation
    if (!createForm.sku.trim()) return showMessage('SKU is required', 'error');
    if (!createForm.name.trim()) return showMessage('Product name is required', 'error');
    if (!createForm.description.trim()) return showMessage('Description is required', 'error');
    if (!createForm.brand) return showMessage('Brand is required', 'error');
    if (!createForm.category) return showMessage('Category is required', 'error');
    if (!createForm.price || isNaN(Number(createForm.price))) return showMessage('Valid price is required', 'error');
    if (createForm.stock === '' || isNaN(Number(createForm.stock))) return showMessage('Valid stock quantity is required', 'error');
    
    // Reagent validation
    const selectedCategory = categories?.find(c => c._id === createForm.category);

    setCreating(true);
    try {
      const token = localStorage.getItem('medcore_token');
      const url = modalMode === 'edit' ? `${API}/products/${modalProduct._id}` : `${API}/products`;
      const method = modalMode === 'edit' ? 'PUT' : 'POST';
      
      // Auto-calculate B2B price if not provided
      const retailPrice = Number(createForm.price);
      const calculatedB2bPrice = createForm.b2bPrice 
        ? Number(createForm.b2bPrice) 
        : Math.round(retailPrice * 0.78);
      
      // Convert specifications array to object
      const specificationsObj = {};
      (createForm.specifications || []).forEach(({ key, value }) => {
        if (key.trim() && value.trim()) {
          specificationsObj[key.trim()] = value.trim();
        }
      });
      
      const payload = {
        ...createForm,
        price: retailPrice,
        b2bPrice: calculatedB2bPrice,
        stock: Number(createForm.stock),
        lowStockThreshold: Number(createForm.lowStockThreshold) || 10,
        minOrderQty: Number(createForm.minOrderQty) || 1,
        specifications: specificationsObj,
        ...(createForm.oldPrice ? { oldPrice: Number(createForm.oldPrice) } : {}),
        ...(createForm.discountPct ? { discountPct: Number(createForm.discountPct) } : {}),
        ...(createForm.expiryDate ? { expiryDate: createForm.expiryDate } : {}),
      };
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.message || `${modalMode === 'edit' ? 'Update' : 'Create'} failed`);
      showMessage(modalMode === 'edit' ? 'Product updated successfully' : 'Product created successfully', 'success');
      closeModal();
      fetchProducts();
    } catch (err) {
      showMessage(err.message || `Failed to ${modalMode === 'edit' ? 'update' : 'create'} product`, 'error');
    } finally {
      setCreating(false);
    }
  };

  const getStockStatus = (product) => {
    if (product.stock === 0) return { color: 'bg-[#FEE2E2] text-[#991B1B]', label: 'Out of stock' };
    if (product.stock <= (product.lowStockThreshold || 10)) return { color: 'bg-[#FEF3C7] text-[#92400E]', label: 'Low stock' };
    return { color: 'bg-[#D1FAE5] text-[#065F46]', label: 'In stock' };
  };

  const totalPages = Math.ceil(total / 20);

  return (
    <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)]">
      {/* Message Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
        }`}>
          {message.text}
        </div>
      )}

      {/* ── Create Product Modal ─────────────────────────────────────────── */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/50 flex items-start justify-center z-50 overflow-y-auto py-8 px-4">
          <div className="bg-white rounded-xl w-full max-w-2xl shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b-[0.5px] border-[var(--color-border-tertiary)]">
              <h3 className="text-[15px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                {modalMode === 'edit' ? `Edit — ${modalProduct?.name}` : 'Add New Product'}
              </h3>
              <button
                onClick={closeModal}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-xl leading-none"
                aria-label="Close"
              >
                ×
              </button>
            </div>

            <div className="px-6 py-5 space-y-5">
              {/* Image Upload */}
              <div>
                <label className="block text-[12px] font-semibold text-[var(--color-text-primary)] mb-2">
                  Product Images <span className="font-normal text-[var(--color-text-secondary)]">(up to 5 — JPEG, PNG, WebP)</span>
                </label>

                <label
                  htmlFor="image-upload"
                  className={`w-full border-2 border-dashed border-[var(--color-border-secondary)] hover:border-[#0E8A6E] hover:bg-[#F0FDF9] rounded-lg p-5 text-center transition-colors cursor-pointer block ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
                >
                  <input
                    id="image-upload"
                    type="file"
                    accept="image/jpeg,image/jpg,image/png,image/webp"
                    multiple
                    onChange={handleFileUpload}
                    disabled={uploading || createForm.images.length >= 5}
                    className="hidden"
                  />
                  <svg className="mx-auto mb-2 w-8 h-8 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[12px] text-[var(--color-text-secondary)]">
                    {uploading ? 'Uploading...' : 'Click to upload images'}
                    {createForm.images.length > 0 && !uploading && (
                      <span className="ml-1 text-[#0E8A6E] font-medium">({createForm.images.length}/5 added)</span>
                    )}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">JPEG, PNG, WebP — max 5 MB each</p>
                </label>

                {/* Image previews */}
                {createForm.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-3">
                    {createForm.images.map((img, idx) => (
                      <div 
                        key={img.publicId || img.url || idx} 
                        className="relative group w-20 h-20 rounded-lg overflow-hidden cursor-pointer"
                        style={{
                          border: img.isPrimary ? '2px solid #0E8A6E' : '0.5px solid #E5E7EB'
                        }}
                        onClick={() => {
                          // Set clicked image as primary
                          const updated = createForm.images.map((image, i) => ({
                            ...image,
                            isPrimary: i === idx,
                          }));
                          setCreateForm(f => ({ ...f, images: updated }));
                        }}
                        title="Click to set as primary image"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={img.url} alt={`Product image ${idx + 1}`} className="w-full h-full object-cover" />
                        
                        {/* Primary badge */}
                        {img.isPrimary && (
                          <div className="absolute bottom-0 left-0 right-0 bg-[#0E8A6E] text-white text-[9px] text-center py-[2px] font-semibold" style={{ background: 'rgba(14,138,110,0.9)' }}>
                            PRIMARY
                          </div>
                        )}
                        
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation(); // don't trigger primary selection
                            handleRemoveImage(idx);
                          }}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                          style={{ background: 'rgba(226,75,74,0.9)' }}
                          aria-label="Remove image"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {createForm.images.length > 0 && (
                  <div className="text-[10px] text-[#9CA3AF] mt-2">
                    Click any image to set as primary · Hover and click × to remove
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">SKU <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    placeholder="e.g. MC-DX-001"
                    value={createForm.sku}
                    onChange={e => setCreateForm(f => ({ ...f, sku: e.target.value.toUpperCase() }))}
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E] font-mono"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Brand <span className="text-red-500">*</span></label>
                  <div className="relative brand-dropdown-container">
                    <input
                      type="text"
                      placeholder="Search manufacturer..."
                      value={brandSearch}
                      onChange={e => {
                        setBrandSearch(e.target.value);
                        setShowBrandDropdown(true);
                      }}
                      onFocus={() => setShowBrandDropdown(true)}
                      className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
                    />
                    {showBrandDropdown && (
                      <div className="absolute z-10 w-full mt-1 bg-white border-[0.5px] border-[var(--color-border-secondary)] rounded-lg shadow-lg max-h-48 overflow-y-auto">
                        {(manufacturers || [])
                          .filter(m => m.name.toLowerCase().includes(brandSearch.toLowerCase()))
                          .map(manufacturer => (
                            <div
                              key={manufacturer._id}
                              onClick={() => {
                                setCreateForm(f => ({ ...f, brand: manufacturer._id }));
                                setBrandSearch(manufacturer.name);
                                setShowBrandDropdown(false);
                              }}
                              className="px-3 py-2 hover:bg-[var(--color-background-tertiary)] cursor-pointer text-[13px]"
                            >
                              {manufacturer.name}
                              {manufacturer.country && (
                                <span className="text-[11px] text-[var(--color-text-secondary)] ml-2">
                                  ({manufacturer.country})
                                </span>
                              )}
                            </div>
                          ))}
                        {(manufacturers || []).filter(m => m.name.toLowerCase().includes(brandSearch.toLowerCase())).length === 0 && (
                          <div className="px-3 py-2 text-[13px] text-[var(--color-text-secondary)]">
                            No manufacturers found
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Product Name <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  placeholder="e.g. Siemens ADVIA 2120i Hematology Analyzer"
                  value={createForm.name}
                  onChange={e => setCreateForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
                />
              </div>

              <div>
                <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Description <span className="text-red-500">*</span></label>
                <textarea
                  rows={3}
                  placeholder="Detailed product description…"
                  value={createForm.description}
                  onChange={e => setCreateForm(f => ({ ...f, description: e.target.value }))}
                  className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E] resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Category <span className="text-red-500">*</span></label>
                  <select
                    value={createForm.category}
                    onChange={e => setCreateForm(f => ({ ...f, category: e.target.value, subcategory: '' }))}
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E]"
                  >
                    <option value="">Select category...</option>
                    {(categories || []).map(c => (
                      <option key={c._id} value={c._id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Subcategory</label>
                  <input
                    type="text"
                    placeholder="e.g. Hematology"
                    value={createForm.subcategory}
                    onChange={e => setCreateForm(f => ({ ...f, subcategory: e.target.value }))}
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
                  />
                </div>
              </div>

              {/* Pricing */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Price (৳) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={createForm.price}
                    onChange={e => setCreateForm(f => ({ ...f, price: e.target.value }))}
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">B2B Price (৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={createForm.b2bPrice}
                    onChange={e => setCreateForm(f => ({ ...f, b2bPrice: e.target.value }))}
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
                  />
                  {!createForm.b2bPrice && createForm.price && (
                    <div className="text-[10px] text-[#9CA3AF] mt-1">
                      Auto: ৳{Math.round(Number(createForm.price) * 0.78).toLocaleString()} (78% of retail)
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Old Price (৳)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={createForm.oldPrice}
                    onChange={e => setCreateForm(f => ({ ...f, oldPrice: e.target.value }))}
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
                  />
                </div>
              </div>

              {/* Stock & Unit */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Stock <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={createForm.stock}
                    onChange={e => setCreateForm(f => ({ ...f, stock: e.target.value }))}
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Low Stock Alert</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="10"
                    value={createForm.lowStockThreshold}
                    onChange={e => setCreateForm(f => ({ ...f, lowStockThreshold: e.target.value }))}
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E]"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-1">Unit</label>
                  <select
                    value={createForm.unit}
                    onChange={e => setCreateForm(f => ({ ...f, unit: e.target.value }))}
                    className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] bg-white focus:outline-none focus:border-[#0E8A6E]"
                  >
                    {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
              </div>

              {/* Certifications */}
              <div>
                <label className="block text-[11px] text-[var(--color-text-secondary)] mb-2">Certifications</label>
                <div className="flex gap-3 flex-wrap">
                  {CERTIFICATIONS.map(cert => (
                    <label key={cert} className="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={createForm.certifications.includes(cert)}
                        onChange={e => {
                          setCreateForm(f => ({
                            ...f,
                            certifications: e.target.checked
                              ? [...f.certifications, cert]
                              : f.certifications.filter(c => c !== cert)
                          }));
                        }}
                        className="accent-[#0E8A6E]"
                      />
                      <span className="text-[12px]">{cert}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Storage Temperature + Hazard Class */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-2">Storage Temperature</label>
                  <div className="space-y-2">
                    {[
                      { val: 'room', label: '🌡️ Room temp (15–25°C)' },
                      { val: 'cold', label: '❄️ Cold (2–8°C)' },
                      { val: 'frozen', label: '🧊 Frozen (−20°C)' },
                    ].map(opt => (
                      <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="storageTemp"
                          value={opt.val}
                          checked={createForm.storageTemp === opt.val}
                          onChange={() => setCreateForm(f => ({ ...f, storageTemp: opt.val }))}
                          className="accent-[#0E8A6E]"
                        />
                        <span className="text-[12px]">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-2">Hazard Class</label>
                  <div className="space-y-2">
                    {[
                      { val: 'safe', label: '✅ Safe' },
                      { val: 'biohazard', label: '⚠️ Biohazard' },
                      { val: 'chemical', label: '⚠️ Chemical' },
                    ].map(opt => (
                      <label key={opt.val} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="radio"
                          name="hazardClass"
                          value={opt.val}
                          checked={createForm.hazardClass === opt.val}
                          onChange={() => setCreateForm(f => ({ ...f, hazardClass: opt.val }))}
                          className="accent-[#0E8A6E]"
                        />
                        <span className="text-[12px]">{opt.label}</span>
                      </label>
                    ))}
                  </div>
                </div>
              </div>

              {/* Specifications */}
              <div>
                <label className="block text-[11px] text-[var(--color-text-secondary)] mb-2">
                  Specifications <span className="text-[10px] font-normal">(technical details)</span>
                </label>
                {createForm.specifications.map((spec, idx) => (
                  <div key={idx} className="grid grid-cols-[1fr_1fr_32px] gap-2 mb-2">
                    <input
                      placeholder="Key (e.g. Leads)"
                      value={spec.key}
                      onChange={e => {
                        const updated = [...createForm.specifications];
                        updated[idx].key = e.target.value;
                        setCreateForm(f => ({ ...f, specifications: updated }));
                      }}
                      className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] focus:outline-none focus:border-[#0E8A6E]"
                    />
                    <input
                      placeholder="Value (e.g. 12)"
                      value={spec.value}
                      onChange={e => {
                        const updated = [...createForm.specifications];
                        updated[idx].value = e.target.value;
                        setCreateForm(f => ({ ...f, specifications: updated }));
                      }}
                      className="px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] focus:outline-none focus:border-[#0E8A6E]"
                    />
                    <button
                      type="button"
                      onClick={() => setCreateForm(f => ({
                        ...f,
                        specifications: f.specifications.filter((_, i) => i !== idx)
                      }))}
                      className="bg-[#FEE2E2] border-[0.5px] border-[#F87171] rounded-lg text-[#991B1B] text-lg hover:bg-[#FEF2F2] transition-colors"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => setCreateForm(f => ({
                    ...f,
                    specifications: [...f.specifications, { key: '', value: '' }]
                  }))}
                  className="text-[11px] px-3 py-2 rounded-lg border-[0.5px] border-[var(--color-border-secondary)] bg-transparent hover:bg-[var(--color-background-tertiary)] transition-colors"
                >
                  + Add specification
                </button>
              </div>

              {/* Tags */}
              <div>
                <label className="block text-[11px] text-[var(--color-text-secondary)] mb-2">
                  Tags <span className="text-[10px] font-normal">(for search)</span>
                </label>
                <div className="border-[0.5px] border-[var(--color-border-secondary)] rounded-lg p-2 min-h-[44px] flex flex-wrap gap-2 items-center">
                  {createForm.tags.map((tag, i) => (
                    <span key={i} className="bg-[#FAEEDA] text-[#633806] rounded px-2 py-1 text-[11px] flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => setCreateForm(f => ({
                          ...f,
                          tags: f.tags.filter((_, idx) => idx !== i)
                        }))}
                        className="text-[14px] hover:text-[#991B1B]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    value={createForm.tagInput || ''}
                    onChange={e => setCreateForm(f => ({ ...f, tagInput: e.target.value }))}
                    onKeyDown={e => {
                      if ((e.key === 'Enter' || e.key === ',') && createForm.tagInput?.trim()) {
                        e.preventDefault();
                        const val = createForm.tagInput.trim();
                        if (!createForm.tags.includes(val)) {
                          setCreateForm(f => ({ ...f, tags: [...f.tags, val], tagInput: '' }));
                        }
                      }
                    }}
                    placeholder={createForm.tags.length ? '' : 'Type and press Enter...'}
                    className="border-none outline-none text-[12px] flex-1 min-w-[120px] bg-transparent"
                  />
                </div>
                <div className="text-[10px] text-[#9CA3AF] mt-1">
                  e.g. ecg, cardiac, diagnostic — press Enter after each
                </div>
              </div>

              {/* Compatible With */}
              <div>
                <label className="block text-[11px] text-[var(--color-text-secondary)] mb-2">
                  Compatible With <span className="text-[10px] font-normal">(related products)</span>
                </label>
                <div className="border-[0.5px] border-[var(--color-border-secondary)] rounded-lg p-2 min-h-[44px] flex flex-wrap gap-2 items-center">
                  {createForm.compatibleWith.map((item, i) => (
                    <span key={i} className="bg-[#E6F1FB] text-[#0C447C] rounded px-2 py-1 text-[11px] flex items-center gap-1">
                      {item}
                      <button
                        type="button"
                        onClick={() => setCreateForm(f => ({
                          ...f,
                          compatibleWith: f.compatibleWith.filter((_, idx) => idx !== i)
                        }))}
                        className="text-[14px] hover:text-[#991B1B]"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  <input
                    value={createForm.compatibleInput || ''}
                    onChange={e => setCreateForm(f => ({ ...f, compatibleInput: e.target.value }))}
                    onKeyDown={e => {
                      if ((e.key === 'Enter' || e.key === ',') && createForm.compatibleInput?.trim()) {
                        e.preventDefault();
                        const val = createForm.compatibleInput.trim();
                        if (!createForm.compatibleWith.includes(val)) {
                          setCreateForm(f => ({ ...f, compatibleWith: [...f.compatibleWith, val], compatibleInput: '' }));
                        }
                      }
                    }}
                    placeholder={createForm.compatibleWith.length ? '' : 'Type product names...'}
                    className="border-none outline-none text-[12px] flex-1 min-w-[120px] bg-transparent"
                  />
                </div>
              </div>

              {/* Reagent-specific fields */}
              {(() => {
                const selectedCategory = categories?.find(c => c._id === createForm.category);
                return selectedCategory?.name === 'Laboratory Reagents' && (
                  <div className="bg-[#E6F1FB] rounded-lg p-4">
                    <div className="text-[12px] font-semibold text-[#0C447C] mb-3 flex items-center gap-2">
                      🧪 Reagent Details
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] text-[#6B7280] mb-1">
                          Lot Number
                        </label>
                        <input
                          value={createForm.lotNumber}
                          onChange={e => setCreateForm(f => ({ ...f, lotNumber: e.target.value }))}
                          placeholder="e.g. LOT-2025-08841"
                          className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] focus:outline-none focus:border-[#0E8A6E]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] text-[#6B7280] mb-1">Expiry Date</label>
                        <input
                          type="date"
                          value={createForm.expiryDate}
                          onChange={e => setCreateForm(f => ({ ...f, expiryDate: e.target.value }))}
                          min={new Date().toISOString().split('T')[0]}
                          className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] focus:outline-none focus:border-[#0E8A6E]"
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.isFeatured}
                    onChange={e => setCreateForm(f => ({ ...f, isFeatured: e.target.checked }))}
                    className="accent-[#0E8A6E]"
                  />
                  <span className="text-[12px]">Featured product</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={createForm.isActive}
                    onChange={e => setCreateForm(f => ({ ...f, isActive: e.target.checked }))}
                    className="accent-[#0E8A6E]"
                  />
                  <span className="text-[12px]">Active (visible on site)</span>
                </label>
              </div>
            </div>

            {/* Footer */}
            <div className="flex gap-3 px-6 py-4 border-t-[0.5px] border-[var(--color-border-tertiary)]">
              <button
                onClick={handleCreateProduct}
                disabled={creating}
                className="flex-1 py-2.5 bg-[#0B2545] text-white rounded-lg text-[13px] font-semibold disabled:opacity-50 hover:bg-[#0d2e56] transition-colors"
              >
                {creating ? 'Saving…' : modalMode === 'edit' ? 'Save Changes' : 'Create Product'}
              </button>
              <button
                onClick={closeModal}
                className="flex-1 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] hover:bg-[var(--color-background-tertiary)] transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="p-4 border-b-[0.5px] border-[var(--color-border-tertiary)] bg-[var(--color-background-secondary)]">
        {/* Search Bar */}
        <div className="mb-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Search by product name, SKU, or description..."
              value={searchQuery}
              onChange={e => { setSearchQuery(e.target.value); setPage(1); }}
              className="w-full px-4 py-2.5 pl-10 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] font-[family-name:var(--font-plus-jakarta)] bg-white focus:outline-none focus:border-[#0E8A6E] focus:ring-2 focus:ring-[#0E8A6E]/10 transition-all"
            />
            <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => { setSearchQuery(''); setPage(1); }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)] hover:text-[#E24B4A] transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Filter Pills Row */}
        <div className="flex flex-wrap gap-2 items-center">
          {/* Category Filter */}
          <div className="relative">
            <select
              value={categoryFilter}
              onChange={e => { setCategoryFilter(e.target.value); setPage(1); }}
              className={`pl-3 pr-8 py-2 border-[0.5px] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white focus:outline-none transition-all appearance-none cursor-pointer ${
                categoryFilter 
                  ? 'border-[#0E8A6E] bg-[#F0FDF9] text-[#0E8A6E] font-semibold shadow-sm' 
                  : 'border-[var(--color-border-secondary)] hover:border-[#0E8A6E] text-[var(--color-text-primary)]'
              }`}
            >
              <option value="">📂 All categories</option>
              {(categories || []).map(c => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <svg className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${categoryFilter ? 'text-[#0E8A6E]' : 'text-[var(--color-text-secondary)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Brand Filter */}
          <div className="relative">
            <select
              value={brandFilter}
              onChange={e => { setBrandFilter(e.target.value); setPage(1); }}
              className={`pl-3 pr-8 py-2 border-[0.5px] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white focus:outline-none transition-all appearance-none cursor-pointer ${
                brandFilter 
                  ? 'border-[#0E8A6E] bg-[#F0FDF9] text-[#0E8A6E] font-semibold shadow-sm' 
                  : 'border-[var(--color-border-secondary)] hover:border-[#0E8A6E] text-[var(--color-text-primary)]'
              }`}
            >
              <option value="">🏭 All brands</option>
              {(manufacturers || []).map(m => (
                <option key={m._id} value={m._id}>
                  {m.name}
                </option>
              ))}
            </select>
            <svg className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${brandFilter ? 'text-[#0E8A6E]' : 'text-[var(--color-text-secondary)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Status Filter */}
          <div className="relative">
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className={`pl-3 pr-8 py-2 border-[0.5px] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white focus:outline-none transition-all appearance-none cursor-pointer ${
                statusFilter 
                  ? 'border-[#0E8A6E] bg-[#F0FDF9] text-[#0E8A6E] font-semibold shadow-sm' 
                  : 'border-[var(--color-border-secondary)] hover:border-[#0E8A6E] text-[var(--color-text-primary)]'
              }`}
            >
              <option value="">⚡ All status</option>
              <option value="active">✓ Active</option>
              <option value="inactive">✗ Inactive</option>
              <option value="featured">⭐ Featured</option>
            </select>
            <svg className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${statusFilter ? 'text-[#0E8A6E]' : 'text-[var(--color-text-secondary)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Stock Filter */}
          <div className="relative">
            <select
              value={stockFilter}
              onChange={e => { setStockFilter(e.target.value); setPage(1); }}
              className={`pl-3 pr-8 py-2 border-[0.5px] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white focus:outline-none transition-all appearance-none cursor-pointer ${
                stockFilter 
                  ? 'border-[#0E8A6E] bg-[#F0FDF9] text-[#0E8A6E] font-semibold shadow-sm' 
                  : 'border-[var(--color-border-secondary)] hover:border-[#0E8A6E] text-[var(--color-text-primary)]'
              }`}
            >
              <option value="">📦 All stock levels</option>
              <option value="instock">✓ In Stock</option>
              <option value="lowstock">⚠️ Low Stock</option>
              <option value="outofstock">✗ Out of Stock</option>
            </select>
            <svg className={`absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${stockFilter ? 'text-[#0E8A6E]' : 'text-[var(--color-text-secondary)]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>

          {/* Clear Filters Button */}
          {(categoryFilter || brandFilter || statusFilter || stockFilter || searchQuery) && (
            <button
              onClick={() => {
                setCategoryFilter('');
                setBrandFilter('');
                setStatusFilter('');
                setStockFilter('');
                setSearchQuery('');
                setPage(1);
              }}
              className="px-3 py-2 border-[0.5px] border-[#E24B4A] bg-[#FEF2F2] text-[#E24B4A] rounded-lg text-[12px] font-medium hover:bg-[#E24B4A] hover:text-white transition-all flex items-center gap-1.5 shadow-sm"
            >
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              Clear all
            </button>
          )}

          {/* Spacer */}
          <div className="flex-1"></div>

          {/* Results Count */}
          <div className="flex items-center gap-2 px-3 py-2 bg-white border-[0.5px] border-[var(--color-border-secondary)] rounded-lg">
            <svg className="w-4 h-4 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
            </svg>
            <span className="text-[12px] font-semibold text-[var(--color-text-primary)]">
              {total}
            </span>
            <span className="text-[12px] text-[var(--color-text-secondary)]">
              product{total !== 1 ? 's' : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">Loading products…</div>
        ) : products.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">No products found</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)]">
                {['SKU', 'Product Name', 'Category', 'Stock', 'Price', 'Status', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map(product => {
                const stockStatus = getStockStatus(product);
                // Handle both populated objects and string values for backward compatibility
                const categoryName = typeof product.category === 'object' ? product.category?.name : product.category;
                const brandName = typeof product.brand === 'object' ? product.brand?.name : product.brand;
                
                return (
                  <tr key={product._id} className="border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)]">
                    <td className="px-4 py-3 text-[11px] font-mono text-[var(--color-text-secondary)]">{product.sku}</td>
                    <td className="px-4 py-3 text-[12px] font-medium">{product.name}</td>
                    <td className="px-4 py-3 text-[12px]">{categoryName || '—'}</td>
                    <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">{product.stock}</td>
                    <td className="px-4 py-3 text-[12px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                      ৳{(product.price || 0).toLocaleString()}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-[10px] px-2 py-[3px] rounded font-medium ${stockStatus.color}`}>
                        {stockStatus.label}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => handleEditOpen(product)}
                        className="text-[11px] text-[#0E8A6E] font-medium hover:underline mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(product._id)}
                        className="text-[11px] text-[#E24B4A] font-medium hover:underline"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 flex items-center justify-between border-t-[0.5px] border-[var(--color-border-tertiary)]">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-[12px] px-3 py-1 border-[0.5px] border-[var(--color-border-secondary)] rounded disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-[12px] text-[var(--color-text-secondary)]">Page {page} of {totalPages}</span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-[12px] px-3 py-1 border-[0.5px] border-[var(--color-border-secondary)] rounded disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}
