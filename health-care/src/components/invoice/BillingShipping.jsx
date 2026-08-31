'use client';

import { FaUser, FaMapMarkerAlt } from 'react-icons/fa';
import { formatAddress } from '@/utils/invoiceHelpers';

/**
 * BillingShipping Component
 * Displays billing and shipping information
 */
export default function BillingShipping({ billingInfo, shippingInfo }) {
  const shippingAddress = formatAddress(shippingInfo.address);

  return (
    <div className="billing-shipping mt-3 grid grid-cols-1 gap-3 md:grid-cols-2">
      {/* BILL TO */}
      <div className="rounded-lg bg-gray-50 p-3">
        <div className="mb-2 flex items-center gap-2 border-b-2 border-brand-teal pb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-white">
            <FaUser className="h-3 w-3" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-teal">
            Bill To
          </h3>
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex">
            <span className="w-16 font-medium text-gray-600">Name</span>
            <span className="font-semibold text-gray-900">
              : {billingInfo.name}
            </span>
          </div>
          
          <div className="flex">
            <span className="w-16 font-medium text-gray-600">Address</span>
            <div className="flex-1">
              <span className="font-medium text-gray-900">
                : {billingInfo.address?.street || 'N/A'}
              </span>
              {billingInfo.address?.thana && (
                <div className="ml-4 text-gray-700">
                  {billingInfo.address.thana}
                  {billingInfo.address.district && `, ${billingInfo.address.district}`}
                  {billingInfo.address.postcode && `-${billingInfo.address.postcode}`}
                </div>
              )}
              {billingInfo.address && (
                <div className="ml-4 text-gray-700">Bangladesh</div>
              )}
            </div>
          </div>
          
          {billingInfo.phone && (
            <div className="flex">
              <span className="w-16 font-medium text-gray-600">Phone</span>
              <span className="text-gray-900">: {billingInfo.phone}</span>
            </div>
          )}
          
          {billingInfo.email && (
            <div className="flex">
              <span className="w-16 font-medium text-gray-600">Email</span>
              <span className="text-gray-900">: {billingInfo.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* DELIVERY / SHIPPING TO */}
      <div className="rounded-lg bg-gray-50 p-3">
        <div className="mb-2 flex items-center gap-2 border-b-2 border-brand-teal pb-1">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-white">
            <FaMapMarkerAlt className="h-3 w-3" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-teal">
            Delivery / Shipping To
          </h3>
        </div>
        
        <div className="space-y-1 text-xs">
          <div className="flex">
            <span className="w-16 font-medium text-gray-600">Name</span>
            <span className="font-semibold text-gray-900">
              : {shippingInfo.name}
            </span>
          </div>
          
          <div className="flex">
            <span className="w-16 font-medium text-gray-600">Address</span>
            <div className="flex-1">
              {shippingAddress.map((line, index) => (
                <div key={index} className={index === 0 ? 'font-medium text-gray-900' : 'ml-4 text-gray-700'}>
                  {index === 0 ? ': ' : ''}{line}
                </div>
              ))}
            </div>
          </div>
          
          {shippingInfo.phone && (
            <div className="flex">
              <span className="w-16 font-medium text-gray-600">Phone</span>
              <span className="text-gray-900">: {shippingInfo.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
