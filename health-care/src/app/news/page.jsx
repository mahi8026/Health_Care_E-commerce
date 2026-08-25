import Link from 'next/link';
import NewsPage from '@/views/NewsPage';
import { SITE_CONFIG } from '@/config/seo';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';

export const metadata = {
  title: 'News & Updates',
  description:
    'Latest news and updates from MediportBD — new product launches, partnerships, DGDA registrations, and company announcements.',
  keywords:
    'MediportBD news, medical equipment Bangladesh news, MediportBD updates, healthcare news Dhaka',
  alternates: { canonical: `${SITE_CONFIG.url}/news` },
  openGraph: {
    title: 'News & Updates',
    description:
      'Company announcements, product launches, and industry news from Bangladesh\u2019s trusted medical equipment supplier.',
    url: `${SITE_CONFIG.url}/news`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function News() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'News & Updates', url: `${SITE_CONFIG.url}/news` },
  ];

  return (
    <>
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <NewsPage />

      <section className="bg-page border-t border-[var(--color-border-tertiary)] py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <Link href="/about" className="text-[var(--color-brand-teal)] hover:underline">About MediportBD</Link>
            <Link href="/careers" className="text-[var(--color-brand-teal)] hover:underline">Careers</Link>
            <Link href="/contact" className="text-[var(--color-brand-teal)] hover:underline">Contact</Link>
            <Link href="/products" className="text-[var(--color-brand-teal)] hover:underline">All Products</Link>
            <Link href="/dgda-info" className="text-[var(--color-brand-teal)] hover:underline">DGDA Compliance</Link>
          </div>
        </div>
      </section>
    </>
  );
}
