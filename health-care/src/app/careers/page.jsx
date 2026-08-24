import CareersPage from '@/views/CareersPage';
import { SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title: 'Careers',
  description:
    'Join MediportBD — careers in medical equipment sales, service engineering, warehousing, and operations in Dhaka, Bangladesh.',
  keywords:
    'MediportBD careers, medical equipment jobs Dhaka, MediportBD jobs, healthcare sales jobs Bangladesh, medical device technician jobs',
  alternates: { canonical: `${SITE_CONFIG.url}/careers` },
  openGraph: {
    title: 'Careers',
    description:
      'Build your career with Bangladesh\u2019s trusted medical equipment supplier. Explore open positions and apply today.',
    url: `${SITE_CONFIG.url}/careers`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function Careers() {
  return <CareersPage />;
}
