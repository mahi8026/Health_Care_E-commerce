"use client";

import { useState } from 'react';
import { processB2BCreditPayment } from '@/utils/payment';
import { useAuth } from '@/context/AuthContext';
import Spinner from '@/components/ui/Spinner';

export default function B2BCreditForm({ amount, orderId, onSuccess, onError }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const creditLimit = user?.creditLimit || 0;
  const creditUsed = user?.creditUsed || 0;
  const availableCredit = creditLimit - creditUsed;
  const remainingAfterPayment = availableCredit - amount;
  const hasEnoughCredit = remainingAfterPayment >= 0;

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!hasEnoughCredit) {
      setError('Insufficient credit limit');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await processB2BCreditPayment(orderId);
      onSuccess && onSuccess(response);
    } catch (err) {
      setError(err.message || 'Failed to process B2B credit payment');
      onError && onError(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3 md:space-y-4">
      <div className="bg-brand-teal-tint border-[0.5px] border-brand-teal rounded-lg p-3 md:p-4">
        <h3 className="text-xs md:text-sm font-semibold mb-2 md:mb-3 text-brand-teal">
          💼 B2B Credit Line
        </h3>
        <div className="space-y-1.5 md:space-y-2 text-xs md:text-xs">
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Total Credit Limit:</span>
            <span className="font-semibold">৳{creditLimit.toLocaleString()}</span>
          </div>
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Credit Used:</span>
            <span className="font-semibold text-[var(--color-status-danger)]">৳{creditUsed.toLocaleString()}</span>
          </div>
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Available Credit:</span>
            <span className="font-semibold text-brand-teal">৳{availableCredit.toLocaleString()}</span>
          </div>
          <div className="h-[0.5px] bg-[var(--color-border-tertiary)] my-2"></div>
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Order Amount:</span>
            <span className="font-semibold">৳{amount.toLocaleString()}</span>
          </div>
          <div className="flex justify-between flex-wrap gap-1">
            <span className="text-[var(--color-text-secondary)]">Remaining After Payment:</span>
            <span className={`font-semibold ${remainingAfterPayment >= 0 ? 'text-brand-teal' : 'text-[var(--color-status-danger)]'}`}>
              ৳{remainingAfterPayment.toLocaleString()}
            </span>
          </div>
        </div>
      </div>

      {!hasEnoughCredit && (
        <div className="bg-[var(--color-status-danger-tint)] border-[0.5px] border-[var(--color-status-danger)] rounded-lg p-2.5 md:p-3 text-xs md:text-xs text-[var(--color-status-danger)]">
          <div className="flex items-start gap-2">
            <span className="flex-shrink-0">⚠️</span>
            <div>
              <strong>Insufficient Credit</strong><br />
              <span className="text-xs md:text-xs">
                You need ৳{amount.toLocaleString()} but only have ৳{availableCredit.toLocaleString()} available.
                Please contact your account manager to increase your credit limit.
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[var(--color-background-secondary)] rounded-lg p-2.5 md:p-3 text-xs md:text-xs text-[var(--color-text-secondary)]">
        <div className="flex items-start gap-2">
          <span className="flex-shrink-0">ℹ️</span>
          <div>
            <strong className="text-[var(--color-text-primary)]">B2B Credit Terms:</strong><br />
            • Payment due within 30 days<br />
            • No interest for on-time payment<br />
            • 2% late fee after due date<br />
            • Invoice will be sent to your registered email
          </div>
        </div>
      </div>

      {error && (
        <div className="p-2 md:p-3 bg-[var(--color-status-danger-tint)] text-[var(--color-status-danger)] rounded-lg text-xs md:text-xs">
          {error}
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !hasEnoughCredit}
        className="w-full bg-brand-teal text-white px-3 md:px-4 py-2.5 md:py-3 rounded-lg text-xs md:text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:bg-[var(--color-brand-teal-hover)] transition-colors"
      >
        {loading ? (
          <>
            <Spinner size="small" color="white" />
            Processing...
          </>
        ) : (
          <>
            <span className="hidden sm:inline">💼 Pay ৳{amount.toLocaleString()} with Credit</span>
            <span className="sm:hidden">💼 Pay with Credit</span>
          </>
        )}
      </button>

      <div className="text-center text-xs md:text-xs text-[var(--color-text-secondary)] flex flex-wrap justify-center gap-1">
        <span>Account Manager: <span className="font-semibold">{user?.accountManager?.name || 'Your Account Manager'}</span></span>
        <span>•</span>
        <a href="tel:+8801712345678" className="text-brand-teal hover:underline">
          +880 1712-345678
        </a>
      </div>
    </form>
  );
}
