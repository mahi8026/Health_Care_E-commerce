import Link from 'next/link';
import WarrantyPage from '@/views/WarrantyPage';
import { SITE_CONFIG } from '@/config/seo';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';

export const metadata = {
  title: 'Warranty & Claims',
  description:
    'MediportBD warranty policy — manufacturer and Mediport warranty coverage, how to file a warranty claim, and what is excluded.',
  keywords:
    'MediportBD warranty, medical equipment warranty Bangladesh, warranty claim, equipment repair, replacement policy',
  alternates: { canonical: `${SITE_CONFIG.url}/warranty` },
  openGraph: {
    title: 'Warranty & Claims',
    description:
      'Understand your equipment warranty — coverage terms, claim process, and repair or replacement guarantees.',
    url: `${SITE_CONFIG.url}/warranty`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function Warranty() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Warranty', url: `${SITE_CONFIG.url}/warranty` },
  ];

  return (
    <>
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <WarrantyPage />

      <section className="bg-page border-t border-[var(--color-border-tertiary)] py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <Link href="/products/category/diagnostic-equipment" className="text-[var(--color-brand-teal)] hover:underline">Diagnostic Equipment</Link>
            <Link href="/products/category/hospital-machines" className="text-[var(--color-brand-teal)] hover:underline">Hospital Machines</Link>
            <Link href="/faq" className="text-[var(--color-brand-teal)] hover:underline">FAQ</Link>
            <Link href="/contact" className="text-[var(--color-brand-teal)] hover:underline">Contact Support</Link>
            <Link href="/help" className="text-[var(--color-brand-teal)] hover:underline">Help Center</Link>
          </div>
        </div>
      </section>
    </>
  );
}
