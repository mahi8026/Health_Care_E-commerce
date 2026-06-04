import { PAGE_SEO } from '@/config/seo';
import FAQPage from '@/views/FAQPage';

export const metadata = {
  title: 'Frequently Asked Questions | MedCore BD',
  description: 'Find answers to common questions about medical equipment, orders, delivery, returns, and B2B services at MedCore BD.',
  alternates: {
    canonical: `${process.env.NEXT_PUBLIC_SITE_URL}/faq`,
  },
};

export default function FAQ() {
  return <FAQPage />;
}
