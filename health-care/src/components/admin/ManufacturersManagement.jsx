'use client';

import { useState, useEffect } from 'react';
import api from '@/utils/api';

export default function ManufacturersManagement() {
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
    fetchManufacturers();
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
      
      const manufacturersData = response.manufacturers || response.data?.manufacturers || response.data || [];
      const mfrArray = Array.isArray(manufacturersData) ? manufacturersData : [];
      
      setManufacturers(mfrArray);
      
      const uniqueCountries = [...new Set(mfrArray
        .filter(m => m.country)
        .map(m => m.country)
      )].sort();
      setCountries(uniqueCountries);
    } catch (err) {
      let errorMessage = 'Failed to load manufacturers';
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
      await api.delete(`/manufacturers/${id}`);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      alert('Manufacturer deactivated successfully');
      fetchManufacturers();
    } catch (err) {
      alert(err.message || err.data?.message || 'Failed to delete manufacturer');
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
      alert(err.message || err.data?.message || 'Failed to update manufacturer');
    }
  };

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
      className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider bg-gray-50 cursor-pointer hover:bg-gray-100 transition"
      onClick={() => handleSort(field)}
    >
      <div className="flex items-center gap-2">
        {label}
        {sortField === field && (
          <span className="inline-block text-blue-600">
            {sortOrder === 'asc' ? '↑' : '↓'}
          </span>
        )}
      </div>
    </th>
  );

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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gradient-primary text-white rounded-lg shadow-lg p-4 border-l-4 border-white/30">
          <div className="text-xs text-white/80 font-medium uppercase">Total Manufacturers</div>
          <div className="text-3xl font-bold mt-2">{manufacturers.length}</div>
        </div>
        <div className="bg-gradient-success text-white rounded-lg shadow-lg p-4 border-l-4 border-white/30">
          <div className="text-xs text-white/80 font-medium uppercase">Active</div>
          <div className="text-3xl font-bold mt-2">{manufacturers.filter(m => m.isActive).length}</div>
        </div>
        <div className="bg-gradient-danger text-white rounded-lg shadow-lg p-4 border-l-4 border-white/30">
          <div className="text-xs text-white/80 font-medium uppercase">Inactive</div>
          <div className="text-3xl font-bold mt-2">{manufacturers.filter(m => !m.isActive).length}</div>
        </div>
        <div className="bg-gradient-warning text-white rounded-lg shadow-lg p-4 border-l-4 border-white/30">
          <div className="text-xs text-white/80 font-medium uppercase">Total Products</div>
          <div className="text-3xl font-bold mt-2">
            {manufacturers.reduce((sum, m) => sum + (m.productCount || 0), 0)}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow p-4 border border-blue-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name, slug..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-700 mb-2">Country</label>
            <select
              value={countryFilter}
              onChange={(e) => {
                setCountryFilter(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition"
            >
              <option value="">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2 cursor-pointer mb-2">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => {
                  setIncludeInactive(e.target.checked);
                  setCurrentPage(1);
                }}
                className="w-4 h-4 text-blue-600 rounded border-gray-300 accent-blue-600"
              />
              <span className="text-xs font-medium text-gray-700">Include Inactive</span>
            </label>
          </div>
          <button
            onClick={() => {
              setCurrentPage(1);
              fetchManufacturers();
            }}
            className="bg-gradient-to-r from-gray-600 to-gray-700 text-white px-3 py-2 rounded-lg hover:shadow-lg transition text-sm font-medium h-9"
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
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
            <span className="text-xs font-medium text-blue-900">{selectedIds.size} item(s) selected</span>
            <button
              className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
              onClick={() => alert('Bulk delete coming soon')}
            >
              Bulk Delete
            </button>
          </div>
        )}
        
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectedIds.size === paginatedData.length && paginatedData.length > 0}
                    onChange={toggleSelectAll}
                    className="w-4 h-4 text-blue-600 rounded"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Logo</th>
                <SortHeader field="name" label="Name" />
                <SortHeader field="slug" label="Slug" />
                <SortHeader field="country" label="Country" />
                <SortHeader field="productCount" label="Products" />
                <SortHeader field="isActive" label="Status" />
                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-700 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {paginatedData.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                    <div>📦 {searchTerm || countryFilter ? 'No manufacturers found.' : 'No manufacturers found.'}</div>
                  </td>
                </tr>
              ) : (
                paginatedData.map((manufacturer) => (
                  <tr key={manufacturer._id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(manufacturer._id)}
                        onChange={() => toggleSelect(manufacturer._id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {manufacturer.logo?.url ? (
                        <img
                          src={manufacturer.logo.url}
                          alt={manufacturer.name}
                          className="w-10 h-10 object-contain rounded border border-gray-200"
                        />
                      ) : (
                        <div className="w-10 h-10 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs border border-gray-300">
                          —
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-900">{manufacturer.name}</div>
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
                    <td className="px-4 py-3 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700 font-mono">
                        {manufacturer.slug}
                      </code>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-gray-700">
                      {manufacturer.country || '—'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {manufacturer.productCount || 0}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                        manufacturer.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {manufacturer.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium space-x-2">
                      <button
                        onClick={() => handleEdit(manufacturer)}
                        className="text-blue-600 hover:text-blue-900 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(manufacturer._id, manufacturer.name)}
                        className="text-red-600 hover:text-red-900 hover:underline"
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
          <div className="bg-white px-4 py-3 border-t border-gray-200 flex items-center justify-between text-sm">
            <div className="text-gray-600">
              Showing {startIdx + 1}–{Math.min(startIdx + itemsPerPage, sortedData.length)} of {sortedData.length}
            </div>
            <div className="flex gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage(currentPage - 1)}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-xs"
              >
                ← Prev
              </button>
              {Array.from({length: Math.min(totalPages, 5)}, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-2 py-1 rounded text-xs ${
                    currentPage === page
                      ? 'bg-blue-600 text-white'
                      : 'border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {page}
                </button>
              ))}
              <button
                disabled={currentPage === totalPages}
                onClick={() => setCurrentPage(currentPage + 1)}
                className="px-3 py-1 border border-gray-300 rounded hover:bg-gray-50 disabled:opacity-50 text-xs"
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
          <div className="bg-white rounded-lg shadow-2xl max-w-md w-full">
            <div className="bg-gradient-primary text-white px-6 py-4 flex items-center justify-between border-b">
              <h2 className="text-lg font-bold">Edit Manufacturer</h2>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Country</label>
                  <input
                    type="text"
                    value={editForm.country || ''}
                    onChange={(e) => setEditForm({...editForm, country: e.target.value})}
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

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Website</label>
                <input
                  type="url"
                  value={editForm.website || ''}
                  onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Description</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows="2"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
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
                className="px-3 py-2 bg-gradient-to-r from-green-500 to-teal-500 text-white rounded-lg hover:shadow-lg transition text-sm font-medium"
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
