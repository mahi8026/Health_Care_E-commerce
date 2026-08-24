import { SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title: `Terms of Service | ${SITE_CONFIG.name}`,
  description: `Terms of Service for ${SITE_CONFIG.name}. Please read these terms carefully before using our website or placing an order.`,
  alternates: { canonical: `${SITE_CONFIG.url}/terms` },
  openGraph: {
    title: `Terms of Service | ${SITE_CONFIG.name}`,
    description: `Terms of Service for ${SITE_CONFIG.name}. Please read these terms carefully before using our website or placing an order.`,
    url: `${SITE_CONFIG.url}/terms`,
    siteName: SITE_CONFIG.name,
    locale: 'en_BD',
  },
};

const sections = [
  {
    title: 'General Terms',
    content: `By accessing and using ${SITE_CONFIG.name} website, you accept and agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you should not use our website or services.`,
  },
  {
    title: 'Account Registration',
    content: `You must provide accurate, current, and complete information when creating an account. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account. Notify us immediately of any unauthorized use.`,
  },
  {
    title: 'Pricing & Availability',
    content: `All prices are listed in Bangladeshi Taka (৳) and include applicable VAT unless stated otherwise. Prices and product availability are subject to change without notice. We reserve the right to modify or discontinue products at any time.`,
  },
  {
    title: 'Orders & Payment',
    content: `Order placement constitutes an offer to purchase. We reserve the right to accept or decline orders at our discretion. Payment must be received in full before order processing. Accepted payment methods include Cash on Delivery (COD), bKash, Nagad, bank transfer, and credit (for approved B2B accounts).`,
  },
  {
    title: 'Shipping & Delivery',
    content: `Delivery times are estimates and not guaranteed. We ship within Dhaka and across Bangladesh. Shipping charges are calculated at checkout. Risk of loss passes to you upon delivery.`,
  },
  {
    title: 'Returns & Refunds',
    content: `Our return policy allows returns within 7 days of delivery for defective or incorrect products. Products must be unused and in original packaging. Refunds are processed within 5-7 business days after inspection. Custom orders and opened reagents are non-returnable.`,
  },
  {
    title: 'B2B Accounts',
    content: `Business accounts are subject to separate credit terms as agreed upon approval. B2B pricing is confidential and may not be shared with third parties. Late payments may result in suspension of credit privileges and accrual of interest at the rate specified in your credit agreement.`,
  },
  {
    title: 'Intellectual Property',
    content: `All content on this website — including text, images, logos, product descriptions, and software — is the property of ${SITE_CONFIG.name} or our suppliers and is protected by applicable intellectual property laws. Unauthorized reproduction or distribution is prohibited.`,
  },
  {
    title: 'Limitation of Liability',
    content: `${SITE_CONFIG.name} shall not be liable for any indirect, incidental, special, consequential, or punitive damages arising from your use of our website or products. Our total liability is limited to the purchase price of the product giving rise to the claim.`,
  },
  {
    title: 'Governing Law',
    content: `These terms are governed by the laws of Bangladesh. Any disputes arising from these terms shall be resolved in the courts of Dhaka, Bangladesh.`,
  },
  {
    title: 'Contact',
    content: `For questions about these Terms of Service, please contact us at ${SITE_CONFIG.email} or call ${SITE_CONFIG.phone}. Our address is ${SITE_CONFIG.address.street}, ${SITE_CONFIG.address.city}, ${SITE_CONFIG.address.country}.`,
  },
];

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">Terms of Service</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">Last updated: July 31, 2026</p>

      <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] space-y-8">
        <p className="text-base leading-relaxed">
          Welcome to {SITE_CONFIG.name}. These Terms of Service govern your use of our website and the purchase of products from us.
        </p>

        {sections.map((section) => (
          <section key={section.title}>
            <h2 className="text-xl font-semibold text-brand-navy mb-3">{section.title}</h2>
            <p className="leading-relaxed">{section.content}</p>
          </section>
        ))}
      </div>
    </div>
  );
}
