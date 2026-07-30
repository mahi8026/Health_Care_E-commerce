"use client";

import { useState, useEffect } from 'react';
import { CldUploadWidget } from 'next-cloudinary';
import { API } from '@/constants/api';

export default function WriteReviewModal({ productId, onClose, onSuccess }) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');
  const [images, setImages] = useState([]);
  const [orderId, setOrderId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [eligibleLoading, setEligibleLoading] = useState(true);

  useEffect(() => {
    const fetchEligibleOrder = async () => {
      try {
        const token = localStorage.getItem('Mediport_token');
        const res = await fetch(`${API}/reviews/eligible-products`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await res.json();
        
        if (data.success) {
          const product = data.data.find(p => p._id === productId);
          if (product) {
            setOrderId(product.orderId);
          }
        }
      } catch (error) {
        process.env.NODE_ENV !== "production" && console.error('Fetch eligible order error:', error);
      } finally {
        setEligibleLoading(false);
      }
    };

    fetchEligibleOrder();
  }, [productId]);

  const handleUploadSuccess = (result) => {
    if (!result?.info || typeof result.info === 'string') return;
    
    const info = result.info;
    const newImage = {
      url: info.secure_url,
      publicId: info.public_id,
      alt: 'Review image'
    };
    
    if (images.length >= 5) {
      setError('Maximum 5 images allowed');
      return;
    }
    
    setImages([...images, newImage]);
  };

  const handleRemoveImage = (index) => {
    setImages(images.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Validation
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    if (!title || title.trim().length === 0) {
      setError('Title is required');
      return;
    }
    if (!comment || comment.trim().length === 0) {
      setError('Comment is required');
      return;
    }
    // orderId is optional — backend auto-detects verified purchase status

    setLoading(true);

    try {
      const token = localStorage.getItem('Mediport_token');
      const res = await fetch(`${API}/reviews`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          productId,
          orderId,
          rating,
          title: title.trim(),
          comment: comment.trim(),
          images
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || `Request failed (${res.status})`);
        return;
      }

      if (data.success) {
        onSuccess();
      } else {
        setError(data.message || 'Failed to submit review');
      }
    } catch (error) {
      setError('Failed to submit review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const renderStars = () => {
    return (
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            onClick={() => setRating(star)}
            onMouseEnter={() => setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className="text-[32px] transition-all hover:scale-110"
          >
            <span className={
              star <= (hoverRating || rating) 
                ? 'text-[#FFA500]' 
                : 'text-[#E5E7EB]'
            }>
              ★
            </span>
          </button>
        ))}
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 bg-black/60 z-[9999] flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl flex flex-col"
        style={{ maxHeight: 'calc(100vh - 2rem)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header — always visible at top */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-[var(--color-border-tertiary)] flex-shrink-0">
          <h3 className="text-[16px] sm:text-[18px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
            Write a Review
          </h3>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-full text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Scrollable body */}
        <div className="overflow-y-auto flex-1 min-h-0">

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-5 space-y-5 pb-6">
          {/* Error Message */}
          {error && (
            <div className="bg-[#FEE2E2] text-[#991B1B] px-4 py-3 rounded-lg text-[13px]">
              {error}
            </div>
          )}

          {/* Verified purchase notice */}
          {!eligibleLoading && !orderId && (
            <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-[12px]">
              ℹ️ No delivered order found for this product. You can still submit a review — it will be marked as unverified and pending approval.
            </div>
          )}
          {!eligibleLoading && orderId && (
            <div className="bg-[#F0FDF9] border border-[#D1FAE5] text-[#065F46] px-4 py-3 rounded-lg text-[12px]">
              ✓ Verified purchase — your review will be published immediately.
            </div>
          )}

          {/* Rating */}
          <div>
            <label className="block text-[13px] font-semibold text-[var(--color-text-primary)] mb-2">
              Rating <span className="text-red-500">*</span>
            </label>
            {renderStars()}
            {rating > 0 && (
              <div className="text-[12px] text-[var(--color-text-secondary)] mt-2">
                {rating === 5 && 'Excellent!'}
                {rating === 4 && 'Very Good'}
                {rating === 3 && 'Good'}
                {rating === 2 && 'Fair'}
                {rating === 1 && 'Poor'}
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-[13px] font-semibold text-[var(--color-text-primary)] mb-2">
              Review Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder="Summarize your experience"
              maxLength={100}
              className="w-full px-4 py-3 min-h-[48px] text-[16px] sm:text-[14px] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:border-[#0E8A6E]"
            />
            <div className="text-[11px] text-[var(--color-text-secondary)] mt-1 text-right">
              {title.length}/100
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-[13px] font-semibold text-[var(--color-text-primary)] mb-2">
              Your Review <span className="text-red-500">*</span>
            </label>
            <textarea
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Share your experience with this product"
              maxLength={1000}
              rows={6}
              className="w-full px-4 py-3 text-[16px] sm:text-[14px] border border-[var(--color-border-secondary)] rounded-lg focus:outline-none focus:border-[#0E8A6E] resize-none"
            />
            <div className="text-[11px] text-[var(--color-text-secondary)] mt-1 text-right">
              {comment.length}/1000
            </div>
          </div>

          {/* Images */}
          <div>
            <label className="block text-[13px] font-semibold text-[var(--color-text-primary)] mb-2">
              Photos (Optional)
            </label>
            
            <CldUploadWidget
              uploadPreset={process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET || 'MediportBD_products'}
              options={{
                cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
                maxFiles: 5 - images.length,
                multiple: true,
                resourceType: 'image',
                clientAllowedFormats: ['jpg', 'jpeg', 'png', 'webp'],
                maxFileSize: 5242880, // 5 MB
                folder: 'MediportBD/reviews',
                transformation: [{ width: 800, height: 800, crop: 'limit', quality: 'auto' }]
              }}
              onSuccess={handleUploadSuccess}
            >
              {({ open }) => (
                <button
                  type="button"
                  onClick={() => {
                    if (images.length >= 5) {
                      setError('Maximum 5 images allowed');
                      return;
                    }
                    open();
                  }}
                  className="w-full border-2 border-dashed border-[var(--color-border-secondary)] hover:border-[#0E8A6E] hover:bg-[#F0FDF9] rounded-lg p-4 text-center transition-colors"
                >
                  <svg className="mx-auto mb-2 w-8 h-8 text-[var(--color-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p className="text-[13px] text-[var(--color-text-secondary)]">
                    Click to upload photos
                    {images.length > 0 && (
                      <span className="ml-1 text-[#0E8A6E] font-medium">({images.length}/5 added)</span>
                    )}
                  </p>
                  <p className="text-[11px] text-[var(--color-text-secondary)] mt-1">
                    JPEG, PNG, WebP — max 5 MB each
                  </p>
                </button>
              )}
            </CldUploadWidget>

            {/* Image Previews */}
            {images.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {images.map((img, idx) => (
                  <div key={idx} className="relative group w-20 h-20 rounded-lg overflow-hidden border border-[var(--color-border-secondary)]">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt={`Review image ${idx + 1}`} className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center text-white text-sm opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: 'rgba(226,75,74,0.9)' }}
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Guidelines */}
          <div className="bg-[#F0FDF9] border border-[#D1FAE5] rounded-lg p-4">
            <h4 className="text-[12px] font-semibold text-[#065F46] mb-2">Review Guidelines</h4>
            <ul className="text-[11px] text-[#065F46] space-y-1">
              <li>• Be honest and specific about your experience</li>
              <li>• Focus on the product, not the seller or shipping</li>
              <li>• Avoid profanity and personal information</li>
              <li>• You can edit your review within 30 days</li>
            </ul>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4 pb-safe">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 min-h-[48px] px-4 py-3 border border-[var(--color-border-secondary)] rounded-lg text-[14px] font-semibold hover:bg-[var(--color-background-tertiary)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || rating === 0 || title.trim().length < 10 || comment.trim().length < 50}
              className="flex-1 min-h-[48px] px-4 py-3 bg-[#0B2545] text-white rounded-lg text-[14px] font-semibold hover:bg-[#0d2e56] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Submitting...' : 'Submit Review'}
            </button>
          </div>
          {/* Show why button is disabled */}
          {(rating === 0 || title.trim().length < 10 || comment.trim().length < 50) && (
            <p className="text-[11px] text-center text-[var(--color-text-secondary)]">
              {rating === 0 && 'Select a star rating · '}
              {title.trim().length < 10 && `Title needs ${10 - title.trim().length} more chars · `}
              {comment.trim().length < 50 && `Review needs ${50 - comment.trim().length} more chars`}
            </p>
          )}
        </form>
        </div>{/* end scrollable body */}
      </div>{/* end card */}
    </div>
  );
}
