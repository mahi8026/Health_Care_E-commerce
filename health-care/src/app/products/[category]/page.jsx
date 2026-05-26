/**
 * Category landing page — /products/[category]
 *
 * Slug-based category URLs for SEO.
 * e.g. /products/diagnostic-equipment
 *      /products/laboratory-reagents
 *
 * Each page gets its own title, description, canonical URL, and OG tags
 * from CATEGORY_SEO config — making them fully indexable by Google.
 */

import { notFound } from 'next/navigation';
import ProductsPage from '@/views/ProductsPage';
import { CATEGORY_SEO, SITE_CONFIG } from '@/config/seo';

// ── Slug ↔ Category name mapping ─────────────────────────────────────────────
export const CATEGORY_SLUG_MAP = {
  'diagnostic-equipment':  'Diagnostic Equipment',
  'surgical-instruments':  'Surgical Instruments',
  'laboratory-reagents':   'Laboratory Reagents',
  'hospital-machines':     'Hospital Machines',
  'lab-equipment':         'Lab Equipment',
  'ppe-safety':            'PPE & Safety',
  'dental-equipment':      'Dental Equipment',
  'implants-ortho':        'Implants & Ortho',
};

// Reverse map: category name → slug
export const CATEGORY_NAME_TO_SLUG = Object.fromEntries(
  Object.entries(CATEGORY_SLUG_MAP).map(([slug, name]) => [name, slug])
);

// Tell Next.js which slugs to pre-render at build time
export function generateStaticParams() {
  return Object.keys(CATEGORY_SLUG_MAP).map(slug => ({ category: slug }));
}

// Per-category metadata — full title, description, canonical, OG
export function generateMetadata({ params }) {
  const categoryName = CATEGORY_SLUG_MAP[params.category];
  if (!categoryName) return {};

  const seo = CATEGORY_SEO[categoryName];
  if (!seo) return {};

  const canonicalUrl = `${SITE_CONFIG.url}/products/${params.category}`;

  return {
    title:       seo.title,
    description: seo.description,
    keywords:    `${categoryName} Bangladesh, buy ${categoryName.toLowerCase()} online BD, ${categoryName.toLowerCase()} supplier Dhaka`,
    alternates:  { canonical: canonicalUrl },
    openGraph: {
      title:       seo.title,
      description: seo.description,
      url:         canonicalUrl,
      images: [{ url: '/og-default.png', width: 1200, height: 630 }],
    },
    twitter: {
      card:        'summary_large_image',
      title:       seo.title,
      description: seo.description,
    },
  };
}

export default function CategoryPage({ params }) {
  const categoryName = CATEGORY_SLUG_MAP[params.category];

  // Unknown slug → 404
  if (!categoryName) notFound();

  // Pass the resolved category name to ProductsPage so it pre-filters
  return <ProductsPage initialCategory={categoryName} />;
}
