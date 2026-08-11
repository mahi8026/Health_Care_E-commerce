"use client";

import { showToast } from '@/components/ui/Toast';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

// Inline copy button for bank details
function CopyBtn({ text }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(text); }
    catch { /* fallback */ }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      type="button"
      onClick={copy}
      className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold transition-all min-h-[44px] min-w-[44px] flex-shrink-0 ${
        copied ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]' : 'bg-[var(--color-background-muted)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)]'
      }`}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function BankTransferConfirmation({ orderId }) {
  const BANK_ROWS = [
    { label: 'Bank', value: 'BRAC Bank PLC', mono: false },
    { label: 'Account Name', value: 'MAHI M RAHMAN', mono: false },
    { label: 'Account No.', value: '1081267690001', mono: true },
    { label: 'Routing No.', value: '060261339', mono: true },
  ];

  return (
    <div className="rounded-xl border border-[var(--color-status-warning-tint)] bg-[var(--color-status-warning-tint)] overflow-hidden mb-6 text-left">
      <div className="px-4 py-3 bg-[var(--color-status-warning-tint)] border-b border-[var(--color-status-warning-tint)] flex items-center gap-2">
        <span className="text-lg">ðŸ¦</span>
        <div>
          <p className="text-sm font-semibold text-[var(--color-status-warning)] m-0">Complete Your Bank Transfer</p>
          <p className="text-xs text-[#B45309] m-0">Transfer within 24 hours to confirm your order</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {BANK_ROWS.map(({ label, value, mono }) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-[var(--color-status-warning)] font-semibold uppercase tracking-wide m-0">{label}</p>
              <p className={`text-xs text-[#78350F] font-semibold m-0 ${mono ? 'font-mono' : ''}`}>{value}</p>
            </div>
            <CopyBtn text={value} />
          </div>
        ))}

        {/* Reference — most important */}
        <div className="mt-2 pt-2 border-t border-[var(--color-status-warning-tint)]">
          <div className="flex items-center justify-between gap-2 bg-[var(--color-status-warning-tint)] rounded-lg px-3 py-2">
            <div>
              <p className="text-xs text-[var(--color-status-warning)] font-semibold uppercase tracking-wide m-0">⚠ï¸ Transfer Reference (Required)</p>
              <p className="text-sm font-semibold text-[#78350F] font-mono m-0">{orderId}</p>
            </div>
            <CopyBtn text={orderId} />
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="text-xs text-[var(--color-status-warning)] m-0">
          Your order will be confirmed within <strong>1–2 business hours</strong> after payment is received.
          Email us at <strong>mahimrahman07@gmail.com</strong> with your transaction screenshot if needed.
        </p>
      </div>
    </div>
  );
}

export default function OrderConfirmation({ orderId, mongoId, estimatedDelivery, paymentMethod }) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      // Use mongoId for API call if available, otherwise fall back to orderId
      const idForDownload = mongoId || orderId;
      const blob = await api.downloadInvoice(idForDownload);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      process.env.NODE_ENV !== "production" && console.error('Failed to download invoice:', error);
      showToast.error('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-6 text-center max-w-[500px] mx-auto mt-6">
      {/* Success Icon */}
      <div className="w-14 h-14 bg-brand-teal-tint rounded-full flex items-center justify-center mx-auto mb-3">
        <svg className="w-8 h-8 text-brand-teal" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Title */}
      <h2 className="text-lg font-semibold mb-2 font-[family-name:var(--font-lora)]">
        Order placed successfully!
      </h2>
      
      <p className="text-sm text-[var(--color-text-secondary)] mb-5 font-[family-name:var(--font-plus-jakarta)]">
        Thank you for your order. We&apos;ve sent a confirmation email with your order details.
      </p>

      {/* Order Details */}
      <div className="bg-[var(--color-background-tertiary)] rounded-lg p-3.5 mb-5">
        <div className="grid grid-cols-2 gap-4 text-left">
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">
              Order number
            </div>
            <div className="text-sm font-semibold font-[family-name:var(--font-plus-jakarta)]">
              {orderId}
            </div>
          </div>
          <div>
            <div className="text-xs text-[var(--color-text-secondary)] mb-1">
              Estimated delivery
            </div>
            <div className="text-sm font-semibold font-[family-name:var(--font-plus-jakarta)]">
              {estimatedDelivery}
            </div>
          </div>
        </div>
      </div>

      {/* Bank Transfer Instructions — shown when payment method is bank_transfer */}
      {paymentMethod === 'bank_transfer' && (
        <BankTransferConfirmation orderId={orderId} />
      )}

      {/* Info Messages */}
      <div className="space-y-3 mb-5">
        <div className="flex items-start gap-3 text-left bg-[var(--color-status-info-tint)] rounded-lg p-3">
          <span className="text-base">ðŸ“¦</span>
          <div className="flex-1">
            <div className="text-xs font-medium text-[var(--color-status-info)] mb-1">
              Track your order
            </div>
            <div className="text-xs text-[var(--color-status-info)]">
              You&apos;ll receive tracking information via SMS and email once your order ships.
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 text-left bg-brand-teal-tint rounded-lg p-3">
          <span className="text-base">â„ï¸</span>
          <div className="flex-1">
            <div className="text-xs font-medium text-[var(--color-status-success)] mb-1">
              Cold chain delivery
            </div>
            <div className="text-xs text-[var(--color-status-success)]">
              Temperature-sensitive items will be delivered in insulated packaging.
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={handleDownloadInvoice}
          disabled={downloading}
          className="flex-1 px-4 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm font-medium font-[family-name:var(--font-plus-jakarta)] hover:bg-[var(--color-background-tertiary)] disabled:opacity-50"
        >
          {downloading ? 'Downloading...' : 'ðŸ“„ Download invoice'}
        </button>
        <button 
          onClick={() => router.push('/products')}
          className="flex-1 px-4 py-2.5 bg-brand-navy text-white rounded-lg text-sm font-semibold font-[family-name:var(--font-plus-jakarta)] hover:bg-[var(--color-brand-navy-hover)]">
          Continue shopping
        </button>
      </div>

      {/* Support */}
      <div className="mt-6 pt-6 border-t-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="text-xs text-[var(--color-text-secondary)] mb-2">
          Need help with your order?
        </div>
        <div className="flex items-center justify-center gap-4 text-xs">
          <a 
            href="tel:+8801646886795" 
            className="text-brand-teal font-medium hover:underline"
          >
            ðŸ“ž Call support
          </a>
          <span className="text-[var(--color-border-secondary)]">|</span>
          <a 
            href="https://wa.me/8801646886795?text=Hi%2C%20I%20need%20help%20with%20my%20order%20%23{orderId}" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-teal font-medium hover:underline"
          >
            ðŸ’¬ Live chat
          </a>
        </div>
      </div>
    </div>
  );
}
