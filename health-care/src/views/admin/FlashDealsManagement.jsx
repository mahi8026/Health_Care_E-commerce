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
      <div className="flex items-center justify-center min-h-screen">
        <Spinner size="large" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FaFire className="text-red-500" />
                Flash Deals Management
              </h1>
              <p className="text-gray-600 mt-1">Create and manage limited-time product deals</p>
            </div>
            <button
              onClick={handleCreateNew}
              className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
            >
              <FaPlus /> Create Flash Deal
            </button>
          </div>
        </div>

        {/* Messages */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
            {success}
          </div>
        )}

        {/* Flash Deals List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {flashDeals.length === 0 ? (
            <div className="p-12 text-center">
              <FaFire className="mx-auto text-6xl text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-700 mb-2">No Flash Deals Yet</h3>
              <p className="text-gray-500 mb-6">Create your first flash deal to boost sales</p>
              <button
                onClick={handleCreateNew}
                className="inline-flex items-center gap-2 px-6 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors font-semibold"
              >
                <FaPlus /> Create Flash Deal
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
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
          )}
        </div>

        {/* Statistics */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-900">{flashDeals.length}</div>
            <div className="text-sm text-gray-600">Total Deals</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-green-600">
              {flashDeals.filter(d => d.status === 'active' && d.isActive).length}
            </div>
            <div className="text-sm text-gray-600">Active Now</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-blue-600">
              {flashDeals.filter(d => d.status === 'scheduled').length}
            </div>
            <div className="text-sm text-gray-600">Scheduled</div>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <div className="text-2xl font-bold text-gray-600">
              {flashDeals.filter(d => d.status === 'expired').length}
            </div>
            <div className="text-sm text-gray-600">Expired</div>
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
    </div>
  );
}
