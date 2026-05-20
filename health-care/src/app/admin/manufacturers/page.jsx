'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

// Check if user is authenticated
const isAuthenticated = () => {
  if (typeof window !== 'undefined') {
    return !!localStorage.getItem('medcore_token');
  }
  return false;
};

export default function ManufacturersPage() {
  const router = useRouter();
  const [manufacturers, setManufacturers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [includeInactive, setIncludeInactive] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('name');
  const [sortOrder, setSortOrder] = useState('asc');
  const [countryFilter, setCountryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [countries, setCountries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({});

  useEffect(() => {
    if (!isAuthenticated()) {
      process.env.NODE_ENV !== "production" && console.warn('[Manufacturers] No authentication token found');
      setError('Please log in to access the admin panel');
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    if (isAuthenticated()) {
      fetchManufacturers();
    }
  }, [includeInactive, searchTerm, countryFilter]);

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (includeInactive) params.append('includeInactive', 'true');
      if (searchTerm) params.append('search', searchTerm);
      if (countryFilter) params.append('country', countryFilter);
      
      const response = await api.get(`/manufacturers?${params.toString()}`);
      
      // Handle different response structures
      const manufacturersData = response.manufacturers || response.data?.manufacturers || response.data || [];
      const mfrArray = Array.isArray(manufacturersData) ? manufacturersData : [];
      
      setManufacturers(mfrArray);
      
      // Extract unique countries
      const uniqueCountries = [...new Set(mfrArray
        .filter(m => m.country)
        .map(m => m.country)
      )].sort();
      setCountries(uniqueCountries);
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error('[Manufacturers] Fetch error:', err);
      process.env.NODE_ENV !== "production" && console.error('[Manufacturers] Error details:', {
        message: err.message,
        status: err.status,
        data: err.data
      });
      
      // Provide more specific error messages
      let errorMessage = 'Failed to load manufacturers';
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
  };

  const handleDelete = async (id, name) => {
    if (!confirm(`Are you sure you want to deactivate "${name}"?`)) return;

    try {
      await api.delete(`/manufacturers/${id}`);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      alert('Manufacturer deactivated successfully');
      fetchManufacturers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete manufacturer');
    }
  };

  const handleEdit = (manufacturer) => {
    setEditingId(manufacturer._id);
    setEditForm({
      name: manufacturer.name,
      slug: manufacturer.slug,
      country: manufacturer.country,
      website: manufacturer.website || '',
      description: manufacturer.description || '',
      isActive: manufacturer.isActive
    });
  };

  const handleSaveEdit = async () => {
    try {
      await api.patch(`/manufacturers/${editingId}`, editForm);
      alert('Manufacturer updated successfully');
      setEditingId(null);
      fetchManufacturers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update manufacturer');
    }
  };

  // Sorting function
  const getSortedManufacturers = () => {
    const sorted = [...manufacturers].sort((a, b) => {
      let aVal = a[sortField];
      let bVal = b[sortField];

      if (sortField === 'productCount') {
        aVal = a.productCount || 0;
        bVal = b.productCount || 0;
      } else if (sortField === 'isActive') {
        aVal = a.isActive ? 1 : 0;
        bVal = b.isActive ? 1 : 0;
      } else if (!aVal || !bVal) {
        aVal = aVal || '';
        bVal = bVal || '';
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });
    return sorted;
  };

  // Pagination
  const sortedData = getSortedManufacturers();
  const totalPages = Math.ceil(sortedData.length / itemsPerPage);
  const startIdx = (currentPage - 1) * itemsPerPage;
  const paginatedData = sortedData.slice(startIdx, startIdx + itemsPerPage);

  const handleSort = (field) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === paginatedData.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(paginatedData.map(m => m._id)));
    }
  };

  const toggleSelect = (id) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const SortHeader = ({ field, label }) => (
    <th 
      className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-100 cursor-pointer hover:bg-gray-150 transition"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortField === field && (
          <span className="inline-block">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-8">
            <div className="h-10 bg-gray-300 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
            <div className="space-y-3">
              <div className="h-8 bg-gray-200 rounded"></div>
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 via-blue-950 to-gray-950 p-4 md:p-8\">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 via-cyan-400 to-teal-400 bg-clip-text text-transparent">Manufacturers</h1>
            <p className="text-gray-300 mt-2">Manage product manufacturers and brands</p>
          </div>
          <button
            onClick={() => router.push('/admin/manufacturers/new')}
            className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white px-6 py-3 rounded-lg hover:shadow-lg hover:shadow-blue-500/50 transition shadow-lg font-medium transform hover:scale-105"
          >
            + Add Manufacturer
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-gradient-primary text-white rounded-lg shadow-lg p-6 border border-blue-400/30 hover:shadow-xl hover:shadow-blue-500/20 transition">
            <div className="text-xs text-blue-100 font-semibold uppercase">Total Manufacturers</div>
            <div className="text-3xl font-bold mt-2">{manufacturers.length}</div>
          </div>
          <div className="bg-gradient-success text-white rounded-lg shadow-lg p-6 border border-green-400/30 hover:shadow-xl hover:shadow-green-500/20 transition">
            <div className="text-xs text-green-100 font-semibold uppercase">Active</div>
            <div className="text-3xl font-bold mt-2">{manufacturers.filter(m => m.isActive).length}</div>
          </div>
          <div className="bg-gradient-danger text-white rounded-lg shadow-lg p-6 border border-red-400/30 hover:shadow-xl hover:shadow-red-500/20 transition">
            <div className="text-xs text-red-100 font-semibold uppercase">Inactive</div>
            <div className="text-3xl font-bold mt-2">{manufacturers.filter(m => !m.isActive).length}</div>
          </div>
          <div className="bg-gradient-warning text-white rounded-lg shadow-lg p-6 border border-yellow-400/30 hover:shadow-xl hover:shadow-yellow-500/20 transition">
            <div className="text-xs text-yellow-100 font-semibold uppercase">Total Products</div>
            <div className="text-3xl font-bold mt-2">
              {manufacturers.reduce((sum, m) => sum + (m.productCount || 0), 0)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-gradient-to-br from-white/10 to-white/5 backdrop-blur border border-white/20 rounded-lg shadow-lg p-6 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Search</label>
              <input
                type="text"
                placeholder="Search by name, slug..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-white/80 backdrop-blur border border-white/30 text-gray-900 placeholder-gray-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Country</label>
              <select
                value={countryFilter}
                onChange={(e) => {
                  setCountryFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-4 py-2 bg-white/80 backdrop-blur border border-white/30 text-gray-900 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400 focus:bg-white transition"
              >
                <option value="">All Countries</option>
                {countries.map(country => (
                  <option key={country} value={country}>{country}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <label className="flex items-center gap-3 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={includeInactive}
                  onChange={(e) => {
                    setIncludeInactive(e.target.checked);
                    setCurrentPage(1);
                  }}
                  className="w-4 h-4 text-blue-600 rounded border-gray-300"
                />
                <span className="text-sm text-gray-700">Include Inactive</span>
              </label>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setCurrentPage(1);
                  fetchManufacturers();
                }}
                className="w-full bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 transition font-medium"
              >
                ⟳ Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className=\"bg-gradient-to-r from-red-500/20 to-pink-500/20 backdrop-blur border-2 border-red-400/50 text-red-300 px-6 py-4 rounded-lg mb-6 flex items-start gap-3\">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-medium">Error</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          </div>
        )}

        {/* Manufacturers Table */}
        <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur border border-white/30 rounded-lg shadow-xl overflow-hidden">
          {selectedIds.size > 0 && (
            <div className=\"bg-gradient-to-r from-blue-500/30 to-cyan-500/30 backdrop-blur border-b border-blue-400/50 px-6 py-3 flex items-center justify-between\">
              <span className=\"text-sm font-medium text-blue-200\">{selectedIds.size} item(s) selected</span>
              <button
                className=\"text-xs bg-gradient-to-r from-red-600 to-pink-600 text-white px-3 py-1 rounded hover:shadow-lg transition font-medium\"
                onClick={() => alert('Bulk delete feature coming soon')}
              >
                Bulk Delete
              </button>
            </div>
          )}
          
          <div className="overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
            <table className="w-full" style={{minWidth: '900px'}}>
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === paginatedData.length && paginatedData.length > 0}
                      onChange={toggleSelectAll}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Logo
                  </th>
                  <SortHeader field="name" label="Name" />
                  <SortHeader field="slug" label="Slug" />
                  <SortHeader field="country" label="Country" />
                  <SortHeader field="productCount" label="Products" />
                  <SortHeader field="isActive" label="Status" />
                  <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {paginatedData.length === 0 ? (
                  <tr>
                    <td colSpan="8" className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <div className="text-lg">📦</div>
                        <div className="mt-2">
                          {searchTerm || countryFilter
                            ? 'No manufacturers found matching your filters.'
                            : 'No manufacturers found. Create your first manufacturer to get started.'}
                        </div>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedData.map((manufacturer) => (
                    <tr key={manufacturer._id} className="hover:bg-gray-50 transition">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedIds.has(manufacturer._id)}
                          onChange={() => toggleSelect(manufacturer._id)}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {manufacturer.logo?.url ? (
                          <img
                            src={manufacturer.logo.url}
                            alt={manufacturer.name}
                            className="w-12 h-12 object-contain rounded border border-gray-200"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs border border-gray-300">
                            No logo
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-semibold text-gray-900">{manufacturer.name}</div>
                        {manufacturer.website && (
                          <a
                            href={manufacturer.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline"
                          >
                            {new URL(manufacturer.website).hostname}
                          </a>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <code className="text-xs bg-gray-100 px-3 py-1 rounded text-gray-700 font-mono">
                          {manufacturer.slug}
                        </code>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {manufacturer.country || '—'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
                          {manufacturer.productCount || 0}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                            manufacturer.isActive
                              ? 'bg-green-100 text-green-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {manufacturer.isActive ? '● Active' : '● Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                        <button
                          onClick={() => handleEdit(manufacturer)}
                          className="text-blue-600 hover:text-blue-900 hover:underline transition"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(manufacturer._id, manufacturer.name)}
                          className="text-red-600 hover:text-red-900 hover:underline transition"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="bg-white px-6 py-4 border-t border-gray-200 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing {startIdx + 1} to {Math.min(startIdx + itemsPerPage, sortedData.length)} of {sortedData.length}
              </div>
              <div className="flex gap-2">
                <button
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage(currentPage - 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Previous
                </button>
                <div className="flex items-center gap-1">
                  {Array.from({length: totalPages}, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`px-3 py-2 rounded-lg transition ${
                        currentPage === page
                          ? 'bg-blue-600 text-white'
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </div>
                <button
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage(currentPage + 1)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Edit Modal */}
        {editingId && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 flex items-center justify-between border-b">
                <h2 className="text-xl font-bold text-white">Edit Manufacturer</h2>
                <button
                  onClick={() => setEditingId(null)}
                  className="text-white hover:opacity-80 text-2xl"
                >
                  ✕
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name *</label>
                  <input
                    type="text"
                    value={editForm.name || ''}
                    onChange={(e) => setEditForm({...editForm, name: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Manufacturer name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={editForm.slug || ''}
                    onChange={(e) => setEditForm({...editForm, slug: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="manufacturer-slug"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Country</label>
                    <input
                      type="text"
                      value={editForm.country || ''}
                      onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Country"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                      value={editForm.isActive ? 'active' : 'inactive'}
                      onChange={(e) => setEditForm({...editForm, isActive: e.target.value === 'active'})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Website</label>
                  <input
                    type="url"
                    value={editForm.website || ''}
                    onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://example.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                  <textarea
                    value={editForm.description || ''}
                    onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Manufacturer description"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-gray-50 px-6 py-4 border-t flex gap-3 justify-end">
                <button
                  onClick={() => setEditingId(null)}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 transition font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
