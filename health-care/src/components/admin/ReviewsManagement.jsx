"use client";

import { useState, useEffect, useCallback } from 'react';
import { API } from '@/constants/api';

const STATUS_OPTIONS = ['all', 'pending', 'approved', 'rejected'];
const RATING_OPTIONS = ['all', '5', '4', '3', '2', '1'];

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState({ pending: 0, approved: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('all');
  const [ratingFilter, setRatingFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [selectedReview, setSelectedReview] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [modalAction, setModalAction] = useState('');
  const [adminResponse, setAdminResponse] = useState('');
  const [rejectionReason, setRejectionReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('medcore_token');
      const params = new URLSearchParams({ page, limit: 20 });
      
      if (statusFilter !== 'all') params.set('status', statusFilter);
      if (ratingFilter !== 'all') params.set('rating', ratingFilter);
      
      const res = await fetch(`${API}/reviews/admin/all?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setReviews(data.data);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      console.error('Fetch reviews error:', error);
      showMessage('Failed to load reviews', 'error');
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, ratingFilter]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleOpenModal = (review, action) => {
    setSelectedReview(review);
    setModalAction(action);
    setAdminResponse(review.adminResponse || '');
    setRejectionReason(review.rejectionReason || '');
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setSelectedReview(null);
    setModalAction('');
    setAdminResponse('');
    setRejectionReason('');
  };

  const handleUpdateStatus = async () => {
    if (!selectedReview) return;

    if (modalAction === 'reject' && !rejectionReason.trim()) {
      showMessage('Please provide a rejection reason', 'error');
      return;
    }

    setActionLoading(true);
    try {
      const token = localStorage.getItem('medcore_token');
      const payload = {
        status: modalAction === 'approve' ? 'approved' : 'rejected',
        adminResponse: adminResponse.trim() || undefined,
        rejectionReason: modalAction === 'reject' ? rejectionReason.trim() : undefined
      };

      const res = await fetch(`${API}/reviews/admin/${selectedReview._id}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        showMessage(`Review ${modalAction}d successfully`, 'success');
        handleCloseModal();
        fetchReviews();
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      showMessage('Failed to update review status', 'error');
    } finally {
      setActionLoading(false);
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const renderStars = (rating) => {
    return (
      <div className="flex gap-[2px] text-[14px]">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={star <= rating ? 'text-[#FFA500]' : 'text-[#E5E7EB]'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const getStatusColor = (status) => {
    const colors = {
      pending: 'bg-[#FEF3C7] text-[#92400E]',
      approved: 'bg-[#D1FAE5] text-[#065F46]',
      rejected: 'bg-[#FEE2E2] text-[#991B1B]'
    };
    return colors[status] || colors.pending;
  };

  const totalPages = pagination ? Math.ceil(pagination.total / 20) : 1;

  return (
    <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)]">
      {/* Message Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
        }`}>
          {message.text}
        </div>
      )}

      {/* Stats Cards */}
      <div className="p-4 border-b border-[var(--color-border-tertiary)]">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[var(--color-background-tertiary)] rounded-lg p-4">
            <div className="text-[11px] text-[var(--color-text-secondary)] mb-1">Total Reviews</div>
            <div className="text-[24px] font-bold font-[family-name:var(--font-plus-jakarta)]">
              {stats.pending + stats.approved + stats.rejected}
            </div>
          </div>
          <div className="bg-[#FEF3C7] rounded-lg p-4">
            <div className="text-[11px] text-[#92400E] mb-1">Pending</div>
            <div className="text-[24px] font-bold text-[#92400E] font-[family-name:var(--font-plus-jakarta)]">
              {stats.pending}
            </div>
          </div>
          <div className="bg-[#D1FAE5] rounded-lg p-4">
            <div className="text-[11px] text-[#065F46] mb-1">Approved</div>
            <div className="text-[24px] font-bold text-[#065F46] font-[family-name:var(--font-plus-jakarta)]">
              {stats.approved}
            </div>
          </div>
          <div className="bg-[#FEE2E2] rounded-lg p-4">
            <div className="text-[11px] text-[#991B1B] mb-1">Rejected</div>
            <div className="text-[24px] font-bold text-[#991B1B] font-[family-name:var(--font-plus-jakarta)]">
              {stats.rejected}
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="p-4 border-b border-[var(--color-border-tertiary)] flex gap-3">
        <select
          value={statusFilter}
          onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
          className="px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white"
        >
          {STATUS_OPTIONS.map(s => (
            <option key={s} value={s}>
              {s === 'all' ? 'All statuses' : s.charAt(0).toUpperCase() + s.slice(1)}
            </option>
          ))}
        </select>

        <select
          value={ratingFilter}
          onChange={e => { setRatingFilter(e.target.value); setPage(1); }}
          className="px-3 py-[8px] border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] font-[family-name:var(--font-plus-jakarta)] bg-white"
        >
          {RATING_OPTIONS.map(r => (
            <option key={r} value={r}>
              {r === 'all' ? 'All ratings' : `${r} stars`}
            </option>
          ))}
        </select>

        <div className="ml-auto text-[12px] text-[var(--color-text-secondary)] self-center">
          {pagination?.total || 0} reviews total
        </div>
      </div>

      {/* Reviews Table */}
      <div className="overflow-x-auto" style={{WebkitOverflowScrolling: 'touch'}}>
        {loading ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">
            Loading reviews…
          </div>
        ) : reviews.length === 0 ? (
          <div className="p-8 text-center text-[12px] text-[var(--color-text-secondary)]">
            No reviews found
          </div>
        ) : (
          <table className="w-full" style={{minWidth: '900px'}}>
            <thead>
              <tr className="border-b-[0.5px] border-[var(--color-border-tertiary)]">
                {['Product', 'Customer', 'Rating', 'Review', 'Status', 'Date', 'Actions'].map(h => (
                  <th key={h} className="text-left px-4 py-3 text-[11px] font-semibold text-[var(--color-text-secondary)] font-[family-name:var(--font-plus-jakarta)]">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {reviews.map(review => (
                <tr key={review._id} className="border-b-[0.5px] border-[var(--color-border-tertiary)] hover:bg-[var(--color-background-tertiary)]">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <img
                        src={review.product?.images?.[0]?.url || '/placeholder.png'}
                        alt={review.product?.name}
                        className="w-10 h-10 object-cover rounded border border-[var(--color-border-secondary)]"
                      />
                      <div>
                        <div className="text-[12px] font-semibold line-clamp-1 font-[family-name:var(--font-plus-jakarta)]">
                          {review.product?.name}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-secondary)]">
                          {review.product?.sku}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <div className="text-[12px]">{review.user?.name}</div>
                    <div className="text-[10px] text-[var(--color-text-secondary)]">
                      {review.user?.email}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {renderStars(review.rating)}
                  </td>
                  <td className="px-4 py-3 max-w-xs">
                    <div className="text-[12px] font-semibold mb-1 font-[family-name:var(--font-plus-jakarta)]">
                      {review.title}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)] line-clamp-2">
                      {review.comment}
                    </div>
                    {review.images?.length > 0 && (
                      <div className="text-[10px] text-[#0E8A6E] mt-1">
                        📷 {review.images.length} {review.images.length === 1 ? 'image' : 'images'}
                      </div>
                    )}
                    {review.reported && (
                      <div className="text-[10px] text-[#E24B4A] mt-1">
                        🚩 Reported ({review.reportedBy?.length || 0} reports)
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-[10px] px-2 py-[3px] rounded font-medium ${getStatusColor(review.status)}`}>
                      {review.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-[var(--color-text-secondary)]">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      {review.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleOpenModal(review, 'approve')}
                            className="text-[11px] px-2 py-1 bg-[#D1FAE5] text-[#065F46] rounded hover:bg-[#A7F3D0] transition-colors"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleOpenModal(review, 'reject')}
                            className="text-[11px] px-2 py-1 bg-[#FEE2E2] text-[#991B1B] rounded hover:bg-[#FECACA] transition-colors"
                          >
                            Reject
                          </button>
                        </>
                      )}
                      {review.status === 'approved' && (
                        <button
                          onClick={() => handleOpenModal(review, 'reject')}
                          className="text-[11px] px-2 py-1 border border-[var(--color-border-secondary)] rounded hover:bg-[var(--color-background-tertiary)] transition-colors"
                        >
                          Reject
                        </button>
                      )}
                      {review.status === 'rejected' && (
                        <button
                          onClick={() => handleOpenModal(review, 'approve')}
                          className="text-[11px] px-2 py-1 border border-[var(--color-border-secondary)] rounded hover:bg-[var(--color-background-tertiary)] transition-colors"
                        >
                          Approve
                        </button>
                      )}
                      <button
                        onClick={() => handleOpenModal(review, 'view')}
                        className="text-[11px] text-[#0E8A6E] font-medium hover:underline"
                      >
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 flex items-center justify-between border-t-[0.5px] border-[var(--color-border-tertiary)]">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="text-[12px] px-3 py-1 border-[0.5px] border-[var(--color-border-secondary)] rounded disabled:opacity-40"
          >
            ← Prev
          </button>
          <span className="text-[12px] text-[var(--color-text-secondary)]">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="text-[12px] px-3 py-1 border-[0.5px] border-[var(--color-border-secondary)] rounded disabled:opacity-40"
          >
            Next →
          </button>
        </div>
      )}

      {/* Review Detail Modal */}
      {showModal && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 overflow-y-auto">
          <div className="bg-white rounded-xl w-full max-w-3xl shadow-2xl my-8">
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--color-border-tertiary)]">
              <h3 className="text-[18px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                Review Details
              </h3>
              <button
                onClick={handleCloseModal}
                className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] text-2xl leading-none"
              >
                ×
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Product & Customer */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] mb-2">Product</div>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedReview.product?.images?.[0]?.url || '/placeholder.png'}
                      alt={selectedReview.product?.name}
                      className="w-16 h-16 object-cover rounded border border-[var(--color-border-secondary)]"
                    />
                    <div>
                      <div className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                        {selectedReview.product?.name}
                      </div>
                      <div className="text-[11px] text-[var(--color-text-secondary)]">
                        SKU: {selectedReview.product?.sku}
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] mb-2">Customer</div>
                  <div className="text-[13px] font-semibold">{selectedReview.user?.name}</div>
                  <div className="text-[11px] text-[var(--color-text-secondary)]">
                    {selectedReview.user?.email}
                  </div>
                  {selectedReview.verifiedPurchase && (
                    <div className="text-[10px] px-2 py-[2px] bg-[#D1FAE5] text-[#065F46] rounded font-medium inline-block mt-1">
                      ✓ Verified Purchase
                    </div>
                  )}
                </div>
              </div>

              {/* Review */}
              <div>
                <div className="text-[11px] text-[var(--color-text-secondary)] mb-2">Review</div>
                {renderStars(selectedReview.rating)}
                <h4 className="text-[15px] font-semibold mt-2 mb-2 font-[family-name:var(--font-plus-jakarta)]">
                  {selectedReview.title}
                </h4>
                <p className="text-[13px] text-[var(--color-text-primary)] leading-relaxed">
                  {selectedReview.comment}
                </p>
              </div>

              {/* Images */}
              {selectedReview.images?.length > 0 && (
                <div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] mb-2">Images</div>
                  <div className="flex gap-2">
                    {selectedReview.images.map((img, idx) => (
                      <img
                        key={idx}
                        src={img.url}
                        alt={img.alt}
                        className="w-24 h-24 object-cover rounded border border-[var(--color-border-secondary)] cursor-pointer hover:opacity-75 transition-opacity"
                        onClick={() => window.open(img.url, '_blank')}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Reports */}
              {selectedReview.reported && selectedReview.reportedBy?.length > 0 && (
                <div>
                  <div className="text-[11px] text-[var(--color-text-secondary)] mb-2">
                    Reports ({selectedReview.reportedBy.length})
                  </div>
                  <div className="space-y-2">
                    {selectedReview.reportedBy.slice(0, 3).map((report, idx) => (
                      <div key={idx} className="bg-[#FEE2E2] border border-[#FCA5A5] rounded p-3">
                        <div className="text-[11px] text-[#991B1B]">{report.reason}</div>
                        <div className="text-[10px] text-[#991B1B] mt-1">
                          {new Date(report.reportedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Admin Response */}
              {modalAction !== 'view' && (
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-2">
                    Admin Response (Optional)
                  </label>
                  <textarea
                    value={adminResponse}
                    onChange={e => setAdminResponse(e.target.value)}
                    placeholder="Add a response to the customer..."
                    maxLength={500}
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E] resize-none"
                  />
                  <div className="text-[10px] text-[var(--color-text-secondary)] mt-1 text-right">
                    {adminResponse.length}/500
                  </div>
                </div>
              )}

              {/* Rejection Reason */}
              {modalAction === 'reject' && (
                <div>
                  <label className="block text-[11px] text-[var(--color-text-secondary)] mb-2">
                    Rejection Reason <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={rejectionReason}
                    onChange={e => setRejectionReason(e.target.value)}
                    placeholder="Explain why this review is being rejected..."
                    rows={3}
                    className="w-full px-3 py-2 border border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#0E8A6E] resize-none"
                  />
                </div>
              )}

              {/* Meta Info */}
              <div className="text-[11px] text-[var(--color-text-secondary)] space-y-1">
                <div>Posted: {new Date(selectedReview.createdAt).toLocaleDateString()}</div>
                {selectedReview.isEdited && (
                  <div>Edited: {new Date(selectedReview.editedAt).toLocaleDateString()}</div>
                )}
                <div>Helpful votes: {selectedReview.helpfulCount}</div>
                <div>Status: <span className={`${getStatusColor(selectedReview.status)} px-2 py-[2px] rounded`}>
                  {selectedReview.status}
                </span></div>
              </div>
            </div>

            {/* Actions */}
            {modalAction !== 'view' && (
              <div className="px-6 py-4 border-t border-[var(--color-border-tertiary)] flex gap-3">
                <button
                  onClick={handleCloseModal}
                  className="flex-1 px-4 py-2 border border-[var(--color-border-secondary)] rounded-lg text-[14px] font-semibold hover:bg-[var(--color-background-tertiary)] transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleUpdateStatus}
                  disabled={actionLoading || (modalAction === 'reject' && !rejectionReason.trim())}
                  className={`flex-1 px-4 py-2 rounded-lg text-[14px] font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    modalAction === 'approve'
                      ? 'bg-[#0E8A6E] text-white hover:bg-[#0c7359]'
                      : 'bg-[#E24B4A] text-white hover:bg-[#dc2626]'
                  }`}
                >
                  {actionLoading ? 'Processing...' : modalAction === 'approve' ? 'Approve Review' : 'Reject Review'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
