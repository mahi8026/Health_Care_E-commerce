import { PAGE_SEO, SITE_CONFIG } from '@/config/seo';
import FAQPage from '@/views/FAQPage';

export const metadata = {
  title: 'Frequently Asked Questions',
  description: 'Find answers to common questions about medical equipment, orders, delivery, returns, and B2B services at MediportBD.',
  alternates: {
    canonical: `${SITE_CONFIG.url}/faq`,
  },
};

export default function FAQ() {
  return <FAQPage />;
}
