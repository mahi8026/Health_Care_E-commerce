"use client";

import { useState } from 'react';

export default function ProductTabs({ product }) {
  const [activeTab, setActiveTab] = useState('specifications');

  const tabs = [
    { id: 'specifications', label: 'Specifications' },
    { id: 'description', label: 'Description' },
    { id: 'reviews', label: 'Reviews' },
    { id: 'shipping', label: 'Shipping & Returns' }
  ];

  return (
    <div className="bg-white rounded-lg border-[0.5px] border-[var(--color-border-tertiary)] overflow-hidden">
      {/* Tab Headers */}
      <div className="flex border-b-[0.5px] border-[var(--color-border-tertiary)] overflow-x-auto">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 min-w-[100px] px-4 py-3 text-[13px] font-medium transition-colors whitespace-nowrap ${
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
      <div className="p-6">
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
              {[
                { name: 'Dr. Ahmed Hassan', rating: 5, date: '2025-03-15', comment: 'Excellent quality and reliable performance. Highly recommended for clinical use.' },
                { name: 'Dhaka Medical Centre', rating: 5, date: '2025-03-10', comment: 'Great product with professional installation service. Very satisfied with the purchase.' },
                { name: 'Dr. Fatima Rahman', rating: 4, date: '2025-03-05', comment: 'Good quality product. Delivery was on time and installation was smooth.' }
              ].map((review, index) => (
                <div key={index} className="border-b-[0.5px] border-[var(--color-border-tertiary)] pb-4 last:border-b-0">
                  <div className="flex items-center justify-between mb-2">
                    <div className="text-[12px] font-medium">{review.name}</div>
                    <div className="text-[10px] text-[var(--color-text-secondary)]">{review.date}</div>
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
