'use client';

/**
 * FlashDealsManagement — Admin page for managing flash deals
 * 
 * Features:
 * - Create/edit/delete flash deals
 * - Select products and set discounts
 * - Set start/end times with date picker
 * - Toggle active status
 * - Real-time preview
 * - Drag & drop reordering
 */

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  FaPlus, FaEdit, FaTrash, FaClock, FaToggleOn, FaToggleOff,
  FaFire, FaCalendar, FaPercentage, FaSave, FaTimes, FaEye
} from 'react-icons/fa';
import api from '@/utils/api';
import Spinner from '@/components/ui/Spinner';
import AdminShell from '@/components/admin/AdminShell';
import FlashDealModal from '@/components/admin/FlashDealModal';

export default function FlashDealsManagement() {
  const router = useRouter();
  const [flashDeals, setFlashDeals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingDeal, setEditingDeal] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchFlashDeals();
  }, []);

  const fetchFlashDeals = async () => {
    try {
      setLoading(true);
      const response = await api.get('/flash-deals');
      setFlashDeals(response.flashDeals || []);
    } catch (err) {
      setError('Failed to load flash deals');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateNew = () => {
    setEditingDeal(null);
    setShowModal(true);
  };

  const handleEdit = (deal) => {
    setEditingDeal(deal);
    setShowModal(true);
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this flash deal?')) return;

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

  const getStatusBadge = (deal) => {
    const now = new Date();
    const start = new Date(deal.startTime);
    const end = new Date(deal.endTime);

    if (!deal.isActive) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-200 text-gray-700">Inactive</span>;
    }
    if (now < start) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-700">Scheduled</span>;
    }
    if (now >= start && now <= end) {
      return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700">Active</span>;
    }
    return <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700">Expired</span>;
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
          <Spinner size="large" />
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
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-2 md:gap-3">
              <FaFire className="text-red-500 text-xl md:text-2xl" />
              Flash Deals
            </h1>
            <p className="text-sm md:text-base text-gray-600 mt-1">Create and manage limited-time product deals</p>
          </div>
          <button
            onClick={handleCreateNew}
            className="flex items-center justify-center gap-2 px-4 py-2.5 md:py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm md:text-base w-full sm:w-auto"
          >
            <FaPlus /> Create Flash Deal
          </button>
        </div>

        {/* Messages */}
        {error && (
          <div className="p-3 md:p-4 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm md:text-base">
            {error}
          </div>
        )}
        {success && (
          <div className="p-3 md:p-4 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm md:text-base">
            {success}
          </div>
        )}

        {/* Flash Deals List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {flashDeals.length === 0 ? (
            <div className="p-8 md:p-12 text-center">
              <FaFire className="mx-auto text-5xl md:text-6xl text-gray-300 mb-4" />
              <h3 className="text-lg md:text-xl font-semibold text-gray-700 mb-2">No Flash Deals Yet</h3>
              <p className="text-sm md:text-base text-gray-500 mb-6">Create your first flash deal to boost sales</p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-5 md:px-6 py-2.5 md:py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold text-sm md:text-base"
              >
                <FaPlus /> Create Flash Deal
              </button>
            </div>
          ) : (
            <>
              {/* Mobile Card View */}
              <div className="block md:hidden divide-y divide-gray-200">
                {flashDeals.map((deal) => (
                  <div key={deal._id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                          <FaFire className="text-red-500 text-lg" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-semibold text-gray-900 truncate">{deal.title}</div>
                          <div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{deal.description}</div>
                        </div>
                      </div>
                      {getStatusBadge(deal)}
                    </div>
                    
                    <div className="space-y-2 text-xs text-gray-600 mb-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-500">Products:</span>
                        <span className="font-medium">{deal.products.length}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs">
                        <FaCalendar className="text-gray-400" />
                        <span className="font-medium">{formatDate(deal.startTime)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <span>to</span>
                        <span>{formatDate(deal.endTime)}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-end gap-2 pt-3 border-t border-gray-100">
                      <button
                        onClick={() => handleToggleStatus(deal._id)}
                        className={`p-2 rounded-lg transition-colors ${
                          deal.isActive
                            ? 'text-green-600 hover:bg-green-50'
                            : 'text-gray-400 hover:bg-gray-50'
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
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete"
                      >
                        <FaTrash />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Title
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Products
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {flashDeals.map((deal) => (
                      <tr key={deal._id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center">
                              <FaFire className="text-red-500 text-xl" />
                            </div>
                            <div>
                              <div className="text-sm font-semibold text-gray-900">{deal.title}</div>
                              <div className="text-xs text-gray-500">{deal.description}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 font-medium">
                            {deal.products.length} product{deal.products.length !== 1 ? 's' : ''}
                          </div>
                          <div className="text-xs text-gray-500">
                            {deal.products.slice(0, 2).map(p => p.product?.name || 'Unknown').join(', ')}
                            {deal.products.length > 2 && ` +${deal.products.length - 2} more`}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-sm text-gray-600">
                            <FaCalendar className="text-gray-400" />
                            <div>
                              <div className="font-medium">{formatDate(deal.startTime)}</div>
                              <div className="text-xs text-gray-500">to {formatDate(deal.endTime)}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(deal)}
                        </td>
                        <td className="px-6 py-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => handleToggleStatus(deal._id)}
                              className={`p-2 rounded-lg transition-colors ${
                                deal.isActive
                                  ? 'text-green-600 hover:bg-green-50'
                                  : 'text-gray-400 hover:bg-gray-50'
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
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
            <div className="text-xl md:text-2xl font-bold text-gray-900">{flashDeals.length}</div>
            <div className="text-xs md:text-sm text-gray-600">Total Deals</div>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
            <div className="text-xl md:text-2xl font-bold text-green-600">
              {flashDeals.filter(d => d.status === 'active' && d.isActive).length}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Active Now</div>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
            <div className="text-xl md:text-2xl font-bold text-blue-600">
              {flashDeals.filter(d => d.status === 'scheduled').length}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Scheduled</div>
          </div>
          <div className="bg-white p-3 md:p-4 rounded-lg border border-gray-200">
            <div className="text-xl md:text-2xl font-bold text-gray-600">
              {flashDeals.filter(d => d.status === 'expired').length}
            </div>
            <div className="text-xs md:text-sm text-gray-600">Expired</div>
          </div>
        </div>
      </div>

      {/* Modal */}
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
    </AdminShell>
  );
}
