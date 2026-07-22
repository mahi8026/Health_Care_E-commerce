'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/utils/api';
import AdminShell from '@/components/admin/AdminShell';

// Check if user is authenticated
const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('medcore_token');
  }
  return false;
};

export default function CategoriesPage() {
  const router = useRouter();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);

  const fetchCategories = useCallback(async (bypassCache = false) => {
    try {
      setLoading(true);
      setError(null);
      
      // Add cache busting parameter when needed
      const cacheBuster = bypassCache ? `&_t=${Date.now()}` : '';
      const response = await api.get(`/categories?includeInactive=${includeInactive}${cacheBuster}`);
      
      // Handle different response structures
      const categoriesData = response.categories || response.data?.categories || response.data || [];
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('[Categories] Fetch error:', err);
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load categories';
      if (err.status === 0) {
        errorMessage = 'Cannot connect to server. Please ensure the backend is running on http://localhost:5000';
      } else if (err.status === 401) {
        errorMessage = 'Authentication required. Please log in as admin.';
      } else if (err.status === 403) {
        errorMessage = 'Access denied. Admin privileges required.';
      } else if (err.message) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [includeInactive]);

  // Check authentication on mount
  useEffect(() => {
    if (!isAuthenticated()) {
      process.env.NODE_ENV !== "production" && console.warn('[Categories] No authentication token found');
      router.push('/login');
      return;
    }
    
    // Fetch categories in async IIFE
    (async () => {
      await fetchCategories();
    })();
  }, [router, includeInactive, fetchCategories]);

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to deactivate "${name}"?`)) return;

    try {
      await api.delete(`/categories/${id}`);
      
      // Remove the deactivated category from state immediately for better UX
      setCategories(prevCategories => 
        prevCategories.map(cat => 
          cat._id === id ? { ...cat, isActive: false } : cat
        )
      );
      
      alert('Category deactivated successfully');
      
      // Bypass cache to get fresh data from backend
      fetchCategories(true);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
    }
  };

  if (loading) {
    return (
      <AdminShell title="Categories">
        <div className="p-3 sm:p-4 md:p-6 max-w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Categories">
    <div className="p-3 sm:p-4 md:p-6 max-w-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 mb-4 md:mb-6">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-bold font-[family-name:var(--font-lora)]">Categories</h1>
          <p className="text-[12px] md:text-[13px] text-[var(--color-text-secondary)] mt-1">
            Manage product categories and subcategories
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/categories/new')}
          className="px-3 md:px-4 py-2 bg-[#0B2545] text-white rounded-lg text-[12px] md:text-[13px] font-semibold hover:bg-[#0d2e56] transition-colors min-h-[44px] whitespace-nowrap"
        >
          <span className="hidden sm:inline">+ Add Category</span>
          <span className="sm:hidden">+ Add</span>
        </button>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] p-3 md:p-4 mb-4 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="w-4 h-4 accent-[#0E8A6E] rounded"
            />
            <span className="text-[13px] text-[var(--color-text-primary)]">Show inactive categories</span>
          </label>
          <button
            onClick={() => fetchCategories(true)}
            className="text-[12px] md:text-[13px] text-[#0E8A6E] hover:text-[#0a6b55] font-medium underline"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] px-4 py-3 rounded-lg mb-4 text-[13px]">
          {error}
        </div>
      )}

      {/* Categories Table/Cards */}
      <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] overflow-hidden mb-4">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-[13px] text-[var(--color-text-secondary)]">
            No categories found. Create your first category to get started.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
              <table className="w-full" style={{minWidth: '900px'}}>
                <thead className="bg-[var(--color-background-secondary)] border-b border-[var(--color-border-tertiary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Slug
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Parent
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Products
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-[11px] font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--color-border-tertiary)]">
                  {categories.map((category) => (
                    <tr key={category._id} className="hover:bg-[var(--color-background-tertiary)]">
                      <td className="px-4 py-3">
                        {category.image?.url ? (
                          <Image
                            src={category.image.url}
                            alt={`${category.name} supplier Bangladesh — MedCore BD`}
                            width={48}
                            height={48}
                            className="object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[var(--color-background-secondary)] rounded flex items-center justify-center text-[var(--color-text-secondary)] text-[10px]">
                            No image
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[13px] font-semibold text-[var(--color-text-primary)]">{category.name}</div>
                        {category.description && (
                          <div className="text-[11px] text-[var(--color-text-secondary)] mt-1 max-w-xs truncate">
                            {category.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-[11px] bg-[var(--color-background-secondary)] px-2 py-1 rounded text-[var(--color-text-secondary)] font-mono">
                          {category.slug}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[var(--color-text-secondary)]">
                        {category.parentCategory?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-[12px] font-semibold text-[var(--color-text-primary)]">
                        {category.productCount || 0}
                      </td>
                      <td className="px-4 py-3 text-[12px] text-[var(--color-text-secondary)]">
                        {category.displayOrder}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 inline-flex text-[10px] leading-5 font-semibold rounded ${
                            category.isActive
                              ? 'bg-[#D1FAE5] text-[#065F46]'
                              : 'bg-[#F3F4F6] text-[#6B7280]'
                          }`}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => router.push(`/admin/categories/${category._id}/edit`)}
                          className="text-[11px] text-[#0E8A6E] font-medium hover:underline mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category._id, category.name)}
                          className="text-[11px] text-[#E24B4A] font-medium hover:underline"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 p-3">
              {categories.map((category) => (
                <div key={category._id} className="bg-[var(--color-background-secondary)] rounded-lg border border-[var(--color-border-tertiary)] p-4 space-y-3">
                  {/* Header with Image and Name */}
                  <div className="flex items-start gap-3">
                    {category.image?.url ? (
                      <Image
                        src={category.image.url}
                        alt={`${category.name} supplier Bangladesh — MedCore BD`}
                        width={64}
                        height={64}
                        className="object-cover rounded flex-shrink-0"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white rounded flex items-center justify-center text-[var(--color-text-secondary)] text-[10px] flex-shrink-0 border border-[var(--color-border-tertiary)]">
                        No image
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-[14px] font-bold text-[#0B2545] truncate">{category.name}</div>
                      {category.description && (
                        <div className="text-[11px] text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                          {category.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`px-2 py-1 text-[10px] font-semibold rounded ${
                            category.isActive
                              ? 'bg-[#D1FAE5] text-[#065F46]'
                              : 'bg-[#F3F4F6] text-[#6B7280]'
                          }`}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-[12px]">
                    <div>
                      <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Slug</div>
                      <code className="text-[11px] font-mono text-[var(--color-text-primary)] mt-0.5 block truncate">
                        {category.slug}
                      </code>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Products</div>
                      <div className="mt-0.5 font-semibold">{category.productCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Parent</div>
                      <div className="mt-0.5 truncate">{category.parentCategory?.name || '—'}</div>
                    </div>
                    <div>
                      <div className="text-[10px] text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Order</div>
                      <div className="mt-0.5">{category.displayOrder}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border-tertiary)]">
                    <button
                      onClick={() => router.push(`/admin/categories/${category._id}/edit`)}
                      className="min-h-[40px] px-2 text-[11px] text-[#0E8A6E] font-semibold border border-[#0E8A6E] rounded-lg hover:bg-[#F0FDF9] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category._id, category.name)}
                      className="min-h-[40px] px-2 text-[11px] text-[#E24B4A] font-semibold border border-[#E24B4A] rounded-lg hover:bg-[#FEF2F2] transition-colors"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
        <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] p-3 md:p-4">
          <div className="text-[11px] md:text-[12px] text-[var(--color-text-secondary)]">Total Categories</div>
          <div className="text-[20px] md:text-[24px] font-bold text-[var(--color-text-primary)] mt-1">{categories.length}</div>
        </div>
        <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] p-3 md:p-4">
          <div className="text-[11px] md:text-[12px] text-[var(--color-text-secondary)]">Active</div>
          <div className="text-[20px] md:text-[24px] font-bold text-[#0E8A6E] mt-1">
            {categories.filter(c => c.isActive).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] p-3 md:p-4 col-span-2 md:col-span-1">
          <div className="text-[11px] md:text-[12px] text-[var(--color-text-secondary)]">Total Products</div>
          <div className="text-[20px] md:text-[24px] font-bold text-[#0B2545] mt-1">
            {categories.reduce((sum, c) => sum + (c.productCount || 0), 0)}
          </div>
        </div>
      </div>
    </div>
    </AdminShell>
  );
}
