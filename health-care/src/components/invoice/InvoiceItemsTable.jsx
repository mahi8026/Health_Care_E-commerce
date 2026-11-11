'use client';

import {
  formatBdt,
  calculateItemTotal,
  formatWarrantyLabel,
  resolveItemName,
  resolveItemBrand,
  resolveItemModel,
  resolveItemWarranty,
} from '@/utils/invoiceHelpers';

/**
 * InvoiceItemsTable Component
 * Displays product items table
 */
export default function InvoiceItemsTable({ items = [], warrantyMonths }) {
  if (!items || items.length === 0) {
    return (
      <div className="mt-4 rounded-lg bg-gray-50 p-4 text-center text-sm text-gray-500">
        No items in this invoice
      </div>
    );
  }

  // The Warranty column exists only when the admin selected a period.
  const showWarrantyColumn = Number(warrantyMonths) > 0;

  return (
    <div className="invoice-items-table mt-4 overflow-x-auto">
      <table className="w-full border-collapse text-xs">
        <thead>
          <tr className="bg-brand-navy text-white">
            <th className="px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wider">
              SL.
            </th>
            <th className="px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wider">
              Product / Description
            </th>
            <th className="px-2 py-2 text-left text-[11px] font-bold uppercase tracking-wider">
              Brand / Model
            </th>
            <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider">
              Qty
            </th>
            {showWarrantyColumn && (
              <th className="px-2 py-2 text-center text-[11px] font-bold uppercase tracking-wider">
                Warranty
              </th>
            )}
            <th className="px-2 py-2 text-right text-[11px] font-bold uppercase tracking-wider">
              Unit Price (BDT)
            </th>
            <th className="px-2 py-2 text-right text-[11px] font-bold uppercase tracking-wider">
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

            // Warranty cell: the line's own admin-entered warranty, otherwise the
            // admin-selected invoice period. The column is hidden when unset.
            const itemWarranty = resolveItemWarranty(item);
            
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
                    <div className="mt-0.5 text-[11px] text-gray-600">
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
                {showWarrantyColumn && (
                  <td className="px-2 py-2 text-center text-xs font-semibold text-brand-teal">
                    {itemWarranty?.label || formatWarrantyLabel(warrantyMonths)}
                  </td>
                )}
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
