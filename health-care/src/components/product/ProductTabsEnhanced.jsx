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
      <div className="flex gap-2 border-b border-gray-200 mb-6 overflow-x-auto">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'text-[#0E8A6E] border-b-2 border-[#0E8A6E]'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50 rounded-t-lg'
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
            <h3 className="text-lg font-bold text-gray-900 mb-4">Technical Specifications</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(specifications).map(([key, value], index) => (
                <div
                  key={key}
                  className={`p-4 rounded-lg transition-colors ${
                    index % 2 === 0 ? 'bg-gray-50' : 'bg-white border border-gray-200'
                  }`}
                >
                  <div className="text-sm font-semibold text-gray-500 mb-1">{key}</div>
                  <div className="text-base font-medium text-gray-900">{value}</div>
                </div>
              ))}
            </div>

            {/* Features List */}
            {product.features && product.features.length > 0 && (
              <div className="mt-6">
                <h4 className="text-md font-bold text-gray-900 mb-3">Key Features</h4>
                <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {product.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-gray-700">
                      <span className="text-[#0E8A6E] mt-1">✓</span>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Compliance Note */}
            <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-gray-700">
                <strong className="text-blue-900">Note:</strong> All specifications are subject to manufacturer standards. 
                Contact our team for detailed technical documentation and compliance certificates.
              </p>
            </div>
          </div>
        )}

        {activeTab === 'description' && (
          <div className="prose prose-sm max-w-none">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Product Description</h3>
            
            {product.description ? (
              <div className="text-gray-700 leading-relaxed space-y-4">
                {product.description.split('\n').map((paragraph, idx) => (
                  <p key={idx}>{paragraph}</p>
                ))}
              </div>
            ) : (
              <div className="space-y-4 text-gray-700">
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
                  MedCore BD is an authorized distributor offering genuine products with full manufacturer warranty and after-sales support. 
                  All products are DGDA registered and comply with local regulatory requirements.
                </p>
              </div>
            )}

            {/* Applications */}
            <div className="mt-6 p-4 bg-teal-50 border border-teal-200 rounded-lg">
              <h4 className="text-md font-bold text-gray-900 mb-2">Applications</h4>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-700">
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
              <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                <FaTruck className="text-[#0E8A6E]" />
                Shipping Information
              </h3>
              
              <div className="space-y-4">
                <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                      <FaTruck className="text-green-600" size={18} />
                    </div>
                    <div>
                      <h4 className="font-bold text-gray-900 mb-1">Free Delivery</h4>
                      <p className="text-sm text-gray-700">
                        Free delivery within Dhaka for orders above ৳50,000. Nationwide shipping available with nominal charges.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">Dhaka Delivery</h5>
                    <p className="text-sm text-gray-600 mb-2">2-3 business days</p>
                    <p className="text-sm text-gray-500">Free for orders &gt; ৳50,000</p>
                  </div>

                  <div className="p-4 border border-gray-200 rounded-lg">
                    <h5 className="font-semibold text-gray-900 mb-2">Outside Dhaka</h5>
                    <p className="text-sm text-gray-600 mb-2">3-5 business days</p>
                    <p className="text-sm text-gray-500">Shipping charges apply</p>
                  </div>
                </div>

                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <h5 className="font-bold text-gray-900 mb-2">Installation & Training</h5>
                  <p className="text-sm text-gray-700">
                    Free installation and staff training included for eligible equipment in Dhaka metro area. 
                    Contact our team for details.
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-4">Return & Refund Policy</h3>
              
              <div className="space-y-3 text-sm text-gray-700">
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

              <div className="mt-4 p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <p className="text-sm text-gray-600">
                  <strong>Need Help?</strong> Contact our customer support at{' '}
                  <span className="text-[#0E8A6E] font-semibold">+880 1646-886795</span> or{' '}
                  <span className="text-[#0E8A6E] font-semibold">mahimrahman07@gmail.com</span>
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
