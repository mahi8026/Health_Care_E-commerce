// health-care/src/components/marketing/ExitIntentPopup.jsx
'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { FaWhatsapp, FaTimes, FaCopy, FaCheck, FaGift } from 'react-icons/fa';
import { API, CONTACT } from '@/constants/api';
import GA4Tracker from '@/services/GA4Tracker';
import MetaPixelTracker from '@/services/MetaPixelTracker';
import { trackMarketingEvent } from '@/utils/marketingBeacon';

/**
 * ExitIntentPopup — a first-order offer shown when a visitor is about to leave.
 *
 * Desktop: triggers on mouse leave toward the top of the page.
 * Mobile: triggers once after a short delay (no mouse-out event exists).
 *
 * Flow:
 * 1. Fetches the currently active coupon (`/coupons/active-promo`).
 * 2. Captures a newsletter email (feeds the existing newsletter system).
 * 3. On success, reveals the coupon code with a one-tap copy button.
 *
 * The popup shows at most once per browser (localStorage), never on
 * checkout/cart/account pages, and tracks show/subscribe as GA4 + Meta events.
 */

const STORAGE_KEY = 'mediport_exit_popup_seen';
const SKIP_PREFIXES = ['/checkout', '/cart', '/admin', '/b2b', '/account', '/login', '/register', '/track', '/orders', '/quotes'];

