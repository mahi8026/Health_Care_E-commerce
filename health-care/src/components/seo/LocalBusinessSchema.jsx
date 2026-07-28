import { SITE_CONFIG } from '@/config/seo';

/**
 * LocalBusinessSchema — MedicalBusiness JSON-LD
 * Renders in root layout to qualify for local SEO rich results.
 */
export default function LocalBusinessSchema() {
  const schema = {
    '@context': 'https://schema.org',
    '@type':    'MedicalBusiness',
    name:       'Mediport Bangladesh Ltd.',
    image:      `${SITE_CONFIG.url}/Mediport_Logo.png`,
    url:        SITE_CONFIG.url,
    telephone:  SITE_CONFIG.phone,
    email:      SITE_CONFIG.email,
    address: {
      '@type':         'PostalAddress',
      streetAddress:   SITE_CONFIG.address.street,
      addressLocality: SITE_CONFIG.address.city,
      addressCountry:  'BD',
      postalCode:      SITE_CONFIG.address.postalCode,
    },
    openingHoursSpecification: [
      {
        '@type':   'OpeningHoursSpecification',
        dayOfWeek: ['Saturday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday'],
        opens:     '09:00',
        closes:    '18:00',
      },
    ],
    priceRange:         '৳৳',
    currenciesAccepted: 'BDT',
    paymentAccepted:    'Cash, Credit Card, Bank Transfer, bKash, Nagad',
    areaServed:         'Bangladesh',
    description:        'Medical equipment and surgical instruments supplier in Bangladesh. DGDA registered. Serving hospitals and clinics since 2020.',
    sameAs: [
      'https://www.facebook.com/MediportBD',
      'https://www.linkedin.com/company/MediportBD',
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
