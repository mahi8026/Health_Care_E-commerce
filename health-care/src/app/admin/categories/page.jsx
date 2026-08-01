'use client';
import { showToast } from '@/components/ui/Toast';
import { confirmAction } from '@/components/ui/ConfirmDialog';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import api from '@/utils/api';
import AdminShell from '@/components/admin/AdminShell';

// Check if user is authenticated
const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('Mediport_token');
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
    if (!await confirmAction(`Are you sure you want to deactivate "${name}"?`)) return;

    try {
      await api.delete(`/categories/${id}`);
      
      // Remove the deactivated category from state immediately for better UX
      setCategories(prevCategories => 
        prevCategories.map(cat => 
          cat._id === id ? { ...cat, isActive: false } : cat
        )
      );
      
      showToast.success('Category deactivated successfully');
      
      // Bypass cache to get fresh data from backend
      fetchCategories(true);
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  if (loading) {
    return (
      <AdminShell title="Categories">
        <div className="p-3 sm:p-4 md:p-6 max-w-full">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-[var(--color-background-muted)] rounded w-1/4 mb-8"></div>
            {[1, 2, 3].map(i => (
              <div key={i} className="h-20 bg-[var(--color-background-muted)] rounded"></div>
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
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary">Categories</h1>
          <p className="text-xs md:text-sm text-[var(--color-text-secondary)] mt-1">
            Manage product categories and subcategories
          </p>
        </div>
        <button
          onClick={() => router.push('/admin/categories/new')}
          className="px-3 md:px-4 py-2 bg-brand-navy text-white rounded-lg text-xs md:text-sm font-semibold hover:bg-[var(--color-brand-navy-hover)] transition-colors min-h-[44px] whitespace-nowrap"
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
              className="w-4 h-4 accent-brand-teal rounded"
            />
            <span className="text-sm text-[var(--color-text-primary)]">Show inactive categories</span>
          </label>
          <button
            onClick={() => fetchCategories(true)}
            className="text-xs md:text-sm text-brand-teal hover:text-[var(--color-brand-teal-hover)] font-medium underline"
          >
            Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[var(--color-status-danger-tint)] border border-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] px-4 py-3 rounded-lg mb-4 text-sm">
          {error}
        </div>
      )}

      {/* Categories Table/Cards */}
      <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] overflow-hidden mb-4">
        {categories.length === 0 ? (
          <div className="p-8 text-center text-sm text-[var(--color-text-secondary)]">
            No categories found. Create your first category to get started.
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
              <table className="w-full" style={{minWidth: '900px'}}>
                <thead className="bg-[var(--color-background-secondary)] border-b border-[var(--color-border-tertiary)]">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Image
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Slug
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Parent
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Products
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Order
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
                      Status
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wide">
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
                            alt={`${category.name} supplier Bangladesh — MediportBD`}
                            width={48}
                            height={48}
                            className="object-cover rounded"
                            loading="lazy"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-[var(--color-background-secondary)] rounded flex items-center justify-center text-[var(--color-text-secondary)] text-xs">
                            No image
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm font-semibold text-[var(--color-text-primary)]">{category.name}</div>
                        {category.description && (
                          <div className="text-xs text-[var(--color-text-secondary)] mt-1 max-w-xs truncate">
                            {category.description}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <code className="text-xs bg-[var(--color-background-secondary)] px-2 py-1 rounded text-[var(--color-text-secondary)] font-mono">
                          {category.slug}
                        </code>
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                        {category.parentCategory?.name || '—'}
                      </td>
                      <td className="px-4 py-3 text-xs font-semibold text-[var(--color-text-primary)]">
                        {category.productCount || 0}
                      </td>
                      <td className="px-4 py-3 text-xs text-[var(--color-text-secondary)]">
                        {category.displayOrder}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded ${
                            category.isActive
                              ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]'
                              : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => router.push(`/admin/categories/${category._id}/edit`)}
                          className="text-xs text-brand-teal font-medium hover:underline mr-3"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(category._id, category.name)}
                          className="text-xs text-danger font-medium hover:underline"
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
                        alt={`${category.name} supplier Bangladesh — MediportBD`}
                        width={64}
                        height={64}
                        className="object-cover rounded flex-shrink-0"
                        loading="lazy"
                      />
                    ) : (
                      <div className="w-16 h-16 bg-white rounded flex items-center justify-center text-[var(--color-text-secondary)] text-xs flex-shrink-0 border border-[var(--color-border-tertiary)]">
                        No image
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-semibold text-brand-navy truncate">{category.name}</div>
                      {category.description && (
                        <div className="text-xs text-[var(--color-text-secondary)] mt-1 line-clamp-2">
                          {category.description}
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <span
                          className={`px-2 py-1 text-xs font-semibold rounded ${
                            category.isActive
                              ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]'
                              : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)]'
                          }`}
                        >
                          {category.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Details Grid */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Slug</div>
                      <code className="text-xs font-mono text-[var(--color-text-primary)] mt-0.5 block truncate">
                        {category.slug}
                      </code>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Products</div>
                      <div className="mt-0.5 font-semibold">{category.productCount || 0}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Parent</div>
                      <div className="mt-0.5 truncate">{category.parentCategory?.name || '—'}</div>
                    </div>
                    <div>
                      <div className="text-xs text-[var(--color-text-secondary)] uppercase tracking-wide font-semibold">Order</div>
                      <div className="mt-0.5">{category.displayOrder}</div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-[var(--color-border-tertiary)]">
                    <button
                      onClick={() => router.push(`/admin/categories/${category._id}/edit`)}
                      className="min-h-[40px] px-2 text-xs text-brand-teal font-semibold border border-brand-teal rounded-lg hover:bg-[var(--color-status-success-tint)] transition-colors"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(category._id, category.name)}
                      className="min-h-[40px] px-2 text-xs text-danger font-semibold border border-danger rounded-lg hover:bg-[var(--color-status-danger-tint)] transition-colors"
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
          <div className="text-xs md:text-xs text-[var(--color-text-secondary)]">Total Categories</div>
          <div className="text-xl md:text-2xl font-semibold text-[var(--color-text-primary)] mt-1">{categories.length}</div>
        </div>
        <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] p-3 md:p-4">
          <div className="text-xs md:text-xs text-[var(--color-text-secondary)]">Active</div>
          <div className="text-xl md:text-2xl font-semibold text-brand-teal mt-1">
            {categories.filter(c => c.isActive).length}
          </div>
        </div>
        <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] p-3 md:p-4 col-span-2 md:col-span-1">
          <div className="text-xs md:text-xs text-[var(--color-text-secondary)]">Total Products</div>
          <div className="text-xl md:text-2xl font-semibold text-brand-navy mt-1">
            {categories.reduce((sum, c) => sum + (c.productCount || 0), 0)}
          </div>
        </div>
      </div>
    </div>
    </AdminShell>
  );
}
