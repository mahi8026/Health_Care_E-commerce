import NewsPage from '@/views/NewsPage';
import { SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title: 'News & Updates',
  description:
    'Latest news and updates from MediportBD — new product launches, partnerships, DGDA registrations, and company announcements.',
  keywords:
    'MediportBD news, medical equipment Bangladesh news, MediportBD updates, healthcare news Dhaka',
  alternates: { canonical: `${SITE_CONFIG.url}/news` },
  openGraph: {
    title: 'News & Updates',
    description:
      'Company announcements, product launches, and industry news from Bangladesh\u2019s trusted medical equipment supplier.',
    url: `${SITE_CONFIG.url}/news`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function News() {
  return <NewsPage />;
}
