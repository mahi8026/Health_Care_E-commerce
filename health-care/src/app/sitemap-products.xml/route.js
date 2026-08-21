/**
 * Product Pages Sitemap for MediportBD
 *
 * Permanently redirects to the static sitemap file generated at build time
 * (scripts/generate-sitemap.js during `npm run build`).
 *
 * 308 (permanent), not 307: this URL is listed in /sitemap.xml, and search
 * engines should treat the target as the lasting location.
 *
 * Route: /sitemap-products.xml → /sitemap-products-static.xml
 */

import { NextResponse } from 'next/server';

export async function GET(request) {
  const url = new URL('/sitemap-products-static.xml', request.url);
  return NextResponse.redirect(url, 308);
}
