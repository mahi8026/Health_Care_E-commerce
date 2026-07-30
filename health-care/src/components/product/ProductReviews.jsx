"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import WriteReviewModal from './WriteReviewModal';
import { API } from '@/constants/api';

export default function ProductReviews({ productId }) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState(null);
  const [ratingFilter, setRatingFilter] = useState('');
  const [sortBy, setSortBy] = useState('helpful');
  const [showWriteModal, setShowWriteModal] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  const fetchReviews = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page,
        limit: 10,
        sort: sortBy
      });
      
      if (ratingFilter) params.set('rating', ratingFilter);
      
      const res = await fetch(`${API}/reviews/product/${productId}?${params}`);
      const data = await res.json();
      
      if (data.success) {
        setReviews(data.data);
        setStats(data.stats);
        setPagination(data.pagination);
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Fetch reviews error:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibility = async () => {
    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/reviews/eligible-products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        const eligible = data.data.some(p => p._id === productId);
        setCanReview(eligible);
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Check eligibility error:', error);
    }
  };

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, page, ratingFilter, sortBy]);

  useEffect(() => {
    if (user) {
      checkEligibility();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, productId]);

  const handleHelpful = async (reviewId) => {
    if (!user) {
      showMessage('Please login to mark reviews as helpful', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        // Update local state
        setReviews(reviews.map(r => 
          r._id === reviewId 
            ? { ...r, helpfulCount: data.data.helpfulCount }
            : r
        ));
      } else {
        showMessage(data.message, 'error');
      }
    } catch (error) {
      showMessage('Failed to update helpful status', 'error');
    }
  };

  const handleReport = async (reviewId) => {
    if (!user) {
      showMessage('Please login to report reviews', 'error');
      return;
    }

    const reason = prompt('Please provide a reason for reporting this review (minimum 10 characters):');
    if (!reason || reason.trim().length < 10) {
      showMessage('Please provide a valid reason (at least 10 characters)', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/reviews/${reviewId}/report`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ reason })
      });
      const data = await res.json();
      
      showMessage(data.message, data.success ? 'success' : 'error');
    } catch (error) {
      showMessage('Failed to report review', 'error');
    }
  };

  const showMessage = (text, type) => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 3000);
  };

  const renderStars = (rating, size = 'md') => {
    const sizeClasses = {
      sm: 'text-[12px]',
      md: 'text-[16px]',
      lg: 'text-[24px]'
    };
    
    return (
      <div className={`flex gap-[2px] ${sizeClasses[size]}`}>
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={star <= rating ? 'text-[#FFA500]' : 'text-[#E5E7EB]'}>
            ★
          </span>
        ))}
      </div>
    );
  };

  const renderRatingDistribution = () => {
    if (!stats || stats.totalReviews === 0) return null;

    return (
      <div className="space-y-2">
        {[5, 4, 3, 2, 1].map(rating => {
          const count = stats.distribution[rating] || 0;
          const percentage = (count / stats.totalReviews) * 100;
          
          return (
            <button
              key={rating}
              onClick={() => setRatingFilter(ratingFilter === rating.toString() ? '' : rating.toString())}
              className={`w-full flex items-center gap-3 text-[12px] hover:bg-[var(--color-background-tertiary)] p-2 rounded transition-colors ${
                ratingFilter === rating.toString() ? 'bg-[var(--color-background-tertiary)]' : ''
              }`}
            >
              <span className="text-[11px] font-medium w-[30px]">{rating} ★</span>
              <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[#FFA500] transition-all"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-[11px] text-[var(--color-text-secondary)] w-[40px] text-right">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  return (
    <div className="mt-12">
      {/* Message Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-4 py-3 rounded-lg shadow-lg z-50 ${
          message.type === 'success' ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#FEE2E2] text-[#991B1B]'
        }`}>
          {message.text}
        </div>
      )}

      <h2 className="text-[20px] font-bold mb-6 font-[family-name:var(--font-plus-jakarta)]">
        Customer Reviews
      </h2>

      {/* Rating Summary */}
      {stats && stats.totalReviews > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-[300px_1fr] gap-8 mb-8">
          {/* Left: Overall Rating */}
          <div className="bg-[var(--color-background-tertiary)] rounded-lg p-6 text-center">
            <div className="text-[48px] font-bold mb-2 font-[family-name:var(--font-plus-jakarta)]">
              {stats.averageRating.toFixed(1)}
            </div>
            {renderStars(Math.round(stats.averageRating), 'lg')}
            <div className="text-[13px] text-[var(--color-text-secondary)] mt-3">
              Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
            </div>
            
            {canReview && (
              <button
                onClick={() => setShowWriteModal(true)}
                className="mt-4 w-full min-h-[44px] px-4 py-2 bg-[#0B2545] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0d2e56] transition-colors"
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Right: Distribution */}
          <div>
            <h3 className="text-[14px] font-semibold mb-3 font-[family-name:var(--font-plus-jakarta)]">
              Rating Distribution
            </h3>
            {renderRatingDistribution()}
          </div>
        </div>
      ) : (
        <div className="bg-[var(--color-background-tertiary)] rounded-lg p-8 text-center mb-8">
          <div className="text-[48px] mb-2">📝</div>
          <h3 className="text-[16px] font-semibold mb-2 font-[family-name:var(--font-plus-jakarta)]">
            No reviews yet
          </h3>
          <p className="text-[13px] text-[var(--color-text-secondary)] mb-4">
            Be the first to review this product!
          </p>
          {canReview && (
            <button
              onClick={() => setShowWriteModal(true)}
              className="px-6 py-2 bg-[#0B2545] text-white rounded-lg text-[13px] font-semibold hover:bg-[#0d2e56] transition-colors"
            >
              Write a Review
            </button>
          )}
        </div>
      )}

      {/* Filters & Sort */}
      {stats && stats.totalReviews > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6 pb-4 border-b border-[var(--color-border-tertiary)]">
          <div className="flex items-center gap-3">
            <span className="text-[13px] text-[var(--color-text-secondary)]">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="flex-1 sm:flex-none px-3 min-h-[44px] py-2 border border-[var(--color-border-secondary)] rounded-lg text-[16px] sm:text-[13px] bg-white"
            >
              <option value="helpful">Most Helpful</option>
              <option value="recent">Most Recent</option>
              <option value="rating_high">Highest Rating</option>
              <option value="rating_low">Lowest Rating</option>
            </select>
          </div>

          {ratingFilter && (
            <button
              onClick={() => setRatingFilter('')}
              className="min-h-[44px] px-4 text-[12px] text-[#0E8A6E] font-medium hover:underline"
            >
              Clear filter
            </button>
          )}
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-[var(--color-background-tertiary)] rounded-lg p-6 animate-pulse">
              <div className="h-4 bg-gray-300 rounded w-1/4 mb-3"></div>
              <div className="h-3 bg-gray-300 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-8 text-[13px] text-[var(--color-text-secondary)]">
          {ratingFilter ? 'No reviews found with this rating filter.' : 'No reviews yet.'}
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review._id} className="bg-white border border-[var(--color-border-tertiary)] rounded-lg p-6">
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-[#0B2545] rounded-full flex items-center justify-center text-white text-[14px] font-bold">
                    {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
                        {review.user?.name || 'Anonymous'}
                      </span>
                      {review.verifiedPurchase && (
                        <span className="text-[10px] px-2 py-[2px] bg-[#D1FAE5] text-[#065F46] rounded font-medium">
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[var(--color-text-secondary)]">
                      {new Date(review.createdAt).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                      {review.isEdited && ' (edited)'}
                    </div>
                  </div>
                </div>
                
                <button
                  onClick={() => handleReport(review._id)}
                  className="text-[11px] text-[var(--color-text-secondary)] hover:text-[#E24B4A] transition-colors"
                  title="Report review"
                >
                  🚩 Report
                </button>
              </div>

              {/* Rating & Title */}
              <div className="mb-3">
                {renderStars(review.rating, 'sm')}
                <h4 className="text-[14px] font-semibold mt-2 font-[family-name:var(--font-plus-jakarta)]">
                  {review.title}
                </h4>
              </div>

              {/* Comment */}
              <p className="text-[13px] text-[var(--color-text-primary)] mb-4 leading-relaxed">
                {review.comment}
              </p>

              {/* Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-2 mb-4">
                  {review.images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img.url}
                      alt={img.alt || `Review image ${idx + 1}`}
                      className="w-20 h-20 object-cover rounded-lg border border-[var(--color-border-secondary)] cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => window.open(img.url, '_blank')}
                    />
                  ))}
                </div>
              )}

              {/* Admin Response */}
              {review.adminResponse && (
                <div className="bg-[#F0FDF9] border-l-4 border-[#0E8A6E] p-4 mb-4">
                  <div className="text-[11px] font-semibold text-[#0E8A6E] mb-1">
                    Response from MediportBD
                  </div>
                  <p className="text-[12px] text-[var(--color-text-primary)]">
                    {review.adminResponse}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-3 border-t border-[var(--color-border-tertiary)]">
                <button
                  onClick={() => handleHelpful(review._id)}
                  className="flex items-center gap-2 text-[12px] text-[var(--color-text-secondary)] hover:text-[#0E8A6E] transition-colors"
                >
                  <span>👍</span>
                  <span>Helpful ({review.helpfulCount})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="min-h-[44px] px-4 py-2 border border-[var(--color-border-secondary)] rounded-lg text-[13px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-background-tertiary)] transition-colors"
          >
            ← Previous
          </button>
          <span className="text-[13px] text-[var(--color-text-secondary)]">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="min-h-[44px] px-4 py-2 border border-[var(--color-border-secondary)] rounded-lg text-[13px] disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[var(--color-background-tertiary)] transition-colors"
          >
            Next →
          </button>
        </div>
      )}

      {/* Write Review Modal */}
      {showWriteModal && (
        <WriteReviewModal
          productId={productId}
          onClose={() => setShowWriteModal(false)}
          onSuccess={() => {
            setShowWriteModal(false);
            setCanReview(false);
            fetchReviews();
            showMessage('Review submitted successfully!', 'success');
          }}
        />
      )}
    </div>
  );
}
