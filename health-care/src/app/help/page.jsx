import Link from 'next/link';
import HelpPage from '@/views/HelpPage';
import { SITE_CONFIG } from '@/config/seo';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';

export const metadata = {
  title: 'Support & Help Centre',
  description:
    'Get help with orders, delivery, returns, payments, and more. Contact the MediportBD support team or browse our FAQ.',
  keywords: 'MediportBD support, help centre, order help Bangladesh, medical equipment returns, contact Mediport',
  alternates: { canonical: `${SITE_CONFIG.url}/help` },
  openGraph: {
    title: 'Support & Help Centre',
    description: 'Get help with orders, delivery, returns, payments, and more.',
    url: `${SITE_CONFIG.url}/help`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function Help() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Help Center', url: `${SITE_CONFIG.url}/help` },
  ];

  return (
    <>
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <HelpPage />

      <section className="bg-page border-t border-[var(--color-border-tertiary)] py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
            <Link href="/faq" className="text-[var(--color-brand-teal)] hover:underline">FAQ</Link>
            <Link href="/contact" className="text-[var(--color-brand-teal)] hover:underline">Contact Us</Link>
            <Link href="/warranty" className="text-[var(--color-brand-teal)] hover:underline">Warranty Info</Link>
            <Link href="/track" className="text-[var(--color-brand-teal)] hover:underline">Track Order</Link>
            <Link href="/products" className="text-[var(--color-brand-teal)] hover:underline">Browse Products</Link>
            <Link href="/b2b" className="text-[var(--color-brand-teal)] hover:underline">B2B Support</Link>
          </div>
        </div>
      </section>
    </>
  );
}
