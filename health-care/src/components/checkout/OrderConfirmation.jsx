"use client";

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
      className={`ml-2 px-2 py-0.5 rounded text-[10px] font-semibold transition-all min-h-[28px] min-w-[44px] flex-shrink-0 ${
        copied ? 'bg-[#D1FAE5] text-[#065F46]' : 'bg-[#E5E7EB] text-[#6B7280] hover:bg-[#D1D5DB]'
      }`}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

function BankTransferConfirmation({ orderId }) {
  const BANK_ROWS = [
    { label: 'Bank', value: 'Dutch-Bangla Bank Ltd', mono: false },
    { label: 'Account Name', value: 'MedCore Bangladesh Ltd', mono: false },
    { label: 'Account No.', value: '1721 2030 5678', mono: true },
    { label: 'Routing No.', value: '090261450', mono: true },
  ];

  return (
    <div className="rounded-xl border border-[#FCD34D] bg-[#FFFBEB] overflow-hidden mb-6 text-left">
      <div className="px-4 py-3 bg-[#FEF3C7] border-b border-[#FCD34D] flex items-center gap-2">
        <span className="text-lg">🏦</span>
        <div>
          <p className="text-[13px] font-bold text-[#92400E] m-0">Complete Your Bank Transfer</p>
          <p className="text-[11px] text-[#B45309] m-0">Transfer within 24 hours to confirm your order</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {BANK_ROWS.map(({ label, value, mono }) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-[10px] text-[#92400E] font-semibold uppercase tracking-wide m-0">{label}</p>
              <p className={`text-[12px] text-[#78350F] font-semibold m-0 ${mono ? 'font-mono' : ''}`}>{value}</p>
            </div>
            <CopyBtn text={value} />
          </div>
        ))}

        {/* Reference — most important */}
        <div className="mt-2 pt-2 border-t border-[#FCD34D]">
          <div className="flex items-center justify-between gap-2 bg-[#FEF3C7] rounded-lg px-3 py-2">
            <div>
              <p className="text-[10px] text-[#92400E] font-bold uppercase tracking-wide m-0">⚠️ Transfer Reference (Required)</p>
              <p className="text-[14px] font-bold text-[#78350F] font-mono m-0">{orderId}</p>
            </div>
            <CopyBtn text={orderId} />
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="text-[11px] text-[#92400E] m-0">
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
      process.env.NODE_ENV !== "production" && process.env.NODE_ENV !== "production" && console.error('Failed to download invoice:', error);
      alert('Failed to download invoice. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg p-8 text-center max-w-[500px] mx-auto mt-8">
      {/* Success Icon */}
      <div className="w-16 h-16 bg-[#E1F5EE] rounded-full flex items-center justify-center mx-auto mb-4">
        <svg className="w-8 h-8 text-[#0E8A6E]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>

      {/* Title */}
      <h2 className="text-[20px] font-semibold mb-2 font-[family-name:var(--font-lora)]">
        Order placed successfully!
      </h2>
      
      <p className="text-[13px] text-[var(--color-text-secondary)] mb-6 font-[family-name:var(--font-plus-jakarta)]">
        Thank you for your order. We've sent a confirmation email with your order details.
      </p>

      {/* Order Details */}
      <div className="bg-[var(--color-background-tertiary)] rounded-lg p-4 mb-6">
        <div className="grid grid-cols-2 gap-4 text-left">
          <div>
            <div className="text-[11px] text-[var(--color-text-secondary)] mb-1">
              Order number
            </div>
            <div className="text-[14px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
              {orderId}
            </div>
          </div>
          <div>
            <div className="text-[11px] text-[var(--color-text-secondary)] mb-1">
              Estimated delivery
            </div>
            <div className="text-[14px] font-semibold font-[family-name:var(--font-plus-jakarta)]">
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
      <div className="space-y-3 mb-6">
        <div className="flex items-start gap-3 text-left bg-[#E6F1FB] rounded-lg p-3">
          <span className="text-[16px]">📦</span>
          <div className="flex-1">
            <div className="text-[12px] font-medium text-[#0C447C] mb-1">
              Track your order
            </div>
            <div className="text-[11px] text-[#0C447C]">
              You'll receive tracking information via SMS and email once your order ships.
            </div>
          </div>
        </div>

        <div className="flex items-start gap-3 text-left bg-[#E1F5EE] rounded-lg p-3">
          <span className="text-[16px]">❄️</span>
          <div className="flex-1">
            <div className="text-[12px] font-medium text-[#085041] mb-1">
              Cold chain delivery
            </div>
            <div className="text-[11px] text-[#085041]">
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
          className="flex-1 px-4 py-3 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-[13px] font-medium font-[family-name:var(--font-plus-jakarta)] hover:bg-[var(--color-background-tertiary)] disabled:opacity-50"
        >
          {downloading ? 'Downloading...' : '📄 Download invoice'}
        </button>
        <button 
          onClick={() => router.push('/products')}
          className="flex-1 px-4 py-3 bg-[#0B2545] text-white rounded-lg text-[13px] font-semibold font-[family-name:var(--font-plus-jakarta)] hover:bg-[#0d2d52]">
          Continue shopping
        </button>
      </div>

      {/* Support */}
      <div className="mt-6 pt-6 border-t-[0.5px] border-[var(--color-border-tertiary)]">
        <div className="text-[11px] text-[var(--color-text-secondary)] mb-2">
          Need help with your order?
        </div>
        <div className="flex items-center justify-center gap-4 text-[12px]">
          <a 
            href="tel:+8801646886795" 
            className="text-[#0E8A6E] font-medium hover:underline"
          >
            📞 Call support
          </a>
          <span className="text-[var(--color-border-secondary)]">|</span>
          <a 
            href="https://wa.me/8801646886795?text=Hi%2C%20I%20need%20help%20with%20my%20order%20%23{orderId}" 
            target="_blank"
            rel="noopener noreferrer"
            className="text-[#0E8A6E] font-medium hover:underline"
          >
            💬 Live chat
          </a>
        </div>
      </div>
    </div>
  );
}
