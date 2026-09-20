"use client";

import { showToast } from '@/components/ui/Toast';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/utils/api';
import { useAuth } from '@/context/AuthContext';
import { useRecaptcha } from '@/hooks/useRecaptcha';

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
        <span className="text-lg">🏦</span>
        <div>
          <p className="text-sm font-semibold text-warning-ink m-0">Complete Your Bank Transfer</p>
          <p className="text-xs text-warning-strong m-0">Transfer within 24 hours to confirm your order</p>
        </div>
      </div>

      <div className="px-4 py-3 space-y-2">
        {BANK_ROWS.map(({ label, value, mono }) => (
          <div key={label} className="flex items-center justify-between gap-2">
            <div className="min-w-0">
              <p className="text-xs text-warning-ink font-semibold uppercase tracking-wide m-0">{label}</p>
              <p className={`text-xs text-warning-deep font-semibold m-0 ${mono ? 'font-mono' : ''}`}>{value}</p>
            </div>
            <CopyBtn text={value} />
          </div>
        ))}

        {/* Reference — most important */}
        <div className="mt-2 pt-2 border-t border-[var(--color-status-warning-tint)]">
          <div className="flex items-center justify-between gap-2 bg-[var(--color-status-warning-tint)] rounded-lg px-3 py-2">
            <div>
              <p className="text-xs text-warning-ink font-semibold uppercase tracking-wide m-0">⚠️ Transfer Reference (Required)</p>
              <p className="text-sm font-semibold text-warning-deep font-mono m-0">{orderId}</p>
            </div>
            <CopyBtn text={orderId} />
          </div>
        </div>
      </div>

      <div className="px-4 pb-3">
        <p className="text-xs text-warning-ink m-0">
          Your order will be confirmed within <strong>1–2 business hours</strong> after payment is received.
          Email us at <strong>mediportbdofficial@gmail.com</strong> with your transaction screenshot if needed.
        </p>
      </div>
    </div>
  );
}

