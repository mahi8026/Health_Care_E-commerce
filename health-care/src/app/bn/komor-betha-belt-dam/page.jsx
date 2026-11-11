// health-care/src/app/bn/komor-betha-belt-dam/page.jsx
//
// S4 — first Bangla landing page. Targets the proven Bangla query
// "কোমর ব্যথার বেল্ট দাম" (waist/back-pain belt price), which converted at
// 100% CTR from position 4 in the GSC export despite tiny volume. Built as a
// single, verified page rather than a speculative full /bn locale.
//
// Claims discipline: prices are confirmed in a written quotation; the only
// delivery promise is the confirmed policy (free over BDT 50,000). No
// installation, credit-term or cold-chain claim appears on the page.

import Link from 'next/link';
import { SITE_CONFIG } from '@/config/seo';
import { API } from '@/constants/api';
import { BENGALI_TERMS } from '@/config/bengali-content';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';

export const revalidate = 3600;

const BN_URL = `${SITE_CONFIG.url}/bn/komor-betha-belt-dam`;
const EN_URL = `${SITE_CONFIG.url}/products/category/orthopedic-supports`;

const BN_TITLE = 'কোমর ব্যথার বেল্ট দাম বাংলাদেশে | MediportBD';
const BN_DESCRIPTION =
  'কোমর ব্যথার বেল্ট ও লাম্বার কর্সেটের দাম জানতে লিখিত কোটেশন নিন। M, L ও XL সাইজে কর্সেট — হাসপাতাল, ক্লিনিক ও ফার্মেসিতে সরবরাহ।';

export const metadata = {
  title: { absolute: BN_TITLE },
  description: BN_DESCRIPTION,
  alternates: {
    canonical: BN_URL,
    languages: {
      'bn-BD': BN_URL,
      'en-BD': EN_URL,
      'x-default': EN_URL,
    },
  },
  openGraph: {
    type: 'website',
    url: BN_URL,
    title: BN_TITLE,
    description: BN_DESCRIPTION,
    locale: 'bn_BD',
    images: [{ url: `${SITE_CONFIG.url}/og-default.png`, width: 1200, height: 630 }],
  },
};

