import Link from 'next/link';
import ReagentStorePage from '@/views/ReagentStorePage';
import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';
import FAQSchema from '@/components/seo/FAQSchema';

export const metadata = {
  title:       PAGE_SEO.reagentStore.title,
  description: PAGE_SEO.reagentStore.description,
  keywords:    PAGE_SEO.reagentStore.keywords,
  alternates:  { canonical: `${SITE_CONFIG.url}/reagent-store` },
  openGraph: {
    title:       PAGE_SEO.reagentStore.title,
    description: PAGE_SEO.reagentStore.description,
    url:         `${SITE_CONFIG.url}/reagent-store`,
    images: [{
      url: `${SITE_CONFIG.url}/og?title=Laboratory+Reagents+Bangladesh&subtitle=HbA1c+%E2%80%A2+CBC+%E2%80%A2+Biochemistry+%E2%80%A2+Immunology+Kits&page=Reagent+Store`,
      width: 1200,
      height: 630,
      alt: 'Laboratory Reagents Bangladesh — MediportBD',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    images: [`${SITE_CONFIG.url}/og?title=Laboratory+Reagents+Bangladesh&subtitle=HbA1c+%E2%80%A2+CBC+%E2%80%A2+Biochemistry+%E2%80%A2+Immunology+Kits&page=Reagent+Store`],
  },
};

const REAGENT_FAQS = [
  {
    q: 'How do you ensure cold chain delivery for reagents in Bangladesh?',
    a: 'MediportBD uses temperature-monitored insulated packaging and refrigerated transport for all temperature-sensitive reagents in Bangladesh, maintaining 2–8°C throughout transit.',
  },
  {
    q: 'Which laboratory analyzer brands are your reagents compatible with?',
    a: 'We supply reagents compatible with Roche Cobas, Abbott ARCHITECT, Beckman Coulter UniCel, Sysmex and Mindray analyzers — both original and validated compatible reagents with compatibility confirmed before dispatch.',
  },
  {
    q: 'How much do HbA1c reagent kits cost in Bangladesh?',
    a: 'HbA1c reagent kits in Bangladesh typically cost ৳15,000–৳120,000 depending on the analyzer platform (HPLC vs immunoassay), pack size and whether they are original or compatible reagents.',
  },
  {
    q: 'What is the shelf life of laboratory reagents in Bangladesh?',
    a: 'Most reagents carry 12–24 months shelf life from manufacture. MediportBD supplies only stock with a minimum of 6 months validity remaining and provides batch traceability documents.',
  },
  {
    q: 'Can hospitals get bulk pricing on laboratory reagents?',
    a: 'Yes. MediportBD offers B2B standing-order contracts for hospitals and reference labs with 8–30% bulk discounts, 30–90 day credit terms and scheduled cold-chain delivery.',
  },
];

export default function ReagentStore() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'Reagent Store', url: `${SITE_CONFIG.url}/reagent-store` },
  ];

  return (
    <>
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      <StructuredData
        schema={{
          '@context': 'https://schema.org',
          '@type': 'WebPage',
          '@id': `${SITE_CONFIG.url}/reagent-store`,
          url: `${SITE_CONFIG.url}/reagent-store`,
          name: 'Laboratory Reagents Bangladesh — MediportBD',
          speakable: { '@type': 'Speakable', cssSelector: ['#reagent-quick-answer'] },
        }}
      />
      <FAQSchema faqs={REAGENT_FAQS} />

      <ReagentStorePage />

      {/* Server-rendered SEO section — internal linking + quick answer */}
      <section className="bg-page px-4 pb-10">
        <div className="container mx-auto max-w-[1280px]">
          {/* Quick answer box */}
          <div
            id="reagent-quick-answer"
            className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-secondary)] p-4 sm:p-5 mb-6"
          >
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
              About Laboratory Reagents in Bangladesh
            </p>
            <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)]">
              Laboratory reagents in Bangladesh must be DGDA approved and cold-chain handled (2–8°C or −20°C).
              HbA1c and CBC kits typically cost ৳3,000–৳150,000 depending on analyzer platform and pack size.
              MediportBD supplies Roche, Siemens and Abbott-compatible reagents in Dhaka with temperature-monitored
              delivery, batch traceability and B2B supply contracts.
            </p>
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
              <Link href="/topics/laboratory-equipment-reagents" className="text-[var(--color-brand-teal)] hover:underline">
                Laboratory Topic Hub →
              </Link>
              <Link href="/guides/laboratory-reagents-guide-bangladesh" className="text-[var(--color-brand-teal)] hover:underline">
                Reagents Buying Guide →
              </Link>
              <Link href="/products/category/laboratory-equipment" className="text-[var(--color-text-secondary)] hover:text-[var(--color-brand-teal)] hover:underline">
                Laboratory Equipment
              </Link>
              <Link href="/b2b" className="text-[var(--color-text-secondary)] hover:text-[var(--color-brand-teal)] hover:underline">
                B2B Bulk Pricing
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
