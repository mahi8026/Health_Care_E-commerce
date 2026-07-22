"use client";

import { useState, useEffect } from 'react';
import { api } from '@/utils/api';

/**
 * Redesigned Product Tabs Component
 * Features: Specifications, Description, Reviews, Shipping & Returns
 */
export default function ProductTabsRedesigned({ product }) {
  const [activeTab, setActiveTab] = useState('specifications');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);

  const fetchReviews = async () => {
    setReviewsLoading(true);
    setReviewsError(null);
    try {
      const response = await api.get(`/reviews/product/${product._id}`);
      setReviews(response.data?.reviews || response.reviews || []);
    } catch (error) {
      setReviewsError(error.message || 'Failed to load reviews');
    } finally {
      setReviewsLoading(false);
    }
  };

  // Fetch reviews when component mounts or product changes
  useEffect(() => {
    if (product?._id) {
      fetchReviews();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product?._id]);

  const tabs = [
    { id: 'specifications', label: 'Specifications' },
    { id: 'description', label: 'Description' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'shipping', label: 'Shipping & Returns' }
  ];

  return (
    <div className="mt-6">
      {/* Tab Headers */}
      <div className="flex border-b-2 border-[#E5E7EB] overflow-x-auto scrollbar-hide mb-6 -mx-4 px-4 md:mx-0 md:px-0" style={{WebkitOverflowScrolling: 'touch'}}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-shrink-0 px-4 sm:px-5 py-3 text-[13px] sm:text-[14px] font-semibold transition-all whitespace-nowrap min-h-[48px] ${
              activeTab === tab.id
                ? 'text-[#0E8A6E] border-b-2 border-[#0E8A6E] -mb-[2px]'
                : 'text-[#6B7280] hover:text-[#0B2545]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="animate-fade-in">
        {activeTab === 'specifications' && (
          <div>
            <h3 className="text-[18px] font-bold mb-4 text-[#0B2545]">
              Technical Specifications
            </h3>
            {product?.specifications && Object.keys(product.specifications).length > 0 ? (
              <div className="bg-white rounded-xl border border-[#E5E7EB] overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2">
                  {Object.entries(product.specifications).map(([key, value], idx) => (
                    <div 
                      key={key} 
                      className={`flex border-b border-[#E5E7EB] last:border-b-0 ${
                        idx % 2 === 0 ? 'bg-surface-subtle' : 'bg-white'
                      }`}
                    >
                      <div className="text-[12px] sm:text-[13px] text-[#6B7280] w-28 sm:w-40 flex-shrink-0 p-3 sm:p-4 font-medium">
                        {key}
                      </div>
                      <div className="text-[12px] sm:text-[13px] font-semibold text-[#0B2545] p-3 sm:p-4 flex-1 break-words">
                        {value}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="bg-surface-subtle rounded-xl p-8 text-center">
                <div className="text-[40px] mb-2">📋</div>
                <p className="text-[13px] text-[#6B7280]">
                  No specifications available for this product
                </p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'description' && (
          <div>
            <h3 className="text-[18px] font-bold mb-4 text-[#0B2545]">
              Product Description
            </h3>
            <div className="text-[15px] text-[#374151] leading-[1.8] space-y-4 max-w-full">
              <p>
                {product?.description || 'Professional medical equipment designed for clinical use. Certified and compliant with international standards.'}
              </p>
              <p>
                This product is manufactured by {typeof product?.brand === 'object' ? (product?.brand?.name || 'a leading medical equipment manufacturer') : (product?.brand || 'a leading medical equipment manufacturer')} and meets all regulatory requirements for medical devices.
              </p>
              
              <div className="mt-6 bg-[#F0FDF9] border-l-4 border-[#0E8A6E] rounded-lg p-5">
                <div className="text-[14px] font-bold mb-3 text-[#0B2545]">Key Features:</div>
                <ul className="text-[13px] space-y-2 text-[#374151]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">✓</span>
                    <span>CE/FDA certified for medical use</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">✓</span>
                    <span>ISO 13485 quality management system</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">✓</span>
                    <span>DGDA registered in Bangladesh</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">✓</span>
                    <span>Comprehensive warranty coverage</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">✓</span>
                    <span>Free installation and training included</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h3 className="text-[18px] font-bold mb-4 text-[#0B2545]">
              Customer Reviews
            </h3>
            
            {/* Rating Summary */}
            <div className="bg-surface-subtle rounded-xl p-6 mb-6">
              <div className="flex flex-col sm:flex-row items-center gap-6">
                <div className="text-center flex-shrink-0">
                  <div className="text-[48px] font-extrabold text-[#0B2545] mb-2">
                    {product.rating || 0}
                  </div>
                  <div className="flex gap-1 mb-2 justify-center">
                    {[...Array(5)].map((_, i) => (
                      <svg
                        key={i}
                        width="16"
                        height="16"
                        viewBox="0 0 24 24"
                        fill={i < Math.floor(product.rating || 0) ? '#F59E0B' : '#E5E7EB'}
                      >
                        <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                      </svg>
                    ))}
                  </div>
                  <div className="text-[12px] text-[#6B7280]">
                    {product.reviewCount || 0} reviews
                  </div>
                </div>

                {/* Distribution Bars */}
                <div className="flex-1 space-y-2 w-full">
                  {[5, 4, 3, 2, 1].map(star => {
                    const percentage = star === 5 ? 60 : star === 4 ? 25 : star === 3 ? 10 : 5;
                    return (
                      <div key={star} className="flex items-center gap-3">
                        <span className="text-[12px] font-medium text-[#6B7280] w-8">
                          {star} ★
                        </span>
                        <div className="flex-1 h-2 bg-[#E5E7EB] rounded-full overflow-hidden">
                          <div 
                            className="h-full bg-[#F59E0B] transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-[11px] text-[#6B7280] w-10 text-right">
                          {percentage}%
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Reviews List */}
            <div className="space-y-4">
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-8 h-8 border-4 border-[#0E8A6E] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[13px] text-[#6B7280] mt-3">Loading reviews...</p>
                </div>
              ) : reviewsError ? (
                <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-xl p-6 text-center">
                  <div className="text-[40px] mb-2">⚠️</div>
                  <p className="text-[13px] text-[#DC2626]">{reviewsError}</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-surface-subtle rounded-xl p-8 text-center">
                  <div className="text-[40px] mb-2">💬</div>
                  <p className="text-[13px] text-[#6B7280] mb-4">
                    No reviews yet. Be the first to review this product!
                  </p>
                  <button className="px-6 py-3 bg-[#0E8A6E] hover:bg-[#0B7558] text-white rounded-lg text-[13px] font-semibold transition-colors">
                    Write a Review
                  </button>
                </div>
              ) : (
                reviews.map((review) => (
                  <div key={review._id} className="bg-white border border-[#E5E7EB] rounded-xl p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#0B2545] rounded-full flex items-center justify-center text-white text-[14px] font-bold">
                          {(review.user?.name || review.userName || 'A').charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="text-[14px] font-semibold text-[#0B2545]">
                            {review.user?.name || review.userName || 'Anonymous'}
                          </div>
                          <div className="text-[11px] text-[#6B7280]">
                            {new Date(review.createdAt).toLocaleDateString('en-US', { 
                              year: 'numeric', 
                              month: 'long', 
                              day: 'numeric' 
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <svg
                          key={i}
                          width="14"
                          height="14"
                          viewBox="0 0 24 24"
                          fill={i < review.rating ? '#F59E0B' : '#E5E7EB'}
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                        </svg>
                      ))}
                    </div>
                    <p className="text-[13px] text-[#374151] leading-relaxed">{review.comment}</p>
                  </div>
                ))
              )}
            </div>

            {reviews.length > 0 && (
              <div className="mt-6 text-center">
                <button className="px-6 py-3 bg-[#0E8A6E] hover:bg-[#0B7558] text-white rounded-lg text-[13px] font-semibold transition-colors">
                  Write a Review
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'shipping' && (
          <div>
            <h3 className="text-[18px] font-bold mb-6 text-[#0B2545]">
              Shipping & Returns
            </h3>
            
            <div className="space-y-6">
              {/* Delivery Information */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#E1F5EE] rounded-lg flex items-center justify-center">
                    <span className="text-[20px]">🚚</span>
                  </div>
                  <h4 className="text-[16px] font-bold text-[#0B2545]">Delivery Information</h4>
                </div>
                <ul className="space-y-2 text-[13px] text-[#374151]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span><strong>Free delivery</strong> within Dhaka metro area</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span><strong>Standard delivery:</strong> 2-4 business days</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span><strong>Express delivery:</strong> 24-48 hours (additional charge)</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span>Nationwide delivery available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span>Cold chain delivery for reagents and temperature-sensitive items</span>
                  </li>
                </ul>
              </div>

              {/* Installation */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#E1F5EE] rounded-lg flex items-center justify-center">
                    <span className="text-[20px]">⏰</span>
                  </div>
                  <h4 className="text-[16px] font-bold text-[#0B2545]">Installation Service</h4>
                </div>
                <ul className="space-y-2 text-[13px] text-[#374151]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span><strong>Free installation</strong> in Dhaka metro area</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span>Professional technician support</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span>Comprehensive training included for equipment operation</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span>Installation within 24 hours of delivery</span>
                  </li>
                </ul>
              </div>

              {/* Returns & Warranty */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#E1F5EE] rounded-lg flex items-center justify-center">
                    <span className="text-[20px]">🔄</span>
                  </div>
                  <h4 className="text-[16px] font-bold text-[#0B2545]">Returns & Warranty</h4>
                </div>
                <ul className="space-y-2 text-[13px] text-[#374151]">
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span><strong>30-day return policy</strong> for unopened items</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span>Full refund or replacement for defective products</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span>Manufacturer warranty included with all equipment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span>Extended warranty options available</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[#0E8A6E] mt-1">•</span>
                    <span>Free maintenance and calibration during warranty period</span>
                  </li>
                </ul>
              </div>

              {/* Packaging */}
              <div className="bg-white border border-[#E5E7EB] rounded-xl p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-[#E1F5EE] rounded-lg flex items-center justify-center">
                    <span className="text-[20px]">📦</span>
                  </div>
                  <h4 className="text-[16px] font-bold text-[#0B2545]">Packaging</h4>
                </div>
                <p className="text-[13px] text-[#374151]">
                  All products are shipped in original manufacturer sealed packaging to ensure authenticity and quality. 
                  Medical equipment is packaged with additional protective materials to prevent damage during transit.
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
