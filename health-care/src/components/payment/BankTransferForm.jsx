"use client";

import { useState } from 'react';
import { submitBankTransfer } from '@/utils/payment';
import Spinner from '@/components/ui/Spinner';

const BANK_DETAILS = {
  bankName: 'BRAC Bank PLC',
  accountName: 'MAHI M RAHMAN',
  accountNo: '1081267690001',
  branch: 'Elephant Road Branch',
  routing: '060261339',
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
        <div className="bg-brand-teal-tint border border-brand-teal-tint rounded-xl p-5">
          <div className="text-sm font-semibold text-[var(--color-status-success)] mb-3 flex items-center gap-2">
            <span className="text-xl">✓</span>
            Reference number submitted!
          </div>
          <div className="text-xs text-[var(--color-text-primary)] mb-4 leading-relaxed">
            Please transfer <strong>৳{amount?.toLocaleString()}</strong> to:
          </div>
          
          {/* Bank details table */}
          <div className="bg-white rounded-lg overflow-hidden mb-4">
            {Object.entries(BANK_DETAILS).map(([key, val]) => (
              <div key={key} className="flex justify-between items-center px-4 py-3 border-b border-[var(--color-border-tertiary)] last:border-b-0 text-xs">
                <span className="text-[var(--color-text-secondary)] capitalize">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </span>
                <span className="font-semibold text-[var(--color-text-primary)]">{val}</span>
              </div>
            ))}
            
            {/* Order reference with copy button */}
            <div className="flex justify-between items-center px-4 py-3 bg-[var(--color-background-secondary)]">
              <span className="text-brand-teal font-semibold text-sm">Transfer Reference</span>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-brand-navy font-mono text-sm">
                  {orderId}
                </span>
                <button
                  onClick={() => handleCopy(orderId)}
                  className="text-xs px-3 py-1.5 rounded-md border border-brand-teal bg-transparent text-brand-teal hover:bg-brand-teal-tint transition-colors font-medium"
                >
                  {copied ? '✓ Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
          
          <div className="text-xs text-[var(--color-text-secondary)] flex items-start gap-2">
            <span className="flex-shrink-0">⏱</span>
            <span>Your order will be confirmed within 2–4 business hours after transfer verification.</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      <div className="bg-[var(--color-status-info-tint)] border-[0.5px] border-[#185FA5] rounded-lg p-3 md:p-4">
        <h3 className="text-xs md:text-sm font-semibold mb-2 md:mb-3 text-[#185FA5]">
          Bank Account Details
        </h3>
        <div className="space-y-1.5 md:space-y-2 text-xs md:text-xs">
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Bank Name:</span>
            <span className="font-semibold">BRAC Bank PLC</span>
          </div>
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Account Number:</span>
            <span className="font-mono font-semibold text-xs md:text-xs">1081267690001</span>
          </div>
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Account Name:</span>
            <span className="font-semibold">MAHI M RAHMAN</span>
          </div>
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Branch:</span>
            <span className="font-semibold">Elephant Road Branch</span>
          </div>
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Routing Number:</span>
            <span className="font-mono font-semibold text-xs md:text-xs">060261339</span>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-background-secondary)] rounded-lg p-2.5 md:p-3 text-xs md:text-xs text-[var(--color-text-secondary)]">
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0">💡</span>
          <div>
            <strong className="text-[var(--color-text-primary)]">Important:</strong><br />
            • Use order ID <span className="font-mono font-semibold text-xs">{orderId}</span> as reference<br />
            • Payment verification takes 2-4 hours on business days<br />
            • Keep your transaction receipt for records
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg p-3 md:p-4">
        <label className="block text-sm md:text-sm font-medium mb-2 text-[var(--color-text-secondary)]">
          Transaction Reference Number
        </label>
        <input
          type="text"
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
          placeholder="Enter your bank transaction reference"
          required
          className="w-full px-2.5 md:px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-xs md:text-sm focus:outline-none focus:border-[#185FA5]"
        />
        <p className="text-xs md:text-xs text-[var(--color-text-secondary)] mt-1">
          This is the reference number from your bank transfer receipt
        </p>
      </div>

      {error && (
        <div className="p-2 md:p-3 bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] rounded-lg text-xs md:text-xs">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !transactionRef}
        className="w-full bg-[#185FA5] text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#144A8A] transition-colors"
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

      <div className="text-center text-xs md:text-xs text-[var(--color-text-secondary)]">
        Amount to transfer: <span className="font-semibold text-[var(--color-text-primary)]">৳{amount.toLocaleString()}</span>
      </div>
    </form>
  );
}
