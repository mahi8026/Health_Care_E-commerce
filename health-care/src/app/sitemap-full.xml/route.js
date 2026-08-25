/**
 * Full Product Sitemap for MediportBD
 *
 * Serves the comprehensive sitemap generated at build time by
 * scripts/generate-sitemap.js (public/sitemap-full.xml).
 *
 * Falls back to a live API fetch if the static file has not been
 * generated yet (e.g. first deploy before the build script runs).
 *
 * The build script writes a combined sitemap covering static pages,
 * categories, brands, guides, equipment, topics, and all products.
 *
 * Route: /sitemap-full.xml
 */

import { readFile } from 'fs/promises';
import { join } from 'path';
import { SITE_CONFIG } from '@/config/seo';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ||
  'https://health-care-e-commerce-ubyy.onrender.com/api';

async function fetchSluggedProducts() {
  try {
    const res = await fetch(
      `${API_BASE}/products?limit=500&fields=slug,updatedAt`,
      { next: { revalidate: 43200 } }
    );
    if (!res.ok) return [];
    const data = await res.json();
    const products = Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.products)
      ? data.products
      : [];
    return products.filter(
      (p) => p.slug && !/^[a-f0-9]{24}$/i.test(p.slug)
    );
  } catch {
    return [];
  }
}

export async function GET() {
  // 1. Try the pre-built static file (fastest, most comprehensive)
  try {
    const filePath = join(process.cwd(), 'public', 'sitemap-full.xml');
    const content = await readFile(filePath, 'utf-8');
    if (content && content.includes('<url>')) {
      return new Response(content, {
        headers: {
          'Content-Type': 'application/xml',
          'Cache-Control': 'public, max-age=43200, s-maxage=43200',
        },
      });
    }
  } catch {
    // File not yet generated — fall through to live API
  }

  // 2. Live API fallback — product slugs only
  const products = await fetchSluggedProducts();
  const now = new Date().toISOString();

  const urlset = products
    .map((p) => {
      const lastmod = p.updatedAt
        ? new Date(p.updatedAt).toISOString()
        : now;
      return `
  <url>
    <loc>${SITE_CONFIG.url}/products/${p.slug}</loc>
    <lastmod>${lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>`;
    })
    .join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlset}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=43200, s-maxage=43200',
    },
  });
}
