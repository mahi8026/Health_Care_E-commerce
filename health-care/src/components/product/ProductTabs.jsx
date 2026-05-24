"use client";

import { useState, useEffect } from 'react';
import { api } from '@/utils/api';

export default function ProductTabs({ product }) {
  const [activeTab, setActiveTab] = useState('specifications');
  const [reviews, setReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState(null);

  // Fetch reviews when component mounts or product changes
  useEffect(() => {
    if (product?._id) {
      fetchReviews();
    }
  }, [product?._id]);

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

  const tabs = [
    { id: 'specifications', label: 'Specifications' },
    { id: 'description', label: 'Description' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'shipping', label: 'Shipping & Returns' }
  ];

  return (
    <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] overflow-hidden">
      {/* Tab Headers - horizontal scroll on mobile with 44px touch targets */}
      <div className="flex border-b-[0.5px] border-[var(--color-border-tertiary)] overflow-x-auto scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[90px] sm:min-w-[100px] px-3 sm:px-4 py-3 text-[12px] sm:text-[13px] font-medium transition-colors whitespace-nowrap min-h-[48px] ${
              activeTab === tab.id
                ? 'text-[#0B2545] border-b-2 border-[#0B2545] -mb-[0.5px]'
                : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="p-4 sm:p-6">
        {activeTab === 'specifications' && (
          <div>
            <h3 className="text-[16px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
              Technical Specifications
            </h3>
            <div className="overflow-x-auto -mx-6 px-6" style={{WebkitOverflowScrolling: 'touch'}}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 min-w-[300px]">
                {product?.specifications ? (
                  Object.entries(product.specifications).map(([key, value]) => (
                    <div key={key} className="flex border-b-[0.5px] border-[var(--color-border-tertiary)] pb-2">
                      <div className="text-[12px] text-[var(--color-text-secondary)] w-32 flex-shrink-0">
                        {key}
                      </div>
                      <div className="text-[12px] font-medium">{value}</div>
                    </div>
                  ))
                ) : (
                  <div className="col-span-2 text-[12px] text-[var(--color-text-secondary)]">
                    No specifications available
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'description' && (
          <div>
            <h3 className="text-[16px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
              Product Description
            </h3>
            <div className="text-[13px] text-[var(--color-text-secondary)] leading-relaxed space-y-3">
              <p>
                {product?.description || 'Professional medical equipment designed for clinical use. Certified and compliant with international standards.'}
              </p>
              <p>
                This product is manufactured by {typeof product?.brand === 'object' ? product?.brand?.name : product?.brand || 'a leading medical equipment manufacturer'} and meets all regulatory requirements for medical devices.
              </p>
              <div className="mt-4 p-3 bg-[var(--color-background-secondary)] rounded-lg">
                <div className="text-[11px] font-medium mb-2">Key Features:</div>
                <ul className="text-[11px] space-y-1 list-disc list-inside">
                  <li>CE/FDA certified for medical use</li>
                  <li>ISO 13485 quality management</li>
                  <li>DGDA registered in Bangladesh</li>
                  <li>Comprehensive warranty coverage</li>
                  <li>Free installation and training</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h3 className="text-[16px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
              Customer Reviews
            </h3>
            <div className="space-y-4">
              {reviewsLoading ? (
                <div className="text-center py-8">
                  <div className="inline-block w-6 h-6 border-3 border-[#0E8A6E] border-t-transparent rounded-full animate-spin"></div>
                  <p className="text-[12px] text-[var(--color-text-secondary)] mt-2">Loading reviews...</p>
                </div>
              ) : reviewsError ? (
                <div className="bg-[#FEF2F2] border border-[#FCA5A5] rounded-lg p-4 text-center">
                  <p className="text-[12px] text-[#DC2626]">{reviewsError}</p>
                </div>
              ) : reviews.length === 0 ? (
                <div className="bg-[var(--color-background-secondary)] rounded-lg p-6 text-center">
                  <p className="text-[12px] text-[var(--color-text-secondary)] mb-3">
                    No reviews yet. Be the first to review this product!
                  </p>
                  <button className="px-4 py-2 bg-[#0E8A6E] hover:bg-[#0B7558] text-white rounded-lg text-[12px] font-medium transition-colors">
                    Write a Review
                  </button>
                </div>
              ) : (
                <>
                  {reviews.map((review) => (
                    <div key={review._id} className="border-b-[0.5px] border-[var(--color-border-tertiary)] pb-4 last:border-b-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="text-[12px] font-medium">
                          {review.user?.name || review.userName || 'Anonymous'}
                        </div>
                        <div className="text-[10px] text-[var(--color-text-secondary)]">
                          {new Date(review.createdAt).toLocaleDateString('en-US', { 
                            year: 'numeric', 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </div>
                      </div>
                      <div className="flex gap-1 mb-2">
                        {[...Array(5)].map((_, i) => (
                          <div
                            key={i}
                            className={`w-3 h-3 ${
                              i < review.rating ? 'bg-[#F59E0B]' : 'bg-[var(--color-border-secondary)]'
                            }`}
                            style={{ clipPath: 'polygon(50% 0%,61% 35%,98% 35%,68% 57%,79% 91%,50% 70%,21% 91%,32% 57%,2% 35%,39% 35%)' }}
                          />
                        ))}
                      </div>
                      <p className="text-[12px] text-[var(--color-text-secondary)]">{review.comment}</p>
                    </div>
                  ))}
                  <div className="mt-4 text-center">
                    <button className="px-4 py-2 bg-[#0E8A6E] hover:bg-[#0B7558] text-white rounded-lg text-[12px] font-medium transition-colors">
                      Write a Review
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div>
            <h3 className="text-[16px] font-semibold mb-4 font-[family-name:var(--font-plus-jakarta)]">
              Shipping & Returns
            </h3>
            <div className="space-y-4 text-[13px]">
              <div>
                <div className="font-medium mb-2">Delivery Information</div>
                <ul className="text-[12px] text-[var(--color-text-secondary)] space-y-1 list-disc list-inside">
                  <li>Free delivery within Dhaka metro area</li>
                  <li>Standard delivery: 2-4 business days</li>
                  <li>Express delivery: 24-48 hours (additional charge)</li>
                  <li>Nationwide delivery available</li>
                  <li>Cold chain delivery for reagents</li>
                </ul>
              </div>
              <div>
                <div className="font-medium mb-2">Installation</div>
                <ul className="text-[12px] text-[var(--color-text-secondary)] space-y-1 list-disc list-inside">
                  <li>Free installation in Dhaka</li>
                  <li>Professional technician support</li>
                  <li>Training included for equipment</li>
                  <li>Installation within 24 hours of delivery</li>
                </ul>
              </div>
              <div>
                <div className="font-medium mb-2">Returns & Warranty</div>
                <ul className="text-[12px] text-[var(--color-text-secondary)] space-y-1 list-disc list-inside">
                  <li>30-day return policy</li>
                  <li>Full refund for defective products</li>
                  <li>Manufacturer warranty included</li>
                  <li>Extended warranty available</li>
                  <li>Free maintenance during warranty period</li>
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
