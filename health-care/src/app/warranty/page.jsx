import WarrantyPage from '@/views/WarrantyPage';
import { SITE_CONFIG } from '@/config/seo';

export const metadata = {
  title: 'Warranty & Claims',
  description:
    'MediportBD warranty policy — manufacturer and Mediport warranty coverage, how to file a warranty claim, and what is excluded.',
  keywords:
    'MediportBD warranty, medical equipment warranty Bangladesh, warranty claim, equipment repair, replacement policy',
  alternates: { canonical: `${SITE_CONFIG.url}/warranty` },
  openGraph: {
    title: 'Warranty & Claims',
    description:
      'Understand your equipment warranty — coverage terms, claim process, and repair or replacement guarantees.',
    url: `${SITE_CONFIG.url}/warranty`,
    images: [{ url: `https://www.mediportbd.com/og-default.png`, width: 1200, height: 630 }],
  },
};

export default function Warranty() {
  return <WarrantyPage />;
}
