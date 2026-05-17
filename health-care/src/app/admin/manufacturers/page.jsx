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

  // Check authentication on mount
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
  }, [includeInactive, searchTerm]);

  const fetchManufacturers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (includeInactive) params.append('includeInactive', 'true');
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await api.get(`/manufacturers?${params.toString()}`);
      
      // Handle different response structures
      const manufacturersData = response.manufacturers || response.data?.manufacturers || response.data || [];
      
      setManufacturers(Array.isArray(manufacturersData) ? manufacturersData : []);
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
      alert('Manufacturer deactivated successfully');
      fetchManufacturers();
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to delete manufacturer');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Manufacturers</h1>
            <p className="text-gray-600 mt-1">Manage product manufacturers and brands</p>
          </div>
          <button
            onClick={() => router.push('/admin/manufacturers/new')}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            + Add Manufacturer
          </button>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6 flex gap-4 items-center">
          <input
            type="text"
            placeholder="Search manufacturers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="w-4 h-4 text-blue-600 rounded"
            />
            <span className="text-sm text-gray-700">Show inactive</span>
          </label>
          <button
            onClick={() => {
              fetchManufacturers();
            }}
            className="text-sm text-blue-600 hover:text-blue-800 underline whitespace-nowrap"
          >
            Refresh
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-6">
            {error}
          </div>
        )}

        {/* Manufacturers Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
            <table className="w-full" style={{minWidth: '800px'}}>
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Logo
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Slug
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Country
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Products
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {manufacturers.length === 0 ? (
                <tr>
                  <td colSpan="7" className="px-6 py-12 text-center text-gray-500">
                    {searchTerm ? 'No manufacturers found matching your search.' : 'No manufacturers found. Create your first manufacturer to get started.'}
                  </td>
                </tr>
              ) : (
                manufacturers.map((manufacturer) => (
                  <tr key={manufacturer._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      {manufacturer.logo?.url ? (
                        <img
                          src={manufacturer.logo.url}
                          alt={manufacturer.name}
                          className="w-12 h-12 object-contain rounded"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded flex items-center justify-center text-gray-400 text-xs">
                          No logo
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">{manufacturer.name}</div>
                      {manufacturer.website && (
                        <a
                          href={manufacturer.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-blue-600 hover:underline"
                        >
                          {manufacturer.website}
                        </a>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
                        {manufacturer.slug}
                      </code>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {manufacturer.country || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {manufacturer.productCount || 0}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${
                          manufacturer.isActive
                            ? 'bg-green-100 text-green-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {manufacturer.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => router.push(`/admin/manufacturers/${manufacturer._id}/edit`)}
                        className="text-blue-600 hover:text-blue-900 mr-4"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(manufacturer._id, manufacturer.name)}
                        className="text-red-600 hover:text-red-900"
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
        </div>

        {/* Stats */}
        <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Total Manufacturers</div>
            <div className="text-2xl font-bold text-gray-900 mt-1">{manufacturers.length}</div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Active</div>
            <div className="text-2xl font-bold text-green-600 mt-1">
              {manufacturers.filter(m => m.isActive).length}
            </div>
          </div>
          <div className="bg-white rounded-lg shadow-sm p-4">
            <div className="text-sm text-gray-500">Total Products</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {manufacturers.reduce((sum, m) => sum + (m.productCount || 0), 0)}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
