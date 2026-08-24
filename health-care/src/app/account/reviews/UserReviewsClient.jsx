"use client";

import { confirmAction } from '@/components/ui/ConfirmDialog';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import WriteReviewModal from '@/components/product/WriteReviewModal';
import { API } from '@/constants/api';

// Helper — prefer slug for SEO-clean URLs, fall back to _id
const productUrl = (product) => `/products/${product?.slug || product?._id}`;

export default function UserReviewsClient() {
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

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/reviews/user?page=${page}&limit=10`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setReviews(data.data);
        setPagination(data.pagination);
      }
    } catch (error) {
      process.env.NODE_ENV !== 'production' && console.error('Fetch reviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchEligibleProducts = async () => {
    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/reviews/eligible-products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) setEligibleProducts(data.data);
    } catch (error) {
      process.env.NODE_ENV !== 'production' && console.error('Fetch eligible products error:', error);
    }
  };

  useEffect(() => {
    if (!user) { router.push('/login'); return; }
    (async () => { await Promise.all([fetchReviews(), fetchEligibleProducts()]); })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, page]);

  const handleDelete = async (reviewId) => {
    if (!await confirmAction('Are you sure you want to delete this review? This action cannot be undone.')) return;
    try {
      const token = localStorage.getItem('Mediport_token');
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
    } catch {
      showMessage('Failed to delete review', 'error');
    }
  };

  const renderStars = (rating) => (
    <div className="flex gap-[2px] text-sm">
      {[1, 2, 3, 4, 5].map(star => (
        <span key={star} className={star <= rating ? 'text-[#FFA500]' : 'border-[var(--color-border-primary)]'}>★</span>
      ))}
    </div>
  );

  const getStatusColor = (status) => {
    const colors = {
      pending:  'bg-[var(--color-status-warning-tint)] text-[var(--color-status-warning)]',
      approved: 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]',
      rejected: 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]',
    };
    return colors[status] || colors.pending;
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-page py-8">
      <div className="max-w-6xl mx-auto px-4">
        {message.text && (
          <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-toast ${
            message.type === 'success'
              ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]'
              : 'bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)]'
          }`}>
            {message.text}
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">My Reviews</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Manage your product reviews and share your experiences
          </p>
        </div>

        {eligibleProducts.length > 0 && (
          <div className="bg-white rounded-lg border border-[var(--color-border-tertiary)] p-6 mb-6">
            <h2 className="text-lg font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
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
                    <h3 className="text-sm font-semibold mb-1 line-clamp-2 font-[family-name:var(--font-plus-jakarta)]">
                      {product.name}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-2">
                      Delivered: {new Date(product.deliveredAt).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => { setSelectedProduct(product); setShowWriteModal(true); }}
                      className="text-xs px-3 py-1 bg-brand-navy text-white rounded font-semibold hover:bg-[var(--color-brand-navy-hover)] transition-colors"
                    >
                      Write Review
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg border border-[var(--color-border-tertiary)]">
          <div className="px-6 py-4 border-b border-[var(--color-border-tertiary)]">
            <h2 className="text-lg font-semibold font-[family-name:var(--font-plus-jakarta)]">
              Your Reviews ({pagination?.total || 0})
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-navy mx-auto mb-4"></div>
              <p className="text-sm text-[var(--color-text-secondary)]">Loading reviews...</p>
            </div>
          ) : reviews.length === 0 ? (
            <div className="p-12 text-center">
              <div className="text-5xl mb-4">📝</div>
              <h3 className="text-base font-semibold mb-2 font-[family-name:var(--font-plus-jakarta)]">No reviews yet</h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Share your experience with products you&apos;ve purchased
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[var(--color-border-tertiary)]">
              {reviews.map(review => (
                <div key={review._id} className="p-6">
                  <div className="flex gap-4 mb-4">
                    <img
                      src={review.product?.images?.[0]?.url || '/placeholder.png'}
                      alt={review.product?.name}
                      className="w-16 h-16 object-cover rounded-lg border border-[var(--color-border-secondary)] cursor-pointer"
                      onClick={() => router.push(productUrl(review.product))}
                    />
                    <div className="flex-1">
                      <h3
                        className="text-sm font-semibold mb-1 cursor-pointer hover:text-brand-teal transition-colors font-[family-name:var(--font-plus-jakarta)]"
                        onClick={() => router.push(productUrl(review.product))}
                      >
                        {review.product?.name}
                      </h3>
                      <p className="text-xs text-[var(--color-text-secondary)]">SKU: {review.product?.sku}</p>
                    </div>
                    <span className={`text-xs px-2 py-[3px] rounded font-medium self-start ${getStatusColor(review.status)}`}>
                      {review.status}
                    </span>
                  </div>

                  <div className="mb-3">
                    {renderStars(review.rating)}
                    <h4 className="text-sm font-semibold mt-2 mb-1 font-[family-name:var(--font-plus-jakarta)]">{review.title}</h4>
                    <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">{review.comment}</p>
                  </div>

                  {review.images?.length > 0 && (
                    <div className="flex gap-2 mb-3">
                      {review.images.map((img, idx) => (
                        <img key={idx} src={img.url} alt={img.alt}
                          className="w-16 h-16 object-cover rounded-lg border border-[var(--color-border-secondary)] cursor-pointer hover:opacity-75 transition-opacity"
                          onClick={() => window.open(img.url, '_blank')} />
                      ))}
                    </div>
                  )}

                  {review.adminResponse && (
                    <div className="bg-[var(--color-status-success-tint)] border-l-4 border-brand-teal p-3 mb-3">
                      <div className="text-xs font-semibold text-brand-teal mb-1">Response from MediportBD</div>
                      <p className="text-xs text-[var(--color-text-primary)]">{review.adminResponse}</p>
                    </div>
                  )}

                  {review.status === 'rejected' && review.rejectionReason && (
                    <div className="bg-[var(--color-status-danger-tint)] border-l-4 border-danger p-3 mb-3">
                      <div className="text-xs font-semibold text-[var(--color-status-danger)] mb-1">Rejection Reason</div>
                      <p className="text-xs text-[var(--color-status-danger)]">{review.rejectionReason}</p>
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t border-[var(--color-border-tertiary)]">
                    <div className="flex items-center gap-4 text-xs text-[var(--color-text-secondary)]">
                      <span>Posted: {new Date(review.createdAt).toLocaleDateString()}</span>
                      {review.isEdited && <span>(Edited: {new Date(review.editedAt).toLocaleDateString()})</span>}
                      <span>👍 {review.helpfulCount} helpful</span>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => router.push(productUrl(review.product))}
                        className="text-xs px-3 py-1 border border-[var(--color-border-secondary)] rounded hover:bg-[var(--color-background-tertiary)] transition-colors"
                      >
                        View Product
                      </button>
                      <button
                        onClick={() => handleDelete(review._id)}
                        className="text-xs px-3 py-1 border border-danger text-danger rounded hover:bg-[var(--color-status-danger-tint)] transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {pagination?.pages > 1 && (
            <div className="px-6 py-4 border-t border-[var(--color-border-tertiary)] flex items-center justify-between">
              <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                className="px-4 py-2 border border-[var(--color-border-secondary)] rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-background-tertiary)] transition-colors">
                ← Previous
              </button>
              <span className="text-sm text-[var(--color-text-secondary)]">Page {page} of {pagination.pages}</span>
              <button onClick={() => setPage(p => Math.min(pagination.pages, p + 1))} disabled={page === pagination.pages}
                className="px-4 py-2 border border-[var(--color-border-secondary)] rounded-lg text-sm disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-background-tertiary)] transition-colors">
                Next →
              </button>
            </div>
          )}
        </div>
      </div>

      {showWriteModal && selectedProduct && (
        <WriteReviewModal
          productId={selectedProduct._id}
          onClose={() => { setShowWriteModal(false); setSelectedProduct(null); }}
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