async function fetchBelts() {
  try {
    const res = await fetch(`${API}/products?search=${encodeURIComponent('lumbar')}&limit=8`, {
      next: { revalidate: 3600 },
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json?.data || json?.products || [];
  } catch {
    return [];
  }
}

const BN_FAQS = [
  {
    q: 'কোমর ব্যথার বেল্টের দাম কত?',
    a: 'কোমর ব্যথার বেল্ট বা লাম্বার কর্সেটের দাম সাইজ, মডেল ও পরিমাণের উপর নির্ভর করে। সঠিক দাম জানতে লিখিত কোটেশন নিন — কোটেশনে দাম, সাইজ ও ডেলিভারি সময়সূচি লিখিতভাবে নিশ্চিত করা হয়।',
  },
  {
    q: 'কোন সাইজের বেল্ট নেওয়া উচিত?',
    a: 'সাধারণত কোমরের মাপ অনুযায়ী M, L বা XL সাইজ নির্বাচন করা হয়। নিশ্চিত না হলে রোগীর কোমরের মাপ জানিয়ে আমাদের টিমের সাথে যোগাযোগ করুন — কোটেশনে সঠিক সাইজ উল্লেখ করা হবে।',
  },
  {
    q: 'ডেলিভারি কীভাবে হয়?',
    a: '৫০,০০০ টাকার বেশি অর্ডারে সারা দেশে ফ্রি ডেলিভারি প্রযোজ্য। ডেলিভারির নির্দিষ্ট সময়সূচি লিখিত কোটেশনে নিশ্চিত করা হয়।',
  },
  {
    q: 'হাসপাতাল বা ফার্মেসির জন্য বাল্ক অর্ডার করা যায়?',
    a: 'হ্যাঁ। হাসপাতাল, ক্লিনিক ও ফার্মেসির জন্য বাল্ক সরবরাহ করা হয়; পরিমাণ ও মূল্য লিখিত কোটেশনে নির্ধারিত হয়।',
  },
];

export default async function KomorBethaBeltPage() {
  const products = await fetchBelts();
  const dam = BENGALI_TERMS?.price?.bn || 'দাম';

  return (
    <main lang="bn" className="bg-page">
      <StructuredData
        schema={generateBreadcrumbSchema([
          { name: 'Home', url: SITE_CONFIG.url },
          { name: 'কোমর ব্যথার বেল্ট', url: BN_URL },
        ])}
      />
      <StructuredData
        schema={{
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: BN_FAQS.map((f) => ({
            '@type': 'Question',
            name: f.q,
            acceptedAnswer: { '@type': 'Answer', text: f.a },
          })),
        }}
      />

      <section className="container mx-auto max-w-[1080px] px-4 py-10">
        <nav aria-label="breadcrumb" className="mb-4 text-xs text-[var(--color-text-tertiary)]">
          <Link href="/" className="hover:underline">হোম</Link>
          <span className="mx-1.5">/</span>
          <span>কোমর ব্যথার বেল্ট</span>
        </nav>

        <h1 className="text-2xl sm:text-3xl font-semibold text-brand-navy mb-3">
          কোমর ব্যথার বেল্ট ({dam}) — লাম্বার কর্সেট ও ব্যাক সাপোর্ট
        </h1>
        <p className="text-sm leading-relaxed text-[var(--color-text-secondary)] mb-6">
          কোমর ব্যথার জন্য ব্যবহৃত লাম্বার কর্সেট ও ব্যাক সাপোর্ট বেল্ট MediportBD সরবরাহ করে।
          যাচাইকৃত ব্র্যান্ডের কর্সেট M, L ও XL সাইজে পাওয়া যায়। দাম সাইজ, মডেল ও পরিমাণ
          অনুযায়ী পরিবর্তিত হয় — লিখিত কোটেশনে চূড়ান্ত দাম নিশ্চিত করা হয়।
        </p>

        <div className="rounded-2xl border border-[var(--color-border-secondary)] bg-[var(--color-background-secondary)] p-4 sm:p-5 mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1.5">
            সংক্ষেপে উত্তর
          </p>
          <p className="text-sm leading-relaxed text-[var(--color-text-secondary)]">
            কোমর ব্যথার বেল্টের দাম সাইজ ও মডেল অনুযায়ী ভিন্ন হয়, তাই অনলাইনে একক দাম না দিয়ে
            লিখিত কোটেশনে দাম জানানো হয়। কোটেশন সাধারণত ২৪ ঘণ্টার মধ্যে প্রস্তুত করা হয় এবং
            ৫০,০০০ টাকার বেশি অর্ডারে সারা দেশে ফ্রি ডেলিভারি প্রযোজ্য।
          </p>
        </div>

        <h2 className="text-lg font-semibold text-brand-navy mb-3">উপলব্ধ কর্সেট ও বেল্ট</h2>
        {products.length > 0 ? (
          <ul className="grid gap-3 sm:grid-cols-2 mb-8">
            {products.slice(0, 8).map((p) => (
              <li key={p._id || p.slug} className="rounded-xl border border-[var(--color-border-primary)] bg-white p-4">
                <Link
                  href={`/products/${p.slug || p._id}`}
                  className="text-sm font-semibold text-brand-navy hover:text-brand-teal"
                >
                  {p.name}
                </Link>
                <div className="mt-1 text-xs text-[var(--color-text-secondary)]">
                  {p.price > 0 ? `৳${Number(p.price).toLocaleString('en-BD')}` : `${dam}: কোটেশনে`}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-[var(--color-text-secondary)] mb-8">
            তালিকা এখন দেখানো যাচ্ছে না — কোটেশনের অনুরোধ করুন, আমাদের টিম সাইজ ও মডেল জানিয়ে দেবে।
          </p>
        )}

        <div className="mb-10">
          <Link
            href="/quotes/request?source=bn_belt"
            className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-[var(--color-brand-teal)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            লিখিত কোটেশন চান
          </Link>
        </div>

        <h2 className="text-lg font-semibold text-brand-navy mb-3">সাধারণ প্রশ্ন</h2>
        <dl className="space-y-3 mb-10">
          {BN_FAQS.map((f) => (
            <div key={f.q} className="rounded-xl border border-[var(--color-border-primary)] bg-white p-4">
              <dt className="text-sm font-semibold text-brand-navy mb-1">{f.q}</dt>
              <dd className="text-sm leading-relaxed text-[var(--color-text-secondary)]">{f.a}</dd>
            </div>
          ))}
        </dl>

        <p className="text-xs text-[var(--color-text-tertiary)]">
          English:{' '}
          <Link href="/products/category/orthopedic-supports" hreflang="en-BD" className="text-[var(--color-brand-teal)] hover:underline">
            Orthopedic supports in Bangladesh
          </Link>
        </p>
      </section>
    </main>
  );
}
