import Link from 'next/link';
import { notFound } from 'next/navigation';
import { SITE_CONFIG } from '@/config/seo';
import { getGuideBySlug, GUIDES, GUIDE_AUTHOR } from '@/config/guides';
import StructuredData, {
  generateBreadcrumbSchema,
} from '@/utils/structuredData';
import FAQSchema from '@/components/seo/FAQSchema';

export const dynamicParams = false;

// ---------------------------------------------------------------------------
// Static generation — all guide slugs
// ---------------------------------------------------------------------------
export function generateStaticParams() {
  return GUIDES.map(guide => ({ slug: guide.slug }));
}

// ---------------------------------------------------------------------------
// Metadata — answer-first description for AI engines
// ---------------------------------------------------------------------------
export async function generateMetadata({ params }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) return { title: 'Guide Not Found | MediportBD', robots: { index: false } };

  const canonicalUrl = `${SITE_CONFIG.url}/guides/${guide.slug}`;

  return {
    title: guide.metaTitle,
    description: guide.metaDescription,
    keywords: guide.keywords.join(', '),
    alternates: { canonical: canonicalUrl },
    openGraph: {
      type: 'article',
      url: canonicalUrl,
      title: guide.metaTitle,
      description: guide.metaDescription,
      publishedTime: guide.updatedAt,
      modifiedTime: guide.updatedAt,
      authors: [GUIDE_AUTHOR.name],
      images: [{ url: '/og-default.png', width: 1200, height: 630, alt: guide.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: guide.metaTitle,
      description: guide.metaDescription,
    },
  };
}

// ---------------------------------------------------------------------------
// Helper — generate Article JSON-LD with author Person schema (E-E-A-T)
// ---------------------------------------------------------------------------
function generateArticleSchema(guide, canonicalUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: guide.title,
    description: guide.metaDescription,
    image: `${SITE_CONFIG.url}/og-default.png`,
    datePublished: guide.updatedAt,
    dateModified: guide.updatedAt,
    mainEntityOfPage: canonicalUrl,
    author: {
      '@type': 'Person',
      name: GUIDE_AUTHOR.name,
      jobTitle: 'Founder & Managing Director',
      worksFor: { '@type': 'Organization', name: SITE_CONFIG.fullName },
    },
    publisher: {
      '@type': 'Organization',
      name: SITE_CONFIG.fullName,
      logo: { '@type': 'ImageObject', url: `${SITE_CONFIG.url}/Mediport_Logo.png` },
    },
    inLanguage: 'en-BD',
    about: guide.keywords.slice(0, 3),
    speakable: {
      '@type': 'Speakable',
      cssSelector: ['#quick-answer', '#guide-faqs'],
    },
  };
}

