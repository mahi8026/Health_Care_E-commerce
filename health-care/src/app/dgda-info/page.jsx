import AboutPage from '@/views/AboutPage';
import { SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title: 'DGDA Compliance & Regulatory Information | MediportBD',
  description:
    'MediportBD operates in full compliance with the Directorate General of Drug Administration (DGDA) of Bangladesh. All products are DGDA-registered, CE certified, and ISO 13485 compliant.',
  keywords: 'DGDA registered medical equipment Bangladesh, CE certified medical devices, ISO 13485 Bangladesh, MediportBD compliance',
  alternates: {
    canonical: `${SITE_CONFIG.url}/dgda-info`,
  },
  openGraph: {
    title: 'DGDA Compliance & Regulatory Information | MediportBD',
    description:
      'Every product on MediportBD meets DGDA regulatory standards for medical equipment and supplies in Bangladesh.',
    url: `${SITE_CONFIG.url}/dgda-info`,
    images: [{ url: '/og-default.png', width: 1200, height: 630 }],
  },
};

export default function DGDAInfoPage() {
  return <AboutPage />;
}
