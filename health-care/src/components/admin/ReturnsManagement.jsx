'use client';

import { useState, useEffect } from 'react';
import { API } from '@/constants/api';

const STATUS_OPTIONS = ['pending', 'approved', 'rejected', 'refunded'];
const REFUND_METHODS = [
  { value: 'original_payment', label: 'Original Payment Method' },
  { value: 'bank_transfer', label: 'Bank Transfer' },
  { value: 'store_credit', label: 'Store Credit' }
];

const STATUS_COLORS = {
  pending: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  approved: 'bg-green-100 text-green-800 border-green-200',
  rejected: 'bg-red-100 text-red-800 border-red-200',
  refunded: 'bg-blue-100 text-blue-800 border-blue-200',
  cancelled: 'bg-gray-100 text-gray-800 border-gray-200',
};

export default function ReturnsManagement() {
  const [returns, setReturns] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedReturn, setSelectedReturn] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [refundMethod, setRefundMethod] = useState('original_payment');
  const [refundTransactionId, setRefundTransactionId] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);

  useEffect(() => {
    fetchReturns();
    fetchStats();
  }, [filter, page]);

  const fetchReturns = async () => {
    try {
      const token = localStorage.getItem('medcore_token');
      const statusParam = filter === 'all' ? '' : `status=${filter}&`;
      const url = `${API}/returns?${statusParam}page=${page}&limit=20`;
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReturns(data.data);
        setPagination(data.pagination);
      }
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/returns/stats/summary`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error(err);
    }
  };

  const handleUpdateStatus = async () => {
    if (!newStatus) {
      alert('Please select a status');
      return;
    }

    if (newStatus === 'rejected' && !adminNotes.trim()) {
      alert('Please provide a reason for rejection');
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('medcore_token');
      const payload = {
        status: newStatus,
        adminNotes: adminNotes.trim(),
      };

      if (newStatus === 'approved' || newStatus === 'refunded') {
        payload.refundMethod = refundMethod;
      }

      if (newStatus === 'refunded' && refundTransactionId.trim()) {
        payload.refundTransactionId = refundTransactionId.trim();
      }

      const res = await fetch(`${API}/returns/${selectedReturn._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (data.success) {
        alert(`Return request ${newStatus} successfully`);
        setShowModal(false);
        fetchReturns();
        fetchStats();
        resetModal();
      } else {
        alert(data.message || 'Failed to update status');
      }
    } catch (err) {
      process.env.NODE_ENV !== "production" && console.error(err);
      alert('Error updating status');
    } finally {
      setUpdating(false);
    }
  };

  const openModal = (returnRequest) => {
    setSelectedReturn(returnRequest);
    setNewStatus(returnRequest.status);
    setAdminNotes(returnRequest.adminNotes || '');
    setRefundMethod(returnRequest.refundMethod || 'original_payment');
    setRefundTransactionId(returnRequest.refundTransactionId || '');
    setShowModal(true);
  };

  const resetModal = () => {
    setSelectedReturn(null);
    setNewStatus('');
    setAdminNotes('');
    setRefundMethod('original_payment');
    setRefundTransactionId('');
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B2545] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading returns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-4 md:p-6">
      {/* Header */}
      <div className="mb-4 sm:mb-6">
        <h2 className="text-xl sm:text-2xl font-bold text-[#0B2545] mb-1 sm:mb-2">Return Requests Management</h2>
        <p className="text-sm text-gray-600">Review and manage customer return requests</p>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
          <div className="bg-white rounded-lg border p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-gray-600 mb-1">Total</p>
            <p className="text-xl sm:text-2xl font-bold text-[#0B2545]">{stats.total}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg border border-yellow-200 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-yellow-800 mb-1">Pending</p>
            <p className="text-xl sm:text-2xl font-bold text-yellow-900">{stats.pending}</p>
          </div>
          <div className="bg-green-50 rounded-lg border border-green-200 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-green-800 mb-1">Approved</p>
            <p className="text-xl sm:text-2xl font-bold text-green-900">{stats.approved}</p>
          </div>
          <div className="bg-blue-50 rounded-lg border border-blue-200 p-3 sm:p-4">
            <p className="text-xs sm:text-sm text-blue-800 mb-1">Refunded</p>
            <p className="text-xl sm:text-2xl font-bold text-blue-900">{stats.refunded}</p>
          </div>
          <div className="bg-red-50 rounded-lg border border-red-200 p-3 sm:p-4 col-span-2 sm:col-span-1">
            <p className="text-xs sm:text-sm text-red-800 mb-1">Rejected</p>
            <p className="text-xl sm:text-2xl font-bold text-red-900">{stats.rejected}</p>
          </div>
        </div>
      )}

      {/* Filter Tabs - horizontal scroll on mobile */}
      <div className="bg-white rounded-lg border p-2 mb-4 sm:mb-6 flex gap-2 overflow-x-auto scrollbar-hide">
        {['all', 'pending', 'approved', 'rejected', 'refunded'].map(status => (
          <button
            key={status}
            onClick={() => { setFilter(status); setPage(1); }}
            className={`px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium whitespace-nowrap transition-colors min-h-[44px] ${
              filter === status ? 'bg-[#0E8A6E] text-white' : 'text-gray-700 hover:bg-gray-100'
            }`}
          >
            {status.charAt(0).toUpperCase() + status.slice(1)}
            {status !== 'all' && stats && (
              <span className="ml-1.5 text-xs opacity-80">({stats[status] || 0})</span>
            )}
          </button>
        ))}
      </div>

      {/* Returns Table/Cards */}
      <div className="bg-white rounded-lg border overflow-hidden">
        {returns.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">No return requests found</div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
              <table className="w-full" style={{minWidth: '900px'}}>
                <thead className="bg-gray-50 border-b">
                  <tr>
                    {['Return ID', 'Order', 'Customer', 'Reason', 'Amount', 'Status', 'Date', 'Actions'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-medium text-gray-600 uppercase">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {returns.map(returnRequest => (
                    <tr key={returnRequest._id} className="border-b hover:bg-gray-50">
                      <td className="px-4 py-3 text-sm font-mono">{returnRequest._id.slice(-8).toUpperCase()}</td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">#{returnRequest.order?.orderNumber}</div>
                        <div className="text-xs text-gray-500">৳{returnRequest.order?.totalAmount?.toLocaleString()}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        <div className="font-medium">{returnRequest.user?.name}</div>
                        <div className="text-xs text-gray-500">{returnRequest.user?.email}</div>
                      </td>
                      <td className="px-4 py-3 text-sm">{returnRequest.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</td>
                      <td className="px-4 py-3 text-sm font-semibold text-[#0E8A6E]">৳{returnRequest.refundAmount?.toLocaleString()}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium border ${STATUS_COLORS[returnRequest.status]}`}>
                          {returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-600">{new Date(returnRequest.createdAt).toLocaleDateString()}</td>
                      <td className="px-4 py-3">
                        <button onClick={() => openModal(returnRequest)} className="text-sm text-[#0E8A6E] font-medium hover:underline">Review</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden space-y-3 p-3">
              {returns.map(returnRequest => (
                <div key={returnRequest._id} className="bg-gray-50 rounded-lg border p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[13px] font-bold text-[#0B2545] font-mono">{returnRequest._id.slice(-8).toUpperCase()}</div>
                      <div className="text-[11px] text-gray-500 mt-0.5">Order #{returnRequest.order?.orderNumber}</div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium border flex-shrink-0 ${STATUS_COLORS[returnRequest.status]}`}>
                      {returnRequest.status.charAt(0).toUpperCase() + returnRequest.status.slice(1)}
                    </span>
                  </div>
                  <div className="text-[12px] space-y-1">
                    <div><span className="text-gray-500">Customer:</span> <span className="font-medium">{returnRequest.user?.name}</span></div>
                    <div><span className="text-gray-500">Reason:</span> {returnRequest.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</div>
                    <div><span className="text-gray-500">Refund:</span> <span className="font-bold text-[#0E8A6E]">৳{returnRequest.refundAmount?.toLocaleString()}</span></div>
                    <div><span className="text-gray-500">Date:</span> {new Date(returnRequest.createdAt).toLocaleDateString()}</div>
                  </div>
                  <button
                    onClick={() => openModal(returnRequest)}
                    className="w-full min-h-[48px] px-4 py-2 bg-[#0E8A6E] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0c7359] transition-colors"
                  >
                    Review Return
                  </button>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {pagination && pagination.pages > 1 && (
          <div className="px-3 sm:px-4 py-3 border-t flex flex-col sm:flex-row items-center justify-between gap-2">
            <div className="text-xs sm:text-sm text-gray-600 text-center sm:text-left">
              Showing {((page - 1) * pagination.limit) + 1}–{Math.min(page * pagination.limit, pagination.total)} of {pagination.total}
            </div>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 min-h-[44px] min-w-[44px]">←</button>
              <span className="px-3 py-2 text-sm flex items-center">{page}/{pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages} className="px-3 py-2 border rounded-lg text-sm disabled:opacity-50 hover:bg-gray-50 min-h-[44px] min-w-[44px]">→</button>
            </div>
          </div>
        )}
      </div>

      {/* Review Modal */}
      {showModal && selectedReturn && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50 p-0 sm:p-4">
          <div className="bg-white rounded-t-2xl sm:rounded-lg max-w-4xl w-full max-h-[95vh] sm:max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="sticky top-0 bg-white border-b px-4 sm:px-6 py-4 flex justify-between items-center">
              <div>
                <h3 className="text-lg sm:text-xl font-bold text-[#0B2545]">Review Return Request</h3>
                <p className="text-xs sm:text-sm text-gray-600">
                  Return ID: {selectedReturn._id.slice(-8).toUpperCase()}
                </p>
              </div>
              <button
                onClick={() => { setShowModal(false); resetModal(); }}
                className="w-11 h-11 flex items-center justify-center rounded-lg hover:bg-gray-100 transition-colors text-gray-500"
                aria-label="Close"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
              {/* Customer & Order Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Customer</p>
                  <p className="text-sm">{selectedReturn.user?.name}</p>
                  <p className="text-xs text-gray-500">{selectedReturn.user?.email}</p>
                  {selectedReturn.user?.phone && (
                    <p className="text-xs text-gray-500">{selectedReturn.user?.phone}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1">Order Details</p>
                  <p className="text-sm">Order #{selectedReturn.order?.orderNumber}</p>
                  <p className="text-xs text-gray-500">
                    Total: ৳{selectedReturn.order?.totalAmount?.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">
                    Requested: {new Date(selectedReturn.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Products */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Returned Products</p>
                <div className="space-y-2">
                  {selectedReturn.products?.map((item, idx) => (
                    <div key={idx} className="flex gap-3 items-center p-3 bg-gray-50 rounded-lg">
                      <img 
                        src={item.product?.images?.[0]?.url || '/placeholder.png'} 
                        alt={item.product?.name}
                        className="w-14 h-14 sm:w-16 sm:h-16 object-cover rounded border flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{item.product?.name}</p>
                        <p className="text-xs text-gray-600">SKU: {item.product?.sku}</p>
                        <p className="text-xs text-gray-600">Qty: {item.quantity}</p>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-sm">৳{(item.quantity * item.price).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-right">
                  <p className="text-sm font-medium">
                    Total Refund: <span className="text-base sm:text-lg text-[#0E8A6E]">৳{selectedReturn.refundAmount?.toLocaleString()}</span>
                  </p>
                </div>
              </div>

              {/* Return Details */}
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Return Reason</p>
                <p className="text-sm bg-gray-50 p-3 rounded-lg">
                  {selectedReturn.reason.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                </p>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Description</p>
                <p className="text-sm bg-gray-50 p-3 rounded-lg whitespace-pre-wrap">
                  {selectedReturn.description}
                </p>
              </div>

              {/* Images */}
              {selectedReturn.images && selectedReturn.images.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Uploaded Images</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
                    {selectedReturn.images.map((img, idx) => (
                      <a key={idx} href={img.url} target="_blank" rel="noopener noreferrer" className="block">
                        <img
                          src={img.url}
                          alt={img.alt || `Return image ${idx + 1}`}
                          className="w-full h-20 sm:h-24 object-cover rounded-lg border hover:opacity-75 transition-opacity cursor-pointer"
                        />
                      </a>
                    ))}
                  </div>
                </div>
              )}

              {/* Status Update Form */}
              <div className="border-t pt-4 sm:pt-6">
                <p className="text-sm font-medium text-gray-700 mb-4">Update Return Status</p>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Status <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                      className="w-full border rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-[#0E8A6E] min-h-[48px]"
                      style={{ fontSize: '16px' }}
                    >
                      <option value="">Select status</option>
                      {STATUS_OPTIONS.map(status => (
                        <option key={status} value={status}>
                          {status.charAt(0).toUpperCase() + status.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>

                  {(newStatus === 'approved' || newStatus === 'refunded') && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Refund Method</label>
                      <select
                        value={refundMethod}
                        onChange={(e) => setRefundMethod(e.target.value)}
                        className="w-full border rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-[#0E8A6E] min-h-[48px]"
                        style={{ fontSize: '16px' }}
                      >
                        {REFUND_METHODS.map(method => (
                          <option key={method.value} value={method.value}>{method.label}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  {newStatus === 'refunded' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Transaction ID (Optional)</label>
                      <input
                        type="text"
                        value={refundTransactionId}
                        onChange={(e) => setRefundTransactionId(e.target.value)}
                        placeholder="Enter transaction/reference ID"
                        className="w-full border rounded-lg px-3 py-3 focus:outline-none focus:ring-2 focus:ring-[#0E8A6E] min-h-[48px]"
                        style={{ fontSize: '16px' }}
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Admin Notes {newStatus === 'rejected' && <span className="text-red-500">*</span>}
                    </label>
                    <textarea
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                      placeholder={newStatus === 'rejected' ? 'Please provide a reason for rejection' : 'Add notes for the customer (optional)'}
                      className="w-full border rounded-lg px-3 py-3 h-24 focus:outline-none focus:ring-2 focus:ring-[#0E8A6E] resize-none"
                      style={{ fontSize: '16px' }}
                      maxLength={1000}
                    />
                    <p className="text-xs text-gray-500 mt-1">{adminNotes.length}/1000</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="sticky bottom-0 bg-gray-50 border-t px-4 sm:px-6 py-4 flex gap-3">
              <button
                onClick={() => { setShowModal(false); resetModal(); }}
                className="flex-1 px-4 py-3 border rounded-lg text-gray-700 hover:bg-gray-100 font-medium min-h-[48px]"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating || !newStatus}
                className="flex-1 px-4 py-3 bg-[#0E8A6E] text-white rounded-lg hover:bg-[#0c7359] disabled:opacity-50 disabled:cursor-not-allowed font-semibold min-h-[48px]"
              >
                {updating ? 'Updating...' : 'Update Status'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
