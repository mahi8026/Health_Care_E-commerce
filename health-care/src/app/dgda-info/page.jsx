import AboutPage from '@/views/AboutPage';

export const metadata = {
  title: 'DGDA Compliance & Regulatory Information — MedCore BD',
  description:
    'MedCore BD operates in full compliance with the Directorate General of Drug Administration (DGDA) of Bangladesh. All products are DGDA-registered, CE certified, and ISO 13485 compliant.',
  alternates: {
    canonical: 'https://medcorebd.com/dgda-info',
  },
  openGraph: {
    title: 'DGDA Compliance & Regulatory Information — MedCore BD',
    description:
      'Every product on MedCore BD meets DGDA regulatory standards for medical equipment and supplies in Bangladesh.',
    url: 'https://medcorebd.com/dgda-info',
  },
};

export default function DGDAInfoPage() {
  return <AboutPage />;
}
