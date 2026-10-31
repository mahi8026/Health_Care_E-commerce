// health-care/src/app/author/mahim-rahman/page.jsx
//
// Public author page (E-E-A-T: author/credibility).
//
// Content is limited to what is already published in the repository
// (config/guides.js GUIDE_AUTHOR). No credentials, registrations or profile
// links are invented here: `sameAs` stays empty until a verified public profile
// URL is supplied.

import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import { GUIDES, GUIDE_AUTHOR } from '@/config/guides';
import { finalTitle, socialTitle } from '@/utils/metadata';

const AUTHOR_URL = `${SITE_CONFIG.url}${GUIDE_AUTHOR.url}`;

export const metadata = {
  title: finalTitle(`About the author — ${GUIDE_AUTHOR.name}`),
  description: `${GUIDE_AUTHOR.name}, ${GUIDE_AUTHOR.title}. ${GUIDE_AUTHOR.description}`,
  alternates: { canonical: AUTHOR_URL },
  openGraph: {
    type: 'profile',
    url: AUTHOR_URL,
    title: socialTitle(`About the author — ${GUIDE_AUTHOR.name}`),
    description: GUIDE_AUTHOR.description,
    images: [{ url: `${SITE_CONFIG.url}/og-default.png`, width: 1200, height: 630 }],
  },
};

const personSchema = {
  '@context': 'https://schema.org',
  '@type': 'Person',
  '@id': `${AUTHOR_URL}#person`,
  name: GUIDE_AUTHOR.name,
  jobTitle: GUIDE_AUTHOR.title,
  description: GUIDE_AUTHOR.description,
  url: AUTHOR_URL,
  mainEntityOfPage: AUTHOR_URL,
  worksFor: {
    '@type': 'Organization',
    name: SITE_CONFIG.fullName,
    url: SITE_CONFIG.url,
  },
};

export default function AuthorPage() {
  const guides = Array.isArray(GUIDES) ? GUIDES : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personSchema) }}
      />

      <div className="container mx-auto max-w-3xl px-4 py-10">
        <nav aria-label="Breadcrumb" className="text-xs text-[var(--color-text-secondary)] mb-6">
          <Link href="/" className="hover:underline">Home</Link>
          <span className="mx-1.5">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-1.5">/</span>
          <span>Author</span>
        </nav>

        <header className="flex items-start gap-4 mb-8">
          <div
            aria-hidden="true"
            className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-semibold flex-shrink-0"
            style={{ background: 'linear-gradient(135deg, var(--color-brand-teal), var(--color-brand-teal-light))' }}
          >
            {GUIDE_AUTHOR.name.charAt(0)}
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-semibold text-[var(--color-brand-navy)]">
              {GUIDE_AUTHOR.name}
            </h1>
            <p className="text-sm text-[var(--color-text-secondary)]">{GUIDE_AUTHOR.title}</p>
          </div>
        </header>

        <section className="mb-8">
          <h2 className="text-lg font-semibold text-[var(--color-brand-navy)] mb-2">About</h2>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            {GUIDE_AUTHOR.description}
          </p>
        </section>

        {guides.length > 0 && (
          <section>
            <h2 className="text-lg font-semibold text-[var(--color-brand-navy)] mb-3">
              Buying guides written by {GUIDE_AUTHOR.name}
            </h2>
            <ul className="space-y-2">
              {guides.map((guide) => (
                <li key={guide.slug}>
                  <Link
                    href={`/guides/${guide.slug}`}
                    className="text-sm text-[var(--color-brand-teal)] hover:underline"
                  >
                    {guide.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </>
  );
}
