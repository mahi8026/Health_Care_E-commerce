/**
 * Product Pages Sitemap for MediportBD
 *
 * Serves the static sitemap file generated at build time
 * (scripts/generate-sitemap.js during `npm run build`).
 *
 * Previously this did a 308 redirect to /sitemap-products-static.xml.
 * Now we serve directly to eliminate the redirect hop and prevent GSC
 * from flagging it as a "redirecting sitemap" error.
 *
 * Route: /sitemap-products.xml
 */

import { readFile } from 'fs/promises';
import { join } from 'path';

export async function GET() {
  try {
    const filePath = join(process.cwd(), 'public', 'sitemap-products-static.xml');
    const content = await readFile(filePath, 'utf-8');
    return new Response(content, {
      headers: {
        'Content-Type': 'application/xml',
        'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      },
    });
  } catch {
    // File not yet generated (first deploy before build script runs)
    return new Response(
      '<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"></urlset>',
      {
        headers: { 'Content-Type': 'application/xml' },
        status: 200,
      }
    );
  }
}
