import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';
import FAQPage from '@/views/FAQPage';
import StructuredData, { generateBreadcrumbSchema } from '@/utils/structuredData';
import FAQSchema from '@/components/seo/FAQSchema';
import { finalTitle, socialTitle } from '@/utils/metadata';

// Flat FAQ list for server-side JSON-LD — mirrors FAQPage.jsx FAQ_CATEGORIES
const ALL_FAQS = [
  { q: 'How do I place an order?', a: "Browse products, add items to cart, proceed to checkout, fill in delivery details, choose payment method (bKash, Nagad, Bank Transfer, or Cash on Delivery), and confirm your order. You'll receive an email confirmation within minutes." },
  { q: 'What payment methods do you accept?', a: 'We accept bKash, Nagad, bank transfer, credit/debit cards, and cash on delivery (COD) for orders within Dhaka. B2B customers can apply for credit terms; terms are agreed per account and confirmed in writing.' },
  { q: 'How long does delivery take?', a: 'Dhaka: 1–2 business days. Chittagong & Sylhet: 2–3 business days. Other areas: 3–5 business days. Express same-day delivery available in Dhaka.' },
  { q: 'Do you provide installation and training?', a: 'Installation and staff training depend on the equipment and location; we will confirm what is available in your quotation.' },
  { q: 'What about temperature-sensitive reagents?', a: 'Cold chain delivery is not currently offered. Contact us to discuss storage requirements for temperature-sensitive reagents.' },
  { q: 'Are all products DGDA registered?', a: 'All regulated products we sell carry DGDA registration, and registration documents are available on request. Unregulated accessories are clearly labelled on the product page.' },
  { q: 'What is your return policy?', a: '7-day return policy for unused items in original packaging. Medical equipment must be unopened. Reagents and consumables are non-returnable unless damaged.' },
  { q: 'Do you offer bulk discounts for hospitals?', a: 'B2B and volume pricing is available on request. Apply via the B2B Portal for a written quotation.' },
  { q: 'What B2B credit terms do you offer?', a: 'Credit terms may be available to approved institutional accounts; terms are agreed per account. Apply via the B2B Portal with trade license and bank details.' },
  { q: 'Can I track my order?', a: "Yes. You'll receive a tracking link via SMS and email once your order ships. You can also track orders from your account dashboard." },
];

export const metadata = {
  // The root layout title template appends ' | MediportBD', so the suffix
  // must not be hard-coded here - it rendered twice before this fix.
  title: finalTitle('Frequently Asked Questions'),
  description: 'Find answers to common questions about medical equipment orders, delivery, reagents, returns and B2B services at MediportBD Bangladesh.',
  keywords: 'MediportBD FAQ, medical equipment delivery Bangladesh, DGDA registered products FAQ, B2B medical supplier FAQ,  reagent delivery',
  alternates: {
    canonical: `${SITE_CONFIG.url}/faq`,
  },
  openGraph: {
    title: socialTitle('Frequently Asked Questions'),
    description: 'Answers to common questions about ordering, delivery, reagents, returns and B2B services at MediportBD.',
    url: `${SITE_CONFIG.url}/faq`,
    images: [{ url: `${SITE_CONFIG.url}/og-default.png`, width: 1200, height: 630 }],
  },
  twitter: {
    card: 'summary_large_image',
    title: socialTitle('Frequently Asked Questions'),
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
