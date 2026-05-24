'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/api';

export default function CategoriesManagement() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    fetchCategories();
  }, [includeInactive]);

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

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to deactivate "${name}"?`)) return;

    try {
      await api.delete(`/categories/${id}`);
      alert('Category deactivated successfully');
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete category');
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
      alert('Category updated successfully');
      setEditingId(null);
      fetchCategories();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update category');
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map(i => (
            <div key={i} className="h-16 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-lg shadow p-4 border border-green-100">
        <div className="flex items-center justify-between">
          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="w-4 h-4 text-green-600 rounded border-gray-300 accent-green-600"
            />
            <span className="text-sm font-medium text-gray-700">Show inactive categories</span>
          </label>
          <button
            onClick={() => fetchCategories()}
            className="text-sm bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 rounded-lg hover:shadow-lg transition font-medium"
          >
            ⟳ Refresh
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 text-red-700 px-4 py-3 rounded-lg flex items-start gap-3">
          <span className="text-lg">⚠️</span>
          <div className="text-sm">{error}</div>
        </div>
      )}

      {/* Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Image</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Name</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Slug</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Parent</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Products</th>
                <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Order</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Status</th>
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {categories.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-gray-500">📦 No categories found.</td></tr>
              ) : (
                categories.map((category) => (
                  <tr key={category._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 whitespace-nowrap">
                      {category.image?.url ? (
                        <img src={category.image.url} alt={category.name} className="w-10 h-10 object-cover rounded border border-gray-200" />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs border border-gray-300">—</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{category.name}</div>
                      {category.description && <div className="text-xs text-gray-600 mt-1">{category.description.substring(0, 50)}...</div>}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">{category.slug}</code></td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700 text-xs">{category.parent ? category.parent.name || '—' : '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{category.productCount || 0}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap text-center text-gray-700">{category.order || '0'}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {category.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium space-x-2">
                      <button onClick={() => handleEdit(category)} className="text-blue-600 hover:text-blue-900 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(category._id, category.name)} className="text-red-600 hover:text-red-900 hover:underline">Delete</button>
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
            <div className="p-8 text-center text-gray-500 text-sm">📦 No categories found.</div>
          ) : (
            categories.map((category) => (
              <div key={category._id} className="bg-gray-50 rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {category.image?.url ? (
                    <img src={category.image.url} alt={category.name} className="w-12 h-12 object-cover rounded border border-gray-200 flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs border border-gray-300 flex-shrink-0">—</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-900 text-[14px]">{category.name}</div>
                    {category.parent && <div className="text-[11px] text-gray-500">Parent: {category.parent.name}</div>}
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${category.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {category.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[12px]">
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">{category.slug}</code>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{category.productCount || 0} products</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-gray-200">
                  <button onClick={() => handleEdit(category)} className="flex-1 min-h-[48px] px-3 py-2 bg-blue-600 text-white rounded-lg text-[13px] font-semibold hover:bg-blue-700">Edit</button>
                  <button onClick={() => handleDelete(category._id, category.name)} className="flex-1 min-h-[48px] px-3 py-2 bg-red-50 text-red-600 border border-red-200 rounded-lg text-[13px] font-semibold hover:bg-red-100">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-6 py-4 flex items-center justify-between border-b">
              <h2 className="text-lg font-bold">Edit Category</h2>
              <button
                onClick={() => setEditingId(null)}
                className="text-white hover:opacity-80 text-2xl transition"
              >
                ✕
              </button>
            </div>

            <div className="p-4 space-y-3 max-h-[calc(90vh-200px)] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  value={editForm.name || ''}
                  onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Slug</label>
                <input
                  type="text"
                  value={editForm.slug || ''}
                  onChange={(e) => setEditForm({...editForm, slug: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Status</label>
                <select
                  value={editForm.isActive ? 'active' : 'inactive'}
                  onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'active'})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-3 border-t flex gap-2 justify-end">
              <button
                onClick={() => setEditingId(null)}
                className="px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 text-sm font-medium transition"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-3 py-2 bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-lg hover:shadow-lg transition text-sm font-medium"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
