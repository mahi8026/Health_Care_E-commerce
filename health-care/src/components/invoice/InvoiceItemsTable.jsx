'use client';

import {
  formatBdt,
  calculateItemTotal,
  resolveItemName,
  resolveItemBrand,
  resolveItemModel,
} from '@/utils/invoiceHelpers';

/**
 * InvoiceItemsTable Component
 * Displays product items table
 */
export default function InvoiceItemsTable({ items = [] }) {
  if (!items || items.length === 0) {
    return (
      <div className="mt-4 rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
        No items in this invoice
      </div>
    );
  }

  return (
    <div className="invoice-items-table mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-brand-navy text-white">
            <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider">
              SL.
            </th>
            <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider">
              Product / Description
            </th>
            <th className="px-2 py-2 text-left text-[10px] font-bold uppercase tracking-wider">
              Brand / Model
            </th>
            <th className="px-2 py-2 text-center text-[10px] font-bold uppercase tracking-wider">
              Qty
            </th>
            <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider">
              Unit Price (BDT)
            </th>
            <th className="px-2 py-2 text-right text-[10px] font-bold uppercase tracking-wider">
              Total (BDT)
            </th>
          </tr>
        </thead>
        <tbody>
          {items.map((item, index) => {
            const itemName = resolveItemName(item);
            const brand = resolveItemBrand(item);
            const model = resolveItemModel(item);
            const quantity = Number(item.qty || item.quantity || 1);
            const unitPrice = Number(item.price || 0);
            const total = calculateItemTotal(item);
            
            // Brand/Model display
            let brandModel = brand || '';
            if (model) {
              brandModel = brandModel ? `${brandModel} / ${model}` : model;
            }

            return (
              <tr
                key={index}
                className={`border-b border-gray-200 ${
                  index % 2 === 0 ? 'bg-white' : 'bg-blue-50'
                }`}
              >
                <td className="px-2 py-2 text-xs font-medium text-gray-900">
                  {index + 1}
                </td>
                <td className="px-2 py-2">
                  <div className="text-xs font-semibold text-gray-900">
                    {itemName}
                  </div>
                  {item.description && (
                    <div className="mt-0.5 text-[10px] text-gray-600">
                      {item.description}
                    </div>
                  )}
                </td>
                <td className="px-2 py-2 text-xs text-gray-700">
                  {brandModel || '—'}
                </td>
                <td className="px-2 py-2 text-center text-xs font-medium text-gray-900">
                  {quantity}
                </td>
                <td className="px-2 py-2 text-right text-xs text-gray-900">
                  {formatBdt(unitPrice)}
                </td>
                <td className="px-2 py-2 text-right text-xs font-bold text-gray-900">
                  {formatBdt(total)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
