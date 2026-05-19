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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between md:items-center mb-8 gap-4">
          <div>
            <h1 className="text-4xl font-bold text-gray-900">Manufacturers</h1>
            <p className="text-gray-600 mt-2">Manage product manufacturers and brands</p>
          </div>
          <button
            onClick={() => router.push('/admin/manufacturers/new')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition shadow-lg hover:shadow-xl transform hover:scale-105 font-medium"
          >
            + Add Manufacturer
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
            <div className="text-sm text-gray-600 font-medium">Total Manufacturers</div>
            <div className="text-3xl font-bold text-gray-900 mt-2">{manufacturers.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-green-600">
            <div className="text-sm text-gray-600 font-medium">Active</div>
            <div className="text-3xl font-bold text-green-600 mt-2">{manufacturers.filter(m => m.isActive).length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-red-600">
            <div className="text-sm text-gray-600 font-medium">Inactive</div>
            <div className="text-3xl font-bold text-red-600 mt-2">{manufacturers.filter(m => !m.isActive).length}</div>
          </div>
          <div className="bg-white rounded-lg shadow p-6 border-l-4 border-purple-600">
            <div className="text-sm text-gray-600 font-medium">Total Products</div>
            <div className="text-3xl font-bold text-purple-600 mt-2">
              {manufacturers.reduce((sum, m) => sum + (m.productCount || 0), 0)}
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
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
          <div className="bg-red-50 border-2 border-red-200 text-red-700 px-6 py-4 rounded-lg mb-6 flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div>
              <div className="font-medium">Error</div>
              <div className="text-sm mt-1">{error}</div>
            </div>
          </div>
        )}

        {/* Manufacturers Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden">
          {selectedIds.size > 0 && (
            <div className="bg-blue-50 border-b border-blue-200 px-6 py-3 flex items-center justify-between">
              <span className="text-sm font-medium text-blue-900">{selectedIds.size} item(s) selected</span>
              <button
                className="text-xs bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700 transition"
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
                          onClick={() => router.push(`/admin/manufacturers/${manufacturer._id}/edit`)}
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
      </div>
    </div>
  );
}
