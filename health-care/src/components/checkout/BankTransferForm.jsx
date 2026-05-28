'use client';

import { useState } from 'react';

const BANK_DETAILS = [
  { label: 'Bank Name', value: 'Dutch-Bangla Bank Ltd', icon: '🏦' },
  { label: 'Account Name', value: 'MedCore Bangladesh Ltd', icon: '🏢' },
  { label: 'Account Number', value: '1721 2030 5678', icon: '💳', mono: true },
  { label: 'Branch', value: 'Nawabpur Road, Dhaka', icon: '📍' },
  { label: 'Routing Number', value: '090261450', icon: '#️⃣', mono: true },
];

function CopyButton({ text }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for older browsers
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`ml-2 px-2 py-0.5 rounded text-[10px] font-semibold transition-all min-h-[28px] min-w-[44px] ${
        copied
          ? 'bg-[#D1FAE5] text-[#065F46]'
          : 'bg-[#F3F4F6] text-[#6B7280] hover:bg-[#E5E7EB] hover:text-[#374151]'
      }`}
      title={`Copy ${text}`}
    >
      {copied ? '✓ Copied' : 'Copy'}
    </button>
  );
}

export default function BankTransferForm({ orderNumber }) {
  const referenceText = orderNumber || 'Your Order Number';

  return (
    <div className="mt-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[#DBEAFE] border-b border-[#BFDBFE] flex items-center gap-2">
        <span className="text-lg">🏦</span>
        <div>
          <p className="text-[13px] font-bold text-[#1E40AF] m-0">Bank Transfer Details</p>
          <p className="text-[11px] text-[#3B82F6] m-0">Transfer to the account below and use your order number as reference</p>
        </div>
      </div>

      {/* Bank Details */}
      <div className="px-4 py-3 space-y-2">
        {BANK_DETAILS.map(({ label, value, icon, mono }) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[13px] flex-shrink-0">{icon}</span>
              <div className="min-w-0">
                <p className="text-[10px] text-[#6B7280] m-0 uppercase tracking-wide font-semibold">{label}</p>
                <p className={`text-[12px] text-[#1E3A5F] font-semibold m-0 ${mono ? 'font-mono' : ''}`}>
                  {value}
                </p>
              </div>
            </div>
            <CopyButton text={value} />
          </div>
        ))}
      </div>

      {/* Reference Number — highlighted */}
      <div className="mx-4 mb-3 rounded-lg bg-[#FEF3C7] border border-[#FCD34D] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] text-[#92400E] font-bold uppercase tracking-wide m-0">
              ⚠️ Payment Reference (Required)
            </p>
            <p className="text-[13px] font-bold text-[#78350F] font-mono m-0 mt-0.5">
              {referenceText}
            </p>
            <p className="text-[10px] text-[#92400E] m-0 mt-0.5">
              You MUST include this as the transfer reference
            </p>
          </div>
          <CopyButton text={referenceText} />
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 pb-3">
        <div className="rounded-lg bg-white border border-[#BFDBFE] px-3 py-2.5 space-y-1.5">
          <p className="text-[11px] font-bold text-[#1E40AF] m-0">📋 After transferring:</p>
          {[
            'Take a screenshot or note your transaction ID',
            'Your order will be confirmed within 1–2 business hours',
            'You\'ll receive an email confirmation once payment is verified',
            'Contact support@medcorebd.com if you need help',
          ].map((step, i) => (
            <p key={i} className="text-[11px] text-[#374151] m-0 flex items-start gap-1.5">
              <span className="text-[#3B82F6] font-bold flex-shrink-0">{i + 1}.</span>
              {step}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
