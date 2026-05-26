import HelpPage from '@/views/HelpPage';
import { SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title: 'Support & Help Centre | MedCore BD',
  description:
    'Get help with orders, delivery, returns, payments, and more. Contact the MedCore BD support team or browse our FAQ.',
  keywords: 'MedCore BD support, help centre, order help Bangladesh, medical equipment returns, contact MedCore',
  alternates: { canonical: `${SITE_CONFIG.url}/help` },
  openGraph: {
    title: 'Support & Help Centre | MedCore BD',
    description: 'Get help with orders, delivery, returns, payments, and more.',
    url: `${SITE_CONFIG.url}/help`,
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
};

export default function Help() {
  return <HelpPage />;
}
