/**
 * Category landing page — /products/category/[slug]
 *
 * Slug-based category URLs for SEO.
 * e.g. /products/category/diagnostic-equipment
 *      /products/category/laboratory-reagents
 *
 * Each page gets its own title, description, canonical URL, and OG tags
 * from CATEGORY_SEO config — making them fully indexable by Google.
 */

import { notFound } from 'next/navigation';
import ProductsPage from '@/views/ProductsPage';
import { CATEGORY_SEO, SITE_CONFIG } from '@/config/seo';
import { CATEGORY_SLUG_MAP, CATEGORY_NAME_TO_SLUG } from '@/constants/categories';

// Tell Next.js which slugs to pre-render at build time
export function generateStaticParams() {
  return Object.keys(CATEGORY_SLUG_MAP).map(slug => ({ slug }));
}

// Per-category metadata — full title, description, canonical, OG
export function generateMetadata({ params }) {
  const categoryName = CATEGORY_SLUG_MAP[params.slug];
  if (!categoryName) return {};

  const seo = CATEGORY_SEO[categoryName];
  if (!seo) return {};

  const canonicalUrl = `${SITE_CONFIG.url}/products/category/${params.slug}`;

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
  const categoryName = CATEGORY_SLUG_MAP[params.slug];

  // Unknown slug → 404
  if (!categoryName) notFound();

  // Pass the resolved category name to ProductsPage so it pre-filters
  return <ProductsPage initialCategory={categoryName} />;
}
