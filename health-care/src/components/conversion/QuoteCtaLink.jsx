// health-care/src/components/conversion/QuoteCtaLink.jsx
'use client';

import Link from 'next/link';
import { trackQuoteCtaClick } from '@/services/funnelTracking';

/**
 * QuoteCtaLink — the single "Request a quotation" control.
 *
 * Renders a real <a href> (next/link) so the CTA exists in server-rendered
 * HTML and is crawlable without JavaScript, then reports `quote_cta_click`
 * on activation.
 *
 * Guardrails:
 *  - Text defaults to exactly "Request a quotation" (callers may pass children,
 *    but every current call site uses the default).
 *  - No price, discount, stock or availability is accepted or appended here;
 *    the href carries only `source` plus, on the product page, `product`/`qty`.
 *  - `quote_cta_click` is engagement only — it is never treated as a
 *    conversion anywhere in the app.
 *  - Minimum tap target is 44px (min-h-[44px] / min-w-[44px]); callers append
 *    their own visual classes via `className`.
 */
export default function QuoteCtaLink({
  href = '/quotes/request',
  source,
  pageType,
  className = '',
  children = 'Request a quotation',
}) {
  return (
    <Link
      href={href}
      onClick={() => trackQuoteCtaClick({ source, pageType })}
      className={[
        'inline-flex items-center justify-center gap-2',
        'min-h-[44px] min-w-[44px] px-5 py-2.5 rounded-xl',
        'font-semibold text-sm transition-colors',
        className,
      ].join(' ')}
      data-quote-cta={source || 'quote'}
    >
      {children}
    </Link>
  );
}
