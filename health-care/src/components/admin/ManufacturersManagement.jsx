'use client';
import { confirmAction } from '@/components/ui/ConfirmDialog';

import { useState, useEffect, useCallback } from 'react';
import api from '@/utils/api';
import { showToast } from '@/components/ui/Toast';
const SortHeader = ({ field, label, sortField, sortOrder, onSort }) => (
  <th 
    className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider bg-[var(--color-background-secondary)] cursor-pointer hover:bg-[var(--color-background-tertiary)] transition"
    onClick={() => onSort(field)}
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

export default function ManufacturersManagement() {
  const [manufacturers, setManufacturers] = useState([]);
  const [totalProductCount, setTotalProductCount] = useState(0);
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
  const [deduping, setDeduping] = useState(false);


  const fetchManufacturers = useCallback(async () => {
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
      
      // Use the global totalProductCount from the API (counts all active products)
      const globalTotal = response.totalProductCount ?? response.data?.totalProductCount ?? 0;
      setTotalProductCount(globalTotal);
      
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
  }, [includeInactive, searchTerm, countryFilter]);
  useEffect(() => {
    void Promise.resolve().then(fetchManufacturers);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [includeInactive, searchTerm, countryFilter]);

  const handleDelete = async (id, name) => {
    if (!await confirmAction(`Are you sure you want to deactivate "${name}"?`)) return;

    try {
      await api.delete(`/manufacturers/${id}`);
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(id);
        return newSet;
      });
      showToast.success('Manufacturer deactivated successfully');
      fetchManufacturers();
    } catch (err) {
      showToast.error(err.message || err.data?.message || 'Failed to delete manufacturer');
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
      showToast.success('Manufacturer updated successfully');
      setEditingId(null);
      fetchManufacturers();
    } catch (err) {
      showToast.error(err.message || err.data?.message || 'Failed to update manufacturer');
    }
  };

  const handleDeduplicate = async () => {
    if (!await confirmAction('This will remove all duplicate manufacturers (keeping the oldest) and reassign their products. Continue?')) return;
    setDeduping(true);
    try {
      const result = await api.post('/manufacturers/deduplicate');
      const msg = result.message || result.data?.message || 'Deduplication complete';
      showToast.success(msg);
      fetchManufacturers();
    } catch (err) {
      showToast.error(err.message || err.data?.message || 'Failed to deduplicate manufacturers');
    } finally {
      setDeduping(false);
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
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        <div className="bg-brand-navy text-white rounded-lg shadow-lg p-3 md:p-4 border-l-4 border-white/30">
          <div className="text-xs text-white/80 font-medium uppercase">Total</div>
          <div className="text-2xl md:text-3xl font-semibold mt-1 md:mt-2">{manufacturers.length}</div>
        </div>
        <div className="bg-success text-white rounded-lg shadow-lg p-3 md:p-4 border-l-4 border-white/30">
          <div className="text-xs text-white/80 font-medium uppercase">Active</div>
          <div className="text-2xl md:text-3xl font-semibold mt-1 md:mt-2">{manufacturers.filter(m => m.isActive).length}</div>
        </div>
        <div className="bg-danger text-white rounded-lg shadow-lg p-3 md:p-4 border-l-4 border-white/30">
          <div className="text-xs text-white/80 font-medium uppercase">Inactive</div>
          <div className="text-2xl md:text-3xl font-semibold mt-1 md:mt-2">{manufacturers.filter(m => !m.isActive).length}</div>
        </div>
        <div className="bg-warning text-white rounded-lg shadow-lg p-3 md:p-4 border-l-4 border-white/30">
          <div className="text-xs text-white/80 font-medium uppercase">Products</div>
          <div className="text-2xl md:text-3xl font-semibold mt-1 md:mt-2">
            {totalProductCount}
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-lg shadow p-4 border border-blue-100">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Search</label>
            <input
              type="text"
              placeholder="Search by name, slug..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-3 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition min-h-[48px]"
              style={{ fontSize: 'var(--text-base)' }}
            />
          </div>
          <div>
            <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-2">Country</label>
            <select
              value={countryFilter}
              onChange={(e) => { setCountryFilter(e.target.value); setCurrentPage(1); }}
              className="w-full px-3 py-3 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent focus:bg-white transition min-h-[48px]"
              style={{ fontSize: 'var(--text-base)' }}
            >
              <option value="">All Countries</option>
              {countries.map(country => (
                <option key={country} value={country}>{country}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center">
            <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => { setIncludeInactive(e.target.checked); setCurrentPage(1); }}
                className="w-5 h-5 text-blue-600 rounded border-[var(--color-border-primary)] accent-blue-600"
              />
              <span className="text-sm font-medium text-[var(--color-text-primary)]">Include Inactive</span>
            </label>
          </div>
          <button
            onClick={() => { setCurrentPage(1); fetchManufacturers(); }}
            className="bg-gradient-to-r from-[var(--color-text-secondary)] to-[var(--color-text-secondary)] text-white px-3 py-3 rounded-lg hover:shadow-lg transition text-sm font-medium min-h-[48px]"
          >
            ⟳ Refresh
          </button>
          <button
            onClick={handleDeduplicate}
            disabled={deduping}
            className="bg-gradient-to-r from-orange-500 to-danger text-white px-3 py-3 rounded-lg hover:shadow-lg transition text-sm font-medium min-h-[48px] disabled:opacity-60"
          >
            {deduping ? '⏳ Removing…' : '🧹 Remove Duplicates'}
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
        {selectedIds.size > 0 && (
          <div className="bg-blue-50 border-b border-blue-200 px-4 sm:px-6 py-3 flex items-center justify-between">
            <span className="text-xs font-medium text-blue-900">{selectedIds.size} item(s) selected</span>
            <button className="text-xs bg-danger text-white px-3 py-1.5 rounded hover:bg-danger transition min-h-[44px]" onClick={() => showToast.info('Bulk delete coming soon')}>Bulk Delete</button>
          </div>
        )}
        
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-[var(--color-background-secondary)] border-b border-[var(--color-border-primary)]">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input type="checkbox" checked={selectedIds.size === paginatedData.length && paginatedData.length > 0} onChange={toggleSelectAll} className="w-4 h-4 text-blue-600 rounded" />
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-[var(--color-text-primary)] uppercase">Logo</th>
                <SortHeader field="name" label="Name" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                <SortHeader field="slug" label="Slug" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                <SortHeader field="country" label="Country" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                <SortHeader field="productCount" label="Products" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                <SortHeader field="isActive" label="Status" sortField={sortField} sortOrder={sortOrder} onSort={handleSort} />
                <th className="px-4 py-3 text-right text-xs font-semibold text-[var(--color-text-primary)] uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border-primary)]">
              {paginatedData.length === 0 ? (
                <tr><td colSpan="8" className="px-6 py-8 text-center text-[var(--color-text-secondary)]">📦 No manufacturers found.</td></tr>
              ) : (
                paginatedData.map((manufacturer) => (
                  <tr key={manufacturer._id} className="hover:bg-[var(--color-background-secondary)] transition">
                    <td className="px-4 py-3">
                      <input type="checkbox" checked={selectedIds.has(manufacturer._id)} onChange={() => toggleSelect(manufacturer._id)} className="w-4 h-4 text-blue-600 rounded" />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {manufacturer.logo?.url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={manufacturer.logo.url} alt={manufacturer.name} className="w-10 h-10 object-contain rounded border border-[var(--color-border-primary)]" />
                      ) : (
                        <div className="w-10 h-10 bg-[var(--color-background-muted)] rounded flex items-center justify-center text-[var(--color-text-secondary)] text-xs border border-[var(--color-border-primary)]">—</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-[var(--color-text-primary)]">{manufacturer.name}</div>
                      {manufacturer.website && (
                        <a href={manufacturer.website} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          {(() => { try { return new URL(manufacturer.website).hostname; } catch { return manufacturer.website; } })()}
                        </a>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap"><code className="text-xs bg-[var(--color-background-tertiary)] px-2 py-1 rounded text-[var(--color-text-primary)] font-mono">{manufacturer.slug}</code></td>
                    <td className="px-4 py-3 whitespace-nowrap text-[var(--color-text-primary)]">{manufacturer.country || '—'}</td>
                    <td className="px-4 py-3 whitespace-nowrap"><span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{manufacturer.productCount || 0}</span></td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className={`text-xs px-2 py-1 rounded-full font-semibold ${manufacturer.isActive ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)]'}`}>
                        {manufacturer.isActive ? '● Active' : '● Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-xs font-medium space-x-2">
                      <button onClick={() => handleEdit(manufacturer)} className="text-blue-600 hover:text-blue-900 hover:underline">Edit</button>
                      <button onClick={() => handleDelete(manufacturer._id, manufacturer.name)} className="text-[var(--color-status-danger)] hover:text-[var(--color-status-danger)] hover:underline">Delete</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3 p-3">
          {paginatedData.length === 0 ? (
            <div className="p-8 text-center text-[var(--color-text-secondary)] text-sm">📦 No manufacturers found.</div>
          ) : (
            paginatedData.map((manufacturer) => (
              <div key={manufacturer._id} className="bg-[var(--color-background-secondary)] rounded-lg border p-4 space-y-3">
                <div className="flex items-center gap-3">
                  {manufacturer.logo?.url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={manufacturer.logo.url} alt={manufacturer.name} className="w-12 h-12 object-contain rounded border border-[var(--color-border-primary)] flex-shrink-0" />
                  ) : (
                    <div className="w-12 h-12 bg-[var(--color-background-muted)] rounded flex items-center justify-center text-[var(--color-text-secondary)] text-xs border border-[var(--color-border-primary)] flex-shrink-0">—</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-[var(--color-text-primary)] text-sm">{manufacturer.name}</div>
                    <div className="text-xs text-[var(--color-text-secondary)]">{manufacturer.country || '—'}</div>
                  </div>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold flex-shrink-0 ${manufacturer.isActive ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-primary)]'}`}>
                    {manufacturer.isActive ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <code className="text-xs bg-[var(--color-background-tertiary)] px-2 py-1 rounded text-[var(--color-text-primary)] font-mono">{manufacturer.slug}</code>
                  <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">{manufacturer.productCount || 0} products</span>
                </div>
                <div className="flex gap-2 pt-2 border-t border-[var(--color-border-primary)]">
                  <button onClick={() => handleEdit(manufacturer)} className="flex-1 min-h-[48px] px-3 py-2 bg-blue-600 text-white rounded-lg text-sm font-semibold hover:bg-blue-700">Edit</button>
                  <button onClick={() => handleDelete(manufacturer._id, manufacturer.name)} className="flex-1 min-h-[48px] px-3 py-2 bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] border border-[var(--color-status-danger-tint)] rounded-lg text-sm font-semibold hover:bg-[var(--color-status-danger-tint)]">Delete</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-3 sm:px-4 py-3 border-t border-[var(--color-border-primary)] flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
            <div className="text-[var(--color-text-secondary)] text-xs sm:text-sm">Showing {startIdx + 1}–{Math.min(startIdx + itemsPerPage, sortedData.length)} of {sortedData.length}</div>
            <div className="flex gap-1">
              <button disabled={currentPage === 1} onClick={() => setCurrentPage(currentPage - 1)} className="px-3 py-2 border border-[var(--color-border-primary)] rounded hover:bg-[var(--color-background-secondary)] disabled:opacity-50 text-xs min-h-[44px] min-w-[44px]">←</button>
              {Array.from({length: Math.min(totalPages, 5)}, (_, i) => i + 1).map(page => (
                <button key={page} onClick={() => setCurrentPage(page)} className={`px-2 py-1 rounded text-xs min-h-[44px] min-w-[44px] ${currentPage === page ? 'bg-blue-600 text-white' : 'border border-[var(--color-border-primary)] hover:bg-[var(--color-background-secondary)]'}`}>{page}</button>
              ))}
              <button disabled={currentPage === totalPages} onClick={() => setCurrentPage(currentPage + 1)} className="px-3 py-2 border border-[var(--color-border-primary)] rounded hover:bg-[var(--color-background-secondary)] disabled:opacity-50 text-xs min-h-[44px] min-w-[44px]">→</button>
            </div>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-modal p-0 sm:p-4">
          <div className="bg-white rounded-t-lg sm:rounded-lg shadow-lg max-w-md w-full">
            <div className="bg-brand-navy text-white px-4 sm:px-6 py-4 flex items-center justify-between border-b rounded-t-lg sm:rounded-t-lg">
              <h2 className="text-lg font-semibold">Edit Manufacturer</h2>
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

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Country</label>
                  <input
                    type="text"
                    value={editForm.country || ''}
                    onChange={(e) => setEditForm({...editForm, country: e.target.value})}
                    className="w-full px-3 py-3 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
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

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Website</label>
                <input
                  type="url"
                  value={editForm.website || ''}
                  onChange={(e) => setEditForm({...editForm, website: e.target.value})}
                  className="w-full px-3 py-3 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
                  style={{ fontSize: 'var(--text-base)' }}
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-[var(--color-text-primary)] mb-1">Description</label>
                <textarea
                  value={editForm.description || ''}
                  onChange={(e) => setEditForm({...editForm, description: e.target.value})}
                  rows="2"
                  className="w-full px-3 py-3 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  style={{ fontSize: 'var(--text-base)' }}
                />
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
                className="flex-1 px-3 py-3 bg-gradient-to-r from-[var(--color-status-success-tint)] to-brand-teal text-white rounded-lg hover:shadow-lg transition text-sm font-semibold min-h-[48px]"
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
