"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import WriteReviewModal from '@/components/product/WriteReviewModal';
import { API } from '@/constants/api';

export default function UserReviewsPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [eligibleProducts, setEligibleProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Move showMessage before handleDelete to avoid hoisting issues
  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/reviews/user?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setReviews(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Fetch reviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleProducts = async () => {
    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/reviews/eligible-products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        setEligibleProducts(data.data);
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Fetch eligible products error:', error);
    }
  };

  useEffect(() => {
    if (!user) {
      router.push('/login');
      return;
    }
    // Call fetch functions in an async IIFE to avoid setState-in-effect
    (async () => {
      await Promise.all([fetchReviews(), fetchEligibleProducts()]);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const handleDelete = async (reviewId) => {
    if (!confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
      return;
    }

    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        showMessage('Review deleted successfully', 'success');
        fetchReviews();
        fetchEligibleProducts();
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      showMessage('Failed to delete review', 'error');
    }
  };

  const handleWriteReview = (product) => {
    setSelectedProduct(product);
    setShowWriteModal(true);
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

  if (!user) return null;

  return (
    <div className="min-h-screen bg-page py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Message Toast */}
        {message.text && (
          <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
            message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
          }`}>
            {message.text}
          </div>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-[28px] font-bold mb-2 font-[family-name:var(--font-plus-jakarta)]">
            My Reviews
          </h1>
          <p className="text-[14px] text-[var(--color-text-secondary)]">
            Manage your product reviews and share your experiences
          </p>
        </div>

        {/* Products to Review */}
        {eligibleProducts.length > 0 && (
          <div className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-6 mb-6">
            <h2 className="text-[18px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
              Products to Review ({eligibleProducts.length})
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {eligibleProducts.slice(0, 4).map(product => (
                <div key={product._id} className="flex gap-4 p-4 bg-[var(--color-background-tertiary)] rounded-lg">
                  <img
                    src={product.images?.[0]?.url || '/placeholder.png'}
                    alt={product.name}
                    className="w-20 h-20 object-cover rounded-lg border border-[var(--color-border-secondary)]"
                  />
                  <div className="flex-1">
                    <h3 className="text-[13px] font-semibold mb-1 line-clamp-2 font-[family-name:var(--font-plus-jakarta)]">
                      {product.name}
                    </h3>
                    <p className="text-[11px] text-[var(--color-text-secondary)] mb-2">
                      Delivered: {new Date(product.deliveredAt).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleWriteReview(product)}
                      className="text-[12px] px-3 py-1 bg-[#0B2545] text-white rounded font-semibold hover:bg-[#0d2e56] transition-colors"
                    >
                      Write Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
            {eligibleProducts.length > 4 && (
              <div className="text-center mt-4">
                <button className="text-[13px] text-[#0E8A6E] font-medium hover:underline">
                  View all {eligibleProducts.length} products →
                </button>
              </div>
            )}
          </div>
        )}

        {/* My Reviews */}
        <div className="bg-white rounded-lg border border-[var(--color-border-tertiary)]">
          <div className="px-6 py-4 border-b border-[var(--color-border-tertiary)]">
            <h2 className="text-[18px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
              Your Reviews ({pagination?.total || 0})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0B2545] mx-auto mb-4"></div>
              <p className="text-[13px] text-[var(--color-text-secondary)]">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-[48px] mb-4">📝</div>
              <h3 className="text-[16px] font-semibold mb-2 font-[family-name:var(--font-plus-jakarta)]">
                No reviews yet
              </h3>
              <p className="text-[13px] text-[var(--color-text-secondary)] mb-4">
                Share your experience with products you&apos;ve purchased
              </p>
              {eligibleProducts.length > 0 && (
                <button
                  onClick={() => handleWriteReview(eligibleProducts[0])}
                  className="px-6 py-2 bg-[#0B2545] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0d2e56] transition-colors"
                >
                  Write Your First Review
                </button>
              )}
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border-tertiary)]">
              {reviews.map(review => (
                <div key={review._id} className="p-6">
                  {/* Product Info */}
                  <div className="flex gap-4 mb-4">
                    <img
                      src={review.product?.images?.[0]?.url || '/placeholder.png'}
                      alt={review.product?.name}
                      className="w-16 h-16 object-cover rounded-lg border border-[var(--color-border-secondary)] cursor-pointer"
                      onClick={() => router.push(`/products/${review.product?._id}`)}
                    />
                    <div className="flex-1">
                      <h3 
                        className="text-[14px] font-semibold mb-1 cursor-pointer hover:text-[#0E8A6E] transition-colors font-[family-name:var(--font-plus-jakarta)]"
                        onClick={() => router.push(`/products/${review.product?._id}`)}
                      >
                        {review.product?.name}
                      </h3>
                      <p className="text-[11px] text-[var(--color-text-secondary)]">
                        SKU: {review.product?.sku}
                      </p>
                    </div>
                    <div className="flex items-start gap-2">
                      <span className={`text-[10px] px-2 py-[3px] rounded font-medium ${getStatusColor(review.status)}`}>
                        {review.status}
                      </span>
                    </div>
                  </div>

                  {/* Review Content */}
                  <div className="mb-3">
                    {renderStars(review.rating)}
                    <h4 className="text-[14px] font-semibold mt-2 mb-1 font-[family-name:var(--font-plus-jakarta)]">
                      {review.title}
                    </h4>
                    <p className="text-[13px] text-[var(--color-text-primary)] leading-relaxed">
                      {review.comment}
                    </p>
                  </div>

                  {/* Images */}
                  {review.images && review.images.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {review.images.map((img, idx) => (
                        <img
                          key={idx}
                          src={img.url}
                          alt={img.alt}
                          className="w-16 h-16 object-cover rounded-lg border border-[var(--color-border-secondary)] cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => window.open(img.url, '_blank')}
                        />
                      ))}
                    </div>
                  )}

                  {/* Admin Response */}
                  {review.adminResponse && (
                    <div className="bg-[#F0FDF9] border-l-4 border-[#0E8A6E] p-3 mb-3">
                      <div className="text-[11px] font-semibold text-[#0E8A6E] mb-1">
                        Response from MedCore BD
                      </div>
                      <p className="text-[12px] text-[var(--color-text-primary)]">
                        {review.adminResponse}
                      </p>
                    </div>
                  )}

                  {/* Rejection Reason */}
                  {review.status === 'rejected' && review.rejectionReason && (
                    <div className="bg-[#FEE2E2] border-l-4 border-[#E24B4A] p-3 mb-3">
                      <div className="text-[11px] font-semibold text-[#991B1B] mb-1">
                        Rejection Reason
                      </div>
                      <p className="text-[12px] text-[#991B1B]">
                        {review.rejectionReason}
                      </p>
                    </div>
                  )}

                  {/* Meta Info */}
                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-tertiary)]">
                    <div className="flex items-center gap-4 text-[11px] text-[var(--color-text-secondary)]">
                      <span>
                        Posted: {new Date(review.createdAt).toLocaleDateString()}
                      </span>
                      {review.isEdited && (
                        <span>(Edited: {new Date(review.editedAt).toLocaleDateString()})</span>
                      )}
                      <span>👍 {review.helpfulCount} helpful</span>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(`/products/${review.product?._id}`)}
                        className="text-[12px] px-3 py-1 border border-[var(--color-border-secondary)] rounded hover:bg-[var(--color-background-tertiary)] transition-colors"
                      >
                        View Product
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="text-[12px] px-3 py-1 border border-[#E24B4A] text-[#E24B4A] rounded hover:bg-[#FEE2E2] transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Pagination */}
          {pagination && pagination.pages > 1 && (
            <div className="px-6 py-4 border-t border-[var(--color-border-tertiary)] flex items-center justify-between">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border border-[var(--color-border-secondary)] rounded-lg text-[13px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-background-tertiary)] transition-colors"
              >
                ← Previous
              </button>
              <span className="text-[13px] text-[var(--color-text-secondary)]">
                Page {page} of {pagination.pages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
                disabled={page === pagination.pages}
                className="px-4 py-2 border border-[var(--color-border-secondary)] rounded-lg text-[13px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-background-tertiary)] transition-colors"
              >
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Write Review Modal */}
      {showWriteModal && selectedProduct && (
        <WriteReviewModal
          productId={selectedProduct._id}
          onClose={() => {
            setShowWriteModal(false);
            setSelectedProduct(null);
          }}
          onSuccess={() => {
            setShowWriteModal(false);
            setSelectedProduct(null);
            fetchReviews();
            fetchEligibleProducts();
            showMessage('Review submitted successfully!', 'success');
          }}
        />
      )}
    </div>
  );
}
