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
    q: 'Do you offer cold chain delivery for reagents in Bangladesh?',
    a: 'Cold chain delivery is not currently offered. Contact our team before ordering temperature-sensitive reagents so we can discuss suitable storage and handling for your site.',
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
    a: 'Yes. MediportBD offers B2B standing-order contracts for hospitals and reference labs. Volume pricing, payment terms and delivery schedules are agreed per contract and confirmed in writing.',
  },
  {
    q: 'How do I confirm a reagent is compatible with my analyzer?',
    a: 'Give the supplier the analyzer make, model and software version you run. A written quotation should state, for each line, whether the reagent is the original brand or a validated compatible product, so compatibility is documented before you order.',
  },
  {
    q: 'What documentation should arrive with a reagent order?',
    a: 'Institutional buyers normally require DGDA registration documentation for regulated IVDs, a lot or batch certificate (certificate of analysis) for each delivery, and a written quotation stating quantities, pricing and terms.',
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
              Laboratory reagents in Bangladesh must be DGDA approved and handled at the temperature the
              manufacturer specifies (commonly 2–8°C, or −20°C for frozen assays).
              HbA1c and CBC kits typically cost ৳3,000–৳150,000 depending on analyzer platform and pack size.
              MediportBD supplies Roche, Siemens and Abbott-compatible reagents in Dhaka with batch
              traceability and B2B supply contracts quoted in writing. Cold chain delivery is not
              currently offered — confirm storage and handling requirements with us before ordering
              temperature-sensitive items.
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

          {/* Reagent buyer guidance — server-rendered, claims-safe */}
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <h2 className="text-base font-semibold text-brand-navy mb-2">
                Match the reagent to your analyzer
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Reagent systems are platform-specific: a kit validated for one analyzer family will not
                run on another. Before ordering, give the supplier the analyzer make, model and software
                version your laboratory uses, and ask for compatibility to be confirmed in writing with
                the quotation. Original and validated compatible reagents both exist — the quotation
                should say which one is being supplied for each line.
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-brand-navy mb-2">
                Check every delivery before it reaches the bench
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Verify four things on receipt and photograph any discrepancy: the lot or batch number
                against the packing list, the remaining shelf life (aim for six months or more), the
                storage instruction printed on the kit label, and the physical condition of the pack.
                Reject or quarantine anything of doubtful temperature history — a compromised kit that
                is used produces a wrong result you will trust, which is worse than a failed test you
                notice.
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-brand-navy mb-2">
                Order by test volume, not by kit price
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)]">
                The number that matters is cost per reportable test: the kit price divided by the tests
                the pack yields after controls and repeats. Small packs cost more per test, while large
                kits expire unused on low-volume assays. Share your monthly test count for each assay and
                ask for the pack size that fits it — quantities and unit pricing are agreed in writing
                per quotation.
              </p>
            </div>
            <div>
              <h2 className="text-base font-semibold text-brand-navy mb-2">
                Documentation institutional buyers expect
              </h2>
              <p className="text-xs sm:text-sm leading-relaxed text-[var(--color-text-secondary)]">
                Hospital and tender procurement usually asks for DGDA registration documentation for
                regulated IVDs, a certificate of analysis or lot certificate per batch, and a written
                quotation with quantities, pricing and delivery schedule. Request all of it with the
                quotation rather than after the order. Cold chain delivery is not currently offered, so
                confirm storage and handling requirements with our team before ordering
                temperature-sensitive items.
              </p>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
            <Link href="/guides/laboratory-reagent-procurement-cost-bangladesh" className="text-[var(--color-brand-teal)] hover:underline">
              Reagent procurement &amp; per-test cost guide →
            </Link>
            <Link href="/guides/cold-chain-reagent-delivery-bangladesh" className="text-[var(--color-brand-teal)] hover:underline">
              Reagent delivery checks labs should make →
            </Link>
            <Link href="/quotes/request?source=reagent_store" className="font-semibold text-[var(--color-brand-teal)] hover:underline">
              Request a written quotation →
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
