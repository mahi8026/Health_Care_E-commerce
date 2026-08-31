'use client';

import { formatBdt, numberToWords } from '@/utils/invoiceHelpers';

/**
 * InvoiceTotals Component
 * Displays invoice totals section
 */
export default function InvoiceTotals({ totals }) {
  const { subtotal, b2bDiscount, b2bDiscountPct, couponDiscount, vat, vatRate, shipping, grandTotal } = totals;

  return (
    <div className="invoice-totals mt-3">
      {/* Totals Table */}
      <div className="ml-auto w-full max-w-md space-y-1">
        {/* Subtotal */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-1 text-xs">
          <span className="font-medium text-gray-600">Subtotal</span>
          <span className="font-semibold text-gray-900">
            BDT {formatBdt(subtotal)}
          </span>
        </div>

        {/* B2B Discount */}
        {b2bDiscount > 0 && (
          <div className="flex items-center justify-between border-b border-gray-200 pb-1 text-xs">
            <span className="font-medium text-gray-600">
              B2B Discount {b2bDiscountPct > 0 ? `(${b2bDiscountPct}%)` : ''}
            </span>
            <span className="font-semibold text-brand-teal">
              − BDT {formatBdt(b2bDiscount)}
            </span>
          </div>
        )}

        {/* Coupon Discount */}
        {couponDiscount > 0 && (
          <div className="flex items-center justify-between border-b border-gray-200 pb-1 text-xs">
            <span className="font-medium text-gray-600">Coupon Discount</span>
            <span className="font-semibold text-brand-teal">
              − BDT {formatBdt(couponDiscount)}
            </span>
          </div>
        )}

        {/* VAT / Tax */}
        {vat > 0 && (
          <div className="flex items-center justify-between border-b border-gray-200 pb-1 text-xs">
            <span className="font-medium text-gray-600">
              VAT / Tax{vatRate > 0 ? ` (${vatRate}%)` : ''}
            </span>
            <span className="font-semibold text-gray-900">
              BDT {formatBdt(vat)}
            </span>
          </div>
        )}

        {/* Shipping / Delivery */}
        <div className="flex items-center justify-between border-b border-gray-200 pb-1 text-xs">
          <span className="font-medium text-gray-600">Shipping / Delivery</span>
          <span className="font-semibold text-gray-900">
            {shipping > 0 ? `BDT ${formatBdt(shipping)}` : 'Free'}
          </span>
        </div>

        {/* Grand Total */}
        <div className="mt-2 flex items-center justify-between rounded-lg bg-brand-navy px-4 py-2">
          <span className="text-sm font-bold text-white">GRAND TOTAL</span>
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-brand-teal">
              BDT {formatBdt(grandTotal)}
            </span>
            <div className="h-8 w-1 rounded bg-brand-orange"></div>
          </div>
        </div>
      </div>

      {/* Amount in Words */}
      <div className="mt-2 rounded-lg bg-gray-50 p-2">
        <p className="text-xs">
          <span className="font-semibold text-gray-700">Amount in words:</span>
          {' '}
          <span className="italic text-gray-900">
            {numberToWords(grandTotal)}
          </span>
        </p>
      </div>
    </div>
  );
}
