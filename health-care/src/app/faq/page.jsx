import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';
import FAQPage from '@/views/FAQPage';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';
import FAQSchema from '@/components/seo/FAQSchema';

// Flat FAQ list for server-side JSON-LD — mirrors FAQPage.jsx FAQ_CATEGORIES
const ALL_FAQS = [
  { q: 'How do I place an order?', a: "Browse products, add items to cart, proceed to checkout, fill in delivery details, choose payment method (bKash, Nagad, Bank Transfer, or Cash on Delivery), and confirm your order. You'll receive an email confirmation within minutes." },
  { q: 'What payment methods do you accept?', a: 'We accept bKash, Nagad, bank transfer, credit/debit cards, and cash on delivery (COD) for orders within Dhaka. B2B customers can apply for credit terms (30–90 days).' },
  { q: 'How long does delivery take?', a: 'Dhaka: 1–2 business days. Chittagong & Sylhet: 2–3 business days. Other areas: 3–5 business days. Express same-day delivery available in Dhaka.' },
  { q: 'Do you provide installation and training?', a: 'Yes, free installation and staff training are included for diagnostic equipment in Dhaka metro. Installation charges apply outside Dhaka.' },
  { q: 'What about cold chain delivery for reagents?', a: 'All temperature-sensitive reagents are shipped with proper cold chain packaging (ice packs, insulated boxes) to maintain 2–8°C throughout transit.' },
  { q: 'Are all products DGDA registered?', a: 'Yes, 100% of our products are DGDA registered and CE certified. DGDA registration documents are available on request.' },
  { q: 'What is your return policy?', a: '7-day return policy for unused items in original packaging. Medical equipment must be unopened. Reagents and consumables are non-returnable unless damaged.' },
  { q: 'Do you offer bulk discounts for hospitals?', a: 'Yes. B2B institutions get 8–30% discount based on order volume. Apply via the B2B Portal to activate institutional pricing and credit terms.' },
  { q: 'What B2B credit terms do you offer?', a: 'We offer 30, 60, or 90-day credit terms to approved B2B customers (hospitals, clinics, diagnostic centers). Apply via the B2B Portal with trade license and bank details.' },
  { q: 'Can I track my order?', a: "Yes. You'll receive a tracking link via SMS and email once your order ships. You can also track orders from your account dashboard." },
];

export const metadata = {
  title: 'Frequently Asked Questions | MediportBD',
  description: 'Find answers to common questions about medical equipment orders, delivery, cold chain reagents, returns and B2B services at MediportBD Bangladesh.',
  keywords: 'MediportBD FAQ, medical equipment delivery Bangladesh, DGDA registered products FAQ, B2B medical supplier FAQ, cold chain reagent delivery',
  alternates: {
    canonical: `${SITE_CONFIG.url}/faq`,
  },
  openGraph: {
    title: 'Frequently Asked Questions | MediportBD',
    description: 'Answers to common questions about ordering, delivery, reagents, returns and B2B services at MediportBD.',
    url: `${SITE_CONFIG.url}/faq`,
    images: [{ url: `${SITE_CONFIG.url}/og-default.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Frequently Asked Questions | MediportBD',
    description: 'Answers to common questions about ordering, delivery and B2B services at MediportBD.',
  },
};

export default function FAQ() {
  const breadcrumbs = [
    { name: 'Home', url: SITE_CONFIG.url },
    { name: 'FAQ', url: `${SITE_CONFIG.url}/faq` },
  ];

  return (
    <>
      <StructuredData schema={generateBreadcrumbSchema(breadcrumbs)} />
      {/* FAQPage JSON-LD — uses server-side flat list so it renders before JS */}
      <FAQSchema faqs={ALL_FAQS} />
      <FAQPage />
    </>
  );
}
