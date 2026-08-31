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
    <div className="billing-shipping mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">
      {/* BILL TO */}
      <div className="rounded-lg bg-gray-50 p-5">
        <div className="mb-3 flex items-center gap-2 border-b-2 border-brand-teal pb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal text-white">
            <FaUser className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-teal">
            Bill To
          </h3>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex">
            <span className="w-20 font-medium text-gray-600">Name</span>
            <span className="font-semibold text-gray-900">
              : {billingInfo.name}
            </span>
          </div>
          
          <div className="flex">
            <span className="w-20 font-medium text-gray-600">Address</span>
            <div className="flex-1">
              <span className="font-medium text-gray-900">
                : {billingInfo.address?.street || 'N/A'}
              </span>
              {billingInfo.address?.thana && (
                <div className="ml-6 text-gray-700">
                  {billingInfo.address.thana}
                  {billingInfo.address.district && `, ${billingInfo.address.district}`}
                  {billingInfo.address.postcode && `-${billingInfo.address.postcode}`}
                </div>
              )}
              {billingInfo.address && (
                <div className="ml-6 text-gray-700">Bangladesh</div>
              )}
            </div>
          </div>
          
          {billingInfo.phone && (
            <div className="flex">
              <span className="w-20 font-medium text-gray-600">Phone</span>
              <span className="text-gray-900">: {billingInfo.phone}</span>
            </div>
          )}
          
          {billingInfo.email && (
            <div className="flex">
              <span className="w-20 font-medium text-gray-600">Email</span>
              <span className="text-gray-900">: {billingInfo.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* DELIVERY / SHIPPING TO */}
      <div className="rounded-lg bg-gray-50 p-5">
        <div className="mb-3 flex items-center gap-2 border-b-2 border-brand-teal pb-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-teal text-white">
            <FaMapMarkerAlt className="h-4 w-4" />
          </div>
          <h3 className="text-sm font-bold uppercase tracking-wider text-brand-teal">
            Delivery / Shipping To
          </h3>
        </div>
        
        <div className="space-y-2 text-sm">
          <div className="flex">
            <span className="w-20 font-medium text-gray-600">Name</span>
            <span className="font-semibold text-gray-900">
              : {shippingInfo.name}
            </span>
          </div>
          
          <div className="flex">
            <span className="w-20 font-medium text-gray-600">Address</span>
            <div className="flex-1">
              {shippingAddress.map((line, index) => (
                <div key={index} className={index === 0 ? 'font-medium text-gray-900' : 'ml-6 text-gray-700'}>
                  {index === 0 ? ': ' : ''}{line}
                </div>
              ))}
            </div>
          </div>
          
          {shippingInfo.phone && (
            <div className="flex">
              <span className="w-20 font-medium text-gray-600">Phone</span>
              <span className="text-gray-900">: {shippingInfo.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
