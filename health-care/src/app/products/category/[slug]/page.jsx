/**
 * Category landing page — /products/category/[slug]
 *
 * Slug-based category URLs for SEO.
 * e.g. /products/category/diagnostic-equipment
 *      /products/category/laboratory-reagents
 *
 * Each page gets its own title, description, canonical URL, and OG tags
 * from CATEGORY_SEO config — making them fully indexable by Google.
 *
 * Server-rendered GEO elements: breadcrumb schema, FAQPage schema and a
 * Quick Answer box (answer-first, AI-engine extractable) above the
 * product grid.
 */

import { notFound } from 'next/navigation';
import ProductsPage from '@/views/ProductsPage';
import { CATEGORY_SEO, SITE_CONFIG } from '@/config/seo';
import { CATEGORY_SLUG_MAP } from '@/constants/categories';
import { fetchListing } from '@/lib/listingData';
import {
  getCategoryFaqs,
  getCategoryQuickAnswer,
} from '@/config/categoryGEO';
import StructuredData, {
  generateBreadcrumbSchema,
} from '@/utils/structuredData';
import FAQSchema from '@/components/seo/FAQSchema';
import CollectionPageSchema from '@/components/seo/CollectionPageSchema';

// ISR: render on first request, cache for 1 hour. Avoids heavy backend
// load during build-time static generation while still serving static HTML
// to crawlers.
export const revalidate = 3600;
export const dynamicParams = true;

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
      images: [{ url: `${SITE_CONFIG.url}/og-default.png`, width: 1200, height: 630 }],
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
    notFound();
  }

  const canonicalUrl = `${SITE_CONFIG.url}/products/category/${resolvedParams.slug}`;
  const quickAnswer = getCategoryQuickAnswer(resolvedParams.slug);
  const faqs = getCategoryFaqs(resolvedParams.slug);
  const seo = CATEGORY_SEO[categoryName] || {};

  const listing = await fetchListing({ category: resolvedParams.slug, page: '1' });

  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Products', url: `${SITE_CONFIG.url}/products` },
    { name: categoryName, url: canonicalUrl },
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);

  const webPageSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': canonicalUrl,
    url: canonicalUrl,
    name: categoryName,
    speakable: {
      '@type': 'Speakable',
      cssSelector: ['#quick-answer'],
    },
  };

  return (
    <>
      <StructuredData schema={breadcrumbSchema} />
      <StructuredData schema={webPageSchema} />
      <FAQSchema faqs={faqs} />
      <CollectionPageSchema
        name={categoryName}
        description={seo.description}
        category={categoryName}
        url={canonicalUrl}
      />

      {/* Pass the resolved category name to ProductsPage so it pre-filters */}
      <ProductsPage
        initialCategory={categoryName}
        initialData={listing.products}
        initialPagination={listing.pagination}
        initialCategories={listing.categories}
        initialBrands={listing.brands}
        initialFilters={listing.filters}
      />

      {/* Quick Answer box — Moved to bottom for better UX, still available for SEO/AI engines */}
      {quickAnswer && (
        <section className="bg-page px-4 pb-8">
          <div
            id="quick-answer"
            className="container mx-auto max-w-[1280px] rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-secondary)] p-4 sm:p-5"
          >
            <p className="text-[var(--text-xs)] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
              About This Category
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {quickAnswer}
            </p>
          </div>
        </section>
      )}
    </>
  );
}
