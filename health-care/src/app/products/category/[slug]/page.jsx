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

import Link from 'next/link';
import { notFound } from 'next/navigation';
import ProductsPage from '@/views/ProductsPage';
import { CATEGORY_SEO, SITE_CONFIG } from '@/config/seo';
import { CATEGORY_SLUG_MAP } from '@/constants/categories';
import { fetchListing } from '@/lib/listingData';
import {
  getCategoryFaqs,
  getCategoryQuickAnswer,
} from '@/config/categoryGEO';
import { getCategoryCrossLinks } from '@/config/categoryCrossLinks';
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
  const crossLinks = getCategoryCrossLinks(resolvedParams.slug);
  const hasTopicLinks = crossLinks.topics.length > 0;
  const hasEquipmentLinks = crossLinks.equipment.length > 0;

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
    name: seo.h1 || categoryName,
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

      {/* Server-rendered H1 + topic/equipment cross-links — visible above the
          product grid so Googlebot sees topical authority signals immediately */}
      <div className="bg-white border-b border-[var(--color-border-tertiary)]">
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4">
          <h1 className="text-lg font-semibold text-[var(--color-brand-navy)] mb-2">
            {seo.h1 || `${categoryName} in Bangladesh`}
          </h1>

          {/* Cross-links to topic hubs and equipment price pages */}
          {(hasTopicLinks || hasEquipmentLinks) && (
            <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs">
              {hasTopicLinks && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[var(--color-text-tertiary)] font-medium whitespace-nowrap">Topics:</span>
                  {crossLinks.topics.map((t, i) => (
                    <span key={t.slug} className="flex items-center gap-1.5">
                      <Link
                        href={`/topics/${t.slug}`}
                        className="text-[var(--color-brand-teal)] hover:underline whitespace-nowrap"
                      >
                        {t.label}
                      </Link>
                      {i < crossLinks.topics.length - 1 && (
                        <span className="text-[var(--color-border-primary)]">·</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
              {hasEquipmentLinks && (
                <div className="flex flex-wrap items-center gap-1.5">
                  <span className="text-[var(--color-text-tertiary)] font-medium whitespace-nowrap">Prices:</span>
                  {crossLinks.equipment.map((e, i) => (
                    <span key={e.slug} className="flex items-center gap-1.5">
                      <Link
                        href={`/equipment/${e.slug}`}
                        className="text-[var(--color-brand-teal)] hover:underline whitespace-nowrap"
                      >
                        {e.label}
                      </Link>
                      {i < crossLinks.equipment.length - 1 && (
                        <span className="text-[var(--color-border-primary)]">·</span>
                      )}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Pass the resolved category name to ProductsPage so it pre-filters */}
      <ProductsPage
        initialCategory={categoryName}
        initialData={listing.products}
        initialPagination={listing.pagination}
        initialCategories={listing.categories}
        initialBrands={listing.brands}
        initialFilters={listing.filters}
      />

      {/* Quick Answer box — answer-first content for SEO/AI engines */}
      {quickAnswer && (
        <section className="bg-page px-4 pb-8">
          <div
            id="quick-answer"
            className="container mx-auto max-w-[1280px] rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-secondary)] p-4 sm:p-5"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
              About {categoryName} in Bangladesh
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)]">
              {quickAnswer}
            </p>
            {/* Bottom cross-links row — reinforces internal linking */}
            {(hasTopicLinks || hasEquipmentLinks) && (
              <div className="mt-3 pt-3 border-t border-[var(--color-border-tertiary)] flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
                {crossLinks.topics.map(t => (
                  <Link key={t.slug} href={`/topics/${t.slug}`} className="text-[var(--color-brand-teal)] hover:underline">
                    {t.label} →
                  </Link>
                ))}
                {crossLinks.equipment.map(e => (
                  <Link key={e.slug} href={`/equipment/${e.slug}`} className="text-[var(--color-brand-teal)] hover:underline">
                    {e.label} →
                  </Link>
                ))}
                <Link href="/brands" className="text-[var(--color-text-secondary)] hover:text-[var(--color-brand-teal)] hover:underline">
                  Browse Brands
                </Link>
                <Link href="/guides" className="text-[var(--color-text-secondary)] hover:text-[var(--color-brand-teal)] hover:underline">
                  Buying Guides
                </Link>
              </div>
            )}
          </div>
        </section>
      )}
    </>
  );
}
