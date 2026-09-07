/**
 * Canonical Site URL helper for MediportBD
 *
 * The single place where the canonical origin should be derived from the
 * NEXT_PUBLIC_SITE_URL environment variable.
 *
 * WHY THIS EXISTS:
 * The canonical origin MUST match the serving host — https://www.mediportbd.com
 * (the apex 308-redirects here). Older deployment guides historically told
 * people to set NEXT_PUBLIC_SITE_URL=https://mediportbd.com (non-www). When
 * that value is used, every canonical tag, sitemap <loc>, Open Graph URL and
 * schema.org URL emits the APEX host instead of the www host — which splits
 * Page-level signals and inflates "Page with redirect" / duplicate-host
 * entries in Google Search Console.
 *
 * This helper:
 *  1. Falls back to https://www.mediportbd.com when the env var is unset or
 *     an empty string (the empty-string case was seen in the Vercel dashboard).
 *  2. Normalizes the apex host mediportbd.com (with or without "www") to
 *     https://www.mediportbd.com, so even a misconfigured env var can never
 *     emit non-www canonicals/sitemap URLs.
 *  3. Leaves unrelated hosts untouched (http://localhost for dev, api.* hosts).
 */

const DEFAULT_SITE_URL = 'https://www.mediportbd.com';

// Matches any case-variant of the apex host with an optional "www." prefix:
// https://mediportbd.com, https://MediportBD.com, https://WWW.MediPortBD.com
// — but NOT api.mediportbd.com, staging.mediportbd.com or localhost.
const HOST_RE = /^https:\/\/(?:www\.)?mediportbd\.com$/i;

export function getSiteUrl() {
  const raw = (process.env.NEXT_PUBLIC_SITE_URL || '').trim().replace(/\/+$/, '');

  // Empty / unset (e.g. an empty-string var in the Vercel dashboard) → default.
  if (!raw) return DEFAULT_SITE_URL;

  // Apex host in any case (with or without "www") → canonical lowercase www origin.
  if (HOST_RE.test(raw)) return DEFAULT_SITE_URL;

  // Anything else (localhost / api.* / staging) → leave untouched.
  return raw;
}

export default getSiteUrl;