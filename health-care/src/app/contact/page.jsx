import ContactPage from '@/views/ContactPage';
import { SITE_CONFIG } from '@/config/seo';

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
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
};

export default function Contact() {
  return <ContactPage />;
}
