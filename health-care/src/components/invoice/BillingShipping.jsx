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
    <div className="billing-shipping mt-2 grid grid-cols-1 gap-2 md:grid-cols-2 print:mt-1 print:gap-1.5">
      {/* BILL TO */}
      <div className="rounded-lg bg-gray-50 p-2 print:p-1.5">
        <div className="mb-1 flex items-center gap-2 border-b-2 border-brand-teal pb-0.5 print:mb-0.5 print:pb-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-teal text-white print:h-4 print:w-4">
            <FaUser className="h-2.5 w-2.5 print:h-2 print:w-2" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-teal print:text-[8pt]">
            Bill To
          </h3>
        </div>
        
        <div className="space-y-0.5 text-xs print:space-y-0 print:text-[7pt] print:leading-tight">
          <div className="flex">
            <span className="w-14 font-medium text-gray-600 print:w-12">Name</span>
            <span className="font-semibold text-gray-900">
              : {billingInfo.name}
            </span>
          </div>
          
          <div className="flex">
            <span className="w-14 font-medium text-gray-600 print:w-12">Address</span>
            <div className="flex-1">
              <span className="font-medium text-gray-900">
                : {billingInfo.address?.street || 'N/A'}
              </span>
              {billingInfo.address?.thana && (
                <div className="ml-3 text-gray-700 print:ml-2">
                  {billingInfo.address.thana}
                  {billingInfo.address.district && `, ${billingInfo.address.district}`}
                  {billingInfo.address.postcode && `-${billingInfo.address.postcode}`}
                </div>
              )}
              {billingInfo.address && (
                <div className="ml-3 text-gray-700 print:ml-2">Bangladesh</div>
              )}
            </div>
          </div>
          
          {billingInfo.phone && (
            <div className="flex">
              <span className="w-14 font-medium text-gray-600 print:w-12">Phone</span>
              <span className="text-gray-900">: {billingInfo.phone}</span>
            </div>
          )}
          
          {billingInfo.email && (
            <div className="flex">
              <span className="w-14 font-medium text-gray-600 print:w-12">Email</span>
              <span className="text-gray-900">: {billingInfo.email}</span>
            </div>
          )}
        </div>
      </div>

      {/* DELIVERY / SHIPPING TO */}
      <div className="rounded-lg bg-gray-50 p-2 print:p-1.5">
        <div className="mb-1 flex items-center gap-2 border-b-2 border-brand-teal pb-0.5 print:mb-0.5 print:pb-0">
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-brand-teal text-white print:h-4 print:w-4">
            <FaMapMarkerAlt className="h-2.5 w-2.5 print:h-2 print:w-2" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-teal print:text-[8pt]">
            Delivery / Shipping To
          </h3>
        </div>
        
        <div className="space-y-0.5 text-xs print:space-y-0 print:text-[7pt] print:leading-tight">
          <div className="flex">
            <span className="w-14 font-medium text-gray-600 print:w-12">Name</span>
            <span className="font-semibold text-gray-900">
              : {shippingInfo.name}
            </span>
          </div>
          
          <div className="flex">
            <span className="w-14 font-medium text-gray-600 print:w-12">Address</span>
            <div className="flex-1">
              {shippingAddress.map((line, index) => (
                <div key={index} className={index === 0 ? 'font-medium text-gray-900' : 'ml-3 text-gray-700 print:ml-2'}>
                  {index === 0 ? ': ' : ''}{line}
                </div>
              ))}
            </div>
          </div>
          
          {shippingInfo.phone && (
            <div className="flex">
              <span className="w-14 font-medium text-gray-600 print:w-12">Phone</span>
              <span className="text-gray-900">: {shippingInfo.phone}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
