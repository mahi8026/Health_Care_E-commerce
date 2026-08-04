'use client';

import { FaNewspaper, FaCalendarAlt, FaTag, FaArrowRight } from 'react-icons/fa';
import Link from 'next/link';

const ARTICLES = [
  {
    date: 'June 2026',
    title: 'MediportBD expands cold-chain delivery network',
    tag: 'Operations',
    excerpt:
      'We have added two new temperature-controlled delivery routes, cutting cold-chain transit times for diagnostic reagents across Dhaka, Chittagong, and Sylhet.',
  },
  {
    date: 'April 2026',
    title: 'New range of DGDA-registered surgical instruments now available',
    tag: 'Products',
    excerpt:
      'Over 120 new surgical instruments from verified manufacturers are now listed, each carrying a valid DGDA registration number with documentation on request.',
  },
  {
    date: 'February 2026',
    title: 'B2B credit terms now available for registered institutions',
    tag: 'B2B',
    excerpt:
      'Hospitals, clinics, and diagnostic centres can now apply for 30-day credit terms through the B2B portal, with approval within two business days.',
  },
  {
    date: 'December 2025',
    title: 'MediportBD introduces dedicated reagent store',
    tag: 'Products',
    excerpt:
      'Our new reagent store brings lab reagents, consumables, and diagnostic kits together in one place with cold-chain delivery and batch documentation.',
  },
  {
    date: 'October 2025',
    title: 'Team training on biomedical device service and calibration',
    tag: 'Company',
    excerpt:
      'Our service engineers completed manufacturer-led training covering calibration, preventive maintenance, and on-site repair for diagnostic equipment.',
  },
];

export default function NewsPage() {
  return (
    <div className="min-h-screen bg-page">
      {/* Hero */}
      <section className="bg-brand-navy text-white py-8 md:py-10 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white/80 text-xs font-medium px-3 py-1 rounded-full mb-4">
            <FaNewspaper className="text-brand-teal-light" />
            News &amp; Updates
          </div>
          <h1 className="text-xl md:text-2xl font-semibold mb-2">Latest from MediportBD</h1>
          <p className="text-white/70 text-base md:text-lg max-w-2xl mx-auto">
            Company announcements, new product ranges, and updates that matter to hospitals, clinics, and suppliers across Bangladesh.
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-4xl">
          <h2 className="text-xl font-semibold text-[var(--color-text-primary)] mb-6">Announcements</h2>
          <div className="flex flex-col gap-4">
            {ARTICLES.map((article) => (
              <article
                key={article.title}
                className="bg-white rounded-2xl border border-[var(--color-border-tertiary)] shadow-sm p-6"
              >
                <div className="flex flex-wrap items-center gap-3 mb-2">
                  <span className="inline-flex items-center gap-1.5 text-xs text-[var(--color-text-secondary)]">
                    <FaCalendarAlt className="text-brand-teal" />
                    {article.date}
                  </span>
                  <span className="inline-flex items-center gap-1.5 text-xs font-medium text-brand-teal bg-brand-teal-tint px-2.5 py-1 rounded-full">
                    <FaTag />
                    {article.tag}
                  </span>
                </div>
                <h3 className="font-semibold text-[var(--color-text-primary)] text-base mb-2">{article.title}</h3>
                <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{article.excerpt}</p>
              </article>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-6 bg-brand-navy rounded-2xl p-5 text-white text-center">
            <FaArrowRight className="text-2xl text-brand-teal-light mx-auto mb-2" />
            <h3 className="font-semibold text-lg mb-2">Want to stay in the loop?</h3>
            <p className="text-white/70 text-sm mb-5">
              Subscribe to our newsletter in the footer to receive product launches and company updates in your inbox.
            </p>
            <Link
              href="/#newsletter"
              className="inline-block bg-white text-brand-navy font-semibold text-sm px-6 py-3 rounded-xl hover:bg-[var(--color-background-tertiary)] transition-colors"
            >
              Subscribe
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
