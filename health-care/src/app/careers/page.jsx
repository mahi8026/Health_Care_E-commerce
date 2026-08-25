import Link from 'next/link';
import CareersPage from '@/views/CareersPage';
import { SITE_CONFIG } from '@/config/seo';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';

export const metadata = {
  title: 'Careers',
  description:
    'Join MediportBD — careers in medical equipment sales, service engineering, warehousing, and operations in Dhaka, Bangladesh.',
  keywords:
    'MediportBD careers, medical equipment jobs Dhaka, MediportBD jobs, healthcare sales jobs Bangladesh, medical device technician jobs',
  alternates: { canonical: `${SITE_CONFIG.url}/careers` },
  openGraph: {
    title: 'Careers',
    description:
      'Build your career with Bangladesh\u2019s trusted medical equipment supplier. Explore open positions and apply today.',
    url: `${SITE_CONFIG.url}/careers`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function Careers() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Careers', url: `${SITE_CONFIG.url}/careers` },
  ];

  return (
    <>
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <CareersPage />

      <section className="bg-page border-t border-[var(--color-border-tertiary)] py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <Link href="/about" className="text-[var(--color-brand-teal)] hover:underline">About MediportBD</Link>
            <Link href="/news" className="text-[var(--color-brand-teal)] hover:underline">News & Updates</Link>
            <Link href="/contact" className="text-[var(--color-brand-teal)] hover:underline">Contact</Link>
            <Link href="/b2b" className="text-[var(--color-brand-teal)] hover:underline">B2B Portal</Link>
            <Link href="/products" className="text-[var(--color-brand-teal)] hover:underline">Browse Products</Link>
          </div>
        </div>
      </section>
    </>
  );
}