// ---------------------------------------------------------------------------
// Helper — generate HowTo JSON-LD for guides with step-by-step instructions
// ---------------------------------------------------------------------------
function generateHowToSchema(guide, canonicalUrl) {
  return {
    '@context': 'https://schema.org',
    '@type': 'HowTo',
    name: guide.howTo.name,
    description: guide.howTo.description,
    totalTime: guide.howTo.totalTime || 'PT10M',
    step: guide.howTo.steps.map((step, i) => ({
      '@type': 'HowToStep',
      position: i + 1,
      name: step.name,
      text: step.text,
    })),
    about: guide.keywords.slice(0, 3),
  };
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default async function GuidePage({ params }) {
  const { slug } = await params;
  const guide = getGuideBySlug(slug);

  if (!guide) notFound();

  const canonicalUrl = `${SITE_CONFIG.url}/guides/${guide.slug}`;

  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Guides', url: `${SITE_CONFIG.url}/guides` },
    { name: guide.title, url: canonicalUrl },
  ];
  const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
  const articleSchema = generateArticleSchema(guide, canonicalUrl);

  const relatedGuides = (guide.relatedGuides || [])
    .map(s => getGuideBySlug(s))
    .filter(Boolean);

  const howToSchema = guide.howTo ? generateHowToSchema(guide, canonicalUrl) : null;

  return (
    <article className="min-h-screen bg-page">
      <StructuredData schema={breadcrumbSchema} />
      <StructuredData schema={articleSchema} />
      {howToSchema && <StructuredData schema={howToSchema} />}
      <FAQSchema faqs={guide.faqs} />

      {/* Hero */}
      <header className="bg-brand-navy text-white py-10 px-4">
        <div className="container mx-auto max-w-3xl">
          <nav aria-label="Breadcrumb" className="text-xs text-white/60 mb-4 flex flex-wrap gap-1.5">
            <Link href="/" className="hover:text-white transition-colors">Home</Link>
            <span aria-hidden="true">/</span>
            <Link href="/guides" className="hover:text-white transition-colors">Guides</Link>
            <span aria-hidden="true">/</span>
            <span className="text-white/80">{guide.type === 'compare' ? 'Comparison' : 'Guide'}</span>
          </nav>

          <div className="flex items-center gap-2 mb-4">
            <span className="text-[var(--text-xs)] font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-white/10 text-brand-teal-light">
              {guide.type === 'pillar' ? 'Pillar Guide' : guide.type === 'compare' ? 'Brand Comparison' : guide.type === 'explainer' ? 'Regulatory Guide' : 'Buying Guide'}
            </span>
            <span className="text-[var(--text-xs)] text-white/60">Updated {guide.updatedAt}</span>
            <span className="text-[var(--text-xs)] text-white/60">· {guide.readMinutes} min read</span>
          </div>

          <h1 className="text-2xl md:text-4xl font-semibold leading-tight mb-4">{guide.title}</h1>
          <p className="text-white/70 text-sm md:text-base leading-relaxed">{guide.excerpt}</p>
        </div>
      </header>

      <div className="container mx-auto max-w-3xl px-4 py-8">
        {/* Author byline (E-E-A-T) */}
        <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[var(--color-border-primary)]">
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center text-white font-semibold text-lg flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-brand-teal), var(--color-brand-teal-light))' }}
            aria-hidden="true"
          >
            {GUIDE_AUTHOR.name.charAt(0)}
          </div>
          <div>
            <p className="text-sm font-semibold text-[var(--color-text-primary)]">
              Written by {GUIDE_AUTHOR.name}
            </p>
            <p className="text-xs text-[var(--color-text-secondary)]">{GUIDE_AUTHOR.title}</p>
          </div>
        </div>

        {/* Body sections */}
        {guide.sections.map((section) => (
          <section key={section.heading} className="mb-10">
            <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-brand-navy)] mb-4">
              {section.heading}
            </h2>
            {section.paragraphs.map((para, i) => (
              <p key={i} className="text-sm md:text-[15px] leading-relaxed text-[var(--color-text-primary)] mb-4">
                {para}
              </p>
            ))}

            {section.bullets && section.bullets.length > 0 && (
              <ul className="space-y-2 mb-4">
                {section.bullets.map((item, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm leading-relaxed text-[var(--color-text-primary)]">
                    <span className="text-[var(--color-brand-teal)] font-bold mt-0.5 flex-shrink-0">✓</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            )}

            {section.table && (
              <div className="overflow-x-auto mb-4 rounded-xl border border-[var(--color-border-primary)]">
                <table className="w-full text-sm min-w-[480px]">
                  <caption className="text-left text-xs text-[var(--color-text-secondary)] px-4 py-2 bg-[var(--color-background-secondary)] font-medium">
                    {section.table.caption}
                  </caption>
                  <thead>
                    <tr className="bg-brand-navy text-white text-left">
                      {section.table.headers.map(h => (
                        <th key={h} scope="col" className="px-4 py-3 font-semibold text-xs whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {section.table.rows.map((row, i) => (
                      <tr key={i} className={i % 2 ? 'bg-[var(--color-background-secondary)]' : 'bg-white'}>
                        {row.map((cell, j) => (
                          <td key={j} className="px-4 py-3 align-top text-[var(--color-text-primary)]">{cell}</td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        ))}

        {/* Visible FAQ section — matches FAQPage schema */}
        {guide.faqs && guide.faqs.length > 0 && (
          <section id="guide-faqs" className="mb-10">
            <h2 className="text-xl md:text-2xl font-semibold text-[var(--color-brand-navy)] mb-4">
              Frequently Asked Questions
            </h2>
            <div className="space-y-3">
              {guide.faqs.map((faq) => (
                <div key={faq.q} className="rounded-xl border border-[var(--color-border-primary)] bg-white p-4">
                  <h3 className="text-sm font-semibold text-[var(--color-text-primary)] mb-2">{faq.q}</h3>
                  <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{faq.a}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Related category CTA — internal linking to money pages */}
        {guide.relatedCategories && guide.relatedCategories.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-[var(--color-brand-navy)] mb-3">
              Shop Related Products
            </h2>
            <div className="flex flex-wrap gap-2">
              {guide.relatedCategories.map(cat => (
                <Link
                  key={cat.href}
                  href={cat.href}
                  className="text-sm font-medium text-[var(--color-brand-teal)] border border-[var(--color-brand-teal)] rounded-lg px-4 py-2 hover:bg-[var(--color-brand-teal)] hover:text-white transition-colors"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Related guides — internal linking within the cluster */}
        {relatedGuides.length > 0 && (
          <section className="mb-10">
            <h2 className="text-lg font-semibold text-[var(--color-brand-navy)] mb-3">
              Continue Reading
            </h2>
            <div className="space-y-3">
              {relatedGuides.map(g => (
                <Link
                  key={g.slug}
                  href={`/guides/${g.slug}`}
                  className="block rounded-xl border border-[var(--color-border-primary)] bg-white p-4 hover:border-[var(--color-brand-teal)] transition-colors"
                >
                  <span className="block text-xs text-[var(--color-brand-teal)] uppercase tracking-wider font-semibold mb-1">
                    {g.type === 'compare' ? 'Comparison' : 'Guide'}
                  </span>
                  <span className="block text-sm font-semibold text-[var(--color-text-primary)]">{g.title}</span>
                  <span className="block text-xs text-[var(--color-text-secondary)] mt-1">{g.excerpt}</span>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* CTA */}
        <div className="rounded-2xl bg-brand-navy text-white p-6 text-center">
          <h2 className="text-lg font-semibold mb-2">Need help choosing the right equipment?</h2>
          <p className="text-sm text-white/70 mb-4">
            Our medical equipment specialists in Dhaka are available 24/7 for free advice, quotations and B2B pricing.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              href="/contact"
              className="px-5 py-2.5 rounded-lg bg-brand-teal text-white text-sm font-semibold hover:bg-[var(--color-brand-teal-hover)] transition-colors"
            >
              Contact Us
            </Link>
            <Link
              href="/b2b"
              className="px-5 py-2.5 rounded-lg border border-white/30 text-sm font-semibold hover:bg-white/10 transition-colors"
            >
              B2B Pricing
            </Link>
          </div>
        </div>

        {/* Quick Answer box — Moved to bottom for better UX, still available for SEO/AI engines */}
        <div
          id="quick-answer"
          className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-secondary)] p-5 mb-8"
        >
          <p className="text-[var(--text-xs)] font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-2">
            About This Guide
          </p>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {guide.quickAnswer}
          </p>
        </div>
      </div>
    </article>
  );
}
