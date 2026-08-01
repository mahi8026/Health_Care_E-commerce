'use client';
import { confirmAction } from '@/components/ui/ConfirmDialog';

/**
 * FlashDealsManagement — Enhanced admin page for managing flash deals
 * 
 * Features:
 * - Create/edit/delete flash deals
 * - Filter by status (all/active/scheduled/expired)
 * - Search by title
 * - Quick preview
 * - Performance metrics
 * - Real-time statistics
 */

import { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaPlus, FaEdit, FaTrash, FaClock, FaToggleOn, FaToggleOff,
  FaFire, FaCalendar, FaPercentage, FaTimes, FaEye,
  FaSearch, FaShoppingCart
} from 'react-icons/fa';
import api from '@/utils/api';
import Spinner from '@/components/ui/Spinner';
import AdminShell from '@/components/admin/AdminShell';
import FlashDealModal from '@/components/admin/FlashDealModal';

function useFocusTrap(containerRef, isActive, onClose) {
  useEffect(() => {
    if (!isActive) return;
    const container = containerRef.current;
    if (!container) return;

    document.body.style.overflow = 'hidden';

    const focusable = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusable[0];
    const last = focusable[focusable.length - 1];

    if (first) first.focus();

    function handleKeyDown(e) {
      if (e.key === 'Escape') { onClose?.(); return; }
      if (e.key !== 'Tab') return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    }

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive, onClose, containerRef]);
}

