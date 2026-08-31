'use client';

import { FaUserCheck, FaUserTie } from 'react-icons/fa';

/**
 * SignatureSection Component
 * Displays signature areas for customer and authorized signatory
 */
export default function SignatureSection() {
  return (
    <div className="signature-section mt-4 grid grid-cols-1 gap-3 md:grid-cols-2">
      {/* Customer Signature */}
      <div className="rounded-lg border-2 border-gray-200 p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-white">
            <FaUserCheck className="h-3 w-3" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
            Customer Signature
          </h3>
        </div>

        <div className="mb-3 h-12 border-b-2 border-dashed border-gray-300"></div>

        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Signature</span>
          <div className="flex items-center gap-2">
            <span>Date:</span>
            <span className="border-b border-gray-300 px-3 text-[10px]">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        </div>
      </div>

      {/* Authorized Signature */}
      <div className="rounded-lg border-2 border-gray-200 p-3">
        <div className="mb-2 flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-brand-teal text-white">
            <FaUserTie className="h-3 w-3" />
          </div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-brand-navy">
            Authorized Signature
          </h3>
        </div>

        <div className="mb-3 h-12 border-b-2 border-dashed border-gray-300"></div>

        <div className="flex items-center justify-between text-xs text-gray-600">
          <span>Signature</span>
          <div className="flex items-center gap-2">
            <span>Date:</span>
            <span className="border-b border-gray-300 px-3 text-[10px]">
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
