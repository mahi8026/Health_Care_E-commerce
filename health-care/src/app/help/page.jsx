import HelpPage from '@/views/HelpPage';
import { SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title: 'Support & Help Centre',
  description:
    'Get help with orders, delivery, returns, payments, and more. Contact the MediportBD support team or browse our FAQ.',
  keywords: 'MediportBD support, help centre, order help Bangladesh, medical equipment returns, contact Mediport',
  alternates: { canonical: `${SITE_CONFIG.url}/help` },
  openGraph: {
    title: 'Support & Help Centre',
    description: 'Get help with orders, delivery, returns, payments, and more.',
    url: `${SITE_CONFIG.url}/help`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function Help() {
  return <HelpPage />;
}