export default function FlashDealsManagement() {
  const router = useRouter();
  const [flashDeals, setFlashDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all'); // all, active, scheduled, expired
  const [previewDeal, setPreviewDeal] = useState(null);
  const [selectedDeals, setSelectedDeals] = useState([]); // For bulk delete
  const [showRemoveProductModal, setShowRemoveProductModal] = useState(null); // {dealId, productId, productName}
  const previewRef = useRef(null);
  const removeRef = useRef(null);
  useFocusTrap(previewRef, !!previewDeal, () => setPreviewDeal(null));
  useFocusTrap(removeRef, !!showRemoveProductModal, () => setShowRemoveProductModal(null));

  const fetchFlashDeals = async () => {
    try {
      // api.get returns the full response: { success: true, data: { flashDeals, total }, message }
      const response = await api.get('/flash-deals');
      
      // Extract flashDeals from data object
      const deals = response?.data?.flashDeals || [];
      
      setFlashDeals(Array.isArray(deals) ? deals : []);
    } catch (err) {
      setError('Failed to load flash deals');
      console.error('Error fetching flash deals:', err);
      setFlashDeals([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void Promise.resolve().then(fetchFlashDeals);
  }, []);

  // Filtered and searched deals
  const filteredDeals = useMemo(() => {
    let result = flashDeals;

    // Filter by status
    if (filterStatus !== 'all') {
      result = result.filter(deal => {
        const now = new Date();
        const start = new Date(deal.startTime);
        const end = new Date(deal.endTime);

        if (filterStatus === 'active') {
          return deal.isActive && now >= start && now <= end;
        } else if (filterStatus === 'scheduled') {
          return deal.isActive && now < start;
        } else if (filterStatus === 'expired') {
          return now > end;
        }
        return true;
      });
    }

    // Search by title or description
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(deal =>
        deal.title.toLowerCase().includes(query) ||
        deal.description.toLowerCase().includes(query)
      );
    }

    return result;
  }, [flashDeals, filterStatus, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const now = new Date();
    let totalProducts = 0;
    let totalSales = 0;
    let avgDiscount = 0;

    const active = flashDeals.filter(d => {
      const start = new Date(d.startTime);
      const end = new Date(d.endTime);
      return d.isActive && now >= start && now <= end;
    }).length;

    const scheduled = flashDeals.filter(d => {
      const start = new Date(d.startTime);
      return d.isActive && now < start;
    }).length;

    const expired = flashDeals.filter(d => {
      const end = new Date(d.endTime);
      return now > end;
    }).length;

    flashDeals.forEach(deal => {
      totalProducts += deal.products.length;
      deal.products.forEach(p => {
        totalSales += p.soldCount || 0;
        avgDiscount += p.discountPercentage || 0;
      });
    });

    if (totalProducts > 0) {
      avgDiscount = Math.round(avgDiscount / totalProducts);
    }

    return {
      total: flashDeals.length,
      active,
      scheduled,
      expired,
      totalProducts,
      totalSales,
      avgDiscount
    };
  }, [flashDeals]);

  const handleCreateNew = () => {
    setEditingDeal(null);
    setShowModal(true);
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!await confirmAction('Are you sure you want to delete this flash deal?')) return;

    try {
      await api.delete(`/flash-deals/${id}`);
      setSuccess('Flash deal deleted successfully');
      fetchFlashDeals();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete flash deal');
      console.error(err);
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await api.patch(`/flash-deals/${id}/toggle`);
      setSuccess('Flash deal status updated');
      fetchFlashDeals();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to toggle status');
      console.error(err);
    }
  };

  const handlePreview = (deal) => {
    setPreviewDeal(deal);
  };

  const handleRemoveProductFromDeal = async (dealId, productId) => {
    try {
      const deal = flashDeals.find(d => d._id === dealId);
      if (!deal) return;

      // Filter out the product
      const updatedProducts = deal.products.filter(p => 
        (p.product._id || p.product) !== productId
      );

      // Check if at least one product remains
      if (updatedProducts.length === 0) {
        setError('Cannot remove the last product. Delete the entire deal instead.');
        setTimeout(() => setError(''), 3000);
        return;
      }

      // Update the deal
      await api.put(`/flash-deals/${dealId}`, {
        ...deal,
        products: updatedProducts.map(p => ({
          productId: p.product._id || p.product,
          discountPercentage: p.discountPercentage,
          stockLimit: p.stockLimit,
          soldCount: p.soldCount
        }))
      });

      setSuccess('Product removed from flash deal');
      setShowRemoveProductModal(null);
      fetchFlashDeals();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to remove product');
      console.error(err);
    }
  };

  const handleSelectDeal = (dealId) => {
    setSelectedDeals(prev => 
      prev.includes(dealId) 
        ? prev.filter(id => id !== dealId)
        : [...prev, dealId]
    );
  };

  const handleSelectAll = () => {
    if (selectedDeals.length === filteredDeals.length) {
      setSelectedDeals([]);
    } else {
      setSelectedDeals(filteredDeals.map(d => d._id));
    }
  };

  const handleBulkDelete = async () => {
    if (selectedDeals.length === 0) return;
    
    if (!await confirmAction(`Are you sure you want to delete ${selectedDeals.length} flash deal${selectedDeals.length > 1 ? 's' : ''}?`)) return;

    try {
      await Promise.all(selectedDeals.map(id => api.delete(`/flash-deals/${id}`)));
      setSuccess(`${selectedDeals.length} flash deal${selectedDeals.length > 1 ? 's' : ''} deleted successfully`);
      setSelectedDeals([]);
      fetchFlashDeals();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete flash deals');
      console.error(err);
    }
  };

  const getStatusBadge = (deal) => {
    const now = new Date();
    const start = new Date(deal.startTime);
    const end = new Date(deal.endTime);

    if (!deal.isActive) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[var(--color-background-muted)] text-[var(--color-text-primary)]">Inactive</span>;
    }
    if (now < start) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Scheduled</span>;
    }
    if (now >= start && now <= end) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]">Active</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]">Expired</span>;
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <AdminShell title="Flash Deals">
        <div className="flex items-center justify-center min-h-[400px]">
          <Spinner size="lg" />
        </div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Flash Deals">
      <div className="p-4 md:p-6 space-y-4 md:space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-text-primary flex items-center gap-2 md:gap-3">
              <FaFire className="text-[var(--color-status-danger)] text-xl md:text-2xl" />
              Flash Deals
            </h1>
            <p className="text-sm md:text-base text-[var(--color-text-secondary)] mt-1">Create and manage limited-time product deals</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 bg-[var(--color-status-danger-tint)] text-white rounded-lg hover:bg-danger transition-colors font-semibold text-sm md:text-base w-full sm:w-auto"
          >
            <FaPlus /> Create Flash Deal
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-3 md:p-4 bg-[var(--color-status-danger-tint)] border border-[var(--color-status-danger-tint)] rounded-lg text-[var(--color-status-danger)] text-sm md:text-base">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 md:p-4 bg-[var(--color-status-success-tint)] border border-[var(--color-status-success-tint)] rounded-lg text-[var(--color-status-success)] text-sm md:text-base">
            {success}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-3 md:p-4 rounded-lg border border-[var(--color-border-primary)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <FaFire className="text-[var(--color-status-danger)] text-lg" />
              <span className="text-xs text-[var(--color-text-secondary)]">Total</span>
            </div>
            <div className="text-xl md:text-2xl font-semibold text-[var(--color-text-primary)]">{stats.total}</div>
            <div className="text-xs md:text-sm text-[var(--color-text-secondary)]">Total Deals</div>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-lg border border-[var(--color-border-primary)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <FaClock className="text-[var(--color-status-success)] text-lg" />
              <span className="text-xs text-[var(--color-text-secondary)]">Live</span>
            </div>
            <div className="text-xl md:text-2xl font-semibold text-[var(--color-status-success)]">{stats.active}</div>
            <div className="text-xs md:text-sm text-[var(--color-text-secondary)]">Active Now</div>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-lg border border-[var(--color-border-primary)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <FaShoppingCart className="text-purple-500 text-lg" />
              <span className="text-xs text-[var(--color-text-secondary)]">Sales</span>
            </div>
            <div className="text-xl md:text-2xl font-semibold text-purple-600">{stats.totalSales}</div>
            <div className="text-xs md:text-sm text-[var(--color-text-secondary)]">Items Sold</div>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-lg border border-[var(--color-border-primary)] hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-2">
              <FaPercentage className="text-orange-500 text-lg" />
              <span className="text-xs text-[var(--color-text-secondary)]">Avg</span>
            </div>
            <div className="text-xl md:text-2xl font-semibold text-orange-600">{stats.avgDiscount}%</div>
            <div className="text-xs md:text-sm text-[var(--color-text-secondary)]">Discount</div>
          </div>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-text-secondary)]" />
            <input
              type="text"
              placeholder="Search deals..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[var(--color-border-primary)] rounded-lg focus:ring-2 focus:ring-[var(--color-status-danger)] focus:border-transparent"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilterStatus('all')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                filterStatus === 'all'
                  ? 'bg-[var(--color-status-danger-tint)] text-white'
                  : 'bg-white text-[var(--color-text-primary)] border border-[var(--color-border-primary)] hover:bg-[var(--color-background-secondary)]'
              }`}
            >
              All ({stats.total})
            </button>
            <button
              onClick={() => setFilterStatus('active')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                filterStatus === 'active'
                  ? 'bg-[var(--color-status-success-tint)] text-white'
                  : 'bg-white text-[var(--color-text-primary)] border border-[var(--color-border-primary)] hover:bg-[var(--color-background-secondary)]'
              }`}
            >
              Active ({stats.active})
            </button>
            <button
              onClick={() => setFilterStatus('scheduled')}
              className={`px-3 md:px-4 py-2 rounded-lg font-medium transition-colors text-sm ${
                filterStatus === 'scheduled'
                  ? 'bg-blue-500 text-white'
                  : 'bg-white text-[var(--color-text-primary)] border border-[var(--color-border-primary)] hover:bg-[var(--color-background-secondary)]'
              }`}
            >
              Scheduled ({stats.scheduled})
            </button>
          </div>
        </div>

        {/* Bulk Actions Bar */}
        {selectedDeals.length > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold text-blue-900">
                {selectedDeals.length} deal{selectedDeals.length > 1 ? 's' : ''} selected
              </span>
              <button
                onClick={() => setSelectedDeals([])}
                className="text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Clear selection
              </button>
            </div>
            <button
              onClick={handleBulkDelete}
              className="flex items-center gap-2 px-4 py-2 bg-[var(--color-status-danger-tint)] text-white rounded-lg hover:bg-danger transition-colors font-semibold text-sm"
            >
              <FaTrash />
              Delete Selected
            </button>
          </div>
        )}

        {/* Flash Deals List */}
        <div className="bg-white rounded-xl shadow-sm border border-[var(--color-border-primary)] overflow-hidden">
          {filteredDeals.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <FaFire className="mx-auto text-5xl md:text-6xl text-[var(--color-text-tertiary)] mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-[var(--color-text-primary)] mb-2">
                {flashDeals.length === 0 ? 'No Flash Deals Yet' : 'No deals found'}
              </h3>
              <p className="text-sm md:text-base text-[var(--color-text-secondary)] mb-6">
                {flashDeals.length === 0 
                  ? 'Create your first flash deal to boost sales'
                  : 'Try adjusting your search or filter'}
              </p>
              {flashDeals.length === 0 && (
                <button
                  onClick={handleCreateNew}
                  className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-[var(--color-status-danger-tint)] text-white rounded-lg hover:bg-danger transition-colors font-semibold text-sm md:text-base"
                >
                  <FaPlus /> Create Flash Deal
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-[var(--color-border-primary)]">
                {filteredDeals.map((deal) => {
                  const totalSold = deal.products.reduce((sum, p) => sum + (p.soldCount || 0), 0);
                  const isSelected = selectedDeals.includes(deal._id);
                  return (
                    <div key={deal._id} className={`p-4 hover:bg-[var(--color-background-secondary)] transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                      <div className="flex items-start gap-3 mb-3">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleSelectDeal(deal._id)}
                          className="mt-1 w-4 h-4 text-[var(--color-status-danger)] border-[var(--color-border-primary)] rounded focus:ring-[var(--color-status-danger)]"
                        />
                        <div className="flex items-start justify-between flex-1">
                          <div className="flex items-start gap-3 flex-1 min-w-0">
                            <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-status-danger-tint)] rounded-lg flex items-center justify-center">
                              <FaFire className="text-[var(--color-status-danger)] text-lg" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{deal.title}</div>
                              <div className="text-xs text-[var(--color-text-secondary)] mt-0.5 line-clamp-1">{deal.description}</div>
                            </div>
                          </div>
                          {getStatusBadge(deal)}
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-xs text-[var(--color-text-secondary)] mb-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-text-secondary)]">Products:</span>
                          <span className="font-medium">{deal.products.length}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-[var(--color-text-secondary)]">Sold:</span>
                          <span className="font-medium">{totalSold}</span>
                        </div>
                        <div className="flex items-center gap-1 text-xs">
                          <FaCalendar className="text-[var(--color-text-secondary)]" />
                          <span className="font-medium">{formatDate(deal.startTime)}</span>
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--color-border-tertiary)]">
                        <button
                          onClick={() => handlePreview(deal)}
                          className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                          title="Preview"
                        >
                          <FaEye />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(deal._id)}
                          className={`p-2 rounded-lg transition-colors ${
                            deal.isActive
                              ? 'text-[var(--color-status-success)] hover:bg-[var(--color-status-success-tint)]'
                              : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]'
                          }`}
                          title={deal.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {deal.isActive ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                        </button>
                        <button
                          onClick={() => handleEdit(deal)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <FaEdit />
                        </button>
                        <button
                          onClick={() => handleDelete(deal._id)}
                          className="p-2 text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger-tint)] rounded-lg transition-colors"
                          title="Delete"
                        >
                          <FaTrash />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-[var(--color-background-secondary)] border-b border-[var(--color-border-primary)]">
                    <tr>
                      <th className="px-6 py-3 text-left">
                        <input
                          type="checkbox"
                          checked={selectedDeals.length === filteredDeals.length && filteredDeals.length > 0}
                          onChange={handleSelectAll}
                          className="w-4 h-4 text-[var(--color-status-danger)] border-[var(--color-border-primary)] rounded focus:ring-[var(--color-status-danger)]"
                        />
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                        Performance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-[var(--color-text-primary)] uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--color-border-primary)]">
                    {filteredDeals.map((deal) => {
                      const totalSold = deal.products.reduce((sum, p) => sum + (p.soldCount || 0), 0);
                      const avgDiscount = Math.round(deal.products.reduce((sum, p) => sum + (p.discountPercentage || 0), 0) / deal.products.length);
                      const isSelected = selectedDeals.includes(deal._id);
                      return (
                        <tr key={deal._id} className={`hover:bg-[var(--color-background-secondary)] transition-colors ${isSelected ? 'bg-blue-50' : ''}`}>
                          <td className="px-6 py-4">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => handleSelectDeal(deal._id)}
                              className="w-4 h-4 text-[var(--color-status-danger)] border-[var(--color-border-primary)] rounded focus:ring-[var(--color-status-danger)]"
                            />
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-status-danger-tint)] rounded-lg flex items-center justify-center">
                                <FaFire className="text-[var(--color-status-danger)] text-xl" />
                              </div>
                              <div className="max-w-xs">
                                <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">{deal.title}</div>
                                <div className="text-xs text-[var(--color-text-secondary)] truncate">{deal.description}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-[var(--color-text-primary)] font-medium">
                              {deal.products.length} item{deal.products.length !== 1 ? 's' : ''}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm font-semibold text-[var(--color-text-primary)]">{totalSold} sold</div>
                            <div className="text-xs text-[var(--color-text-secondary)]">Avg {avgDiscount}% off</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-xs text-[var(--color-text-secondary)]">
                              <div className="font-medium">{formatDate(deal.startTime)}</div>
                              <div className="text-[var(--color-text-secondary)]">to {formatDate(deal.endTime)}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {getStatusBadge(deal)}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button
                                onClick={() => handlePreview(deal)}
                                className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition-colors"
                                title="Preview"
                              >
                                <FaEye />
                              </button>
                              <button
                                onClick={() => handleToggleStatus(deal._id)}
                                className={`p-2 rounded-lg transition-colors ${
                                  deal.isActive
                                    ? 'text-[var(--color-status-success)] hover:bg-[var(--color-status-success-tint)]'
                                    : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-background-secondary)]'
                                }`}
                                title={deal.isActive ? 'Deactivate' : 'Activate'}
                              >
                                {deal.isActive ? <FaToggleOn size={20} /> : <FaToggleOff size={20} />}
                              </button>
                              <button
                                onClick={() => handleEdit(deal)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                title="Edit"
                              >
                                <FaEdit />
                              </button>
                              <button
                                onClick={() => handleDelete(deal._id)}
                                className="p-2 text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger-tint)] rounded-lg transition-colors"
                                title="Delete"
                              >
                                <FaTrash />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <FlashDealModal
          deal={editingDeal}
          onClose={() => {
            setShowModal(false);
            setEditingDeal(null);
          }}
          onSave={() => {
            setShowModal(false);
            setEditingDeal(null);
            fetchFlashDeals();
            setSuccess(editingDeal ? 'Flash deal updated!' : 'Flash deal created!');
            setTimeout(() => setSuccess(''), 3000);
          }}
        />
      )}

      {/* Preview Modal */}
      {previewDeal && (
        <div ref={previewRef} role="dialog" aria-modal="true" className="fixed inset-0 bg-black bg-opacity-50 z-modal flex items-center justify-center p-4" onClick={() => setPreviewDeal(null)}>
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-6 border-b border-[var(--color-border-primary)] flex items-center justify-between sticky top-0 bg-white">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Preview: {previewDeal.title}</h3>
              <button onClick={() => setPreviewDeal(null)} aria-label="Close" className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-secondary)]">
                <FaTimes size={20} />
              </button>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <div className="text-sm text-[var(--color-text-secondary)] mb-2">{previewDeal.description}</div>
                {getStatusBadge(previewDeal)}
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--color-text-secondary)]">Duration:</span>
                  <span className="font-medium text-right">{formatDate(previewDeal.startTime)} - {formatDate(previewDeal.endTime)}</span>
                </div>
                <div className="border-t pt-3">
                  <div className="font-semibold mb-2">Products ({previewDeal.products.length}):</div>
                  <div className="space-y-2">
                    {previewDeal.products.map((item, idx) => (
                      <div key={idx} className="flex justify-between items-center p-2 bg-[var(--color-background-secondary)] rounded group">
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{item.product?.name || 'Unknown Product'}</div>
                          <div className="text-xs text-[var(--color-text-secondary)]">
                            {item.discountPercentage}% off • Sold: {item.soldCount || 0}
                            {item.stockLimit && ` / ${item.stockLimit}`}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-right ml-2">
                            <div className="text-sm font-semibold text-[var(--color-status-danger)]">৳{item.finalPrice?.toLocaleString()}</div>
                            <div className="text-xs text-[var(--color-text-secondary)] line-through">৳{item.product?.price?.toLocaleString()}</div>
                          </div>
                          <button
                            onClick={() => setShowRemoveProductModal({
                              dealId: previewDeal._id,
                              productId: item.product?._id || item.product,
                              productName: item.product?.name || 'Unknown Product'
                            })}
                            className="opacity-0 group-hover:opacity-100 p-2 text-[var(--color-status-danger)] hover:bg-[var(--color-status-danger-tint)] rounded transition-all"
                            title="Remove product from deal"
                          >
                            <FaTrash size={14} />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Remove Product Confirmation Modal */}
      {showRemoveProductModal && (
        <div ref={removeRef} role="dialog" aria-modal="true" className="fixed inset-0 bg-black bg-opacity-50 z-modal flex items-center justify-center p-4" onClick={() => setShowRemoveProductModal(null)}>
          <div className="bg-white rounded-xl max-w-md w-full p-6" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-[var(--color-status-danger-tint)] rounded-full flex items-center justify-center">
                <FaTrash className="text-[var(--color-status-danger)] text-xl" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">Remove Product</h3>
                <p className="text-sm text-[var(--color-text-secondary)]">This action cannot be undone</p>
              </div>
            </div>
            <p className="text-sm text-[var(--color-text-primary)] mb-6">
              Are you sure you want to remove <strong>{showRemoveProductModal.productName}</strong> from this flash deal?
            </p>
            <div className="flex items-center justify-end gap-3">
              <button
                onClick={() => setShowRemoveProductModal(null)}
                className="px-4 py-2 text-[var(--color-text-primary)] hover:bg-[var(--color-background-tertiary)] rounded-lg transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                onClick={() => handleRemoveProductFromDeal(showRemoveProductModal.dealId, showRemoveProductModal.productId)}
                className="px-4 py-2 bg-[var(--color-status-danger-tint)] text-white rounded-lg hover:bg-danger transition-colors font-semibold"
              >
                Remove Product
              </button>
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
