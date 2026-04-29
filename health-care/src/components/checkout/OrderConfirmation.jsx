"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';

export default function OrderConfirmation({ orderId, estimatedDelivery }) {
  const router = useRouter();
  const [downloading, setDownloading] = useState(false);

  const handleDownloadInvoice = async () => {
    setDownloading(true);
    try {
      const blob = await api.downloadInvoice(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `invoice-${orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Failed to download invoice:', error);
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
      <div className="flex gap-3">
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
          <a href="#" className="text-[#0E8A6E] font-medium hover:underline">
            📞 Call support
          </a>
          <span className="text-[var(--color-border-secondary)]">|</span>
          <a href="#" className="text-[#0E8A6E] font-medium hover:underline">
            💬 Live chat
          </a>
        </div>
      </div>
    </div>
  );
}
