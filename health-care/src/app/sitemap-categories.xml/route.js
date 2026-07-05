/**
 * Category Pages Sitemap for MedCore BD
 * 
 * Contains all category landing pages.
 * Fast generation, no external API calls.
 * 
 * Route: /sitemap-categories.xml
 */

import { SITE_CONFIG } from '@/config/seo';

const SITE_URL = SITE_CONFIG.url;

// Category slugs — same as in the main sitemap
const CATEGORY_SLUGS = [
  { name: 'Diagnostic Equipment', slug: 'diagnostic-equipment' },
  { name: 'Surgical Instruments', slug: 'surgical-instruments' },
  { name: 'Laboratory Reagents', slug: 'laboratory-reagents' },
  { name: 'Hospital Machines', slug: 'hospital-machines' },
  { name: 'Lab Equipment', slug: 'lab-equipment' },
  { name: 'PPE & Safety', slug: 'ppe-safety' },
  { name: 'Dental Equipment', slug: 'dental-equipment' },
  { name: 'Implants & Ortho', slug: 'implants-ortho' },
];

export async function GET() {
  const now = new Date().toISOString();

  const categoryPages = CATEGORY_SLUGS.map(cat => ({
    url: `${SITE_URL}/products/category/${cat.slug}`,
    lastModified: now,
    changeFrequency: 'daily',
    priority: 0.85,
  }));

  const urlset = categoryPages.map(page => `
  <url>
    <loc>${page.url}</loc>
    <lastmod>${page.lastModified}</lastmod>
    <changefreq>${page.changeFrequency}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('');

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urlset}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400', // 24 hour cache
    },
  });
}
