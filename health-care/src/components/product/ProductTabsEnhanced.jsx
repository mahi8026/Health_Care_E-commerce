"use client";

import { useState } from 'react';
import { FaBox, FaFileAlt, FaTruck } from 'react-icons/fa';

/**
 * Enhanced Product Tabs with Better Specifications
 * Never shows "No specs yet" - always has default content
 */
export default function ProductTabsEnhanced({ product }) {
  const [activeTab, setActiveTab] = useState('specs');

  const tabs = [
    { id: 'specs', label: 'Specifications', icon: FaBox },
    { id: 'description', label: 'Description', icon: FaFileAlt },
    { id: 'shipping', label: 'Shipping & Returns', icon: FaTruck },
  ];

  // Default specifications that every product should have
  const getSpecifications = () => {
    const specs = product.specifications || {};
    
    // Merge with defaults
    return {
      'Manufacturer': product.manufacturer || (typeof product.brand === 'object' ? product.brand?.name : product.brand) || 'Available on request',
      'Model Number': product.model || product.sku || 'N/A',
      'Country of Origin': specs['Country of Origin'] || product.countryOfOrigin || 'China/Germany/Japan',
      'Warranty Period': product.warranty || specs.Warranty || '12 months manufacturer warranty',
      'Certification': product.certifications?.join(', ') || 'CE, DGDA',
      'Package Dimensions': specs['Package Dimensions'] || 'Contact for details',
      'Product Weight': specs.Weight || specs['Product Weight'] || 'Contact for details',
      'Package Contents': specs['Package Contents'] || '1x Main Unit, Accessories, User Manual, Warranty Card',
      ...specs // Include any additional specs from product
    };
  };

  const specifications = getSpecifications();

  return (
    <div>
      {/* Tab Navigation */}
      <div className="flex gap-2 border-b border-[var(--color-border-primary)] mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-brand-teal border-b-2 border-brand-teal'
                  : 'text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-background-secondary)] rounded-t-lg'
              }`}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content */}
      <div className="animate-fadeIn">
        {activeTab === 'specs' && (
          <div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Technical Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(specifications).map(([key, value], index) => (
                <div
                  key={key}
                  className={`p-4 rounded-lg transition-colors ${
                    index % 2 === 0 ? 'bg-[var(--color-background-secondary)]' : 'bg-white border border-[var(--color-border-primary)]'
                  }`}
                >
                  <div className="text-sm font-semibold text-[var(--color-text-secondary)] mb-1">{key}</div>
                  <div className="text-base font-medium text-[var(--color-text-primary)]">{value}</div>
                </div>
              ))}
            </div>

            {/* Features List */}
            {product.features && product.features.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-semibold text-[var(--color-text-primary)] mb-3">Key Features</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-[var(--color-text-primary)]">
                      <span className="text-brand-teal mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Compliance Note */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-[var(--color-text-primary)]">
                <strong className="text-blue-900">Note:</strong> All specifications are subject to manufacturer standards. 
                Contact our team for detailed technical documentation and compliance certificates.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'description' && (
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Product Description</h3>
            
            {product.description ? (
              <div className="text-[var(--color-text-primary)] leading-relaxed space-y-4">
                {product.description.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className="space-y-4 text-[var(--color-text-primary)]">
                <p>
                  <strong>{product.name}</strong> is a premium medical equipment designed for professional healthcare use. 
                  This product meets international quality standards and is certified for use in Bangladesh.
                </p>
                <p>
                  Manufactured by {typeof product.brand === 'object' ? product.brand?.name : product.brand || 'leading manufacturer'}, 
                  this device combines reliability, precision, and ease of use. Ideal for hospitals, clinics, diagnostic centers, 
                  and medical laboratories.
                </p>
                <p>
                  MediportBD is an authorized distributor offering genuine products with full manufacturer warranty and after-sales support. 
                  All products are DGDA registered and comply with local regulatory requirements.
                </p>
              </div>
            )}

            {/* Applications */}
            <div className="mt-6 p-4 bg-brand-teal-tint border border-brand-teal-tint rounded-lg">
              <h4 className="text-md font-semibold text-[var(--color-text-primary)] mb-2">Applications</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-[var(--color-text-primary)]">
                <li>Hospitals and Medical Centers</li>
                <li>Diagnostic Laboratories</li>
                <li>Clinics and Nursing Homes</li>
                <li>Research Institutions</li>
              </ul>
            </div>
          </div>
        )}

        {activeTab === 'shipping' && (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
                <FaTruck className="text-brand-teal" />
                Shipping Information
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-[var(--color-status-success-tint)] border border-[var(--color-status-success-tint)] rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-[var(--color-status-success-tint)] flex items-center justify-center flex-shrink-0">
                      <FaTruck className="text-[var(--color-status-success)]" size={18} />
                    </div>
                    <div>
                      <h4 className="font-semibold text-[var(--color-text-primary)] mb-1">Free Delivery</h4>
                      <p className="text-sm text-[var(--color-text-primary)]">
                        Free delivery within Dhaka for orders above ৳50,000. Nationwide shipping available with nominal charges.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-[var(--color-border-primary)] rounded-lg">
                    <h5 className="font-semibold text-[var(--color-text-primary)] mb-2">Dhaka Delivery</h5>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-2">2-3 business days</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">Free for orders &gt; ৳50,000</p>
                  </div>

                  <div className="p-4 border border-[var(--color-border-primary)] rounded-lg">
                    <h5 className="font-semibold text-[var(--color-text-primary)] mb-2">Outside Dhaka</h5>
                    <p className="text-sm text-[var(--color-text-secondary)] mb-2">3-5 business days</p>
                    <p className="text-sm text-[var(--color-text-secondary)]">Shipping charges apply</p>
                  </div>
                </div>

                <div className="p-4 bg-[var(--color-status-warning-tint)] border border-[var(--color-status-warning-tint)] rounded-lg">
                  <h5 className="font-semibold text-[var(--color-text-primary)] mb-2">Installation & Training</h5>
                  <p className="text-sm text-[var(--color-text-primary)]">
                    Free installation and staff training included for eligible equipment in Dhaka metro area. 
                    Contact our team for details.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4">Return & Refund Policy</h3>
              
              <div className="space-y-3 text-sm text-[var(--color-text-primary)]">
                <p>
                  <strong>7-Day Return:</strong> Return within 7 days if product is unused, in original packaging, 
                  with all accessories and documentation.
                </p>
                <p>
                  <strong>Warranty Claims:</strong> All products come with manufacturer warranty. Defects covered under warranty 
                  will be repaired or replaced free of charge.
                </p>
                <p>
                  <strong>Refund Process:</strong> Refunds are processed within 7-10 business days after receiving the returned product. 
                  Amount will be credited to original payment method.
                </p>
              </div>

              <div className="mt-4 p-4 bg-[var(--color-background-secondary)] border border-[var(--color-border-primary)] rounded-lg">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  <strong>Need Help?</strong> Contact our customer support at{' '}
                  <span className="text-brand-teal font-semibold">+880 1646-886795</span> or{' '}
                  <span className="text-brand-teal font-semibold">mahimrahman07@gmail.com</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