// WAVE-CLAIM — post-purchase account-acquisition prompt shown to guest buyers.
// The highest-converting conversion moment in e-commerce: the order is already
// placed and trust is established. Creates the account via register(), which
// auto-signs the user in, then links the just-placed guest order via
// POST /orders/claim-guest (backend verifies delivery email === account email).
function GuestAccountPrompt({ orderNumber, guestEmail }) {
  const { register, isAuthenticated } = useAuth();
  const router = useRouter();
  // reCAPTCHA parity with RegisterPage: a soft signal only. When no site key is
  // configured (or reCAPTCHA fails to load) the token is simply omitted, which
  // the backend treats as "skip" — signup is never blocked by this.
  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY;
  const { executeRecaptcha } = useRecaptcha(recaptchaSiteKey);
  const [name, setName] = useState('');
  const [email, setEmail] = useState(guestEmail || '');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [done, setDone] = useState(false);

  // Only guests see the prompt; already signed-in users get nothing.
  if (isAuthenticated()) return null;

  const PASSWORD_RULE =
    'At least 8 characters with uppercase, lowercase, number, and special character';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!name.trim() || name.trim().length < 2) {
      setError('Please enter your name');
      return;
    }
    if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email.trim())) {
      setError('Please enter a valid email address');
      return;
    }
    if (!/^(?:\+880|880|0)?1[3-9]\d{8}$/.test((phone || '').replace(/[\s\-+]/g, ''))) {
      setError('Enter a valid Bangladesh phone number (01XXXXXXXXX)');
      return;
    }
    if (
      password.length < 8 ||
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]/.test(password)
    ) {
      setError(PASSWORD_RULE);
      return;
    }
    setSubmitting(true);
    try {
      // reCAPTCHA is executed but never blocks account creation (same contract
      // as RegisterPage): null tokens are simply omitted from the payload.
      let recaptchaToken = null;
      if (recaptchaSiteKey) {
        recaptchaToken = await executeRecaptcha('register');
      }
      // register() stores the returned token — the user is signed in on success.
      const result = await register({
        name: name.trim(),
        email: email.trim(),
        password,
        phone: phone.trim(),
        ...(recaptchaToken ? { recaptchaToken } : {}),
      });
      if (!result.success) {
        setError(result.error || 'Could not create your account. Please try again.');
        setSubmitting(false);
        return;
      }
      // Account created and signed in — link the guest order (non-fatal).
      try {
        await api.claimGuestOrder(orderNumber);
      } catch {
        // Claim failures (e.g. email mismatch) never block account creation;
        // the order remains trackable via /track/<orderNumber> either way.
      }
      setDone(true);
      showToast.success('Account created — order saved to your account');
      router.refresh();
    } catch {
      setError('Could not create your account. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (done) {
    return (
      <div className="mt-5 flex items-start gap-3 text-left bg-[var(--color-status-success-tint)] rounded-lg p-3.5">
        <span className="text-base">🎉</span>
        <div className="flex-1">
          <div className="text-sm font-semibold text-[var(--color-status-success)] m-0">
            Account created!
          </div>
          <p className="text-xs text-[var(--color-status-success)] mt-1 m-0">
            This order is now saved to your account. View it any time under
            &quot;My Orders&quot; — and you&apos;ll earn loyalty points on future orders.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 text-left bg-[var(--color-background-secondary)] rounded-xl border border-[var(--color-border-primary)] p-4">
      <div className="flex items-start gap-3">
        <span className="text-xl">🎁</span>
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-brand-navy m-0">
            Save this order &amp; earn points
          </h3>
          <p className="text-xs text-[var(--color-text-secondary)] mt-1 m-0">
            Create a free account with the email you used at checkout — this order
            will be linked automatically, and you&apos;ll earn loyalty points on
            everything you buy.
          </p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="mt-3 space-y-2.5" noValidate>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Full name"
            autoComplete="name"
            className="w-full px-3 py-2.5 min-h-[44px] text-sm text-brand-navy bg-white border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
          />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email (used at checkout)"
            autoComplete="email"
            className="w-full px-3 py-2.5 min-h-[44px] text-sm text-brand-navy bg-white border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="Phone (01XXXXXXXXX)"
            autoComplete="tel"
            className="w-full px-3 py-2.5 min-h-[44px] text-sm text-brand-navy bg-white border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Create a password"
            autoComplete="new-password"
            className="w-full px-3 py-2.5 min-h-[44px] text-sm text-brand-navy bg-white border border-[var(--color-border-primary)] rounded-lg focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/15"
          />
        </div>

        {error && (
          <p className="text-xs text-danger m-0" role="alert" aria-live="polite">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={submitting}
          className="w-full py-2.5 min-h-[44px] text-sm font-semibold bg-brand-teal text-white rounded-lg hover:bg-[var(--color-brand-teal-hover)] disabled:opacity-50 transition-colors"
        >
          {submitting ? 'Creating account…' : 'Create account & save this order'}
        </button>
        <p className="text-[11px] text-[var(--color-text-tertiary)] m-0">
          Password rule: {PASSWORD_RULE}
        </p>
      </form>
    </div>
  );
}

export default function OrderConfirmation({ orderId, mongoId, estimatedDelivery, paymentMethod, guestEmail }) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [downloading, setDownloading] = useState(false);

  // WAVE-CLAIM: the invoice page is behind login (protect-gated API). Guests
  // who skipped account creation would hit a /login redirect, so route them to
  // the public order tracker instead. The live session check wins: a guest who
  // just used the claim prompt above is signed in and keeps invoice access.
  const isGuest = !isAuthenticated();
  const handleDownloadInvoice = () => {
    if (isGuest) {
      window.open(`/track/${orderId}`, '_blank');
      return;
    }

    // Use mongoId for navigation if available, otherwise fall back to orderId
    const idForNavigation = mongoId || orderId;
    
    if (!idForNavigation) {
      showToast.error('Order ID is missing');
      return;
    }
    
    // Navigate to new invoice page
    window.open(`/orders/${idForNavigation}/invoice`, '_blank');
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
          <span className="text-base">📦</span>
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
          <span className="text-base">❄️</span>
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

      {/* WAVE-CLAIM — guest account conversion prompt (renders only for guests) */}
      <GuestAccountPrompt orderNumber={orderId} guestEmail={guestEmail} />

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button 
          onClick={handleDownloadInvoice}
          className="flex-1 px-4 py-2.5 border-[0.5px] border-[var(--color-border-secondary)] rounded-lg text-sm font-medium font-[family-name:var(--font-plus-jakarta)] hover:bg-[var(--color-background-tertiary)] transition-colors"
        >
          {isGuest ? '📦 Track Order' : '📄 View Invoice'}
        </button>
        <button 
          onClick={() => router.push('/products')}
          className="flex-1 px-4 py-2.5 bg-brand-navy text-white rounded-lg text-sm font-semibold font-[family-name:var(--font-plus-jakarta)] hover:bg-[var(--color-brand-navy-hover)] transition-colors">
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
            📞 Call support
          </a>
          <span className="text-[var(--color-border-secondary)]">|</span>
          <a 
            href={`https://wa.me/8801646886795?text=Hi%2C%20I%20need%20help%20with%20my%20order%20%23${orderId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-teal font-medium hover:underline"
          >
            💬 Live chat
          </a>
        </div>
      </div>
    </div>
  );
}