function isSkipPath(pathname) {
  return SKIP_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default function ExitIntentPopup() {
  const pathname = usePathname();
  const [visible, setVisible] = useState(false);
  const [coupon, setCoupon] = useState(null);
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');
  const closeBtnRef = useRef(null);
  const shownRef = useRef(false);

  const show = useCallback(() => {
    if (shownRef.current) return;
    shownRef.current = true;
    setVisible(true);
    GA4Tracker.trackEvent('exit_intent_popup_shown');
    MetaPixelTracker.trackCustomEvent('ExitIntentPopupShown');
    trackMarketingEvent('exit_intent_popup_shown');
    // Move focus to the dialog for accessibility.
    requestAnimationFrame(() => closeBtnRef.current?.focus());
  }, []);

  const close = useCallback(() => setVisible(false), []);

  // Load the currently-active coupon for the offer copy (non-fatal if offline).
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API}/coupons/active-promo`, { cache: 'no-store' });
        const data = await res.json();
        if (!cancelled && data?.success) {
          setCoupon(data.data?.coupon || null);
        }
      } catch {
        // Non-fatal — fall back to the generic offer copy.
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Trigger logic — once per browser, never on purchase/account pages.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (isSkipPath(pathname)) return;
    try {
      if (localStorage.getItem(STORAGE_KEY)) return;
    } catch {
      /* localStorage unavailable — still allow the popup */
    }

    const isMobile = window.matchMedia('(max-width: 767px)').matches;

    if (isMobile) {
      // No mouse-out on mobile — show after a short dwell.
      const timer = setTimeout(show, 12000);
      return () => clearTimeout(timer);
    }

    const onMouseOut = (e) => {
      // Only when the pointer genuinely leaves the document toward the top.
      if (!e.relatedTarget && e.clientY <= 0) {
        show();
      }
    };
    document.addEventListener('mouseout', onMouseOut);
    return () => document.removeEventListener('mouseout', onMouseOut);
  }, [pathname, show]);

  // Escape to close + mark "seen" so it never returns.
  useEffect(() => {
    if (!visible) return;
    try { localStorage.setItem(STORAGE_KEY, '1'); } catch { /* noop */ }
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [visible, close]);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    const em = email.trim();
    if (!em || !/\S+@\S+\.\S+/.test(em)) {
      setError('Please enter a valid email address.');
      return;
    }
    setSubmitting(true);
    setError('');
    try {
      const res = await fetch(`${API}/newsletter/subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: em, name: name.trim(), source: 'exit_popup' }),
      });
      const data = await res.json();
      if (data.success || data.data?.alreadySubscribed) {
        setSubscribed(true);
        GA4Tracker.trackEvent('generate_lead', { source: 'exit_popup' });
        MetaPixelTracker.trackLead({ value: 0 });
        trackMarketingEvent('exit_popup_lead');
      } else {
        setError(data.message || 'Failed to subscribe. Please try again.');
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleCopy = async () => {
    const code = coupon?.code || 'COMEBACK5';
    try {
      await navigator.clipboard.writeText(code);
    } catch {
      // Fallback for older browsers / non-secure contexts.
      const ta = document.createElement('textarea');
      ta.value = code;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  if (!visible) return null;

  const offerPercent = coupon?.type === 'fixed' ? null : (coupon?.value || 5);
  const offerLabel = offerPercent !== null
    ? `${offerPercent}% OFF`
    : `\u09F3${Number(coupon?.value || 0).toLocaleString()} OFF`;
  const couponCode = coupon?.code || 'COMEBACK5';
  const expiry = coupon?.endDate ? new Date(coupon.endDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : null;

  const waLink = `https://wa.me/${CONTACT.whatsapp}?text=${encodeURIComponent(
    'Hi MediportBD! I saw your offer and want to get the best price on medical equipment.'
  )}`;

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 1100, background: 'rgba(15, 23, 42, 0.65)', backdropFilter: 'blur(2px)' }}
      onClick={close}
      role="dialog"
      aria-modal="true"
      aria-label="Exclusive discount offer"
    >
      <div
        className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl overflow-hidden animate-fadeSlideUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Head — brand gradient */}
        <div
          className="relative px-6 pt-8 pb-7 text-center"
          style={{ background: 'linear-gradient(135deg, var(--color-brand-navy) 0%, #002B78 100%)' }}
        >
          <button
            ref={closeBtnRef}
            onClick={close}
            aria-label="Close offer"
            className="absolute top-3 right-3 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center transition-colors"
          >
            <FaTimes size={16} />
          </button>

          <div className="w-16 h-16 mx-auto mb-3 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center shadow-lg">
            <FaGift size={28} className="text-white" />
          </div>
          <h2 className="text-white font-bold text-xl mb-1">Wait! Don&apos;t leave empty-handed</h2>
          <p className="text-white/70 text-sm">
            Get <span className="font-bold text-amber-300">{offerLabel}</span> on your first order
            {expiry ? ` — valid until ${expiry}` : ''}
          </p>
        </div>

        {/* Body */}
        <div className="p-6">
          {subscribed ? (
            <div className="text-center">
              <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[var(--color-status-success-tint)] flex items-center justify-center">
                <FaCheck size={26} className="text-[var(--color-status-success)]" />
              </div>
              <h3 className="font-bold text-lg text-[var(--color-text-primary)] mb-1">
                You&apos;re in! 🎉
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4">
                Use this code at checkout to claim your discount.
              </p>

              <button
                onClick={handleCopy}
                className="w-full flex items-center justify-between gap-3 px-4 py-3.5 rounded-xl border-2 border-dashed border-brand-teal bg-brand-teal-tint hover:bg-brand-teal-tint/70 transition-colors"
                aria-label="Copy coupon code"
              >
                <span className="font-mono font-bold text-lg tracking-wider text-brand-teal">{couponCode}</span>
                <span className="flex items-center gap-1.5 text-sm font-semibold text-brand-teal">
                  {copied ? <FaCheck size={16} /> : <FaCopy size={16} />}
                  {copied ? 'Copied!' : 'Copy'}
                </span>
              </button>

              <Link
                href="/products"
                className="mt-4 inline-flex items-center justify-center w-full py-3 rounded-xl bg-brand-navy hover:bg-[var(--color-brand-navy-hover)] text-white font-semibold text-sm transition-colors"
              >
                Shop Medical Equipment →
              </Link>
            </div>
          ) : (
<>
              <p className="text-sm text-[var(--color-text-secondary)] mb-4 text-center">
                Enter your email to instantly unlock the discount code — plus
                early access to flash deals and B2B pricing.
              </p>

              <form onSubmit={handleSubscribe} className="space-y-3">
                <div>
                  <label htmlFor="ei-name" className="sr-only">Name (optional)</label>
                  <input
                    id="ei-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name (optional)"
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition-all"
                  />
                </div>
                <div>
                  <label htmlFor="ei-email" className="sr-only">Email address</label>
                  <input
                    id="ei-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    required
                    className="w-full px-4 py-3 rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-background-secondary)] text-sm text-[var(--color-text-primary)] focus:outline-none focus:border-brand-teal focus:ring-2 focus:ring-brand-teal/20 transition-all"
                  />
                </div>
                {error && (
                  <p role="alert" className="text-xs text-[var(--color-status-danger)]">
                    {error}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-brand-teal to-[var(--color-brand-teal-hover)] hover:from-[var(--color-brand-teal-hover)] hover:to-brand-teal text-white font-bold text-sm transition-all hover:shadow-lg disabled:opacity-60 flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Claiming…
                    </>
                  ) : (
                    <>Claim My {offerLabel}</>
                  )}
                </button>
              </form>

              <div className="mt-4 pt-4 border-t border-[var(--color-border-tertiary)]">
                <a
                  href={waLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => {
                    GA4Tracker.trackEvent('exit_popup_whatsapp_click');
                    MetaPixelTracker.trackCustomEvent('ExitPopupWhatsAppClick');
                    trackMarketingEvent('exit_popup_whatsapp_click');
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--color-status-success-tint)] hover:bg-[var(--color-status-success)] hover:text-white text-[var(--color-status-success)] font-semibold text-sm transition-colors"
                >
                  <FaWhatsapp size={16} />
                  Prefer WhatsApp? Chat with us
                </a>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}