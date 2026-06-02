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
import { CATEGORY_SLUG_MAP } from '@/constants/categories';

// Allow dynamic params beyond pre-generated ones
export const dynamicParams = true;

// Generate static params at build time for all known category slugs
export async function generateStaticParams() {
  const slugs = Object.keys(CATEGORY_SLUG_MAP).map(slug => ({ slug }));
  console.log('Generating static params for category slugs:', slugs);
  return slugs;
}

// Per-category metadata — full title, description, canonical, OG
export async function generateMetadata({ params }) {
  // Next.js 15+ requires awaiting params
  const resolvedParams = await Promise.resolve(params);
  const categoryName = CATEGORY_SLUG_MAP[resolvedParams.slug];
  
  if (!categoryName) return {};

  const seo = CATEGORY_SEO[categoryName];
  if (!seo) return {};

  const canonicalUrl = `${SITE_CONFIG.url}/products/category/${resolvedParams.slug}`;

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

export default async function CategoryPage({ params }) {
  // Next.js 15+ requires awaiting params
  const resolvedParams = await Promise.resolve(params);
  const categoryName = CATEGORY_SLUG_MAP[resolvedParams.slug];

  // Unknown slug → 404
  if (!categoryName) {
    console.error(`Category slug not found: ${resolvedParams.slug}`);
    notFound();
  }

  console.log(`Rendering category page: ${resolvedParams.slug} -> ${categoryName}`);

  // Pass the resolved category name to ProductsPage so it pre-filters
  return <ProductsPage initialCategory={categoryName} />;
}
