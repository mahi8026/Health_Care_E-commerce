'use client';

import { useState } from 'react';

const BANK_DETAILS = [
  { label: 'Bank Name', value: 'BRAC Bank PLC', icon: '🏦' },
  { label: 'Account Name', value: 'MAHI M RAHMAN', icon: '🏢' },
  { label: 'Account Number', value: '1081267690001', icon: '💳', mono: true },
  { label: 'Branch', value: 'Elephant Road Branch', icon: '📍' },
  { label: 'Routing Number', value: '060261339', icon: '#️⃣', mono: true },
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
      className={`ml-2 px-2 py-0.5 rounded text-xs font-semibold transition-all min-h-[44px] min-w-[44px] ${
        copied
          ? 'bg-[var(--color-status-success-tint)] text-[var(--color-status-success)]'
          : 'bg-[var(--color-background-tertiary)] text-[var(--color-text-secondary)] hover:bg-[var(--color-background-muted)] hover:text-[var(--color-text-primary)]'
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
    <div className="mt-3 rounded-xl border border-[var(--color-status-info-tint)] bg-[var(--color-status-info-tint)] overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 bg-[var(--color-status-info-tint)] border-b border-[var(--color-status-info-tint)] flex items-center gap-2">
        <span className="text-lg">🏦</span>
        <div>
          <p className="text-sm font-semibold text-[var(--color-status-info)] m-0">Bank Transfer Details</p>
          <p className="text-xs text-[var(--color-status-info)] m-0">Transfer to the account below and use your order number as reference</p>
        </div>
      </div>

      {/* Bank Details */}
      <div className="px-4 py-3 space-y-2">
        {BANK_DETAILS.map(({ label, value, icon, mono }) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-sm flex-shrink-0">{icon}</span>
              <div className="min-w-0">
                <p className="text-xs text-[var(--color-text-secondary)] m-0 uppercase tracking-wide font-semibold">{label}</p>
                <p className={`text-xs text-[#002B78] font-semibold m-0 ${mono ? 'font-mono' : ''}`}>
                  {value}
                </p>
              </div>
            </div>
            <CopyButton text={value} />
          </div>
        ))}
      </div>

      {/* Reference Number — highlighted */}
      <div className="mx-4 mb-3 rounded-lg bg-[var(--color-status-warning-tint)] border border-[var(--color-status-warning-tint)] px-3 py-2.5">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-xs text-warning-ink font-semibold uppercase tracking-wide m-0">
              ⚠️ Payment Reference (Required)
            </p>
            <p className="text-sm font-semibold text-[#78350F] font-mono m-0 mt-0.5">
              {referenceText}
            </p>
            <p className="text-xs text-warning-ink m-0 mt-0.5">
              You MUST include this as the transfer reference
            </p>
          </div>
          <CopyButton text={referenceText} />
        </div>
      </div>

      {/* Instructions */}
      <div className="px-4 pb-3">
        <div className="rounded-lg bg-white border border-[var(--color-status-info-tint)] px-3 py-2.5 space-y-1.5">
          <p className="text-xs font-semibold text-[var(--color-status-info)] m-0">📋 After transferring:</p>
          {[
            'Take a screenshot or note your transaction ID',
            'Your order will be confirmed within 1–2 business hours',
            'You\'ll receive an email confirmation once payment is verified',
            'Contact mahimrahman07@gmail.com if you need help',
          ].map((step, i) => (
            <p key={i} className="text-xs text-[var(--color-text-primary)] m-0 flex items-start gap-1.5">
              <span className="text-[var(--color-status-info)] font-semibold flex-shrink-0">{i + 1}.</span>
              {step}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
