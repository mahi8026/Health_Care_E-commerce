"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from '@/context/AuthContext';
import WriteReviewModal from './WriteReviewModal';
import { API } from '@/constants/api';
import { FaStar, FaRegStar, FaThumbsUp, FaFlag, FaEdit } from 'react-icons/fa';

/**
 * World-Class Enhanced Product Reviews
 * Features:
 * - Engaging empty state with incentive
 * - Visual star rating distribution
 * - Verified purchase badges
 * - Helpful votes
 * - Admin responses
 * - Report inappropriate reviews
 */
export default function ProductReviewsEnhanced({ productId }) {
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
  const [hasEligibleOrder, setHasEligibleOrder] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    fetchReviews();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId, page, ratingFilter, sortBy]);

  useEffect(() => {
    if (user) {
      // Any logged-in user can write a review
      setCanReview(true);
      // Check if they have an eligible order (determines verified vs unverified)
      checkEligibility();
    } else {
      setCanReview(false);
      setHasEligibleOrder(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, productId]);

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
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/reviews/eligible-products`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
        const eligible = data.data.some(p => p._id === productId);
        setHasEligibleOrder(eligible);
      }
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Check eligibility error:', error);
    }
  };

  const handleHelpful = async (reviewId) => {
    if (!user) {
      showMessage('Please login to mark reviews as helpful', 'error');
      return;
    }

    try {
      const token = localStorage.getItem('medcore_token');
      const res = await fetch(`${API}/reviews/${reviewId}/helpful`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      
      if (data.success) {
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
      const token = localStorage.getItem('medcore_token');
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

  const renderStars = (rating, interactive = false, size = 20) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <span key={star} className={interactive ? 'cursor-pointer' : ''}>
            {star <= rating ? (
              <FaStar size={size} className="text-yellow-500" />
            ) : (
              <FaRegStar size={size} className="text-gray-300" />
            )}
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
              className={`w-full flex items-center gap-3 text-sm hover:bg-gray-50 p-2 rounded-lg transition-all ${
                ratingFilter === rating.toString() ? 'bg-blue-50 border border-blue-200' : ''
              }`}
            >
              <span className="flex items-center gap-1 w-16">
                <span className="font-medium">{rating}</span>
                <FaStar size={14} className="text-yellow-500" />
              </span>
              <div className="flex-1 h-3 bg-gray-200 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-yellow-500 transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
              <span className="text-sm text-gray-600 w-12 text-right">
                {count}
              </span>
            </button>
          );
        })}
      </div>
    );
  };

  // Engaging empty state
  if (!loading && (!reviews || reviews.length === 0) && !stats) {
    return (
      <div>
        {/* Message Toast */}
        {message.text && (
          <div className={`fixed top-4 right-4 px-6 py-4 rounded-xl shadow-2xl z-50 animate-fadeSlideUp ${
            message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
          }`}>
            {message.text}
          </div>
        )}

        <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>
        
        <div className="bg-gradient-to-br from-blue-50 to-teal-50 rounded-3xl p-12 text-center border border-blue-100">
          {/* Large star icons */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5].map(star => (
              <FaRegStar key={star} size={48} className="text-gray-300 animate-pulse" style={{ animationDelay: `${star * 100}ms` }} />
            ))}
          </div>

          <h3 className="text-3xl font-bold text-gray-900 mb-4">
            Be the First to Review! 🎉
          </h3>
          
          <p className="text-lg text-gray-600 mb-6 max-w-xl mx-auto">
            Share your experience and help others make informed decisions. Your review matters!
          </p>

          {user ? (
            <div className="space-y-3">
              <button
                onClick={() => setShowWriteModal(true)}
                className="px-8 py-4 bg-[#0E8A6E] hover:bg-[#0c7a61] text-white rounded-xl font-bold text-lg transition-all duration-300 hover:shadow-xl hover:scale-105 inline-flex items-center gap-3"
              >
                <FaEdit size={20} />
                <span>Write Your Review</span>
              </button>
              {hasEligibleOrder ? (
                <p className="text-xs text-green-600">✓ Verified purchase — your review will be published immediately</p>
              ) : (
                <p className="text-xs text-gray-400">Review will be marked as unverified and pending approval</p>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-gray-500">Sign in to write a review</p>
              <a
                href="/login"
                className="px-6 py-3 bg-[#0B2545] hover:bg-[#0d2e56] text-white rounded-xl font-semibold text-base transition-colors inline-block"
              >
                Sign In to Review
              </a>
            </div>
          )}

          {/* Trust indicators */}
          <div className="mt-8 flex items-center justify-center gap-8 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <span className="text-green-600 text-xl">✓</span>
              <span>Honest reviews</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-blue-600 text-xl">🛡️</span>
              <span>Moderated content</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-purple-600 text-xl">📸</span>
              <span>Photos welcome</span>
            </div>
          </div>
        </div>

        {showWriteModal && (
          <WriteReviewModal
            productId={productId}
            onClose={() => setShowWriteModal(false)}
            onSuccess={() => {
              setShowWriteModal(false);
              fetchReviews();
              showMessage('Review submitted successfully! Thank you for your feedback.', 'success');
            }}
          />
        )}
      </div>
    );
  }

  return (
    <div>
      {/* Message Toast */}
      {message.text && (
        <div className={`fixed top-4 right-4 px-6 py-4 rounded-xl shadow-2xl z-50 animate-fadeSlideUp ${
          message.type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      <h2 className="text-2xl font-bold text-gray-900 mb-6">Customer Reviews</h2>

      {/* Rating Summary */}
      {stats && stats.totalReviews > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr] gap-6 mb-8">
          {/* Left: Overall Rating */}
          <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-2xl p-6 text-center border border-yellow-200">
            <div className="text-6xl font-extrabold text-gray-900 mb-3">
              {stats.averageRating.toFixed(1)}
            </div>
            <div className="flex justify-center mb-3">
              {renderStars(Math.round(stats.averageRating), false, 24)}
            </div>
            <div className="text-sm text-gray-600 font-medium">
              Based on {stats.totalReviews} {stats.totalReviews === 1 ? 'review' : 'reviews'}
            </div>
            
            {user && (
              <button
                onClick={() => setShowWriteModal(true)}
                className="mt-6 w-full py-3 px-4 bg-[#0E8A6E] hover:bg-[#0c7a61] text-white rounded-xl font-bold transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
              >
                <FaEdit size={16} />
                <span>Write a Review</span>
              </button>
            )}
            {!user && (
              <a
                href="/login"
                className="mt-6 w-full py-3 px-4 bg-[#0B2545] hover:bg-[#0d2e56] text-white rounded-xl font-bold transition-all duration-300 hover:shadow-lg flex items-center justify-center gap-2"
              >
                <span>Sign In to Review</span>
              </a>
            )}
          </div>

          {/* Right: Distribution */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-4">Rating Distribution</h3>
            {renderRatingDistribution()}
          </div>
        </div>
      ) : null}

      {/* Filters & Sort */}
      {stats && stats.totalReviews > 0 && (
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-200">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">Sort by:</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-xl text-sm bg-white hover:border-gray-400 focus:border-[#0E8A6E] focus:outline-none transition-colors"
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
              className="text-sm text-[#0E8A6E] font-semibold hover:underline"
            >
              Clear filter ✕
            </button>
          )}
        </div>
      )}

      {/* Reviews List */}
      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map(i => (
            <div key={i} className="bg-gray-100 rounded-2xl p-6 animate-pulse">
              <div className="h-6 bg-gray-300 rounded w-1/4 mb-4"></div>
              <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
              <div className="h-4 bg-gray-300 rounded w-full mb-2"></div>
              <div className="h-4 bg-gray-300 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-2xl">
          <div className="text-gray-400 text-6xl mb-4">🔍</div>
          <p className="text-lg text-gray-600">
            {ratingFilter ? 'No reviews found with this rating filter.' : 'No reviews yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {reviews.map(review => (
            <div key={review._id} className="bg-white border-2 border-gray-200 rounded-2xl p-6 hover:border-gray-300 hover:shadow-lg transition-all duration-300">
              {/* Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-500 rounded-full flex items-center justify-center text-white text-lg font-bold flex-shrink-0">
                    {review.user?.name?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-base font-bold text-gray-900">
                        {review.user?.name || 'Anonymous'}
                      </span>
                      {review.verifiedPurchase && (
                        <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-bold flex items-center gap-1">
                          ✓ Verified Purchase
                        </span>
                      )}
                    </div>
                    <div className="text-sm text-gray-500">
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
                  className="flex items-center gap-2 text-sm text-gray-400 hover:text-red-500 transition-colors px-3 py-2 rounded-lg hover:bg-red-50"
                  title="Report review"
                >
                  <FaFlag size={14} />
                  <span className="hidden sm:inline">Report</span>
                </button>
              </div>

              {/* Rating & Title */}
              <div className="mb-4">
                <div className="flex items-center gap-3 mb-2">
                  {renderStars(review.rating, false, 18)}
                  <span className="text-sm font-bold text-gray-700">
                    {review.rating}.0 out of 5
                  </span>
                </div>
                <h4 className="text-lg font-bold text-gray-900">
                  {review.title}
                </h4>
              </div>

              {/* Comment */}
              <p className="text-base text-gray-700 mb-5 leading-relaxed">
                {review.comment}
              </p>

              {/* Images */}
              {review.images && review.images.length > 0 && (
                <div className="flex gap-3 mb-5 overflow-x-auto pb-2">
                  {review.images.map((img, idx) => (
                    <Image
                      key={idx}
                      src={img.url}
                      alt={img.alt || `Review image ${idx + 1}`}
                      width={96}
                      height={96}
                      className="w-24 h-24 object-cover rounded-xl border-2 border-gray-200 cursor-pointer hover:scale-110 hover:border-[#0E8A6E] transition-all duration-300"
                      onClick={() => window.open(img.url, '_blank')}
                    />
                  ))}
                </div>
              )}

              {/* Admin Response */}
              {review.adminResponse && (
                <div className="bg-gradient-to-r from-teal-50 to-blue-50 border-l-4 border-[#0E8A6E] p-4 rounded-lg mb-5">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-bold text-[#0E8A6E]">MedCore BD Team</span>
                    <span className="px-2 py-1 bg-[#0E8A6E] text-white rounded-full text-xs font-bold">
                      Official Response
                    </span>
                  </div>
                  <p className="text-sm text-gray-700 leading-relaxed">
                    {review.adminResponse}
                  </p>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-4 pt-4 border-t border-gray-200">
                <button
                  onClick={() => handleHelpful(review._id)}
                  className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 hover:text-[#0E8A6E] hover:bg-gray-50 rounded-lg transition-all"
                >
                  <FaThumbsUp size={14} />
                  <span>Helpful ({review.helpfulCount})</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.pages > 1 && (
        <div className="flex items-center justify-center gap-4 mt-8">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0E8A6E] hover:text-[#0E8A6E] transition-all"
          >
            ← Previous
          </button>
          <span className="text-base font-medium text-gray-700">
            Page {page} of {pagination.pages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(pagination.pages, p + 1))}
            disabled={page === pagination.pages}
            className="px-6 py-3 border-2 border-gray-300 rounded-xl font-semibold text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:border-[#0E8A6E] hover:text-[#0E8A6E] transition-all"
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
            fetchReviews();
            showMessage('Review submitted successfully! Thank you for your feedback.', 'success');
          }}
        />
      )}
    </div>
  );
}
