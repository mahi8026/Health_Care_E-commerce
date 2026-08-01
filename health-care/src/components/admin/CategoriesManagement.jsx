'use client';
import { confirmAction } from '@/components/ui/ConfirmDialog';

import { useState, useEffect } from 'react';
import api from '@/utils/api';
import { showToast } from '@/components/ui/Toast';

export default function CategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});


  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await api.get(`/categories?includeInactive=${includeInactive}`);
      
      const categoriesData = response.categories || response.data?.categories || response.data || [];
      
      setCategories(Array.isArray(categoriesData) ? categoriesData : []);
    } catch (err) {
      let errorMessage = 'Failed to load categories';
      if (err.status === 401) {
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
  };
  useEffect(() => {
    void Promise.resolve().then(fetchCategories);
  }, [includeInactive]);

  const handleDelete = async (id, name) => {
    if (!await confirmAction(`Are you sure you want to deactivate "${name}"?`)) return;

    try {
      await api.delete(`/categories/${id}`);
      showToast.success('Category deactivated successfully');
      fetchCategories();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to delete category');
    }
  };

  const handleEdit = (category) => {
    setEditingId(category._id);
    setEditForm({
      name: category.name,
      slug: category.slug,
      description: category.description || '',
      isActive: category.isActive
    });
  };

  const handleSaveEdit = async () => {
    try {
      await api.patch(`/categories/${editingId}`, editForm);
      showToast.success('Category updated successfully');
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      showToast.error(err.response?.data?.message || 'Failed to update category');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-[var(--color-background-muted)] rounded w-1/3"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-[var(--color-background-muted)] rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gradient-to-br from-[var(--color-status-success-tint)] to-[var(--color-status-success-tint)] rounded-lg shadow p-4 border border-[var(--color-status-success-tint)]">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <label className="flex items-center gap-3 cursor-pointer min-h-[44px]">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="w-5 h-5 text-[var(--color-status-success)] rounded border-[var(--color-border-primary)] accent-green-600"
            />
            <span className="text-sm font-medium text-[var(--color-text-primary)]">Show inactive categories</span>
          </label>
          <button
            onClick={() => fetchCategories()}
            className="text-sm bg-gradient-to-r from-[var(--color-status-success)] to-[var(--color-status-success)] text-white px-4 py-3 rounded-lg hover:shadow-lg transition font-medium min-h-[48px]"
          >
            ⟳ Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-[var(--color-status-danger-tint)] border-2 border-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] px-4 py-3 rounded-lg flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-background-secondary)] border-b border-[var(--color-border-primary)]">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-primary)] uppercase">Image</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-primary)] uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-primary)] uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-primary)] uppercase">Parent</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--color-text-primary)] uppercase">Products</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-[var(--color-text-primary)] uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-primary)] uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-primary)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-primary)]">
              {categories.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-[var(--color-text-secondary)]">📦 No categories found.</td></tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id} className="hover:bg-[var(--color-background-secondary)] transition">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {category.image?.url ? (
                        <img src={category.image.url} alt={`${category.name} supplier Bangladesh — MediportBD`} className="w-10 h-10 object-cover rounded border border-[var(--color-border-primary)]" />
                      ) : (
                        <div className="w-10 h-10 bg-[var(--color-background-muted)] rounded flex items-center justify-center text-[var(--color-text-secondary)] text-xs border border-[var(--color-border-primary)]">—</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--color-text-primary)]">{category.name}</div>
                      {category.description && <div className="text-xs text-[var(--color-text-secondary)] mt-1">{category.description.substring(0, 50)}...</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><code className="text-xs bg-[var(--color-background-tertiary)] px-2 py-1 rounded text-[var(--color-text-primary)] font-mono">{category.slug}</code></td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--color-text-primary)] text-xs">{category.parent ? category.parent.name || '—' : '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{category.productCount || 0}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-[var(--color-text-primary)]">{category.order || '0'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${category.isActive ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)]'}`}>
                        {category.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium space-x-2">
                      <button onClick={() => handleEdit(category)} className="text-blue-600 hover:text-blue-900 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(category._id, category.name)} className="text-[var(--color-status-danger)] hover:text-[var(--color-status-danger)] hover:underline">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-3">
          {categories.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-text-secondary)] text-sm">📦 No categories found.</div>
          ) : (
            categories.map((category) => (
              <div key={category._id} className="bg-[var(--color-background-secondary)] rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {category.image?.url ? (
                    <img src={category.image.url} alt={`${category.name} supplier Bangladesh — MediportBD`} className="w-12 h-12 object-cover rounded border border-[var(--color-border-primary)] flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-[var(--color-background-muted)] rounded flex items-center justify-center text-[var(--color-text-secondary)] text-xs border border-[var(--color-border-primary)] flex-shrink-0">—</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[var(--color-text-primary)] text-sm">{category.name}</div>
                    {category.parent && <div className="text-xs text-[var(--color-text-secondary)]">Parent: {category.parent.name}</div>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${category.isActive ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)]'}`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <code className="text-xs bg-[var(--color-background-tertiary)] px-2 py-1 rounded text-[var(--color-text-primary)] font-mono">{category.slug}</code>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{category.productCount || 0} products</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-[var(--color-border-primary)]">
                  <button onClick={() => handleEdit(category)} className="flex-1 min-h-[48px] px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Edit</button>
                  <button onClick={() => handleDelete(category._id, category.name)} className="flex-1 min-h-[48px] px-3 py-2 bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] border border-[var(--color-status-danger-tint)] rounded-lg text-sm font-semibold hover:bg-[var(--color-status-danger-tint)]">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-modal p-0 sm:p-4">
          <div className="bg-white rounded-t-lg sm:rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-[var(--color-status-success)] to-[var(--color-status-success)] text-white px-4 sm:px-6 py-4 flex items-center justify-between border-b rounded-t-lg sm:rounded-t-lg">
              <h2 className="text-lg font-semibold">Edit Category</h2>
              <button
                onClick={() => setEditingId(null)}
                className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-white/20 transition text-white"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[calc(90vh-200px)] overflow-y-auto">
              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-3 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Slug</label>
                <input
                  type="text"
                  value={editForm.slug || ''}
                  onChange={(e) => setEditForm({...editForm, slug: e.target.value})}
                  className="w-full px-3 py-3 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Description</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-3 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Status</label>
                <select
                  value={editForm.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'active'})}
                  className="w-full px-3 py-3 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                  style={{ fontSize: 'var(--text-base)' }}
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="bg-[var(--color-background-secondary)] px-4 sm:px-6 py-4 border-t flex gap-3">
              <button
                onClick={() => setEditingId(null)}
                className="flex-1 px-3 py-3 border border-[var(--color-border-primary)] rounded-lg hover:bg-[var(--color-background-tertiary)] text-sm font-medium transition min-h-[48px]"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="flex-1 px-3 py-3 bg-gradient-to-r from-[var(--color-status-success-tint)] to-[var(--color-status-success)] text-white rounded-lg hover:shadow-lg transition text-sm font-semibold min-h-[48px]"
              >
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
