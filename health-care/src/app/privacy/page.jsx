import { SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title: `Privacy Policy | ${SITE_CONFIG.name}`,
  description: `Privacy Policy for ${SITE_CONFIG.name}. Learn how we collect, use, and protect your personal information.`,
  alternates: { canonical: `${SITE_CONFIG.url}/privacy` },
  openGraph: {
    title: `Privacy Policy | ${SITE_CONFIG.name}`,
    description: `Privacy Policy for ${SITE_CONFIG.name}. Learn how we collect, use, and protect your personal information.`,
    url: `${SITE_CONFIG.url}/privacy`,
    siteName: SITE_CONFIG.name,
    locale: 'en_BD',
  },
};

const sections = [
  {
    title: 'Information We Collect',
    content: `We collect information you provide directly: name, email address, phone number, delivery address, and payment details when you place an order or create an account. We also automatically collect certain technical data including IP address, browser type, device information, and browsing behavior through cookies and similar technologies.`,
  },
  {
    title: 'How We Use Your Information',
    content: `We use your information to process orders, deliver products, provide customer support, send order updates and promotional communications (with your consent), improve our website and services, and comply with legal obligations.`,
  },
  {
    title: 'Payment Processing',
    content: `Payment transactions are processed through secure third-party payment gateways. We do not store full credit card numbers or banking credentials on our servers. All payment data is encrypted using industry-standard SSL/TLS protocols.`,
  },
  {
    title: 'Data Sharing',
    content: `We do not sell your personal information. We may share data with trusted third-party service providers (delivery partners, payment processors, analytics providers) who are contractually obligated to protect your data and use it only for the services they provide.`,
  },
  {
    title: 'Data Retention',
    content: `We retain your personal information for as long as your account is active or as needed to provide you services. We may retain certain data longer to comply with legal obligations, resolve disputes, and enforce our agreements.`,
  },
  {
    title: 'Your Rights',
    content: `You have the right to access, correct, or delete your personal data at any time through your account settings. You may also opt out of marketing communications by clicking the unsubscribe link in any email or contacting us directly.`,
  },
  {
    title: 'Cookies',
    content: `We use cookies to enhance your browsing experience, analyze site traffic, and personalize content. You can control cookie preferences through your browser settings. Disabling cookies may affect certain features of our website.`,
  },
  {
    title: 'Security',
    content: `We implement appropriate technical and organizational measures to protect your personal data against unauthorized access, alteration, disclosure, or destruction. This includes SSL encryption, firewalls, and regular security audits.`,
  },
  {
    title: 'Contact Us',
    content: `If you have questions about this Privacy Policy or wish to exercise your data rights, please contact us at ${SITE_CONFIG.email} or call ${SITE_CONFIG.phone}.`,
  },
];

export default function PrivacyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12">
      <h1 className="text-2xl md:text-3xl font-semibold text-text-primary mb-2">Privacy Policy</h1>
      <p className="text-sm text-[var(--color-text-secondary)] mb-8">Last updated: July 31, 2026</p>

      <div className="prose prose-sm max-w-none text-[var(--color-text-secondary)] space-y-8">
        <p className="text-base leading-relaxed">
          At {SITE_CONFIG.name}, we take your privacy seriously. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you visit our website or make a purchase.
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
