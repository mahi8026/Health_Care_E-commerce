"use client";

import { useState } from 'react';
import { submitBankTransfer } from '@/utils/payment';
import Spinner from '@/components/ui/Spinner';

const BANK_DETAILS = {
  bankName: 'Dutch-Bangla Bank Ltd',
  accountName: 'Mediport Bangladesh Ltd',
  accountNo: '1721-2030-5678',
  branch: 'Gulshan Branch, Dhaka',
  routing: '090260123',
};

export default function BankTransferForm({ amount, orderId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [error, setError] = useState(null);
  const [submitted, setSubmitted] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await submitBankTransfer(orderId, transactionRef);
      setSubmitted(true);
      onSuccess && onSuccess(response);
    } catch (err) {
      setError(err.message || 'Failed to submit bank transfer details');
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="space-y-4">
        <div className="bg-[#E1F5EE] border border-[#9FE1CB] rounded-xl p-5">
          <div className="text-[14px] font-bold text-[#065F46] mb-3 flex items-center gap-2">
            <span className="text-[20px]">✓</span>
            Reference number submitted!
          </div>
          <div className="text-[12px] text-[#374151] mb-4 leading-relaxed">
            Please transfer <strong>৳{amount?.toLocaleString()}</strong> to:
          </div>
          
          {/* Bank details table */}
          <div className="bg-white rounded-lg overflow-hidden mb-4">
            {Object.entries(BANK_DETAILS).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center px-4 py-3 border-b border-[#F3F4F6] last:border-b-0 text-[12px]">
                <span className="text-[#6B7280] capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="font-semibold text-[#111827]">{val}</span>
              </div>
            ))}
            
            {/* Order reference with copy button */}
            <div className="flex justify-between items-center px-4 py-3 bg-[#F9FAFB]">
              <span className="text-[#0E8A6E] font-semibold text-[13px]">Transfer Reference</span>
              <div className="flex items-center gap-2">
                <span className="font-bold text-[#0B2545] font-mono text-[13px]">
                  {orderId}
                </span>
                <button
                  onClick={() => handleCopy(orderId)}
                  className="text-[10px] px-3 py-1.5 rounded-md border border-[#0E8A6E] bg-transparent text-[#0E8A6E] hover:bg-[#E1F5EE] transition-colors font-medium"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-[11px] text-[#6B7280] flex items-start gap-2">
            <span className="flex-shrink-0">⏱</span>
            <span>Your order will be confirmed within 2–4 business hours after transfer verification.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      <div className="bg-[#E6F1FB] border-[0.5px] border-[#185FA5] rounded-lg p-3 md:p-4">
        <h3 className="text-[12px] md:text-[13px] font-semibold mb-2 md:mb-3 text-[#185FA5]">
          Bank Account Details
        </h3>
        <div className="space-y-1.5 md:space-y-2 text-[11px] md:text-[12px]">
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Bank Name:</span>
            <span className="font-semibold">Dutch-Bangla Bank Ltd</span>
          </div>
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Account Number:</span>
            <span className="font-mono font-semibold text-[10px] md:text-[12px]">1721 2030 5678</span>
          </div>
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Account Name:</span>
            <span className="font-semibold">Mediport Bangladesh Ltd</span>
          </div>
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Branch:</span>
            <span className="font-semibold">Gulshan, Dhaka</span>
          </div>
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Routing Number:</span>
            <span className="font-mono font-semibold text-[10px] md:text-[12px]">090260123</span>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-background-secondary)] rounded-lg p-2.5 md:p-3 text-[10px] md:text-[11px] text-[var(--color-text-secondary)]">
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0">💡</span>
          <div>
            <strong className="text-[var(--color-text-primary)]">Important:</strong><br />
            • Use order ID <span className="font-mono font-semibold text-[10px]">{orderId}</span> as reference<br />
            • Payment verification takes 2-4 hours on business days<br />
            • Keep your transaction receipt for records
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg p-3 md:p-4">
        <label className="block text-[11px] md:text-[12px] font-medium mb-2 text-[var(--color-text-secondary)]">
          Transaction Reference Number
        </label>
        <input
          type="text"
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
          placeholder="Enter your bank transaction reference"
          required
          className="w-full px-2.5 md:px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[12px] md:text-[13px] focus:outline-none focus:border-[#185FA5]"
        />
        <p className="text-[9px] md:text-[10px] text-[var(--color-text-secondary)] mt-1">
          This is the reference number from your bank transfer receipt
        </p>
      </div>

      {error && (
        <div className="p-2 md:p-3 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-[11px] md:text-[12px]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !transactionRef}
        className="w-full bg-[#185FA5] text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-[12px] md:text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#144A8A] transition-colors"
      >
        {loading ? (
          <>
            <Spinner size="small" color="white" />
            <span className="hidden sm:inline">Submitting...</span>
            <span className="sm:hidden">Submitting...</span>
          </>
        ) : (
          <>
            <span className="hidden sm:inline">🏦 Submit Bank Transfer Details</span>
            <span className="sm:hidden">🏦 Submit Details</span>
          </>
        )}
      </button>

      <div className="text-center text-[10px] md:text-[11px] text-[var(--color-text-secondary)]">
        Amount to transfer: <span className="font-semibold text-[var(--color-text-primary)]">৳{amount.toLocaleString()}</span>
      </div>
    </form>
  );
}
