'use client';

import BankTransferForm from './BankTransferForm';
import CODInfo from '@/components/payment/CODInfo';

const METHODS = [
  { id: 'cod', label: 'Cash on Delivery', color: '#059669', bg: '#ECFDF5', icon: '💵' },
  { id: 'bkash', label: 'bKash', color: '#E2136E', bg: '#FDF2F8', icon: '📱' },
  { id: 'nagad', label: 'Nagad', color: '#0E8A6E', bg: '#ECFDF5', icon: '📱' },
  { id: 'bank_transfer', label: 'Bank', color: '#185FA5', bg: '#EFF6FF', icon: '🏦' },
  { id: 'npsb', label: 'NPSB', color: '#B45309', bg: '#FFFBEB', icon: '🏛️' },
  { id: 'b2b_credit', label: 'B2B Credit', color: '#0E8A6E', bg: '#ECFDF5', icon: '💼' },
  { id: 'cheque', label: 'Cheque', color: '#6D28D9', bg: '#F5F3FF', icon: '📝' },
];

export default function PaymentMethods({ selected, onSelect, orderNumber, orderTotal }) {
  return (
    <section className="bg-white rounded-2xl border border-[#E5E7EB] p-4 sm:p-5">
      <div className="mb-4 pb-3 border-b border-[#F3F4F6]">
        <h2 className="text-[15px] font-bold text-[#0B2545] m-0">Payment method</h2>
        <p className="text-[12px] text-[#6B7280] m-0 mt-0.5">How would you like to pay?</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-4">
        {METHODS.map((method) => {
          const isSelected = selected === method.id;
          return (
            <button
              key={method.id}
              type="button"
              onClick={() => onSelect(method.id)}
              className={`rounded-xl p-3 border-2 text-center transition-all min-h-[72px] ${
                isSelected
                  ? 'border-[#0B2545] bg-[#F8FAFC] ring-1 ring-[#0B2545]/10'
                  : 'border-[#E5E7EB] bg-white hover:border-[#D1D5DB]'
              }`}
            >
              <span
                className="inline-flex w-9 h-9 rounded-lg items-center justify-center text-lg mb-1.5"
                style={{ background: method.bg, color: method.color }}
              >
                {method.icon}
              </span>
              <span className={`block text-[11px] font-semibold ${isSelected ? 'text-[#0B2545]' : 'text-[#6B7280]'}`}>
                {method.label}
              </span>
            </button>
          );
        })}
      </div>

      {selected === 'cod' && (
        <CODInfo orderTotal={orderTotal} />
      )}

      {selected === 'bank_transfer' && (
        <BankTransferForm orderNumber={orderNumber} />
      )}
    </section>
  );
}
