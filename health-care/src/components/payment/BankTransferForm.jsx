"use client";

import { useState } from 'react';
import { submitBankTransfer } from '@/utils/payment';
import Spinner from '@/components/ui/Spinner';

export default function BankTransferForm({ amount, orderId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [transactionRef, setTransactionRef] = useState('');
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await submitBankTransfer(orderId, transactionRef);
      onSuccess && onSuccess(response);
    } catch (err) {
      setError(err.message || 'Failed to submit bank transfer details');
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-[#E6F1FB] border-[0.5px] border-[#185FA5] rounded-lg p-4">
        <h3 className="text-[13px] font-semibold mb-3 text-[#185FA5]">
          Bank Account Details
        </h3>
        <div className="space-y-2 text-[12px]">
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Bank Name:</span>
            <span className="font-semibold">Dutch-Bangla Bank Ltd</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Account Number:</span>
            <span className="font-mono font-semibold">1721 2030 5678</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Account Name:</span>
            <span className="font-semibold">MedCore Bangladesh Ltd</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Branch:</span>
            <span className="font-semibold">Gulshan, Dhaka</span>
          </div>
          <div className="flex justify-between">
            <span className="text-[var(--color-text-secondary)]">Routing Number:</span>
            <span className="font-mono font-semibold">090260123</span>
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-background-secondary)] rounded-lg p-3 text-[11px] text-[var(--color-text-secondary)]">
        <div className="flex items-start gap-2">
          <span>💡</span>
          <div>
            <strong className="text-[var(--color-text-primary)]">Important:</strong><br />
            • Use order ID <span className="font-mono font-semibold">{orderId}</span> as reference<br />
            • Payment verification takes 2-4 hours on business days<br />
            • Keep your transaction receipt for records
          </div>
        </div>
      </div>

      <div className="bg-[var(--color-background-primary)] border-[0.5px] border-[var(--color-border-tertiary)] rounded-lg p-4">
        <label className="block text-[12px] font-medium mb-2 text-[var(--color-text-secondary)]">
          Transaction Reference Number
        </label>
        <input
          type="text"
          value={transactionRef}
          onChange={(e) => setTransactionRef(e.target.value)}
          placeholder="Enter your bank transaction reference"
          required
          className="w-full px-3 py-2 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] focus:outline-none focus:border-[#185FA5]"
        />
        <p className="text-[10px] text-[var(--color-text-secondary)] mt-1">
          This is the reference number from your bank transfer receipt
        </p>
      </div>

      {error && (
        <div className="p-3 bg-[#FEE2E2] text-[#991B1B] rounded-lg text-[12px]">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !transactionRef}
        className="w-full bg-[#185FA5] text-white px-4 py-3 rounded-lg text-[13px] font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[#144A8A] transition-colors"
      >
        {loading ? (
          <>
            <Spinner size="small" color="white" />
            Submitting...
          </>
        ) : (
          <>
            🏦 Submit Bank Transfer Details
          </>
        )}
      </button>

      <div className="text-center text-[11px] text-[var(--color-text-secondary)]">
        Amount to transfer: <span className="font-semibold text-[var(--color-text-primary)]">৳{amount.toLocaleString()}</span>
      </div>
    </form>
  );
}
