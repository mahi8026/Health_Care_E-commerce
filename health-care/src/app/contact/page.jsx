import Link from 'next/link';
import ContactPage from '@/views/ContactPage';
import { SITE_CONFIG } from '@/config/seo';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';

export const metadata = {
  title: 'Contact Us',
  description:
    'Contact MediportBD for medical equipment inquiries, orders, B2B partnerships, and support. Phone, WhatsApp, email, and our Dhaka showroom address.',
  keywords:
    'contact MediportBD, medical equipment supplier contact, Dhaka medical equipment, B2B medical supplier, MediportBD phone, MediportBD email',
  alternates: { canonical: `${SITE_CONFIG.url}/contact` },
  openGraph: {
    title: 'Contact Us',
    description:
      'Reach MediportBD by phone, WhatsApp, or email. Visit our Dhaka showroom or send a B2B partnership inquiry.',
    url: `${SITE_CONFIG.url}/contact`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function Contact() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Contact', url: `${SITE_CONFIG.url}/contact` },
  ];

  return (
    <>
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <ContactPage />

      {/* Server-rendered internal links — Googlebot follows even though ContactPage is client-rendered */}
      <section className="bg-page border-t border-[var(--color-border-tertiary)] py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-brand-navy)] mb-3">
                Quick Links
              </h2>
              <ul className="space-y-1.5">
                <li><Link href="/products" className="text-xs text-[var(--color-brand-teal)] hover:underline">All Products</Link></li>
                <li><Link href="/reagent-store" className="text-xs text-[var(--color-brand-teal)] hover:underline">Laboratory Reagents</Link></li>
                <li><Link href="/equipment" className="text-xs text-[var(--color-brand-teal)] hover:underline">Price Guides</Link></li>
                <li><Link href="/b2b" className="text-xs text-[var(--color-brand-teal)] hover:underline">B2B Portal</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-brand-navy)] mb-3">
                Support
              </h2>
              <ul className="space-y-1.5">
                <li><Link href="/faq" className="text-xs text-[var(--color-brand-teal)] hover:underline">Frequently Asked Questions</Link></li>
                <li><Link href="/warranty" className="text-xs text-[var(--color-brand-teal)] hover:underline">Warranty Information</Link></li>
                <li><Link href="/help" className="text-xs text-[var(--color-brand-teal)] hover:underline">Help Center</Link></li>
                <li><Link href="/track" className="text-xs text-[var(--color-brand-teal)] hover:underline">Track Your Order</Link></li>
              </ul>
            </div>
            <div>
              <h2 className="text-sm font-semibold text-[var(--color-brand-navy)] mb-3">
                Resources
              </h2>
              <ul className="space-y-1.5">
                <li><Link href="/guides" className="text-xs text-[var(--color-brand-teal)] hover:underline">Buying Guides</Link></li>
                <li><Link href="/topics" className="text-xs text-[var(--color-brand-teal)] hover:underline">Topic Hubs</Link></li>
                <li><Link href="/dgda-info" className="text-xs text-[var(--color-brand-teal)] hover:underline">DGDA Compliance</Link></li>
                <li><Link href="/certifications" className="text-xs text-[var(--color-brand-teal)] hover:underline">Certifications</Link></li>
              </ul>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
